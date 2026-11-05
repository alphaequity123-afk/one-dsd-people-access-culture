"""Builds lib/content/hub/community-figures.json from two Minnesota State Demographic Center PDFs.

Run with an isolated interpreter (pdfplumber, pypdf and pymupdf installed) and pass the paths:

  python -I scripts/data/extract-community-figures.py \
      <economic_status_of_minnesotans_2026.pdf> \
      <minnesotans_with_disabilities_2026.pdf> \
      [<output json>] [<verification log>]

How every value is checked
  Method A  pdfplumber word positions. Each number is placed in its table column by its right edge.
  Method B  PyMuPDF word positions, read and placed by separate code.
  Check C   pypdf text. The numbers printed on each table row, in order, must equal Method A's values
            in column order (the source leaves some cells blank, so order alone cannot place them).
  A value is written only when A and B agree exactly and C passes. Anything else is dropped and
  listed under verification.disagreements. Nothing is estimated, filled in or calculated: counts,
  medians and margins of error are copied as printed.

Disability brief, Figure 6a (numbers printed as bar labels): label and number are paired by their
vertical position, separately with pdfplumber and PyMuPDF, and each number must also match the length
of its drawn bar (within 2 percent of the axis). Figures 6b and 6c are not used: their printed
percentages do not match their drawn bars (see DISABILITY_BRIEF_EXCLUDED).
"""

import json
import os
import re
import sys

import pdfplumber
import pymupdf
from pypdf import PdfReader

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DEFAULT_OUT = os.path.join(ROOT, "lib", "content", "hub", "community-figures.json")

# --------------------------------------------------------------------------------------------------
# Source facts (from the PDFs and the download notes kept with them)
# --------------------------------------------------------------------------------------------------
CHARTBOOK = {
    "id": "economic-status-2026",
    "title": "The Economic Status of Minnesotans 2026: A Chartbook with Data for Minnesota's Largest Cultural Groups",
    "publisher": "Minnesota State Demographic Center",
    "date": "January 2026",
    "url": "https://mn.gov/admin/assets/The%20Economic%20Status%20of%20Minnesotans%202026_tcm36-717691.pdf",
    "surveyYears": "2019 to 2023",
    "dataSource": "Census Bureau American Community Survey, 2019 to 2023 combined five-year sample, "
                  "tabulated by the Demographic Center from the University of Minnesota's Integrated Public Use "
                  "Microdata Series, USA version 16.0 (2025).",
    "geography": "Statewide only. The report says its group sizes are too small for county or regional detail.",
}
DISABILITY_BRIEF = {
    "id": "disabilities-2026",
    "title": "Minnesotans with Disabilities: Demographic and Economic Characteristics",
    "publisher": "Minnesota State Demographic Center",
    "date": "February 2026",
    "url": "https://mn.gov/admin/assets/accessible%20MN_MinnesotansWithDisabilities_tcm36-734001.pdf",
    "surveyYears": "2019 to 2023",
    "dataSource": "Census Bureau American Community Survey, 2019 to 2023, using the same cultural groups as the 2026 chartbook.",
    "geography": "Statewide.",
}
SUPPRESSION_RULES = [
    "A cultural group appears in the report only if it had 300 or more survey respondents in the 2019 to 2023 sample.",
    "A value is not shown when fewer than 150 survey respondents are in the group of people that value describes. "
    "The report prints NA, and marks the group with an asterisk.",
    "All values are rounded. Groups may not add up to the total because of rounding and values not shown.",
    "Margins of error are at the 95 percent confidence level. They are generally larger for smaller groups.",
]
COMPARABILITY_NOTE = (
    "Do not compare these figures with the 2023 edition of this report. The 2023 edition used 2016 to 2020 survey "
    "data, which overlaps with the 2019 to 2023 data used here, and the Census Bureau cautions against comparing "
    "overlapping five-year samples."
)
PERIOD_NOTE = (
    "The figures are averages over January 2019 to December 2023, a period that includes the economic disruption "
    "of the COVID-19 pandemic."
)

