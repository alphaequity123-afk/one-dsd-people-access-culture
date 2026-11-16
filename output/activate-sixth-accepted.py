import json,hashlib
from pathlib import Path
def read(p):return json.loads(Path(p).read_text(encoding='utf8'))
def save(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p=Path('lib/content/professional-language-revisions.json');d=read(p)
proposal=read('output/practice-path-final-revisions.json')
for row in proposal['records']:
 assert not any(r['target']==row['target'] for r in d['revisions'])
 for change in row['changes']:
  value=row['original']
  for k in change['path']:value=value[k]
  assert value==change['before']
 d['revisions'].append({k:row[k] for k in ['target','kind','route','changes']}|{'status':'reviewed','review':{'status':'accepted','reviewer':'coverage_review','date':'2026-11-15','scope':'50 bounded fields across six complete practice-path contexts; linked materials not recertified.'}})
save(p,d);save('docs/editorial/practice-path-final-revisions-review.json',proposal)
proposal=read('output/action-plan-shared-revisions.json')
for row in proposal['records']:
 p=Path(row['file']);s=p.read_text(encoding='utf8')
 for c in row['changes']:
  assert s.count(c['before'])==1,(row['file'],c['before'])
  s=s.replace(c['before'],c['after'])
 if row['file']=='components/record-workbench.tsx':
  c={'before':'Nothing else you do here is shared.','after':'This button shares only the selected record.'}
  assert s.count(c['before'])==1;s=s.replace(c['before'],c['after']);row['changes'].append(c)
 p.write_text(s,encoding='utf8')
proposal['review']={'reviewer':'root','status':'accepted','date':'2026-11-15','scope':'18 proposed fields plus exact adjacent team-share footer correction; storage behavior inspected.'}
save('docs/editorial/action-plan-shared-review.json',proposal)
p=Path('output/assessment-tool-revisions.json');d=read(p)
for r in d['records']:
 for c in r['changes']:
  if r['target']=='resource.tool-idi' and c['path']==['summary']:
   c['after']=c['after'].replace('administered by qualified professionals','administered by an IDI Qualified Administrator')
  if r['target']=='resource.tool-implicit-association' and c['path']==['body',2]:
   c['after']="Evidence and limits: Project Implicit describes continuing debate about repeated scores and behavioral prediction. The publisher reports associations with behavior in aggregate, while cautioning against predictions about one person on one occasion. It also cautions against treating one result as a permanent personal characteristic. Use the result as a question for reflection, not a diagnosis."
save(p,d)
print('Activated 50 path fields and 19 shared fields; refined assessment proposal for final review.')
