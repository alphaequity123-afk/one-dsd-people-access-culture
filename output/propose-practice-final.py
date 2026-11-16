from pathlib import Path
import json

updates = {
 'graduation-path.gp-8': {
  ('graduatedLooksLike',): 'Use this path to prepare a meeting plan: purpose and materials shared ahead, accessible participation formats, a clear accommodation-request process, attention to positional power, a response when harm occurs, decisions with accountable roles, and accessible follow-up.',
  ('privacy',): 'Describe the meeting and responsible roles without identifying participants or recording personal accommodation information. Keep individual requests in the authorized process and confirm work assignments through the appropriate workplace records.',
  ('step3Guidance',): 'Prepare the meeting plan using the downloaded checklist. Describe responsible roles and participation arrangements without names or personal accommodation information.',
  ('readyToUse', 1): 'The meeting lead has a response plan that accounts for power, the affected person, and any formal reporting duty',
  ('step1Guidance',): 'Use relevant community briefs to prepare questions about access and timing. Confirm arrangements with participants; a brief does not establish what a particular person needs or prefers.',
  ('artifactField4Help',): 'Consider speaking order, ways to contribute without speaking publicly, and how you will check participation barriers without guessing motives. If harm occurs, address the immediate concern, ask what support is needed, and follow any applicable reporting process.',
  ('reviewRule0Label',): 'Every follow-up has an accountable role',
  ('reviewRule0Message',): 'Identify the role responsible for each follow-up and confirm individual assignments through the appropriate workplace process.',
 },
 'graduation-path.gp-9': {
  ('graduatedLooksLike',): 'Use this path to prepare a review record for a specific draft: what it asks of people, who may be excluded, access and language findings, source labels, suggested changes, and questions for the owner. Record what you checked even when the evidence supports keeping the draft as written.',
  ('needsWork', 0): 'Approval without documenting what was checked or why the draft is suitable',
  ('privacy',): 'Use a fictional example or material you are authorized to review. Keep confidential, predecisional, and personal material out of Ask and this learning exercise. Store any completed review through the appropriate workplace process.',
  ('step3Guidance',): 'Prepare the review record using the downloaded checklist. Document specific findings and reasons for retaining or revising wording. Do not paste confidential material.',
 },
 'graduation-path.gp-10': {
  ('graduatedLooksLike',): 'Use this path to prepare questions and proposed terms for a procurement equity review: who the service reaches, solicitation requirements, evaluation criteria, reporting, access, and monitoring. The contracts or procurement office confirms applicable rules and authorizes the relevant steps.',
  ('needsWork', 1): 'Published evaluation criteria applied inconsistently or left out of the assessment',
  ('privacy',): 'Keep confidential procurement details and vendor-identifying information out of this learning worksheet and Ask. Use authorized procurement records for actual proposals, evaluations, and decisions.',
  ('step1Guidance',): 'Use relevant community briefs to identify access questions and possible contacts. Confirm current roles, relevant expertise, and community perspectives; being listed in a brief does not establish that a partner represents or is trusted by everyone.',
  ('step3Guidance',): 'Prepare the review record using the downloaded checklist. Leave out vendor-identifying and confidential procurement details, and mark proposed requirements or approvals as pending until confirmed.',
 },
 'graduation-path.gp-11': {
  ('startingCompetence',): 'You shape access to leadership roles and want to examine barriers for staff with disabilities. Review the pathway without identifying individuals or asking them to disclose personal information in this learning exercise.',
  ('graduatedLooksLike',): 'Use this path to prepare a leadership pathway or sponsorship plan: visible criteria tied to the work, access to development opportunities, sponsors with relevant influence, responsibility for access across transitions, and a review date. Plan aggregate measures with privacy safeguards. Keep individual disability and accommodation information in the authorized process.',
  ('privacy',): 'Do not record individual disability information or accommodation histories in this learning worksheet. Describe the pathway and responsible roles. Individual requests and records belong in the authorized accommodation process.',
  ('step3Guidance',): 'Prepare the pathway or sponsorship plan using the downloaded checklist. Use roles rather than names and keep individual disability or accommodation information out of the plan.',
  ('step4Guidance',): 'Check that the pathway is visible, criteria relate to leadership work, and responsibility for access is clear at each transition. Review participation formats, sponsor commitments, and aggregate measures with appropriate privacy safeguards. Confirm unresolved access questions through the authorized process.',
  ('artifactField4Help',): 'Plan materials in advance, captions and flexible participation formats. Provide alternatives to timed or drag-based activities and explain how to request an accommodation. Confirm individual needs through the appropriate process rather than assuming one arrangement works for everyone.',
  ('artifactField10Help',): 'Set a date to review aggregate patterns and tell staff what changed, what stayed the same, and why.',
 },
 'graduation-path.gp-12': {
  ('graduatedLooksLike',): 'Use this path to prepare a short decision record: who may be affected differently, who has authority, access needs, evidence and uncertainty, an alternative, and a next step with a review date. This check does not authorize a decision or determine whether formal equity-analysis requirements apply.',
  ('privacy',): 'Describe the decision and affected groups in general terms without names or case details. Identify responsible roles in the learning worksheet and use the authorized process for actual assignments and records.',
  ('step1Guidance',): 'Use relevant community briefs to identify questions about access and context. Check needs with the people affected instead of treating the brief as a description of an individual.',
  ('step2Guidance',): 'Use the plain-language and language-access checklists for material people will read. Review the official equity policy and User Guide, and confirm any required review with the responsible equity office; calling a decision routine does not exempt it from those requirements.',
  ('step3Guidance',): 'Use the downloaded checklist to record the decision, evidence, uncertainty, and next step. Keep names and case details out of this learning exercise.',
  ('step5Guidance',): 'Use the person or office responsible for the decision when authority, evidence, access, or review requirements remain unclear. Follow any required consultation or approval process even when the decision initially appears routine.',
  ('reviewRule0Label',): 'Every follow-up has an accountable role',
  ('reviewRule0Message',): 'Identify the role responsible for each follow-up and confirm individual assignments through the appropriate workplace process.',
 },
 'graduation-path.gp-13': {
  ('startingCompetence',): 'You wrote something and want to review it in three passes: whether people can access and understand it, whether it assumes knowledge or norms they may not share, and whether its tone is respectful and accurate. Preserve required notices, deadlines, and consequences.',
  ('graduatedLooksLike',): 'Use this path to document a three-part review of your material: access and plain language, assumed knowledge and representation, and tone. Record what you retained or revised, why, what still needs another reviewer, and when you will revisit it.',
  ('privacy',): 'Use material you are authorized to review. Keep confidential, predecisional, and personal material out of Ask and this learning exercise. Store completed work through the appropriate workplace process.',
  ('step0Guidance',): 'Read in three passes: access and plain language, assumed knowledge and representation, and tone. Record specific observations and reasons to retain or revise the material. Ask for an explanation or example without including confidential details.',
  ('step3Guidance',): 'Use the downloaded checklist to record what each pass found and why you retained or revised the wording. Do not paste confidential material.',
  ('step4Guidance',): 'Check that each pass records a finding and its reason, assumptions are explicit, and any further review has a responsible role and date. Confirm that edits preserve required information and the original meaning.',
  ('step5Guidance',): 'A second reader may notice barriers or ambiguities the writer missed. Use the draft-review path to structure that review, and seek the responsible office for language access, accessibility, or required wording.',
  ('artifactField3Help',): 'Use a respectful, direct tone and explain how to act. Preserve accurate requirements and consequences. Ask about person-first or identity-first language when an individual preference is relevant; preferences can differ within a community. Record revisions and the meaning they preserve.',
  ('readyToUse', 2): 'Clear next steps and a respectful tone, with required notices and consequences preserved',
  ('askStarters', 2): 'How can I make this message respectful and helpful while preserving any required notice, deadline, or consequence?',
 },
}
inventory = json.loads(Path('output/editorial-source-inventory.json').read_text(encoding='utf-8'))
records = []
for target, fields in updates.items():
    source = next(row for row in inventory['surfaces'] if row['surfaceId'] == target)
    changes = []
    for path, after in fields.items():
        before = source['values']
        for key in path:
            before = before[key]
        changes.append({'path': list(path), 'before': before, 'after': after, 'reason': 'Full-source editorial review: align preparation with actual download behavior, preserve authority and formal duties, avoid guarantees or assumptions about people.'})
    records.append({'target': target, 'kind': 'surface', 'route': source['route'], 'original': source['values'], 'changes': changes})
Path('output/practice-path-final-revisions.json').write_text(json.dumps({'records': records}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(sum(len(row['changes']) for row in records), 'proposed fields in six full-read path contexts')