# Groups exactly as printed in Table ii, with the report's broader racial or ethnic group.
GROUPS = [
    ("Dakota", "American Indian"),
    ("Ojibwe", "American Indian"),
    ("Other American Indian", "American Indian"),
    ("Asian Indian", "Asian"),
    ("Chinese", "Asian"),
    ("Filipino", "Asian"),
    ("Hmong", "Asian"),
    ("Karen", "Asian"),
    ("Korean", "Asian"),
    ("Lao", "Asian"),
    ("Vietnamese", "Asian"),
    ("Other Asian", "Asian"),
    ("African-American", "Black or African-American"),
    ("Ethiopian", "Black or African-American"),
    ("Liberian", "Black or African-American"),
    ("Somali", "Black or African-American"),
    ("Other Black", "Black or African-American"),
    ("Mexican", "Hispanic or Latino"),
    ("Puerto Rican", "Hispanic or Latino"),
    ("Other Hispanic", "Hispanic or Latino"),
    ("Russian", "White"),
    ("White", "White"),
    ("Other (including Pacific Islander)", "Other/Multiple Groups"),
    ("Multiple Cultural Groups", "Other/Multiple Groups"),
    ("Total", "Total"),
]
GROUP_NAMES = [g for g, _ in GROUPS]
RACIAL_PREFIXES = ["Black or African-American", "Other/Multiple Groups", "Hispanic or Latino",
                   "American Indian", "Asian", "White", "Total"]

# Plain-language definition notes for each report group (from Table i and the Appendix, pages 7, 60 and 61).
GROUP_DEFINITIONS = {
    "Dakota": "People who identified as Dakota or Sioux.",
    "Ojibwe": "People who identified as Ojibwe, Chippewa or Anishinaabe.",
    "Other American Indian": "All other American Indian people, except Dakota and Ojibwe.",
    "Asian Indian": "Asian Indian, wherever born.",
    "Chinese": "Chinese, wherever born.",
    "Filipino": "Filipino, wherever born.",
    "Hmong": "Hmong ancestry, language or birthplace, including children born in the United States.",
    "Karen": "Burmese ancestry with the Karen language, including children born in the United States.",
    "Korean": "Korean, wherever born.",
    "Lao": "Lao, wherever born.",
    "Vietnamese": "Vietnamese, wherever born.",
    "Other Asian": "All other Asian people not in the Asian groups above.",
    "African-American": "Black residents born in the United States, and their children, with no Ethiopian, Liberian "
                        "or Somali ancestry or birthplace in the last two generations. Black immigrants are not in this group.",
    "Ethiopian": "Black residents with Ethiopian ancestry or birthplace, including children born in the United States.",
    "Liberian": "Black residents with Liberian ancestry or birthplace, including children born in the United States.",
    "Somali": "Black residents with Somali ancestry or birthplace, including children born in the United States.",
    "Other Black": "All other Black residents not in the Black groups above. Most were born outside the United States.",
    "Mexican": "Hispanic origin of Mexican, wherever born.",
    "Puerto Rican": "Hispanic origin of Puerto Rican, wherever born.",
    "Other Hispanic": "All other Hispanic or Latino people, except Mexican and Puerto Rican.",
    "Russian": "Non-Hispanic White residents of Russian ancestry, including children born in the United States. "
               "This is ancestry, not language.",
    "White": "Non-Hispanic White residents, except those of Russian ancestry.",
    "Other (including Pacific Islander)": "People who reported Pacific Islander or another race not in the groups above.",
    "Multiple Cultural Groups": "People who belong to two or more of the groups above.",
    "Total": "All Minnesotans.",
}

