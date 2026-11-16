import json, pathlib
root=pathlib.Path(__file__).resolve().parents[1]
source=json.loads((root/'output/editorial-source-inventory.json').read_text(encoding='utf8'))
by_id={s['surfaceId']:s for s in source['surfaces']}
revisions={
 'about.page': {
  'introLede': 'People, Access and Culture is an independently managed resource that brings professional learning, research, practical tools, and support for Minnesota DHS Disability Services Division work into one place. Use it to examine how organizational decisions affect access, workplace conditions, and the people who use services.',
  'purposeBody': 'Professional practice and personal cultural understanding develop together. A staff member can use this collection to examine a policy decision, prepare for a difficult conversation, or understand how their own background shapes what feels normal. Studying family, regional, religious, or workplace influences helps make those assumptions visible. Learning about the communities a program serves adds another perspective; direct conversation with the people affected tests whether that knowledge fits the situation.',
  'purposeBoundary': 'The purpose is to strengthen judgment, cultural understanding, and service responsiveness. Personal reflection is not evidence of a required belief or a basis for ranking staff, teams, or communities.',
  'sourcesBody': 'Use the source information to distinguish official requirements, program-authored guidance, and outside research. Consider when the material was produced, what question it addresses, and which conclusions it can support. A framework can help organize professional judgment without authorizing its assessment tools or scoring methods to be reproduced.',
 },
 'start.page': {
  'introLede': 'Choose your role, the work you are considering, and the time available before a decision. The suggestions connect those choices with relevant learning, practical tools, and responsible offices, so you can begin with the question that needs attention.',
  'formIntro': 'Select the closest match to your current responsibility. You can revise the choices when the task, decision, or available time changes.',
  'roleSupervisorOrManagerGuidance': 'Examine the decision, the support staff need to carry it out, and how affected people will be able to raise concerns.',
  'rolePolicyProgramOrServiceProfessionalGuidance': 'Identify which requirements are fixed, which choices remain open, and whose experience should inform the recommendation.',
  'roleDataResearchOrQualityProfessionalGuidance': 'Define the decision your evidence will inform, examine missing perspectives, and protect confidential information and small groups when reporting differences.',
  'roleFiscalProcurementOrContractsProfessionalGuidance': 'Examine who can meet a requirement, what resources participation demands, and how costs or responsibilities shift between the agency and others.',
  'roleEquityDirectorOrSpecialistGuidance': 'Connect the immediate concern with the relevant program, evidence, decision authority, and responsibility for implementation and review.',
 },
 'areas.page': {
  'introLede': 'Start with the decision or professional responsibility you need to address. Each area brings together relevant evidence, questions for analysis, practical tools, and the offices or partners responsible for action.',
 },
 'learn.page': {
  'introLede': 'Develop the judgment behind accessible services, equitable decisions, and inclusive workplaces. Courses, readings, and recordings connect concepts with Minnesota human services practice, including the evidence and trade-offs involved in applying them.',
  'stagesIntro': 'Choose foundations, intercultural practice, applied equity, or leadership according to the question and level of analysis your work requires.',
  'stageOrientationPurpose': 'Understand the collection, identify the resources relevant to your responsibility, and distinguish learning support from official decision authority.',
  'stageInterculturalPracticePurpose': 'Examine how cultural expectations shape interpretation, ask people about their experience, and adapt communication or practice in response.',
  'stageSystemsPracticePurpose': 'Investigate recurring barriers across teams or decisions, using evidence to connect individual experiences with institutional rules, authority, and resources.',
  'stageLeadershipContinuityPurpose': 'Translate an improvement into sustained practice through supervision, shared responsibility, resources, feedback, and a clear process for reviewing results.',
 },
 'learn.hub': {
  'intro': 'Develop the judgment behind accessible services, equitable decisions, and inclusive workplaces. Courses, readings, and recordings connect concepts with Minnesota human services practice, including the evidence and trade-offs involved in applying them.',
  'interculturalNote': 'A familiar communication approach may not make a request or concern clear to another person. Ask how the person understands the exchange, identify any access support needed, and adjust the next step in response.',
  'accessNote': 'An accurate form can still create a barrier if the instructions, language, format, or required response are difficult to use. Examine the task from the service user\'s perspective and check which changes would make a practical difference.',
  'facilitationNote': 'Plan what participants will be able to examine, practice, and use after a learning session. A later conversation about application can reveal where the idea helped and where the workplace needs additional support.',
 },
 'learn.cultural-intelligence': {
  'intro': 'Examine how your own cultural expectations and the organization\'s routines shape interpretation, communication, and service decisions. Use community knowledge, research, and direct engagement to develop a more responsive approach.',
  'foundationBody': 'Cultural understanding requires attention to both personal expectations and institutional power. Consider whose ways of communicating, demonstrating knowledge, or asking for assistance are treated as familiar or credible in Minnesota human services. Community briefs and intercultural frameworks can help you prepare questions, but the person\'s account remains essential. Identify what the organization can change when a requirement, communication method, or routine limits participation.',
  'applyRoutine': 'Choose a specific interaction or process to examine, identify the assumption shaping it, and ask affected people what would make participation more useful. Try an appropriate adjustment, review what happened, and record what remains uncertain.',
 },
 'community-outreach.home': {
  'cycleIntro': 'Use these connected steps to prepare, build relationships, involve people in decisions, and explain what follows. Revisit earlier steps when new information changes the question or reveals a participation barrier.',
  'stepUnderstand': 'Identify the professional and cultural expectations you bring to the interaction. Consider how those expectations influence whose knowledge you recognize and what you interpret as clear, respectful, or credible.',
  'stepLearn': 'Review the community pages for relevant history, language, local context, and dated evidence. Use that information to prepare questions and identify what needs confirmation with the people involved.',
  'stepReport': 'Explain which contributions shaped the decision, what did not change and why, which issues remain unresolved, and who is responsible for follow-up. Give participants an accessible way to correct your account and assess whether it reflects their input.',
 },
 'practice.page': {
  'introLede': 'Use a guided practice to develop a decision, draft, meeting plan, or workforce action. Each practice connects relevant questions and evidence with a work product you can review, adapt, and use in your professional setting.',
  'choicesIntro': 'Choose a task that matches your responsibility. Work through the questions, consider the supporting material, and use the checklist to identify what is ready and what still requires evidence or another person\'s judgment.',
  'moreBody': 'A practice provides a starting structure rather than a complete account of every situation. If the task spans several responsibilities, combine the relevant areas of work and identify who needs to contribute to the decision.',
 },
 'paths.index': {
  'introLede': 'Follow a learning path to develop a work product with relevant evidence, community context, practical tools, and a final review. Choose a path that fits your current responsibility and use its questions to identify what you know, what needs verification, and who should be involved.',
 },
 'ask.page': {
  'introKicker': 'Questions, evidence, and next steps',
  'privacyNotice': 'Opening a published answer is different from submitting your own question to Ask. Keep names, case details, medical or personnel information, and other confidential material out of questions and working notes.',
  'introLede': 'Use the published answers to examine a work question, locate relevant sources, and identify a practical next step. Read the stated limits before applying an answer to a policy, service, or workforce decision.',
  'reviewDraftHelp': 'Request feedback on the reasoning, evidence, equity implications, access, and usability of a draft. Include the intended audience and purpose, but leave out confidential or identifying information.',
 },
 'library.page': {
  'introLede': 'Find research, community briefs, job aids, practice guidance, and learning materials relevant to Minnesota human services work. Compare the purpose and authority of each source before using it to support a decision.',
  'noResultsBody': 'Try the program name, the task, or another term used in the relevant guidance. You can also browse by topic to find related material and refine the question.',
 },
 'communities.index': {
  'introLede': 'Use the briefs to prepare for work with Minnesota communities by examining history, access, participation, and relevant evidence. Identify questions to ask, partners to consult, and assumptions to check with the people affected by the work.',
  'releasedExplanation': 'Read each brief for its sources, context, and limits. Community-level findings can inform preparation, but an individual\'s needs, preferences, and interpretation require direct inquiry. Referral pages identify the responsible office where specialized guidance is needed.',
 },
 'one-dsd.page': {
  'introLede': 'One DSD connects the Program charter with learning, evidence, community perspectives, and practical methods for Disability Services Division work. Use these resources to examine how policy, service, workforce, and organizational decisions affect access and opportunity.',
  'door0Description': 'Build from shared concepts to intercultural inquiry, structural analysis, and organizational change. Choose the depth of learning that helps you examine the responsibility or decision in front of you.',
  'door2Description': 'Prepare questions about history, access, participation, and community experience, then check your interpretation with the people affected by the work.',
 },
 'support.page': {
  'introLede': 'Identify the supervisor, Equity Director or Specialist, policy owner, or office responsible for a question or decision. Use the learning and practical resources to prepare the issue, explain what remains unresolved, and make the conversation useful.',
  'door0Description': 'Explore a work question with an explanation of the available evidence, its limits, and possible next steps.',
 },
 'my-work.page': {
  'introLede': 'Return to saved resources, working plans, reflection notes, and course progress. These items are stored in this browser on this computer, so someone else using the same browser may be able to see them.',
 },
}
rows=[]
for sid, fields in revisions.items():
 original=by_id[sid]['values']; changes=[]
 for key,after in fields.items():
  if key not in original: raise ValueError(sid+': '+key)
  changes.append({'path':[key],'before':original[key],'after':after})
 rows.append({'target':sid,'kind':'surface','route':by_id[sid]['route'],'changes':changes,'status':'draft','reviewNote':'Prepared from the complete registered surface. Independent source and voice review pending.'})
out=root/'lib/content/professional-language-revisions.json';out.write_text(json.dumps({'standard':'2026-11-13','revisions':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(len(rows),'surfaces',sum(len(r['changes']) for r in rows),'field revisions')
