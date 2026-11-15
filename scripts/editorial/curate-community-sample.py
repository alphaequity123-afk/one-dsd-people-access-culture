import json,hashlib
from pathlib import Path
base=Path('output/community-editorial'); inv=json.loads((base/'inventory.json').read_text(encoding='utf-8')); byid={u['id']:u for u in inv['units']}
selected=[]
for p in (base/'candidates').glob('*.json'):
 if p.name=='run-status.json':continue
 c=json.loads(p.read_text(encoding='utf-8'))
 if c.get('id') not in byid:continue
 u=byid[c['id']]; changes=[]; notes=[]
 def edit(field,after,reason):
  f=next(f for f in u['fields'] if f['path']==field)
  if f['before']!=after:changes.append({**f,'after':after,'reason':reason})
 if c['id'].endswith('somali--disability'):
  changes=c['changes'];notes=['Research paragraphs retained: they already preserve study population, date, interpretation limits, and individual variation. Intro edit separates the overloaded identity/variation sentence.']
 elif c['id'].endswith('american--sections-0'):
  f=u['fields'][0];after=f['before'].replace('No statewide born-in-Minnesota figure could be opened for this page.','This review did not obtain a statewide figure for residents born in Minnesota.').replace('That is the latest Minnesota figure that could be opened. It is more than a decade old, and newer census tables were not reachable.','This review obtained no newer Minnesota figure. The estimate is more than a decade old, and newer census tables were not accessible during the review.')
  edit(f['path'],after,'Describe the limits of this review precisely without implying that no newer evidence exists. Preserve all figures and sources.');notes=['Rejected model rewrite: added numeric75, omitted ACS2023, and changed margin wording; retained the substantial original account.']
 elif c['id'].endswith('minnesota--sections-1'):
  f=u['fields'][0];after=f['before'].replace('**The gap inside the averages.** The comfortable averages hide wide differences by race.','**Differences within the statewide averages.** Statewide averages do not show how income, housing, and other conditions differ among racial groups.')
  edit(f['path'],after,'Replace subjective comfortable-averages framing with the specific limitation taught by the figures, retaining every statistic, quotation and attribution.');notes=['Rejected model-added evaluative summary and removal of quoted baked-in wording.']
 elif c['id'].endswith('organizations--organizations-0'):
  for x in c['changes']:
   if x['path'][-1]=='whereItWorks':
    edit(x['path'],'Programs operate in Ely, in northeastern Minnesota. The organization’s mailing address is in Minneapolis.','Distinguish service area from mailing address without claiming headquarters are in Ely.')
   else: changes.append(x)
  notes=['Model proposed based-in claim rejected; service-area wording preserved.']
 elif c['id'].endswith('dsd-policies--policies-0'):
  notes=['Retained existing wording pending source-specific review. Model changed if they want one to if requested, which shifts the condition to an explicit request. Model wrongly asserted statutory support without source verification. No legal/obligation rewrite accepted.']
 elif c['id'].endswith('reading-collection--0'):
  f=u['fields'][0];after='Ijeoma Oluo is a Seattle-based writer and editor who built a large following by writing about race online before publishing this book. It is a plain-language guide to discussing race in the United States, written for people of color and for white readers who want to join these conversations but fear getting it wrong. Her core claim is that race already shapes every interaction, so refusing to discuss it protects the status quo rather than keeping the peace.'
  edit(f['path'],after,'Separate author background, audience, and attributed argument into connected sentences without strengthening or changing the author’s claim.');notes=['Model changed status quo to existing inequalities and added geographical qualification; retained original claim scope.']
 elif c['id'].endswith('system-connections--structure-0'):
  f=u['fields'][0];after=f['before'].replace('The part of the Department of Human Services that holds the divisions for older adults and people with disabilities.','This administration is part of the Department of Human Services and includes divisions serving older adults and people with disabilities.')
  edit(f['path'],after,'Use a complete sentence to explain the organizational relationship; preserve listed division names and source boundaries.');notes=['Rejected duplicate summary/professional-explanation labels and new source-date reference from model.']
 elif c['id'].endswith('cultural-calendar--entries-0'):
  notes=['Retain existing fields. Model introduced last enslaved people into capsule and changed source singular county to plural accounts. Source attribution and historical detail require source-specific verification; no gain from proposed stylistic changes.']
 else:continue
 selected.append({**{k:c[k] for k in ['id','file','path','sourceSha256','fieldCount']},'status':'ready_for_root_review','changes':changes,'curationNotes':notes,'editorialAcceptance':False,'protectedFacts':'all original source metadata, numeric tokens, quotes, names and contact details retained'})
(base/'first-sample-curated.json').write_text(json.dumps({'status':'awaiting_root_review','records':selected},ensure_ascii=False,indent=2),encoding='utf-8')
track=Path(r'C:\Users\garyb\Downloads\One DSD Equity Program (11)\Language Rollout Tracker/community-progress.json');s=json.loads(track.read_text());s.update(revisionDraftCount=len(selected),summary='First eight source records drafted and manually curated. Six contain proposed prose improvements; two retain original wording pending source-specific checks. Root review precedes any source edits.',phase='Independent review of first eight source records');track.write_text(json.dumps(s,indent=2),encoding='utf-8')
print(len(selected),sum(len(r['changes']) for r in selected))
