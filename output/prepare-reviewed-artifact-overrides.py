import json,hashlib,shutil
from pathlib import Path
def read(p):return json.loads(Path(p).read_text(encoding='utf8'))
def save(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
receipt=read('docs/editorial/community-reference-tools-batch.json')
overrides=read('config/standalone-public-overrides/index.json')
release=read('config/railway-release-assets.json')
supplemental=read('config/github-supplemental-assets.json')
records=[]
for r in receipt['records']:
 p=Path(r['file']);data=p.read_bytes();sha=hashlib.sha256(data).hexdigest();assert sha==r['finalSha256']
 identity={'path':p.as_posix(),'bytes':len(data),'sha256':sha}
 for entries in [overrides['files'],release['assets']]:
  matches=[x for x in entries if x['path']==identity['path']]
  assert len(matches)<=1,(identity['path'],len(matches))
  if matches:matches[0].update(identity)
  else:
   assert entries is overrides['files'],identity['path']
   entries.append(identity.copy())
 target=Path('config/standalone-public-overrides/files')/p;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)
 if p.suffix=='.docx':
  for destination in [p,target]:
   row={'path':destination.as_posix(),'bytes':len(data),'sha256':sha,'key':'one-dsd/github-assets/'+sha}
   matches=[x for x in supplemental['files'] if x['path']==row['path']]
   assert len(matches)<=1
   if matches:matches[0].update(row)
   else:supplemental['files'].append(row)
 records.append(identity)
save('config/standalone-public-overrides/index.json',overrides)
save('config/railway-release-assets.json',release)
save('config/github-supplemental-assets.json',supplemental)
save('docs/editorial/reference-artifact-transport-review.json',{'scope':'Exact already-reviewed artifacts; explicit standalone identity supersedes immutable historical release bytes. Four DOCX files and their override copies use checksum-addressed supplemental transport.','records':records})
print('Prepared ten explicit overrides and eight supplemental destinations sharing four immutable blobs.')
