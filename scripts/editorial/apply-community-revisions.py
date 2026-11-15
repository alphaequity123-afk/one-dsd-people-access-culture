"""Apply an independently accepted manifest with stale-source and exact-field guards."""
import argparse,collections,copy,hashlib,json,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--manifest',required=True);p.add_argument('--apply',action='store_true');args=p.parse_args()
manifest=json.loads(Path(args.manifest).read_text(encoding='utf-8'))
if args.apply and manifest.get('status')!='root_review_accepted':raise SystemExit('Manifest is not independently accepted.')
def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
def get(v,path):
 for k in path:v=v[k]
 return v
def tokens(s):return {name:collections.Counter(re.findall(pattern,s)) for name,pattern in [('numbers',r'\b\d[\d,.:%/-]*\b'),('urls',r'https?://[^\s)<>"\']+'),('quotes',r'"[^"\n]+"|“[^”\n]+”')]}
prepared={};beforehash={};formatting={};changed=[]
for row in manifest['records']:
 file=Path(row['file'])
 if not str(file.resolve()).startswith(str(Path.cwd().resolve())+str(Path('/'))):
  # Path separator normalization uses relative-to rather than string acceptance below.
  try:file.resolve().relative_to(Path.cwd().resolve())
  except ValueError:raise SystemExit('Path outside worktree')
 if row['file'] not in prepared:
  raw=file.read_bytes();prepared[row['file']]=json.loads(raw);beforehash[row['file']]=hashlib.sha256(raw).hexdigest()
  line=raw.decode('utf-8').splitlines()[1];formatting[row['file']]=len(line)-len(line.lstrip())
 data=prepared[row['file']]
 if digest(get(data,row['path']))!=row['sourceSha256']:raise SystemExit('Stale source record: '+row['id'])
 for c in row['changes']:
  if get(data,c['path'])!=c['before']:raise SystemExit('Field changed since review: '+str(c['path']))
  if tokens(c['before'])!=tokens(c['after']):raise SystemExit('Protected numbers, quotations or URLs changed: '+str(c['path']))
  parent=get(data,c['path'][:-1]);parent[c['path'][-1]]=c['after'];changed.append({'id':row['id'],'file':row['file'],'path':c['path'],'beforeSha256':hashlib.sha256(c['before'].encode()).hexdigest(),'afterSha256':hashlib.sha256(c['after'].encode()).hexdigest()})
result={'mode':'applied' if args.apply else 'dry_run','records':len(manifest['records']),'changedFields':len(changed),'files':len(set(c['file'] for c in changed)),'changes':changed,'sourceFileHashes':beforehash}
if args.apply:
 for f in {c['file'] for c in changed}:Path(f).write_text(json.dumps(prepared[f],ensure_ascii=False,indent=formatting[f])+'\n',encoding='utf-8')
 Path('output/community-editorial/applied-ledger.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
