import json,hashlib,re
from pathlib import Path
ROOT=Path(r'C:\Users\garyb\Projects\one-dsd-community-language-20261115')
FALLBACK=Path(r'C:\Users\garyb\Projects\one-dsd-writing-standard-20261115')
OUT=ROOT/'output/community-editorial'; OUT.mkdir(parents=True,exist_ok=True)
TRACK=Path(r'C:\Users\garyb\Downloads\One DSD Equity Program (11)\Language Rollout Tracker/community-progress.json')
files=list((FALLBACK/'lib/content/community-research').glob('*.json'))+list((FALLBACK/'lib/content/community-360').glob('*.json'))+[FALLBACK/'lib/content/cultural-calendar.json',FALLBACK/'lib/content/reading-collection.json']+list((FALLBACK/'lib/content/hub').glob('*.json'))
excluded={'id','communityId','slug','title','name','heading','label','kind','type','category','date','dates','dateRule','dateCertainty','checked','effective','lastUpdated','version','number','source','sources','sourceUrl','sourceDocument','sourceSha256','contentSha256','sourceTitle','records','contact','phone','website','email','url','href','src','authors','alsoKnownAs','communities','programs','appliesTo','tags','themes','years','amount','counties','county','agencyName','fips','sharedCounties','languages','region','status','closed','relationshipTypes','sourceEvidence','review','reviewStatus','curationStatus','generatedBy','builtOn','surveyYears','measures','groups','places','projection','viewBox','width','height','coordinates','d','path','code','value','percent','count','requires','keyFacts','services','editionNote','sourceKind'}
excluded.update({'titles','narration','transcript','captions','audio','video','poster','image','imageAlt'})
fields=[]; units=[]
def walk(v,path,unit,blocked=None):
 key=str(path[-1]) if path else ''
 if key in excluded: blocked=blocked or 'exact fact, source metadata, official requirement, label, or structured value'
 if isinstance(v,str):
  reason=blocked or ('not prose' if len(v.strip())<30 or re.match(r'^(https?://|/[\w])',v) else None)
  rec={'path':path,'before':v,'classification':'protected' if reason else 'authored_prose_review','reason':reason}
  fields.append({'file':unit['file'],'unit':unit['id'],**rec})
  if not reason: unit['fields'].append({'fieldId':len(unit['fields']),**rec})
 elif isinstance(v,list):
  for i,x in enumerate(v):walk(x,path+[i],unit,blocked)
 elif isinstance(v,dict):
  for k,x in v.items():walk(x,path+[k],unit,blocked)
def unit(file,root,value,path):
 ident=file.replace('/','--').replace('.json','')+'--'+'-'.join(map(str,path or ['overview']))
 row={'id':ident,'file':file,'path':path,'sourceSha256':hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True).encode()).hexdigest(),'source':value,'context':{k:v for k,v in root.items() if k in ['title','communityId','limits','description','tribalNote','checked','sources','about']} if isinstance(root,dict) else {},'fields':[]}
 walk(value,path,row)
 if row['fields']:units.append(row)
for old in files:
 rel=old.relative_to(FALLBACK).as_posix(); p=ROOT/rel
 # Worktree checkout may still be running. Inventory must match a complete source.
 if not p.exists(): raise RuntimeError('Checkout incomplete: '+rel)
 obj=json.loads(p.read_text(encoding='utf-8'))
 if isinstance(obj,list):
  for i,x in enumerate(obj):unit(rel,obj,x,[i])
 elif '/community-research/' in rel:
  for key,value in obj.items():
   if isinstance(value,list):
    for i,x in enumerate(value):unit(rel,obj,x,[key,i])
   else:unit(rel,obj,value,[key])
 elif '/community-360/' in rel:
  for i,x in enumerate(obj.get('sections',[])):unit(rel,obj,x,['sections',i])
  unit(rel,obj,obj.get('limits',''),['limits'])
  for i,x in enumerate(obj.get('businesses',[])):unit(rel,obj,x,['businesses',i])
 else:
  for key,value in obj.items():
   if key in excluded:
    unit(rel,obj,value,[key])
   elif isinstance(value,list):
    for i,x in enumerate(value):unit(rel,obj,x,[key,i])
   else:unit(rel,obj,value,[key])
(OUT/'inventory.json').write_text(json.dumps({'units':units,'fields':fields},ensure_ascii=False),encoding='utf-8')
summary={'updatedAt':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),'summary':'Inventoried source-bound community, calendar, directory, policy-summary and reading-note prose. Protected facts and references are recorded per field; no source edits or publications yet.','inventoryCount':len(units),'unitLabel':'source records with authored prose (not pages)','templateCount':len(files),'revisionDraftCount':0,'reviewedCount':0,'publishedCount':0,'remainingCount':len(units),'phase':'First representative sample preparation','issues':['Unchanged source facts and exact quotations remain protected.','Policy requires fields are protected pending source-specific legal review; authored summaries remain in scope.','TypeScript standalone framework, leadership and curriculum sources require a separate collector and are not counted here.'],'fieldCount':len(fields),'authoredFieldCount':sum(f['classification']=='authored_prose_review' for f in fields)}
TRACK.write_text(json.dumps(summary,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in summary.items() if k not in ['summary','issues']}))
