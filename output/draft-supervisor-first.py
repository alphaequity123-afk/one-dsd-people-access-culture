import json
from pathlib import Path
inv=json.loads(Path('output/editorial-source-inventory.json').read_text(encoding='utf8'))
resources={r['id']:r for r in inv['resources']}
changes={
'ja-sm-first-week':{'summary':'Prepare for the first response to a report, an access request or a proposed change to someone’s work, and identify the office responsible for the next step.','whyItMatters':'A supervisor’s first response can affect whether a concern reaches the responsible office promptly. Identify your division’s contacts before an issue arises, and keep completed working notes outside this learning app.'},
'ja-sm-fair-assignments':{'summary':'Test whether an assignment, schedule or nomination rests on job-related criteria that you can apply and explain consistently.','body.1':'Before you decide, describe what the work requires before considering names. Offer the opportunity openly to everyone eligible, using consistent information about the work and the selection criteria. Define language proficiency or other relevant skills in terms you can assess, so familiarity with a candidate does not substitute for evidence.'},
'ja-sm-rating-and-what-follows':{'summary':'Connect a performance rating to documented work across the review period, then examine how that rating is used in later decisions.','body.1':'Throughout the review period, record relevant examples after each one-to-one, using the same headings for each employee. Include contributions that may be less visible, progress and concerns. Discuss concerns when they arise so the employee has an opportunity to understand and respond before the formal rating.'},
'ja-sm-corrective-action':{'summary':'Prepare the evidence and questions needed for a fair response to a performance or conduct concern, and consult the responsible office before acting.'},
'ja-sm-named-in-complaint':{'summary':'Respond to a complaint that names you without interfering with the review or changing how you treat the people involved.','whyItMatters':'A complaint requires a careful response while its facts are being examined. Keep the review with the responsible office, preserve records and examine whether your own decisions could discourage participation.','body.5':'After the matter closes, follow the responsible office’s directions about what may be shared. Avoid public comments that could identify, embarrass or discourage anyone who participated. Continue reviewing work decisions for consistent criteria, and identify any practice that needs to change.','body.6':'Prepare before a concern arises: save your Human Resources contact and locate the contract or plan that applies to your position. Know where to ask about representation, advice and the next steps in a review.'},
'ja-sm-leave-and-return':{'summary':'Coordinate the work during an employee’s absence and prepare for their return, while Human Resources determines the applicable leave and return-to-work requirements.'},
'ja-sm-budget-cuts-separation':{'whyItMatters':'Staff need accurate information about what is changing, what remains uncertain and who can answer questions. Prepare those explanations with the responsible offices before discussing effects on individual positions.','body.0':'Begin with what you are authorized to explain, and distinguish confirmed decisions from unresolved questions. Set job-related criteria before considering names. If effects differ across groups, ask Human Resources to examine the process; do not change an individual decision based on race or sex. Identify which work will continue, move, decrease or stop so a staffing reduction does not leave unexamined demands on the remaining team.'}
}
rows=[]
for id, fields in changes.items():
 r=resources[id]; cs=[]
 for field, after in fields.items():
  path=[int(x) if x.isdigit() else x for x in field.split('.')]; before=r
  for key in path:before=before[key]
  cs.append({'path':path,'before':before,'after':after,'reason':'Make the supervisory purpose, evidence and responsibility explicit without expanding source legal or contract claims.'})
 rows.append({'kind':'resource','target':'resource.'+id,'route':'/library/'+id,'original':r,'changes':cs})
Path('output/supervisor-first-revisions.json').write_text(json.dumps({'status':'pending_independent_review','records':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(len(rows),sum(len(r['changes']) for r in rows))