# --------------------------------------------------------------------------------------------------
# Tables to read. columns = printed column order; "-moe" suffix marks a margin-of-error column.
# --------------------------------------------------------------------------------------------------
TABLES = {
    "ii": {"page": 8, "title": "Table ii. Minnesota's Largest Cultural Groups",
           "columns": ["percentOfMinnesota", "people", "people-moe", "households", "households-moe"]},
    "3": {"page": 16, "title": "Table 3. Birthplace by Cultural Group",
          "columns": ["foreignBorn", "foreignBorn-moe", "minnesotaBorn", "minnesotaBorn-moe",
                      "otherState", "otherState-moe", "total", "total-moe"]},
    "5": {"page": 20, "title": "Table 5. Ability to Speak English by Cultural Group, Ages 5+",
          "columns": ["speaksWell", "speaksWell-moe", "notWell", "notWell-moe", "total", "total-moe"]},
    "14": {"page": 38, "title": "Table 14. Labor Force and Employment Status, Ages 16-64 Years, By Cultural Group",
           "columns": ["notEmployed", "notEmployed-moe", "employed", "employed-moe", "total", "total-moe"]},
    "17": {"page": 45, "title": "Table 17. Disability Status by Cultural Group, Population Ages 18-64",
           "columns": ["age18to44", "age18to44-moe", "age45to64", "age45to64-moe", "age18to64", "age18to64-moe"]},
    "19": {"page": 49, "title": "Table 19. Median Household Income by Cultural Group",
           "columns": ["median", "median-moe"]},
    "20": {"page": 51, "title": "Table 20. Poverty Status of Individuals by Cultural Group",
           "columns": ["poverty", "poverty-moe", "nearPoverty", "nearPoverty-moe", "notPoverty", "notPoverty-moe",
                       "total", "total-moe"]},
    "21": {"page": 53, "title": "Table 21. Poverty Status of Children by Cultural Group",
           "columns": ["poverty", "poverty-moe", "notPoverty", "notPoverty-moe", "total", "total-moe"]},
    "23": {"page": 57, "title": "Table 23. Households by Owner/Renter Status and Cultural Group",
           "columns": ["owner", "owner-moe", "renter", "renter-moe", "total", "total-moe"]},
}

# Measures written to the JSON: (key, label, table, value column, universe column or None, universe label, unit, note)
MEASURES = [
    ("totalPopulation", "Number of people", "ii", "people", None, "All residents", "people",
     "Household counts from the same table are kept under households."),
    ("bornOutsideUnitedStates", "People born outside the United States", "3", "foreignBorn", "total",
     "All residents", "people", None),
    ("limitedEnglish", "People ages 5 and older who do not speak English well or at all", "5", "notWell", "total",
     "Residents ages 5 and older", "people",
     "The report's measure is \"does not speak English well or at all\". It is not the Census Bureau's broader "
     "\"speaks English less than very well\", which the report does not give."),
    ("disabilityAges18to64", "People ages 18 to 64 with a disability", "17", "age18to64", None,
     "Residents ages 18 to 64", "people",
     "The table gives the number with a disability only. It does not print the number of people ages 18 to 64 in "
     "each group, so no percentage is given here."),
    ("employedAges16to64", "People ages 16 to 64 who are employed", "14", "employed", "total",
     "Residents ages 16 to 64", "people",
     "The report uses ages 16 to 64, not 25 to 64. The universe is everyone ages 16 to 64, not only people in the "
     "labor force."),
    ("medianHouseholdIncome", "Median household income", "19", "median", None, "All households", "dollars",
     "In dollars as printed in the report."),
    ("peopleInPoverty", "People living below the federal poverty line", "20", "poverty", "total",
     "People for whom poverty status is known", "people", None),
    ("childrenInPoverty", "Children under 18 living below the federal poverty line", "21", "poverty", "total",
     "Children under 18 living in households, for whom poverty status is known", "people", None),
    ("homeownerHouseholds", "Households that own their home", "23", "owner", "total", "All households", "households",
     None),
]

NUM_RE = re.compile(r"^\d{1,3}(?:,\d{3})*(?:\.\d+)?$")


def is_value_token(t):
    return bool(NUM_RE.match(t)) or t in ("NA", "-")


def parse_value(t):
    if t == "NA":
        return ("suppressed", None)
    if t == "-":
        return ("dash", None)
    v = t.replace(",", "")
    return ("published", float(v) if "." in v else int(v))


def split_label(label):
    label = label.strip()
    for p in RACIAL_PREFIXES:
        if label.startswith(p + " "):
            rest = label[len(p) + 1:].strip()
            star = rest.endswith("*")
            rest = rest.rstrip("*").strip()
            if rest in GROUP_NAMES:
                return rest, star
    return None, False


def cluster_lines(words, tol=3.0):
    """words: list of (x0, top, x1, text). Returns lines (sorted by x) clustered by top."""
    lines = []
    for w in sorted(words, key=lambda w: w[1]):
        for ln in lines:
            if abs(ln["top"] - w[1]) <= tol:
                ln["words"].append(w)
                break
        else:
            lines.append({"top": w[1], "words": [w]})
    for ln in lines:
        ln["words"].sort(key=lambda w: w[0])
    return lines


