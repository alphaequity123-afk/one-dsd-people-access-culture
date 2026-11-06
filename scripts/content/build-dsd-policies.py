"""Combine the researched policy entries into lib/content/hub/dsd-policies.json.

Usage: python -I scripts/content/build-dsd-policies.py [<entries folder>] [<worktree root>]

Defaults: entries folder C:/Users/garyb/Projects/dsd-policies-20261105/entries, root is the folder
that holds this script's scripts/ directory. Every entry is validated before anything is written;
the first invalid entry stops the run with a non-zero exit code and a message naming the file.
"""
import json
import pathlib
import re
import sys
from urllib.parse import urlparse

HERE = pathlib.Path(__file__).resolve()
SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("C:/Users/garyb/Projects/dsd-policies-20261105/entries")
ROOT = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else HERE.parents[2]
CHECKED = "2026-11-05"

KINDS = [
    {"id": "statute", "title": "Minnesota statutes", "intro": "Laws passed by the Minnesota Legislature. They set who is eligible, what services exist, who pays and who oversees the work."},
    {"id": "rule", "title": "Minnesota rules", "intro": "Rules adopted by state agencies under authority from statute. They carry the force of law and fill in how a statute is carried out."},
    {"id": "manual", "title": "Community-Based Services Manual", "intro": "The policy manual the Disability Services Division and the Aging and Adult Services Division publish for lead agencies that administer home and community-based services."},
    {"id": "waiver-plan", "title": "Federally approved waiver plans", "intro": "The waiver plans the Centers for Medicare and Medicaid Services approved for Minnesota, and the announcements of their approval."},
    {"id": "department-policy", "title": "Department of Human Services policies", "intro": "Policies, protocols, manuals and guidance the Department of Human Services publishes outside the Community-Based Services Manual."},
    {"id": "bulletin", "title": "Bulletins", "intro": "Numbered bulletins and dated announcements the Department of Human Services sends to lead agencies and providers."},
    {"id": "federal-rule", "title": "Federal rules", "intro": "Federal regulations and final rules from the Centers for Medicare and Medicaid Services that Minnesota's programs must follow."},
    {"id": "report-or-plan", "title": "Reports and plans", "intro": "Legislative reports, review reports and statewide plans that record how the policies are working and what is planned next."},
]
KIND_ORDER = {k["id"]: i for i, k in enumerate(KINDS)}

# Routes in this app that a policy may point to. The dynamic policy page itself is not in the list.
ALLOWED_PAGES = [
    "/community-outreach/county-agencies",
    "/community-outreach/county-map",
    "/community-outreach/how-the-system-connects",
    "/community-outreach/plan",
    "/community-outreach/providers",
    "/equity-policy",
    "/equity-review",
    "/equity-review/working-group-plan",
    "/learn/equity-toolkit",
    "/minnesota-communities",
]

# Official hosts. Hosts ending in .mn.gov are state sites. content.govdelivery.com is accepted only for
# the Department of Human Services bulletin account (MNDHS). www.govinfo.gov is the United States
# Government Publishing Office, which prints the Federal Register.
OFFICIAL_HOSTS = {
    "dhs.state.mn.us", "www.dhs.state.mn.us", "edocs.dhs.state.mn.us",
    "mn.gov", "www.mn.gov", "revisor.mn.gov", "www.revisor.mn.gov", "lrl.mn.gov", "www.lrl.mn.gov",
    "medicaid.gov", "www.medicaid.gov", "cms.gov", "www.cms.gov", "ecfr.gov", "www.ecfr.gov",
    "federalregister.gov", "www.federalregister.gov", "govinfo.gov", "www.govinfo.gov",
}
GOVDELIVERY_PREFIX = "https://content.govdelivery.com/accounts/MNDHS/"

APPLIES_TO = {"lead agencies", "providers", "case managers", "people receiving services", "the Department of Human Services", "related aging program"}
BANNED = re.compile(r"\b(DSD|DHS|HCBS|CBSM|CADI|CAC|CDCS|DWRS|PCA|CFSS|EVV|AI)\b|\btutor\b|recommended")
DATE = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")
SOURCE_DATE = re.compile(r"^(\d{4}(-\d{2}(-\d{2})?)?|\d{4} Minnesota Statutes)?$")
FULL_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ID = re.compile(r"^[a-z0-9][a-z0-9-]*$")
REQUIRED = ["id", "title", "kind", "programs", "appliesTo", "summary", "requires", "equityCheck", "effective", "lastUpdated", "source", "relatedSources", "relatedPages", "tags", "checked"]


class Invalid(Exception):
    pass


def official(url: str) -> bool:
    if not url.startswith("https://"):
        return False
    host = urlparse(url).netloc.lower()
    if host in OFFICIAL_HOSTS or host.endswith(".mn.gov"):
        return True
    return url.startswith(GOVDELIVERY_PREFIX)


def non_empty_string(value, label):
    if not isinstance(value, str) or not value.strip():
        raise Invalid(f"{label} must be a non-empty string")
    return value.strip()


def string_list(value, label, allow_empty=False):
    if not isinstance(value, list) or (not value and not allow_empty):
        raise Invalid(f"{label} must be a {'' if allow_empty else 'non-empty '}list of strings")
    return [non_empty_string(v, f"{label}[{i}]") for i, v in enumerate(value)]


