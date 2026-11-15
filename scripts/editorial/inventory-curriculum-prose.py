import json,re,hashlib
from pathlib import Path
out=Path('output/community-editorial');units=[];ledger=[]
protected={'id','number','slug','title','name','heading','label','href','url','source','sources','sourceUrl','sourceTitle','quote','quotes','transcript','narration','caption','captions','audio','video','poster','image','imageAlt','src','type','kind','correct','score','status','date','standards'}
def make(file,obj,path,context):
 u={'id':file.replace('/','--').replace('.json','')+'--'+'-'.join(map(str,path or ['overview'])),'file':file,'path':path,'source':obj,'context':context,'sourceSha256':hashlib.sha256(json.dumps(obj,sort_keys=True,ensure_ascii=False).encode()).hexdigest(),'fields':[]}
 def walk(v,p,reason=None):
  key=str(p[-1]) if p else ''
  if key in protected:reason=reason or 'exact media, source, model identifier, label or assessment field'
  if 'slides' in p and key=='text':reason='visual text synchronized to existing narrated media; separate media revision required'
  if isinstance(v,str):
   why=reason or ('short label or technical value' if len(v)<30 or re.match(r'^https?://|^/[\w]',v) else None)
   f={'file':file,'path':p,'before':v,'classification':'protected' if why else 'authored_prose_review','reason':why};ledger.append(f)
   if not why:u['fields'].append({**f,'fieldId':len(u['fields'])})
  elif isinstance(v,list):
   for i,x in enumerate(v):walk(x,p+[i],reason)
  elif isinstance(v,dict):
   for k,x in v.items():walk(x,p+[k],reason)
 walk(obj,path)
 if u['fields']:units.append(u)
files=['lib/content/water-we-swim-in.json','lib/content/clas-curriculum.json','lib/content/equity-everyday-decisions.json','lib/content/intercultural-curriculum.json','lib/program/equity-goals.json','data/program-documents/policy-presentation.json']
for file in files:
 obj=json.loads(Path(file).read_text(encoding='utf-8'))
 context={k:v for k,v in obj.items() if k in ['title','sources']} if isinstance(obj,dict) else {}
 if isinstance(obj,dict):
  for k,v in obj.items():
   if isinstance(v,list) and k not in protected:
    for i,x in enumerate(v):make(file,x,[k,i],context)
   elif k=='essay' and isinstance(v,dict):
    for i,x in enumerate(v.get('sections',[])):make(file,x,[k,'sections',i],context)
    for q in ['limits','sources']:make(file,v.get(q,''),[k,q],context)
   else:make(file,v,[k],context)
 else:make(file,obj,[],context)
html=Path('public/learning/self-directed/index.html').read_text(encoding='utf-8');m=re.search(r'<script\b[^>]*\bid=[\"\x27]course-data[\"\x27][^>]*>([\s\S]*?)</script>',html,re.I)
active=json.loads(m.group(1)) if m else []
for item in active:
 file='public/learning/self-directed/'+item['dataFile'];obj=json.loads(Path(file).read_text(encoding='utf-8'));make(file,obj,[],{'title':obj.get('title'),'mediaRule':'Narration and slide text are synchronized to accepted recordings; preserve them until media is intentionally revised.'});files.append(file)
(out/'curriculum-inventory.json').write_text(json.dumps({'files':files,'units':units,'fields':ledger},ensure_ascii=False),encoding='utf-8')
print(json.dumps({'files':len(files),'records':len(units),'authored_fields':sum(len(u['fields']) for u in units),'protected_fields':sum(x['classification']=='protected' for x in ledger)}))
