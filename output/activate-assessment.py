import json
from pathlib import Path
p=Path('lib/content/professional-language-revisions.json');d=json.loads(p.read_text(encoding='utf8'))
r=json.loads(Path('output/assessment-tool-revisions.json').read_text(encoding='utf8'))
for row in r['records']:
 assert not any(x['target']==row['target'] for x in d['revisions'])
 for c in row['changes']:
  v=row['original']
  for k in c['path']:v=v[k]
  assert v==c['before']
 d['revisions'].append({k:row[k] for k in ['target','kind','route','changes']}|{'status':'reviewed','review':{'status':'accepted','reviewer':'coverage_review','date':'2026-11-15','scope':'Nine bounded fields; publisher primary evidence and full original cards read.'}})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
Path('docs/editorial/assessment-tool-revisions-review.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
