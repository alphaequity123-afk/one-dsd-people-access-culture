from pathlib import Path
import json,re,sys,unittest
sys.path.insert(0,str(Path(__file__).parent))
from scenario_scripts import parse
ROOT=Path(__file__).resolve().parents[2]
class ScenarioScripts(unittest.TestCase):
 def test_all_spoken_lines_preserved_and_cast(self):
  profile=json.loads((ROOT/'config/character-voices.json').read_text())
  paths=list((ROOT/'docs/media-scripts').glob('*/*.video.md'));self.assertEqual(len(paths),13)
  for path in paths:
   script=parse(path,profile)
   raw=path.read_text(encoding='utf8');expected=[]
   for m in re.finditer(r'^([A-Z][A-Z ]+)(?: \([^\n]*?\))?: (.*)$',raw,re.M):
    expected.append((m[1],re.sub(r'\([^)]*\)\s*','',m[2]).strip()))
   self.assertEqual([(t['speaker'],t['text']) for t in script['turns'] if t['kind']=='dialogue'],expected,path.name)
   for t in script['turns']:self.assertIn(t['character'],profile['characters'])
   for scene in script['scenes']:self.assertTrue(any(t['kind']=='description' and t['scene']==scene['number'] for t in script['turns']))
 def test_saved_pairings_cover_each_character_once(self):
  profile=json.loads((ROOT/'config/character-voices.json').read_text())
  chars=[c for pair in profile['podcastPairings'] for c in pair['characters']]
  self.assertEqual(sorted(chars),sorted(profile['characters']))
  self.assertEqual(profile['characters']['C4']['portraitFile'],'C4.png')
  self.assertIn('blue polo',profile['characters']['C4']['appearance'])
if __name__=='__main__':unittest.main()
