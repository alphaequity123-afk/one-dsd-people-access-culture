"""Apply independently accepted literal changes without reformatting TypeScript."""
import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--manifest',required=True);p.add_argument('--apply',action='store_true');a=p.parse_args()
m=json.loads(Path(a.manifest).read_text(encoding='utf-8'))
if a.apply and m.get('status')!='root_review_accepted':raise SystemExit('Independent acceptance required')
prepared={};ledger=[]
for r in m['records']:
 f=Path(r['file']);f.resolve().relative_to(Path.cwd().resolve())
 if r['file'] not in prepared:prepared[r['file']]=f.read_bytes().decode('utf-8')
 text=prepared[r['file']];source=r['source']
 if hashlib.sha256(source.encode()).hexdigest()!=r['sourceSha256'] or text.count(source)!=1:raise SystemExit('Stale or ambiguous source: '+r['id'])
 changed=source
 for c in r['changes']:
  literal=c['sourceLiteral']
  if changed.count(literal)!=1:raise SystemExit('Ambiguous literal')
  if json.loads(literal)!=c['before']:raise SystemExit('Exact before mismatch')
  replacement=json.dumps(c['after'],ensure_ascii=False)
  changed=changed.replace(literal,replacement,1)
  ledger.append({'id':r['id'],'file':r['file'],'fieldId':c['fieldId'],'beforeSha256':hashlib.sha256(c['before'].encode()).hexdigest(),'afterSha256':hashlib.sha256(c['after'].encode()).hexdigest()})
 prepared[r['file']]=text.replace(source,changed,1)
if a.apply:
 for f,text in prepared.items():Path(f).write_bytes(text.encode('utf-8'))
out={'mode':'applied' if a.apply else 'dry_run','reviewedRecords':len(m['records']),'changedRecords':sum(bool(r['changes'])for r in m['records']),'retainedRecords':sum(not r['changes']for r in m['records']),'changedFields':len(ledger),'changes':ledger}
if a.apply:Path('output/community-editorial/static-applied-ledger.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print(json.dumps(out,indent=2))
