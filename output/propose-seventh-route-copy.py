import json,hashlib
from pathlib import Path
edits={
'app/about/page.tsx':[("The program connects learning, practice and review in a deliberate sequence, rests on three pillars of equity practice, and makes specific commitments to the people who use it. Those are set out on their own page, alongside the charter that governs the whole program.","The program connects learning, practice and review, with three pillars of equity practice and commitments to the people who use it. Read the program model alongside the proposed charter. The charter is a planning framework; applicable law, policy and assigned responsibilities continue to govern the work.")],
'app/start/page.tsx':[("Most people arrive here with a real question: a decision to make, a draft to review, a meeting to plan, or a process that is not working for someone. Start there. If you would like context first,","Start with a question from your work: a decision to make, a draft to review, a meeting to plan, or a process that is not working for someone. If you would like context first,")],
'app/learn/cultural-intelligence/page.tsx':[("Courses alone are not the work. These bring people together around a real decision.","Use these resources to connect a group discussion with a decision in your work, including the evidence, perspectives and responsibilities that need consideration.")]
}
records=[]
for file,pairs in edits.items():
 s=Path(file).read_text(encoding='utf8');changes=[]
 for before,after in pairs:
  assert s.count(before)==1
  changes.append({'before':before,'after':after})
 records.append({'file':file,'sourceSha256':hashlib.sha256(Path(file).read_bytes()).hexdigest(),'original':s,'changes':changes})
Path('output/seventh-route-copy-proposal.json').write_text(json.dumps({'records':records,'basis':'Full route source read. Proposed charter status already established in constitution source and prior independently accepted framework corrections; retain binding authority. Remove unsupported majority claim and dismissive framing without weakening application.'},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
