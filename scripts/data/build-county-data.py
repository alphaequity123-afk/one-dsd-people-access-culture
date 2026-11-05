"""Builds lib/content/hub/county-data.json for the county map.

Run with an isolated interpreter and pass the source folders as arguments:

  python -I scripts/data/build-county-data.py \
      <folder with the three DHS dashboard spreadsheets> \
      <path to mn_county_edr_historical_estimates_sdc_1990-2025.xlsx> \
      [<output json>]

Run scripts/data/build-mn-county-shapes.mjs first: county names and FIPS codes come from
lib/content/hub/mn-county-shapes.json so the data and the map always use the same 87 counties.

Every figure comes straight from the spreadsheets. The only arithmetic is:
  * service share = group count / county all-race count (home and community-based services)
  * comparison    = service share / population share (2022), only when the group count is 11 or more
Nothing is filled in when a source leaves a value out.
"""

import datetime
import json
import os
import sys

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

GROUPS = [
    ("american-indian", "American Indian or Alaska Native"),
    ("asian-pacific-islander", "Asian or Pacific Islander"),
    ("black", "Black or African American"),
    ("hispanic", "Hispanic or Latino"),
    ("multiracial", "Multiracial"),
    ("white", "White"),
    ("all", "All people"),
]

# Spreadsheet labels -> group ids. Explicit on purpose; an unknown label stops the build.
POPULATION_LABELS = {
    "African American/Black": "black",
    "American Indian and Alaska Native": "american-indian",
    "Asian or Pacific Islander": "asian-pacific-islander",
    "Hispanic": "hispanic",
    "Multiracial": "multiracial",
    "White": "white",
}
PROGRAM_LABELS = {  # HCBS Population sheet and People Earned Income sheet use the same labels
    "African American/Black": "black",
    "American Indian": "american-indian",
    "Asian or Pacific Islander": "asian-pacific-islander",
    "Hispanic": "hispanic",
    "Two or more races": "multiracial",
    "White": "white",
    "All Race/Ethnicities": "all",
    "Unknown": None,  # kept only as a county-level count; not one of the seven groups
}

MIN_COMPARE_COUNT = 11
SUPPRESSED_TEXT = "<6"


def die(msg):
    sys.stderr.write(msg + "\n")
    sys.exit(1)


def key(name):
    """Normalize a county name for matching across files."""
    n = str(name).strip()
    if n.endswith(" County"):
        n = n[: -len(" County")]
    return n.lower().replace(".", "").replace("  ", " ")


def rows_of(path, sheet):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    if sheet not in wb.sheetnames:
        die(f"Sheet {sheet!r} not found in {path}")
    rows = list(wb[sheet].iter_rows(values_only=True))
    header = [str(h).strip() if h is not None else None for h in rows[0]]
    # Accessible sheets end with an "End of Worksheet" marker row; drop it and blank rows.
    body = [
        r for r in rows[1:]
        if any(c is not None for c in r) and not str(r[0] or "").strip().lower().startswith("end of worksheet")
    ]
    return header, body


def col(header, name):
    if name not in header:
        die(f"Column {name!r} not found; header is {header}")
    return header.index(name)


def count_value(v):
    """Returns (count, suppressed). '<6' -> (None, True)."""
    if v is None:
        return None, False
    if isinstance(v, str) and v.strip() == SUPPRESSED_TEXT:
        return None, True
    return int(v), False


def r6(x):
    return None if x is None else round(float(x), 6)


