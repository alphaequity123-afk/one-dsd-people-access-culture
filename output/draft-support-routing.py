import json
from pathlib import Path
inv=json.loads(Path('output/editorial-source-inventory.json').read_text(encoding='utf8'))
r=next(x for x in inv['surfaces'] if x['surfaceId']=='support.right-person')
a={'introLede':'Choose your role, the area of work and when you need to act. This guide suggests learning resources and the roles or offices to contact about the decision.','formIntro':'Choose the options that describe your work. This guide identifies possible next steps; it does not send a consultation request.','directoryNote':'Confirm the current contact through the DHS staff directory, intranet or your supervisor before sharing information about a particular matter.','oneDhsDecisionBody':'Use the suggested resources to prepare your question, then contact the person or office with responsibility for the decision.'}
row={'kind':'surface','target':r['surfaceId'],'route':r['route'],'original':r['values'],'changes':[{'path':[k],'before':r['values'][k],'after':v,'reason':'Match instructions to the actual selection-only helper and avoid implying a consultation submission or promised directory update.'} for k,v in a.items()]}
Path('output/support-routing-revisions.json').write_text(json.dumps({'status':'pending_independent_review','records':[row]},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
