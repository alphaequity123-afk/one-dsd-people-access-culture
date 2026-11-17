import io
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch
import openpyxl
import refresh

def make_workbooks(bad_performance=False):
    demo = openpyxl.Workbook()
    sheet = demo.active
    sheet.title = "Summary"
    sheet.append(["Program Population", "County (COFR)", "Month Year", "Race Summary", "Age Summary", "# of People", "% of Program Population"])
    for year, ltss, hcbs in [(2019, 100, 80), (2023, 120, 95)]:
        for name, count in [("Total LTSS Population", ltss), ("Total HCBS Population", hcbs)]:
            sheet.append([name, "Statewide", datetime(year, 1, 1), "All Race/Ethnicities", "All Ages", count, 1])
    performance = openpyxl.Workbook()
    sheet = performance.active
    sheet.title = "People receiving HCBS" if not bad_performance else "Changed"
    sheet.append(["Measure Name", "County (COFR)", "Year"])
    blobs=[]
    for book in (demo, performance):
        stream=io.BytesIO(); book.save(stream); blobs.append(stream.getvalue())
    return blobs

class RefreshTests(unittest.TestCase):
    def test_uses_latest_complete_statewide_period(self):
        demo, _ = make_workbooks()
        self.assertEqual(refresh.snapshot(refresh.load(demo)), {"period": "2023-01", "ltss": 120, "hcbs": 95})

    def test_invalid_second_workbook_keeps_existing_files(self):
        demo, bad = make_workbooks(bad_performance=True)
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            (target / "metadata.json").write_text("last valid copy", encoding="utf-8")
            with patch.object(refresh, "TARGET", target), patch.object(refresh, "get", side_effect=[demo, bad]):
                with self.assertRaises(ValueError): refresh.main()
            self.assertEqual((target / "metadata.json").read_text(encoding="utf-8"), "last valid copy")
            self.assertFalse((target / "demographics.xlsx").exists())

if __name__ == "__main__": unittest.main()
