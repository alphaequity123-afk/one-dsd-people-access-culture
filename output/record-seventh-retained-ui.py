import json,hashlib
from pathlib import Path
files=[
'components/water-foundation-course.tsx','components/water-foundation-feature.tsx','components/site-header.tsx','components/resource-format-links.tsx','components/resource-theme-nav.tsx','components/resource-starting-points.tsx','components/resource-theme-pathway.tsx','components/resource-downloads.tsx','components/share-page.tsx','components/work-examples.tsx','components/core-fifteen.tsx',
'app/learn/water-we-swim-in/page.tsx','app/learn/water-we-swim-in/course/page.tsx','app/audio-library/page.tsx','app/learn/page.tsx','app/courses/page.tsx','app/courses/[courseId]/page.tsx','app/learn/core-15/page.tsx']
records=[]
for file in files:
 raw=Path(file).read_bytes()
 records.append({'file':file,'sourceSha256':hashlib.sha256(raw).hexdigest(),'status':'accepted_retained_hardcoded','reviewer':'dsd_language_rollout','date':'2026-11-15','scope':'Complete wrapper source read. Hardcoded orientation, controls, navigation and recovery copy retained. Imported teaching records, recordings and official-source facts remain separately scoped. Course/video length labels checked against existing data rather than treated as a new media audit.','original':raw.decode('utf8')})
Path('docs/editorial/hardcoded-seventh-retained-review.json').write_text(json.dumps({'records':records,'limitations':'These 18 shared route/component reviews do not mean every generated course or source record has been rewritten. Source governance toolkitQuestion has no TSX renderer and is excluded from live-field claims.'},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p=Path('docs/editorial/route-prose-inventory.json');d=json.loads(p.read_text(encoding='utf8'))
for row in d['records']:
 if row['file'] in files:row['editorialStatus']='accepted_retained_hardcoded'
d['reviewedHardcodedFiles']=sum(r['editorialStatus'].startswith('accepted_') for r in d['records']);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Recorded 18 full wrapper reviews; total dedicated wrapper coverage:',d['reviewedHardcodedFiles'])
