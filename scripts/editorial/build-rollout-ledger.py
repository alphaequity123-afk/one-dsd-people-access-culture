"""Record bounded editorial coverage without treating drafts as reviewed or published."""
import hashlib,json
from pathlib import Path
p=Path('.')
inventory=json.loads((p/'output/editorial-source-inventory.json').read_text(encoding='utf8'))
registry=json.loads((p/'lib/content/professional-language-revisions.json').read_text(encoding='utf8'))['revisions']
course=json.loads((p/'lib/content/course-language-revisions.json').read_text(encoding='utf8'))['courses']
accepted={r['target']:len(r['changes']) for r in registry if r['status']=='reviewed'}
accepted.update({'course.'+c['courseId']:len(c['changes']) for c in course if c['review']['status']=='accepted'})
verified=set()
for f in ['live-first-release-check.json','live-learn-expanded-check.json','live-second-release-check.json','live-third-release-check.json']:
 if (p/'output'/f).exists():verified.update(r['target'] for r in json.loads((p/'output'/f).read_text(encoding='utf8'))['results'] if r['passed'] and not r['target'].startswith('lesson.'))
candidates={}
for f in (p/'output/noncourse-candidates').glob('*.json'):
 if f.name=='run-status.json':continue
 r=json.loads(f.read_text(encoding='utf8'));candidates[r['target']]=r
retained=set();excluded=set()
for receipt in ['workforce-language-review.json','shared-surfaces-retained-review.json','navigation-surfaces-review.json','resource-retained-review.json']:
 f=p/'docs/editorial'/receipt
 if f.exists():
  rows=json.loads(f.read_text(encoding='utf8'))['records']
  retained.update(r['target'] for r in rows if r.get('status',r.get('disposition'))=='accepted_retained')
  excluded.update(r['target'] for r in rows if r.get('status')=='excluded_dormant_surface')
records=[]
for row in inventory['surfaces']+inventory['resources']:
 surface='surfaceId' in row;target=row['surfaceId'] if surface else 'resource.'+row['id'];values=row['values'] if surface else row;c=candidates.get(target)
 records.append({'target':target,'kind':'course_pack' if target.startswith('course.') else 'editable_surface' if surface else 'staff_resource','route':row.get('route',row.get('href')),'originalSha256':hashlib.sha256(json.dumps(values,ensure_ascii=False,sort_keys=True).encode()).hexdigest(),'review':'accepted_fields' if target in accepted else 'accepted_retained' if target in retained else 'excluded_dormant_surface' if target in excluded else 'candidate_pending_review' if c else 'not_reviewed','acceptedFieldChanges':accepted.get(target,0),'candidateFieldChanges':len(c.get('changes',[])) if c else 0,'liveVerified':target in verified})
report={'snapshotDate':'2026-11-15','scope':'Registry subtotal only; community/research JSON, source files and hardcoded page/component prose require separate coverage. Accepted fields do not imply re-verification of unchanged facts. Course packs include related lesson and job-aid fields.','registryObjects':len(records),'acceptedObjects':len(accepted),'acceptedFields':sum(accepted.values()),'retainedObjects':len(retained),'excludedDormantObjects':len(excluded),'editoriallyReviewedObjects':len(set(accepted)|retained),'liveVerifiedObjects':sum(r['liveVerified'] for r in records),'records':records}
(p/'docs/editorial/registry-rollout-status.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in report.items() if k!='records'}))
