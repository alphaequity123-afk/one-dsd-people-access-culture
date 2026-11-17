"""Retrieve and validate the two public DHS LTSS workbooks before publication."""
from datetime import datetime, timezone
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
import json
import os
import tempfile
import openpyxl

ROOT = Path(__file__).resolve().parents[2]
TARGET = ROOT / "public" / "data" / "ltss"
SOURCES = {
    "demographics": "https://mn.gov/dhs/assets/LTSS%20Program%20Demographics_tcm1053-631765.xlsx",
    "performance": "https://mn.gov/dhs/assets/LTSS-Performance-Measures_tcm1053-492103.xlsx",
}
MAX_BYTES = 25 * 1024 * 1024

def get(url):
    req = Request(url, headers={"User-Agent": "OneDHS-LTSS-data-refresh/1.0"})
    with urlopen(req, timeout=90) as response:
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES or not data.startswith(b"PK\x03\x04"):
        raise ValueError("DHS workbook is missing, invalid, or exceeds the size limit")
    return data

def load(data):
    return openpyxl.load_workbook(BytesIO(data), read_only=True, data_only=True)

def snapshot(book):
    if "Summary" not in book.sheetnames:
        raise ValueError("The LTSS demographic workbook no longer has its Summary sheet")
    rows = book["Summary"].iter_rows(values_only=True)
    headers = next(rows)
    if tuple(headers[:7]) != ("Program Population", "County (COFR)", "Month Year", "Race Summary", "Age Summary", "# of People", "% of Program Population"):
        raise ValueError("The LTSS demographic workbook headers changed")
    found = {}
    for row in rows:
        program, county, period, race, age, number = row[:6]
        if not all(isinstance(x, str) for x in (program, county, race, age)):
            continue
        program, county, race, age = (x.strip() for x in (program, county, race, age))
        if county != "Statewide" or race != "All Race/Ethnicities" or age != "All Ages" or program not in ("Total LTSS Population", "Total HCBS Population"):
            continue
        if not isinstance(period, datetime) or not isinstance(number, (int, float)) or isinstance(number, bool) or number < 0 or int(number) != number:
            raise ValueError("The statewide demographic row has an invalid date or count")
        key = (period.strftime("%Y-%m"), program)
        if key in found:
            raise ValueError("The statewide demographic row is ambiguous")
        found[key] = int(number)
    periods = sorted(set(p for p, name in found if (p, "Total LTSS Population") in found and (p, "Total HCBS Population") in found))
    if not periods:
        raise ValueError("No complete statewide LTSS and HCBS totals were found")
    period = periods[-1]
    return {"period": period, "ltss": found[(period, "Total LTSS Population")], "hcbs": found[(period, "Total HCBS Population")]}

def main():
    blobs = {name: get(url) for name, url in SOURCES.items()}
    demographic = load(blobs["demographics"])
    performance = load(blobs["performance"])
    values = snapshot(demographic)
    if "People receiving HCBS" not in performance.sheetnames:
        raise ValueError("The LTSS performance workbook no longer has its expected measure sheet")
    header = next(performance["People receiving HCBS"].iter_rows(values_only=True))
    if tuple(header[:3]) != ("Measure Name", "County (COFR)", "Year"):
        raise ValueError("The LTSS performance workbook headers changed")
    metadata = {"checkedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"), "snapshot": values, "sources": {name: {"url": url, "sha256": sha256(blobs[name]).hexdigest()} for name, url in SOURCES.items()}}
    # Validation finishes before any published file changes. A failed download or schema
    # check leaves the previously published copy intact; CI commits only on success.
    TARGET.mkdir(parents=True, exist_ok=True)
    outputs = {"demographics.xlsx": blobs["demographics"], "performance.xlsx": blobs["performance"], "metadata.json": (json.dumps(metadata, indent=2) + "\n").encode()}
    for filename, data in outputs.items():
        with tempfile.NamedTemporaryFile(dir=TARGET, delete=False) as temp:
            temp.write(data)
            name = temp.name
        os.replace(name, TARGET / filename)
    print("Validated both DHS workbooks; latest complete statewide demographic period:", values["period"])

if __name__ == "__main__":
    main()