def rows_from_words(words, ncols):
    """Find group rows and place each value token in a column by its right edge."""
    rows = {}
    for ln in cluster_lines(words):
        ws = ln["words"]
        idx = next((i for i, w in enumerate(ws) if is_value_token(w[3])), None)
        if idx is None:
            continue
        group, star = split_label(" ".join(w[3] for w in ws[:idx]))
        if group is None or group in rows:
            continue
        vals = [w for w in ws[idx:]]
        if not all(is_value_token(w[3]) for w in vals):
            continue
        rows[group] = {"tokens": vals, "star": star}
    full = [r["tokens"] for r in rows.values() if len(r["tokens"]) == ncols]
    if not full:
        raise SystemExit("No complete row found; table layout not recognized")
    anchors = []
    for c in range(ncols):
        xs = sorted(t[c][2] for t in full)
        anchors.append(xs[len(xs) // 2])
    out = {}
    for g, r in rows.items():
        cells = [None] * ncols
        for w in r["tokens"]:
            c = min(range(ncols), key=lambda i: abs(anchors[i] - w[2]))
            if abs(anchors[c] - w[2]) > 12 or cells[c] is not None:
                raise SystemExit(f"Cannot place token {w[3]!r} for {g} (nearest column {c})")
            cells[c] = w[3]
        out[g] = {"cells": cells, "star": r["star"]}
    return out


def method_a(pdf, page, ncols):
    p = pdf.pages[page - 1]
    words = [(w["x0"], w["top"], w["x1"], w["text"]) for w in p.extract_words(keep_blank_chars=False, use_text_flow=False)]
    return rows_from_words(words, ncols)


def method_b(doc, page, ncols):
    # Separate reading: PyMuPDF words, its own line grouping by (block, line) then by vertical position.
    p = doc[page - 1]
    raw = p.get_text("words")
    words = [(w[0], w[1], w[2], w[4]) for w in raw]
    # Independent placement: columns from the header-free rule "right edge nearest the median of complete rows",
    # computed from PyMuPDF coordinates only.
    return rows_from_words_b(words, ncols)


def rows_from_words_b(words, ncols):
    by_y = {}
    for x0, y0, x1, t in words:
        key = round(y0 / 2.0)
        by_y.setdefault(key, []).append((x0, y0, x1, t))
    merged = []
    for key in sorted(by_y):
        if merged and key - merged[-1][0] <= 1:
            merged[-1][1].extend(by_y[key])
            merged[-1] = (key, merged[-1][1])
        else:
            merged.append((key, list(by_y[key])))
    rows = {}
    for _, ws in merged:
        ws.sort(key=lambda w: w[0])
        texts = [w[3] for w in ws]
        first = next((i for i, t in enumerate(texts) if is_value_token(t)), None)
        if first is None:
            continue
        label = " ".join(texts[:first])
        group, star = split_label(label)
        if group is None:
            continue
        rows[group] = {"tokens": ws[first:], "star": star}
    lengths = {len(r["tokens"]) for r in rows.values()}
    full = [r["tokens"] for r in rows.values() if len(r["tokens"]) == ncols]
    anchors = [sorted(t[c][2] for t in full)[len(full) // 2] for c in range(ncols)]
    out = {}
    for g, r in rows.items():
        cells = [None] * ncols
        for w in r["tokens"]:
            dists = [abs(a - w[2]) for a in anchors]
            c = dists.index(min(dists))
            if dists[c] > 12 or cells[c] is not None:
                raise SystemExit(f"[B] cannot place {w[3]!r} for {g}")
            cells[c] = w[3]
        out[g] = {"cells": cells, "star": r["star"]}
    return out


def check_c(reader, page):
    """pypdf text: printed value tokens for each group row, in order."""
    text = reader.pages[page - 1].extract_text()
    rows = {}
    for line in text.splitlines():
        toks = line.split()
        idx = next((i for i, t in enumerate(toks) if is_value_token(t)), None)
        if idx is None:
            continue
        group, _ = split_label(" ".join(toks[:idx]))
        if group is None or group in rows:
            continue
        if all(is_value_token(t) for t in toks[idx:]):
            rows[group] = toks[idx:]
    return rows


# --------------------------------------------------------------------------------------------------
# Disability brief, Figure 6a
# --------------------------------------------------------------------------------------------------
BRIEF_NAME_TO_GROUP = {
    "African American": "African-American", "Mexican": "Mexican", "Hmong": "Hmong", "Somali": "Somali",
    "Ojibwe": "Ojibwe", "Russian": "Russian", "Puerto Rican": "Puerto Rican", "Indian (Asia)": "Asian Indian",
    "Ethiopian": "Ethiopian", "Karen": "Karen", "Vietnamese": "Vietnamese", "Chinese": "Chinese",
    "Korean": "Korean", "Lao": "Lao", "Liberian": "Liberian", "Dakota": "Dakota", "Filipino": "Filipino",
}
FIG6A_PAGE = 6
FIG6A_YRANGE = (110, 360)  # PDF points; bars and labels of Figure 6a (axis tick labels sit just below)
DISABILITY_BRIEF_EXCLUDED = (
    "Figures 6b and 6c (percent with a disability, ages 18 to 44 and 45 to 64) are not used. Their printed "
    "percentages sit at the end of each error bar and do not match the length of the drawn bars (for example, "
    "Dakota is printed as 40.2 percent but its bar ends near 26 percent), so the estimate cannot be read reliably. "
    "Neither figure gives a rate for ages 18 to 64."
)


def fig6a_pairs(words):
    """words: (x0, top, x1, text). Labels are left of x=110, values right of the bars."""
    lines = cluster_lines([w for w in words if FIG6A_YRANGE[0] < w[1] < FIG6A_YRANGE[1]], tol=4)
    pairs = {}
    for ln in lines:
        label = " ".join(w[3] for w in ln["words"] if w[2] <= 110)
        # Rejoin a number that a library split into touching pieces (PyMuPDF reads "3,100" as "3" + ",100";
        # the pieces share an edge, so there is no space between them on the page).
        right = []
        for w in (w for w in ln["words"] if w[0] > 110):
            if right and abs(w[0] - right[-1][2]) < 0.5:
                right[-1] = (right[-1][0], right[-1][1], w[2], right[-1][3] + w[3])
            else:
                right.append(w)
        vals = [w[3] for w in right if NUM_RE.match(w[3])]
        if label in BRIEF_NAME_TO_GROUP and len(vals) == 1:
            pairs[label] = (int(vals[0].replace(",", "")), ln["top"])
    return pairs


def fig6a_bars(page):
    """Bar right edges by vertical position, and the axis scale from the tick labels."""
    bars = []
    for d in page.get_drawings():
        if not d.get("fill"):
            continue
        for it in d["items"]:
            if it[0] == "re":
                r = it[1]
                if FIG6A_YRANGE[0] < r.y0 < FIG6A_YRANGE[1] and 3 < r.height < 12 and r.width > 0.5:
                    bars.append((r.y0, r.x0, r.x1))
    ticks = {}
    for w in page.get_text("words"):
        if FIG6A_YRANGE[1] < w[1] < FIG6A_YRANGE[1] + 25 and w[4] in ("0", "10,000", "20,000", "30,000"):
            ticks[int(w[4].replace(",", ""))] = (w[0] + w[2]) / 2
    return bars, ticks


def extract_fig6a(dis_path, log):
    with pdfplumber.open(dis_path) as pdf:
        a_words = [(w["x0"], w["top"], w["x1"], w["text"]) for w in pdf.pages[FIG6A_PAGE - 1].extract_words()]
    doc = pymupdf.open(dis_path)
    page = doc[FIG6A_PAGE - 1]
    b_words = [(w[0], w[1], w[2], w[4]) for w in page.get_text("words")]
    a, b = fig6a_pairs(a_words), fig6a_pairs(b_words)
    bars, ticks = fig6a_bars(page)
    log.append(f"Figure 6a: pdfplumber found {len(a)} labelled values, PyMuPDF {len(b)}, bars {len(bars)}, ticks {sorted(ticks)}")
    if 0 not in ticks or 30000 not in ticks:
        raise SystemExit("Figure 6a axis ticks not found")
    per_unit = (ticks[30000] - ticks[0]) / 30000.0
    results, disagreements = [], []
    for name in BRIEF_NAME_TO_GROUP:
        va, vb = a.get(name), b.get(name)
        if va is None or vb is None or va[0] != vb[0]:
            disagreements.append({"source": "disability brief Figure 6a", "group": name,
                                  "pdfplumber": va and va[0], "pymupdf": vb and vb[0]})
            continue
        y = vb[1]
        bar = min(bars, key=lambda r: abs(r[0] - y)) if bars else None
        bar_value = (bar[2] - bar[1]) / per_unit if bar else None
        if bar is None or abs(bar[0] - y) > 10 or abs(bar_value - va[0]) > 600:  # 2 percent of the 30,000 axis
            disagreements.append({"source": "disability brief Figure 6a", "group": name, "printed": va[0],
                                  "barLength": round(bar_value) if bar_value else None})
            continue
        results.append({"briefLabel": name, "group": BRIEF_NAME_TO_GROUP[name], "estimate": va[0],
                        "barLengthCheck": round(bar_value)})
    return results, disagreements


# --------------------------------------------------------------------------------------------------
def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    econ_path, dis_path = sys.argv[1], sys.argv[2]
    out_path = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_OUT
    log_path = sys.argv[4] if len(sys.argv) > 4 else None
    log = []

    tables = {}
    verified = dropped = 0
    disagreements = []
    reader = PdfReader(econ_path)
    doc = pymupdf.open(econ_path)
    with pdfplumber.open(econ_path) as pdf:
        for tid, spec in TABLES.items():
            page, cols = spec["page"], spec["columns"]
            text = pdf.pages[page - 1].extract_text() or ""
            title_start = spec["title"].split(".")[0] + "."
            if title_start not in text:
                raise SystemExit(f"{title_start} not found on page {page}")
            a = method_a(pdf, page, len(cols))
            b = method_b(doc, page, len(cols))
            c = check_c(reader, page)
            missing = [g for g in GROUP_NAMES if g not in a or g not in b or g not in c]
            if missing:
                raise SystemExit(f"Table {tid}: rows not found {missing}")
            table = {}
            for g in GROUP_NAMES:
                printed_a = [x for x in a[g]["cells"] if x is not None]
                c_ok = printed_a == c[g]
                cells = {}
                for i, col in enumerate(cols):
                    va, vb = a[g]["cells"][i], b[g]["cells"][i]
                    if va == vb and c_ok:
                        cells[col] = va  # None = blank in the source
                        if va is not None:
                            verified += 1
                    else:
                        dropped += 1
                        cells[col] = "DROPPED"
                        disagreements.append({"table": tid, "page": page, "group": g, "column": col,
                                              "pdfplumber": va, "pymupdf": vb, "pypdfRowMatches": c_ok})
                table[g] = {"cells": cells, "star": a[g]["star"]}
            tables[tid] = table
            log.append(f"Table {tid} (page {page}): {len(GROUP_NAMES)} rows read by all three methods")

    def cell(tid, g, col):
        return tables[tid][g]["cells"][col]

    def figure(tid, g, col, universe_col):
        spec = TABLES[tid]
        base = {"table": spec["title"].split(".")[0], "page": spec["page"]}
        raw = cell(tid, g, col)
        if raw == "DROPPED":
            return dict(base, status="not-verified")
        if raw is None:
            return dict(base, status="blank")
        status, value = parse_value(raw)
        if status != "published":
            note = ("Not shown: fewer than 150 survey respondents." if status == "suppressed"
                    else "Printed as a dash in the report.")
            return dict(base, status=status, note=note)
        moe_raw = cell(tid, g, col + "-moe") if col + "-moe" in spec["columns"] else None
        fig = dict(base, status="published", estimate=value)
        if moe_raw in (None, "-", "NA", "DROPPED"):
            fig["marginOfError"] = None
            fig["marginOfErrorPrinted"] = False
        else:
            fig["marginOfError"] = parse_value(moe_raw)[1]
            fig["marginOfErrorPrinted"] = True
        if universe_col:
            u_raw = cell(tid, g, universe_col)
            u_moe = cell(tid, g, universe_col + "-moe")
            if u_raw not in (None, "-", "NA", "DROPPED"):
                fig["universeCount"] = parse_value(u_raw)[1]
                if u_moe not in (None, "-", "NA", "DROPPED"):
                    fig["universeMarginOfError"] = parse_value(u_moe)[1]
                    fig["universeMarginOfErrorPrinted"] = True
                else:
                    fig["universeMarginOfError"] = None
                    fig["universeMarginOfErrorPrinted"] = False
        return fig

    groups = []
    for name, racial in GROUPS:
        figs = {}
        for key, _label, tid, col, ucol, _ulabel, _unit, _note in MEASURES:
            figs[key] = figure(tid, name, col, ucol)
        pct = cell("ii", name, "percentOfMinnesota")
        if pct not in (None, "DROPPED"):
            figs["totalPopulation"]["percentOfMinnesota"] = parse_value(pct)[1]
        figs["households"] = figure("ii", name, "households", None)
        groups.append({"name": name, "reportRacialOrEthnicGroup": racial, "definition": GROUP_DEFINITIONS[name],
                       "figures": figs})

    fig6a, fig6a_dis = extract_fig6a(dis_path, log)
    verified += len(fig6a)
    dropped += len(fig6a_dis)
    disagreements.extend(fig6a_dis)
    table17 = {g["name"]: g["figures"]["disabilityAges18to64"] for g in groups}
    for r in fig6a:
        t = table17[r["group"]]
        r["chartbookTable17"] = t.get("estimate") if t["status"] == "published" else "not shown in the chartbook"

    out = {
        "generatedBy": "scripts/data/extract-community-figures.py",
        "sources": {"chartbook": CHARTBOOK, "disabilityBrief": DISABILITY_BRIEF},
        "surveyYears": "2019 to 2023",
        "suppressionRules": SUPPRESSION_RULES,
        "comparabilityNote": COMPARABILITY_NOTE,
        "periodNote": PERIOD_NOTE,
        "readingNote": (
            "Values are counts and medians exactly as printed in the report tables, with their margins of error. "
            "The report's tables print counts, not percentages, so no percentages are given here except the share "
            "of Minnesota's population printed in Table ii. Where a measure is a count of people, universeCount is "
            "the printed number of people the count is out of."
        ),
        "measures": [
            {"key": key, "label": label, "table": TABLES[tid]["title"], "page": TABLES[tid]["page"], "universe": ulabel,
             "unit": unit, **({"note": note} if note else {})}
            for key, label, tid, col, ucol, ulabel, unit, note in MEASURES
        ] + [{"key": "households", "label": "Number of households", "table": TABLES["ii"]["title"], "page": 8,
              "universe": "All households", "unit": "households"}],
        "groups": groups,
        "disabilityBrief": {
            "source": DISABILITY_BRIEF["id"],
            "figure": "Figure 6a. Number of People with at Least One Disability, by Cultural Group, 2019-2023",
            "page": FIG6A_PAGE,
            "universe": "Residents ages 18 to 64 (civilian, not living in institutions)",
            "unit": "people",
            "marginOfErrorNote": "The brief draws 95 percent margins of error as error bars but does not print them "
                                 "as numbers, so none are given here.",
            "definitionNote": "Same cultural groups and survey years as the chartbook. The brief prints counts for "
                              "some groups that the chartbook does not show because of small samples (Somali, Karen, "
                              "Puerto Rican, Ethiopian, Korean, Lao, Liberian, Dakota, Filipino). Treat those with "
                              "extra caution. It gives no count for Other American Indian, Other Asian, Other Black, "
                              "Other Hispanic, White, Other (including Pacific Islander), Multiple Cultural Groups or "
                              "the total.",
            "excluded": DISABILITY_BRIEF_EXCLUDED,
            "groups": [{"group": r["group"], "briefLabel": r["briefLabel"], "status": "published",
                        "estimate": r["estimate"], "marginOfError": None, "marginOfErrorPrinted": False,
                        "table": "Figure 6a", "page": FIG6A_PAGE, "chartbookTable17": r["chartbookTable17"]}
                       for r in fig6a],
        },
        "verification": {
            "methods": [
                "pdfplumber word positions (values placed in columns by their right edge)",
                "PyMuPDF word positions (separate reading and placement)",
                "pypdf text (the printed values on each row, in order, must match)",
                "Figure 6a only: each printed number must also match its drawn bar length within 2 percent of the axis",
            ],
            "valuesVerified": verified,
            "valuesDropped": dropped,
            "disagreements": disagreements,
        },
    }
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")
    log.append(f"Verified {verified} printed values; dropped {dropped}.")
    for d in disagreements:
        log.append(f"DISAGREEMENT {d}")
    if log_path:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("\n".join(log) + "\n")
    sys.stdout.reconfigure(encoding="utf-8")
    print("\n".join(log))


if __name__ == "__main__":
    main()