def validate(path: pathlib.Path, entry: dict) -> dict:
    missing = [k for k in REQUIRED if k not in entry]
    if missing:
        raise Invalid(f"missing fields: {', '.join(missing)}")
    extra = [k for k in entry if k not in REQUIRED]
    if extra:
        raise Invalid(f"unknown fields: {', '.join(extra)}")

    out = {}
    out["id"] = non_empty_string(entry["id"], "id")
    if not ID.match(out["id"]):
        raise Invalid(f"id {out['id']!r} must be lowercase letters, digits and hyphens")
    if out["id"] != path.stem:
        raise Invalid(f"id {out['id']!r} does not match the file name")
    out["title"] = non_empty_string(entry["title"], "title")
    out["kind"] = non_empty_string(entry["kind"], "kind")
    if out["kind"] not in KIND_ORDER:
        raise Invalid(f"kind {out['kind']!r} is not one of {sorted(KIND_ORDER)}")
    out["programs"] = string_list(entry["programs"], "programs")
    out["appliesTo"] = string_list(entry["appliesTo"], "appliesTo")
    for a in out["appliesTo"]:
        if a not in APPLIES_TO:
            raise Invalid(f"appliesTo value {a!r} is not one of {sorted(APPLIES_TO)}")
    out["summary"] = non_empty_string(entry["summary"], "summary")
    out["requires"] = string_list(entry["requires"], "requires")
    out["equityCheck"] = string_list(entry["equityCheck"], "equityCheck")

    for key in ("effective", "lastUpdated"):
        value = entry[key]
        if not isinstance(value, str) or (value and not DATE.match(value)):
            raise Invalid(f"{key} must be a date (YYYY, YYYY-MM or YYYY-MM-DD) or empty, got {value!r}")
        out[key] = value
    checked = entry["checked"]
    if not isinstance(checked, str) or not FULL_DATE.match(checked):
        raise Invalid(f"checked must be a full date, got {checked!r}")
    out["checked"] = checked

    source = entry["source"]
    if not isinstance(source, dict):
        raise Invalid("source must be an object")
    src_title = non_empty_string(source.get("title"), "source.title")
    src_url = non_empty_string(source.get("url"), "source.url")
    if not official(src_url):
        raise Invalid(f"source.url is not https on an official host: {src_url}")
    src_date = source.get("date", "")
    if not isinstance(src_date, str) or not SOURCE_DATE.match(src_date):
        raise Invalid(f"source.date must be a date, a statutes edition or empty, got {src_date!r}")
    out["source"] = {"title": src_title, "url": src_url, "date": src_date}

    related = entry["relatedSources"]
    if not isinstance(related, list):
        raise Invalid("relatedSources must be a list")
    out["relatedSources"] = []
    for i, s in enumerate(related):
        if not isinstance(s, dict):
            raise Invalid(f"relatedSources[{i}] must be an object")
        title = non_empty_string(s.get("title"), f"relatedSources[{i}].title")
        url = non_empty_string(s.get("url"), f"relatedSources[{i}].url")
        if not official(url):
            raise Invalid(f"relatedSources[{i}].url is not https on an official host: {url}")
        out["relatedSources"].append({"title": title, "url": url})

    pages = string_list(entry["relatedPages"], "relatedPages", allow_empty=True)
    for p in pages:
        if p not in ALLOWED_PAGES:
            raise Invalid(f"relatedPages value {p!r} is not an allowed route")
        if not (ROOT / "app" / p.strip("/") / "page.tsx").is_file():
            raise Invalid(f"relatedPages route {p!r} has no app/{p.strip('/')}/page.tsx")
    out["relatedPages"] = list(dict.fromkeys(pages))
    out["tags"] = list(dict.fromkeys(string_list(entry["tags"], "tags")))

    visible = [out["title"], out["summary"], *out["requires"], *out["equityCheck"], *out["programs"], *out["appliesTo"], *out["tags"], src_title, *[s["title"] for s in out["relatedSources"]]]
    for text in visible:
        m = BANNED.search(text)
        if m:
            raise Invalid(f"banned short form {m.group(0)!r} in visible text: {text[:80]!r}")
    return out


def main() -> int:
    if not SRC.is_dir():
        print(f"entries folder not found: {SRC}", file=sys.stderr)
        return 2
    policies = []
    ids = set()
    for path in sorted(SRC.glob("*.json")):
        try:
            entry = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(entry, dict):
                raise Invalid("top level must be an object")
            policy = validate(path, entry)
        except (Invalid, json.JSONDecodeError) as err:
            print(f"INVALID {path}: {err}", file=sys.stderr)
            return 1
        if policy["id"] in ids:
            print(f"INVALID {path}: duplicate id {policy['id']}", file=sys.stderr)
            return 1
        ids.add(policy["id"])
        policies.append(policy)
    if not policies:
        print("no entries found", file=sys.stderr)
        return 1

    policies.sort(key=lambda p: (KIND_ORDER[p["kind"]], p["title"].casefold(), p["id"]))
    out = ROOT / "lib" / "content" / "hub" / "dsd-policies.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"checked": CHECKED, "kinds": KINDS, "policies": policies}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    counts = {k["id"]: 0 for k in KINDS}
    for p in policies:
        counts[p["kind"]] += 1
    for k in KINDS:
        print(f"{counts[k['id']]:4d}  {k['title']}")
    print(f"{len(policies):4d}  total -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
