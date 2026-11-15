import json
from pathlib import Path
base=Path('output/community-editorial');inv=json.loads((base/'inventory.json').read_text(encoding='utf-8'));units={u['id']:u for u in inv['units']};records={}
def edit(uid,path,after,reason):
 u=units[uid];f=next(f for f in u['fields'] if f['path']==path)
 if f['before']==after:return
 r=records.setdefault(uid,{k:u[k] for k in ['id','file','path','sourceSha256']});r.setdefault('changes',[]).append({**f,'after':after,'reason':reason});r['status']='ready_for_root_review';r['acceptanceScope']='proposed fields only; factual references retained, not newly verified';r['fieldCount']=len(u['fields'])
def source(community,kind,index=None):return 'lib--content--community-research--'+community+'--'+kind+('' if index is None else '-'+str(index))
def field(uid,path):return next(f['before'] for f in units[uid]['fields'] if f['path']==path)
# Correct the teaching frame directly without adding a cultural profile or new finding.
uid=source('american','disability');path=['disability','intro'];old=field(uid,path)
after=old.replace('This is background for preparing questions. It does not describe any person or family. Here, American means the mainstream U.S. ideas about disability built into the laws, programs and professional training that staff work inside. It is here so you can see that frame as one frame, not a neutral default.','This section examines mainstream U.S. ideas about disability built into the laws, programs and professional training within which staff work. It makes that cultural frame visible as one perspective rather than a neutral default. Use the background to prepare questions; it does not describe any person or family.')
edit(uid,path,after,'Lead with the institutional lens and its purpose, preserving individual variation and every limitation of the evidence below it.')
uid=source('african-american','disability');path=['disability','context',1,'body',1];c=json.loads((base/'candidates-v2'/f'{uid}.json').read_text(encoding='utf-8'))
edit(uid,path,next(x['after'] for x in c['changes'] if x['path']==path),'Clarify that the individual chooses who participates; preserve both studies, their scope and the consent condition.')
uid=source('amharic','organizations');path=['organizations','intro'];old=field(uid,path)
after=old.replace(' An undated project request','\n\nAn undated project request').replace(" Worthington's daily newspaper","\n\nWorthington's daily newspaper").replace(' The list below is starting points for learning.','\n\nThe list below offers starting points for learning.')
edit(uid,path,after,'Separate language estimates, ethnicity estimates, local verification limits and use of the directory so readers do not conflate their evidence.')
# Break overloaded historical sentences without changing evaluation, timing or named actors.
uid=source('african-american','people',1);path=['people',1,'body',3];old=field(uid,path)
edit(uid,path,old.replace(', and she led the NAACP protest against a 1940','. She also led the NAACP protest against a 1940'),'Separate two different civil-rights actions; retain the direct description of the racist film.')
uid=source('african-american','people',2);path=['people',2,'body',0];old=field(uid,path)
after=old.replace("In 1935, after a new federal law protected workers' right to organize and after the club had cut food workers' pay from $15.00 to $12.50 a week, an elevator operator at the Minneapolis Athletic Club began signing up her coworkers.","In 1935, Nellie Stone Johnson, an elevator operator at the Minneapolis Athletic Club, began signing up her coworkers. A new federal law had protected workers' right to organize, and the club had cut food workers' pay from $15.00 to $12.50 a week.")
edit(uid,path,after,'Name the actor at the beginning and separate the organizing action from its legal and economic context without adding causation.')
uid=source('african-american','people',4);path=['people',4,'body',0];old=field(uid,path)
edit(uid,path,old.replace(', a quiet portrait that asked viewers','. The quiet portrait asked viewers'),'Separate the photograph’s historical significance from the interpretation learners are invited to consider.')
path=['people',4,'body',1];old=field(uid,path)
edit(uid,path,old.replace(', but was soon forced out and became homeless.','. He was soon forced out and became homeless.'),'Separate the move to Minnesota from the subsequent loss of housing, keeping the original chronology and circumstances.')
uid=source('african-american','people',11);path=['people',11,'body',2];old=field(uid,path)
edit(uid,path,old.removeprefix('Some context helps here. '),'Begin directly with the documented institutional barrier rather than announcing that context follows.')
uid=source('african-american','people',12);path=['people',12,'body',0];old=field(uid,path)
edit(uid,path,old.replace('a contralto singer stood','contralto Marian Anderson stood').replace('Daughters of the American Revolution,','Daughters of the American Revolution (DAR),'),'Identify the person already named by this record and explain the abbreviation used in the next sentence.')
uid=source('african-american','people',13);path=['people',13,'body',2];old=field(uid,path)
edit(uid,path,old.replace('To understand his career, it helps to know that the U.S. armed forces were segregated until after World War II.','Davis’s career developed within U.S. armed forces that remained segregated until after World War II.'),'Connect the career to institutional context directly; retain the source’s statement about pressure and avoid adding an external-pressure claim.')
uid=source('african-american','people',16);path=['people',16,'body',0];old=field(uid,path)
after=old.replace('during segregation; in 1947','during segregation. In 1947').replace('a campus that was not accessible; the department head','a campus that was not accessible. The department head').replace('As a Black woman who used a wheelchair, she then faced','As a Black woman who used a wheelchair, Lacy faced')
edit(uid,path,after,'Separate major periods and institutional actions; preserve the broader accessibility issue without narrowing it to physical access.')
payload={'status':'awaiting_root_review','records':list(records.values()),'curationNotes':['Rejected needless synonym substitutions and summary/explanation duplication.','Retained direct descriptions of racism and discrimination; did not soften them as a matter of tone.','These proposed field edits preserve every original date, quantity, source link, quotation and named entity; additions only identify existing record subjects or expand an existing abbreviation.','Full source records and per-field ledger remain in inventory.json.']}
(base/'second-batch-curated.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8');print(len(records),sum(len(r['changes']) for r in records.values()))
