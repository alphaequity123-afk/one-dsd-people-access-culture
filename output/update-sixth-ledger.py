import json,hashlib,datetime
from pathlib import Path
def read(p):return json.loads(Path(p).read_text(encoding='utf8'))
def save(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p='docs/editorial/hardcoded-retained-review.json';d=read(p)
for file,scope in [
 ('app/resources/[id]/page.tsx','Full route wrapper read: navigation, source labels, original-resource and learning links, error states, reading/download instructions. Resource bodies and owner data require separate record review.'),
 ('app/paths/[id]/page.tsx','Full published reading/download route read. Path-specific content is separately reviewed; no writable form behavior claimed.'),
 ('components/right-person-client.tsx','Full client-only routing interface and three selection fields read. Registry result prose separately accepted; no server submission occurs.')]:
 if any(r['file']==file for r in d['records']):continue
 raw=Path(file).read_bytes();d['records'].append({'file':file,'status':'accepted_retained','reviewer':'dsd_language_rollout','date':'2026-11-15','sourceSha256':hashlib.sha256(raw).hexdigest(),'scope':scope,'original':raw.decode('utf8')})
save(p,d)
inventory=read('docs/editorial/route-prose-inventory.json');states={r['file']:'accepted_retained_hardcoded' for r in d['records']}
for file in ['docs/editorial/shared-participation-route-review.json','docs/editorial/action-plan-shared-review.json','docs/editorial/community-clas-note-privacy-batch.json']:
 receipt=read(file)
 for r in receipt.get('records',[]):
  if r.get('file'):states[r['file']]='accepted_bounded_hardcoded_changes'
states['components/clas-curriculum/notes.tsx']='accepted_bounded_hardcoded_changes'
for r in inventory['records']:
 if r['file'] in states:r['editorialStatus']=states[r['file']]
inventory['reviewedHardcodedFiles']=sum(r['editorialStatus'].startswith('accepted_') for r in inventory['records']);save('docs/editorial/route-prose-inventory.json',inventory)
tracker=Path('C:/Users/garyb/Downloads/One DSD Equity Program (11)/Language Rollout Tracker/dsd-progress.json');t=read(tracker);ledger=read('docs/editorial/registry-rollout-status.json')
t.update(updatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),summary='Fifth release is live: 132 registry objects have rendered verification receipts, including the eight previously blocked resources. Sixth release is preparing 146 revised registry objects, with 37 additional courses receiving three bounded instruction corrections each. Ten revised downloadable artifacts require the explicit transport correction included in the sixth release.',reviewedCount=ledger['editoriallyReviewedObjects'],publishedCount=132,remainingCount=878-ledger['editoriallyReviewedObjects']-4,phase='Fifth release verified; sixth release checks',issues=['Registry, shared UI, and research/source families are tracked separately.','Ten reviewed HTML/Word artifacts are not yet counted live; sixth release corrects historical-byte restoration.','37 partially revised courses are not counted as complete course reviews.','14 dormant source fields are excluded from live page claims.','Approved recordings and exact captions/transcripts remain unchanged.'])
t['scopeBreakdown']['hardcodedFilesReviewedInDedicatedReceipt']=inventory['reviewedHardcodedFiles'];save(tracker,t)
print('Updated distinct registry, partial-course, hardcoded and artifact statuses.')
