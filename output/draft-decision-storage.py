import json
from pathlib import Path
inv=json.loads(Path('output/editorial-source-inventory.json').read_text(encoding='utf8'))
p=Path('docs/editorial/navigation-surfaces-review.json'); d=json.loads(p.read_text(encoding='utf8')); old={r['target'] for r in d['records']}
for name in ['one-dsd.program-overview','equity-toolkit.home']:
 r=next(x for x in inv['surfaces'] if x['surfaceId']==name)
 if name not in old:d['records'].append({'target':name,'route':r['route'],'values':r['values'],'status':'accepted_retained','review':'Complete authored surface read. Explanations connect evidence, individual preferences, decision authority and practical next steps without unsupported guarantees. Existing source dates, staff names and program conditions remain source-dependent, not currently recertified. Toolkit practice renders through staged experience; inactive draft fields are not counted as published changes.'})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
r=next(x for x in inv['surfaces'] if x['surfaceId']=='equity-toolkit.decision')
row={'target':r['surfaceId'],'kind':'surface','route':r['route'],'original':r['values'],'changes':[{'path':['retention'],'before':r['values']['retention'],'after':'The app keeps these notes on the open page until you choose Save to My Work. Saving stores a copy in this browser on this device; anyone with access to the same browser may be able to open it. The app does not submit the notes to another person. Keep downloaded copies only where your work’s information rules permit.','reason':'Describe explicit localStorage saving and shared-browser access accurately without implying confidential storage.'}]}
Path('output/decision-storage-revision.json').write_text(json.dumps({'records':[row]},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
