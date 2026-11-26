"""Regression checks for recognition-format differences found during real recording."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('recorder', Path(__file__).with_name('record-approved-local.py'))
recorder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recorder)


class RecognitionNormalization(unittest.TestCase):
    def test_equivalent_formats(self):
        for source, recognized in [
            ('ten families before ten thousand', '10 families before 10,000'),
            ('Caseloads up thirty percent', 'Case loads up 30%'),
            ('any time', 'anytime'),
            ('a coworker', 'a co-worker'),
            ('Know where support lives.', 'Nowhere support lives.'),
        ]:
            with self.subTest(source=source):
                self.assertEqual(recorder.words(source), recorder.words(recognized))

    def test_material_changes_remain_different(self):
        for source, changed in [
            ('Do not share the file', 'Do share the file'),
            ('thirty percent', 'forty percent'),
            ('ten families', 'ten thousand families'),
            ('support exists', 'no support exists'),
            ('mistakes that happen', 'mistakes that happened'),
        ]:
            with self.subTest(source=source):
                self.assertNotEqual(recorder.words(source), recorder.words(changed))


if __name__ == '__main__':
    unittest.main()