def main():
    if len(sys.argv) < 3:
        die(__doc__)
    dhs_dir, sdc_path = sys.argv[1], sys.argv[2]
    out_path = sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, "lib", "content", "hub", "county-data.json")
    pop_path = os.path.join(dhs_dir, "Minnesota-Population-Demographics.xlsx")
    prog_path = os.path.join(dhs_dir, "LTSS-Program-Demographics.xlsx")
    perf_path = os.path.join(dhs_dir, "LTSS-Performance-Measures.xlsx")

    with open(os.path.join(ROOT, "lib", "content", "hub", "mn-county-shapes.json"), encoding="utf-8") as f:
        shapes = json.load(f)
    places = [{"fips": "27", "name": "Statewide", "key": "statewide"}] + [
        {"fips": c["fips"], "name": c["name"], "key": key(c["name"])} for c in shapes["counties"]
    ]
    if len(places) != 88:
        die("Expected 87 counties in mn-county-shapes.json")
    by_key = {p["key"]: p for p in places}

    def place_for(name):
        k = key(name)
        return by_key.get(k)

    # ---------------- Population shares by race (2018 and 2022) ----------------
    header, rows = rows_of(pop_path, "Overall Population_Race")
    ci, di = col(header, "County"), col(header, "Date")
    race_cols = {}
    for label, gid in POPULATION_LABELS.items():
        race_cols[gid] = col(header, label)
    for h in header[2:]:
        if h and h not in POPULATION_LABELS:
            die(f"Unmapped population label {h!r}")
    pop = {}  # (key, year) -> {gid: share}
    dates = set()
    last_county = None
    for r in rows:
        if r[di] is None:
            continue
        county = r[ci] if r[ci] is not None else last_county
        last_county = county
        p = place_for(county)
        if p is None:
            die(f"Population sheet county not matched: {county!r}")
        date = str(r[di]).strip()
        dates.add(date)
        year = int(date[-4:])
        pop[(p["key"], year)] = {gid: r6(r[i]) for gid, i in race_cols.items()}
    if dates != {"Jul. 2018", "Jul. 2022"}:
        die(f"Unexpected population dates {dates}")

    # ---------------- Language (people who speak a language other than English at home) ----------------
    header, rows = rows_of(pop_path, "2017-2021_Language Summary")
    ci = col(header, "County")
    ne_i, en_i = col(header, "% NonEnglish"), col(header, "% Speak English")
    lang = {}
    for r in rows:
        if r[ci] is None:
            continue
        p = place_for(r[ci])
        if p is None:
            die(f"Language sheet county not matched: {r[ci]!r}")
        lang[p["key"]] = (r[ne_i], r[en_i])
    # The two column labels in this sheet are reversed: statewide "% NonEnglish" is about 0.88 and
    # "% Speak English" about 0.12, and the two add to 1. About 12 percent of Minnesotans speak a
    # language other than English at home, so the column labeled "% Speak English" holds that share.
    sw_ne, sw_en = lang["statewide"]
    labels_reversed = sw_ne > 0.5 and sw_en < 0.5
    if not labels_reversed:
        die("Language columns no longer look reversed; review the sheet before building.")
    non_english = {k: r6(en) for k, (ne, en) in lang.items()}

    # ---------------- Home and community-based services (HCBS Population sheet) ----------------
    header, rows = rows_of(prog_path, "HCBS Population")
    ci, mi = col(header, "County (COFR)"), col(header, "Month Year")
    ri, ai, ni = col(header, "Race/Ethnicity"), col(header, "Age Groups"), col(header, "# of People")
    months = sorted({r[mi] for r in rows if isinstance(r[mi], datetime.datetime)})
    latest = months[-1]
    svc = {}  # (key, gid or 'unknown') -> (count, suppressed)
    other_units = set()
    ages_seen = set()
    for r in rows:
        if r[mi] != latest:
            continue
        race = str(r[ri]).strip()
        if race not in PROGRAM_LABELS:
            die(f"Unmapped services label {race!r}")
        age = r[ai]
        ages_seen.add(str(age))
        if age != "All Ages":
            continue
        p = place_for(r[ci])
        if p is None:
            other_units.add(str(r[ci]).strip())
            continue
        gid = PROGRAM_LABELS[race] or "unknown"
        svc[(p["key"], gid)] = count_value(r[ni])

    # ---------------- Earned income (People Earned Income sheet) ----------------
    header, rows = rows_of(perf_path, "People Earned Income")
    ci, yi = col(header, "County (COFR)"), col(header, "State_Fiscal_Year")
    fi, ri, ai = col(header, "Population Filter"), col(header, "Race/Ethnicity Combined"), col(header, "Age Groups")
    pi, ni = col(header, "% Earned Income"), col(header, "# Recipients with Earned Income")
    years = sorted({int(r[yi]) for r in rows if r[yi] is not None})
    latest_fy = years[-1]
    pop_filters = sorted({str(r[fi]) for r in rows})
    EARN_FILTER = "Total Waiver Population"
    if EARN_FILTER not in pop_filters:
        die(f"Population filter {EARN_FILTER!r} missing; found {pop_filters}")
    earn = {}
    for r in rows:
        if r[yi] is None or int(r[yi]) != latest_fy or r[fi] != EARN_FILTER or r[ai] != "All Ages":
            continue
        race = str(r[ri]).strip()
        if race not in PROGRAM_LABELS or PROGRAM_LABELS[race] is None:
            die(f"Unmapped earned income label {race!r}")
        p = place_for(r[ci])
        if p is None:
            die(f"Earned income county not matched: {r[ci]!r}")
        count, suppressed = count_value(r[ni])
        pct = r[pi]
        hidden = pct is None or (isinstance(pct, str) and not pct.replace(".", "", 1).isdigit())
        if suppressed or hidden:
            earn[(p["key"], PROGRAM_LABELS[race])] = {"percent": None, "recipients": None, "suppressed": True}
        else:
            earn[(p["key"], PROGRAM_LABELS[race])] = {"percent": r6(pct), "recipients": count, "suppressed": False}

    # ---------------- Total population, 2025 (State Demographic Center) ----------------
    header, rows = rows_of(sdc_path, "MN_EDR_COs_1990-2025")
    ti, gi, yi, pi = col(header, "Geography Type"), col(header, "Geography Name"), col(header, "Year"), col(header, "Population")
    sdc_year = max(int(r[yi]) for r in rows if r[yi] is not None)
    total = {}
    for r in rows:
        if r[yi] != sdc_year:
            continue
        if r[ti] == "State":
            total["statewide"] = int(r[pi])
        elif r[ti] == "County":
            p = place_for(r[gi])
            if p is None:
                die(f"State Demographic Center county not matched: {r[gi]!r}")
            total[p["key"]] = int(r[pi])

    # ---------------- Assemble ----------------
    out_places = []
    compare_counts = {gid: 0 for gid, _ in GROUPS}
    for p in places:
        k = p["key"]
        p22, p18 = pop.get((k, 2022)), pop.get((k, 2018))
        county_count, county_supp = svc.get((k, "all"), (None, False))
        reported = (k, "all") in svc
        unk = svc.get((k, "unknown"))
        groups = {}
        for gid, _ in GROUPS:
            share22 = 1.0 if gid == "all" and p22 else (p22 or {}).get(gid)
            share18 = 1.0 if gid == "all" and p18 else (p18 or {}).get(gid)
            if (k, gid) in svc:
                g_count, g_supp = svc[(k, gid)]
                status = "suppressed" if g_supp else "reported"
            else:
                g_count, g_supp = None, False
                status = "not-reported"
            if county_supp:
                g_count, g_supp, status = None, True, "suppressed"
            s_share = None
            if g_count is not None and county_count:
                s_share = r6(g_count / county_count)
            ratio = None
            if gid != "all" and s_share is not None and share22 and g_count is not None and g_count >= MIN_COMPARE_COUNT:
                ratio = r6(s_share / share22)
                compare_counts[gid] += 1 if k != "statewide" else 0
            e = earn.get((k, gid))
            groups[gid] = {
                "population": {"share2022": share22, "share2018": share18},
                "services": {
                    "share": s_share,
                    "count": g_count,
                    "countyCount": county_count,
                    "suppressed": g_supp,
                    "status": status,
                },
                "comparison": {
                    "ratio": ratio,
                    "groupCount": g_count,
                    "groupCountSuppressed": g_supp,
                    "enoughPeople": g_count is not None and g_count >= MIN_COMPARE_COUNT,
                },
                "earnedIncome": e
                if e
                else {"percent": None, "recipients": None, "suppressed": False, "status": "not-reported"},
            }
        out_places.append(
            {
                "fips": p["fips"],
                "name": p["name"],
                "totalPopulation2025": total.get(k),
                "nonEnglishShare": non_english.get(k),
                "servicesReportedSeparately": reported,
                "servicesUnknownRaceCount": None if unk is None else unk[0],
                "groups": groups,
            }
        )

    missing_services = [p["name"] for p in out_places if not p["servicesReportedSeparately"]]
    latest_label = latest.strftime("%B %Y")
    data = {
        "version": 1,
        "builtOn": datetime.date.today().isoformat(),
        "groups": [{"id": gid, "label": label} for gid, label in GROUPS],
        "measures": {
            "population": {
                "label": "Share of county population",
                "date": "July 2022",
                "compareDate": "July 2018",
                "source": "dhs-population",
            },
            "services": {
                "label": "Share of people receiving home and community-based services",
                "date": latest_label,
                "ages": "All ages",
                "method": "Number of people in the group divided by the number of people of all races and ethnicities receiving home and community-based services in the same county. People whose race is unknown count in the total but in no group.",
                "source": "dhs-program",
            },
            "comparison": {
                "label": "Service share compared with population share",
                "date": f"{latest_label} services and July 2022 population",
                "method": f"Service share divided by population share. 1 means the group's share of people receiving services matches its share of the county population. Shown only when at least {MIN_COMPARE_COUNT} people in the group receive services.",
                "minimumCount": MIN_COMPARE_COUNT,
            },
            "earned-income": {
                "label": "People receiving waiver services who earned income",
                "date": f"State fiscal year {latest_fy}",
                "ages": "All ages",
                "populationFilter": EARN_FILTER,
                "populationFilterPlain": "Everyone receiving waiver services (the broadest group in the file)",
                "source": "dhs-performance",
            },
            "totalPopulation": {"label": "Total population", "date": f"April 1, {sdc_year}", "source": "sdc"},
            "nonEnglish": {
                "label": "People who speak a language other than English at home",
                "date": "American Community Survey 5-year estimates; the sheet is labeled 2017-2021 and the file's notes name 2018-2022",
                "note": "The file's two language column labels are reversed. The value used is the one labeled \"% Speak English\", which is the smaller share and matches the statewide share of people who speak another language at home.",
                "source": "dhs-population",
            },
        },
        "sources": [
            {
                "id": "dhs-population",
                "title": "Overall Minnesota population demographics, accessible version",
                "pageName": "LTSS demographic dashboard",
                "publisher": "Minnesota Department of Human Services (from United States Census Bureau population estimates and the American Community Survey)",
                "date": "Downloaded November 3, 2026",
                "url": "https://mn.gov/dhs/assets/Overall%20Minnesota%20Population%20Demographics_tcm1053-631767.xlsx",
                "file": "Minnesota-Population-Demographics.xlsx",
            },
            {
                "id": "dhs-program",
                "title": "Long-term services and supports program demographics, accessible version",
                "pageName": "LTSS demographic dashboard",
                "publisher": "Minnesota Department of Human Services",
                "date": "Downloaded November 3, 2026",
                "url": "https://mn.gov/dhs/assets/LTSS%20Program%20Demographics_tcm1053-631765.xlsx",
                "file": "LTSS-Program-Demographics.xlsx",
            },
            {
                "id": "dhs-performance",
                "title": "Long-term services and supports performance measures, accessible version",
                "pageName": "LTSS performance measures dashboard",
                "publisher": "Minnesota Department of Human Services",
                "date": "Downloaded November 3, 2026",
                "url": "https://mn.gov/dhs/assets/LTSS-Performance-Measures_tcm1053-492103.xlsx",
                "file": "LTSS-Performance-Measures.xlsx",
            },
            {
                "id": "sdc",
                "title": "County and regional population estimates, 1990 to 2025",
                "publisher": "Minnesota State Demographic Center, Metropolitan Council and United States Census Bureau",
                "date": "Released July 2026",
                "url": "https://mn.gov/admin/assets/mn_county_edr_historical_estimates_sdc_1990-2025_tcm36-760413.xlsx",
                "file": "mn_county_edr_historical_estimates_sdc_1990-2025.xlsx",
            },
        ],
        "definitions": {
            "county": "County means the county of financial responsibility: the county responsible for paying for a person's services. It may not be where the person lives.",
            "suppression": f"The Department of Human Services shows counts under 6 as \"<6\". Those values are left out here and marked suppressed. A service share is left out when its count is under 6. An earned income percent is left out when its count of people with earned income is under 6. A comparison is shown only when at least {MIN_COMPARE_COUNT} people in the group receive services.",
            "notReported": "A value is left out when the source has no row for that county and group.",
            "otherReportingUnitsNote": "Some people's services are paid for by a multi-county human services agency or a Tribal Nation. The source counts those people under that agency or Nation, not under a county, so they are in the Statewide figures but in no county figure.",
            "otherReportingUnits": sorted(u for u in other_units if u),
            "countiesWithoutSeparateServiceRows": missing_services,
        },
        "places": out_places,
    }
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)
        f.write("\n")
    size = os.path.getsize(out_path)
    print(f"Wrote {out_path} ({size} bytes)")
    print(f"Services month: {latest_label}; ages seen: {sorted(ages_seen)}")
    print(f"Earned income: fiscal year {latest_fy}, filter {EARN_FILTER}; filters in file: {pop_filters}")
    print(f"Population 2025 total statewide: {total.get('statewide')}")
    print(f"Other reporting units: {sorted(other_units)}")
    print(f"Counties without separate service rows: {missing_services}")
    print("Counties with a usable comparison:", compare_counts)


if __name__ == "__main__":
    main()
