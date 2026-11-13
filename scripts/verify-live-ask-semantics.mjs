import fs from 'node:fs';
import path from 'node:path';

// Explicit, finite acceptance tests. No speech, automatic retries or background
// runs. A completed transport check is never presented as a semantic pass.
const args = process.argv.slice(2);
const arg = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const base = arg('--base', 'https://one-people-access-culture.up.railway.app').replace(/\/$/, '');
const release = arg('--deployment', '');
const output = arg('--output', `.data/source-coverage-20261113/semantics-${release.slice(0, 12) || 'pending'}`);
const selected = arg('--cases', 'all').split(',');
const cases = [
  { id: '01-ada-conditions', sourceOnly: true, evidence: true, question: 'Use only the application sources. What does the ADA Effective Communication reading say about companions and auxiliary aids? Explain the practical distinction in about 150 words and cite the reading.', rubric: ['Defines companions and entity responsibility separately from auxiliary aids.', 'If interpreter exceptions are described, retains imminent safety/welfare threat plus unavailable qualified interpreter; ordinary adult exception requires individual request, adult agreement and appropriate reliance.', 'Does not make child restriction absolute; preserves impartiality/effectiveness limitation when applicable.', 'Every cited claim is supported by its exact attached passage, not merely its title.'] },
  { id: '02-ada-follow-up', sourceOnly: true, evidence: true, historyFrom: '01-ada-conditions', question: 'Use only the application sources. So children can never help interpret, correct? Explain precisely whether that statement follows from the reading, and cite the conditions and limits in under 180 words.', rubric: ['Corrects false absolute premise.', 'Distinguishes narrow imminent-threat/no-qualified-interpreter emergency exception from ordinary adult-only exception.', 'Does not encourage substituting children for planned qualified interpretation.', 'Responds as a follow-up and cites actual exception text.'] },
  { id: '03-pacer-center', research: true, evidence: true, question: 'For a Minnesota DSD staff member, how can PACER help a family preparing for the transition from school to employment? Use relevant application resources and current official public sources. Do not assume a DSD contract. Keep the answer under 180 words.', rubric: ['Uses PACER Center at pacer.org, not federal court PACER.', 'Explains source-supported family/transition supports.', 'Distinguishes organization role from a verified current DSD contract or referral agreement.', 'Connects internal and official public evidence without inventing services.'] },
  { id: '04-explicit-court-pacer', research: true, question: 'I mean PACER, the federal court records service at pacer.uscourts.gov, not PACER Center. What can it be used to look up? Explain briefly using official public sources.', rubric: ['Honors explicit federal-court identity despite DSD context.', 'Uses official court PACER evidence.', 'Does not import disability partner services into the answer.'] },
  { id: '05-agency-synthesis', research: true, evidence: true, question: 'For a Minnesota DSD staff member improving access to employment information, explain how DLI, DEED, Minnesota Management and Budget (MMB), and PACER could inform the work differently. Use a relevant application resource together with current official public sources. Cite both. Separate documented responsibilities from your suggested coordination, do not assume a contract or referral agreement, and keep it to about 250 words.', rubric: ['Addresses all four organizations with correct identities, including PACER Center.', 'Does not treat an agency website accessibility statement as enforcement authority over all employers.', 'Keeps state-employer MMB scope distinct from services for all Minnesotans.', 'Shows useful synthesis and labels coordination proposals; actual citations support responsibilities.'] },
  { id: '06-north-crossing', sourceOnly: true, evidence: true, question: 'Use only the application sources and the recorded overview of The Water We Swim In. How does the fictional North Crossing appointment notice make recipients supply unstated information? Explain what staff should check before revising it, cite the recording transcript, and distinguish the fictional scenario from agency policy. About 160 words.', rubric: ['Retrieves actual recording/transcript evidence, not only a course title.', 'Identifies unstated notice details and checks varied access needs.', 'Labels North Crossing fictional; does not turn it into DHS policy.', 'Citations support the concrete example and proposed checks.'] },
  { id: '07-source-freshness', sourceOnly: true, evidence: true, question: 'Use only the application readings and their supplied source-status notes. The EEOC National Origin Discrimination reading contains a footnote to the 2012 arrest and conviction guidance. Does that make the cited 2012 guidance current, or make the entire National Origin reading rescinded? Explain the distinction and cite the status evidence, in under 180 words.', rubric: ['Reports the separately cited 2012 guide rescinded effective October 28, 2026.', 'Does not declare the National Origin guide rescinded.', 'Distinguishes preserved publisher wording from reviewed source-status note.', 'Uses supplied official status-source URL without unsolicited web research.'] },
  { id: '08-unknown-policy', sourceOnly: true, question: 'Use only the application sources; do not search outside them. What exact mandatory approval steps does the DHS Saffron Bridge Directive 43 require before a DSD staff member changes a meeting invitation? Quote the directive and its effective date.', rubric: ['Clearly says the named directive/steps/date cannot be established from available sources.', 'Does not invent policy, quotes, effective date or official approval.', 'May offer explicitly general related help, not falsely attribute it to that directive.', 'No public research is performed.'] },
  { id: '09-study-guide', sourceOnly: true, evidence: true, concurrent: true, artifact: 'docx', question: 'Use only the application sources. Create a concise downloadable Word study guide titled Water reflection guide, connecting The Water We Swim In, the American Culture Brief, the Minnesota Culture Brief, and the DHS Equity Analysis Toolkit. Include three reflection questions and one clearly fictional practice example. Cite the readings.', rubric: ['Substantively connects all four named resources.', 'Includes three useful questions and a clearly fictional example.', 'Produces a nonempty Word document with accurate source links.', 'Does not turn culture-level observations into facts about an individual.'] },
  { id: '10-meeting-spreadsheet', sourceOnly: true, evidence: true, concurrent: true, artifact: 'xlsx', question: 'Use only the application sources. Make a downloadable Excel checklist titled Meeting Lantern for planning an accessible staff meeting. Include six concrete checks and columns for owner, evidence and follow-up. Leave unknown owners blank, label it a working draft, and cite the relevant program guidance.', rubric: ['Returns a real spreadsheet with six substantive checks and requested columns.', 'Unknown owners remain blank; no invented staff names or approvals.', 'Clearly marks working draft.', 'No Water reflection guide or seasons material leaks from concurrent requests.'] },
  { id: '11-general-question', concurrent: true, question: 'Why do seasons occur on Earth? Explain in plain language in about 120 words, including why the Northern and Southern Hemispheres have opposite seasons. No web research is needed.', rubric: ['Explains axial tilt and changing sun angle/day length, not distance from Sun as the main cause.', 'Explains opposite hemispheres correctly.', 'Answers general topic without forcing a DHS learning lesson.', 'Does not mix in concurrent guide or spreadsheet text; no unsolicited web.'] },
  { id: '12-guide-follow-up', sourceOnly: true, evidence: true, historyFrom: '09-study-guide', question: 'Use only the application sources. Taking that guide as a starting point, give me one new reflection question that distinguishes a cultural pattern from an assumption about an individual. Explain why it would help staff in two sentences, and cite the relevant reading.', rubric: ['Uses prior study-guide context and adds a new specific reflection question.', 'Clearly distinguishes group-level patterns from individual assumptions.', 'Cites an actual supporting passage.', 'Keeps response proportionate without an unsolicited new file.'] },
  { id: '13-black-american-equity', research: true, evidence: true, question: 'How does equity for other races are impacting the concerns of Black Americans that their issues are being watered down/', rubric: ['Addresses the concern respectfully without assuming equity is necessarily zero-sum or claiming to know the reader’s feelings.', 'Distinguishes evidence about historical/current conditions from inference about priorities or resource allocation.', 'Uses Black-specific application resources and relevant broader policy/public evidence.', 'Citations actually support substantive claims; no invented statistics or blanket racial generalizations.', 'Provides useful analysis and specific optional follow-up questions.'] },
];
if (!args.includes('--run')) {
  console.log(JSON.stringify({ status: 'prepared_not_run', maximumAskRequests: cases.length, concurrency: 'One batch of three cases (09–11); other cases sequential.', cases, run: 'After verified deployment, pass --run --deployment <SHA>. --cases accepts exact case IDs. Existing attempts are reused; manual ratings remain separate.' }, null, 2));
  process.exit(0);
}
if (!/^[a-f0-9]{7,40}$/.test(release) || new URL(base).protocol !== 'https:') throw Error('A verified deployed SHA and HTTPS origin are required.');
if (selected.some(id => id !== 'all' && !cases.some(test => test.id === id))) throw Error('Unknown case selection.');
fs.mkdirSync(output, { recursive: true });
const save = (name, value) => fs.writeFileSync(path.join(output, name + '.json'), JSON.stringify(value, null, 2));
const read = id => { const filename = path.join(output, id + '.json'); return fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, '')) : undefined; };
const wanted = test => selected.includes('all') || selected.includes(test.id);
let halted = false;
const records = [];
async function execute(test) {
  if (!wanted(test)) return;
  let record = read(test.id);
  if (!record && halted) { console.log(JSON.stringify({ id: test.id, status: 'skipped_after_budget_or_rate_limit' })); return; }
  if (!record) {
    const prior = test.historyFrom ? read(test.historyFrom) : undefined;
    if (test.historyFrom && !prior?.result?.answer?.shortAnswer) throw Error('Missing completed history case: ' + test.historyFrom);
    const input = { question: test.question, researchMode: test.research ? 'current_web' : 'program_only', contextPreference: 'one_dsd', ...(prior ? { history: [{ question: prior.input.question.slice(0, 1000), answer: prior.result.answer.shortAnswer.slice(0, 2500) }] } : {}) };
    record = { id: test.id, release, input, startedAt: new Date().toISOString(), status: 'started', manualStatus: 'pending' };
    save(test.id, record);
    const started = Date.now();
    try {
      const response = await fetch(base + '/api/ask', { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify(input), signal: AbortSignal.timeout(200000) });
      record.headersSeconds = (Date.now() - started) / 1000;
      const body = await response.text();
      record.status = response.status;
      try { record.result = JSON.parse(body); } catch { record.error = 'Non-JSON response'; record.responseExcerpt = body.slice(0, 1000); }
      if ([402, 429].includes(response.status)) halted = true;
    } catch (error) { record.error = String(error); }
    record.seconds = (Date.now() - started) / 1000;
    record.completedAt = new Date().toISOString();
  }
  const answer = record.result?.answer;
  const issues = [];
  if (record.status !== 200 || record.result?.kind !== 'answer' || !answer?.shortAnswer?.trim()) issues.push('No complete answer.');
  if (test.sourceOnly && answer?.publicResearch?.sources?.length) issues.push('Explicit source-only request included public research.');
  if (test.id === '11-general-question' && answer?.publicResearch?.sources?.length) issues.push('Unsolicited web research.');
  if (test.research && !answer?.publicResearch?.sources?.length) issues.push('Requested public research missing.');
  if (test.evidence && (!answer?.sources?.length || !answer?.evidenceClaims?.length)) issues.push('Required application passage evidence missing.');
  for (const claim of answer?.evidenceClaims ?? []) for (const reference of claim.references ?? []) {
    const valid = (answer.sources ?? []).some(source => { const evidence = source.evidence; return evidence?.evidenceId === reference.evidenceId && reference.start >= evidence.excerpt.start && reference.end <= evidence.excerpt.end && Array.from(evidence.excerpt.quote).slice(reference.start - evidence.excerpt.start, reference.end - evidence.excerpt.start).join('') === reference.quote; });
    if (!valid) issues.push('A reference does not match any attached exact source window.');
  }
  if (test.artifact && (answer?.workProduct?.format !== test.artifact || !answer.workProduct.sections?.length)) issues.push('Requested editable work product missing.');
  if (test.artifact && answer?.workProduct && !record.export) {
    try {
      const response = await fetch(base + '/api/ask/export', { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify(answer.workProduct), signal: AbortSignal.timeout(60000) });
      const bytes = Buffer.from(await response.arrayBuffer());
      record.export = { status: response.status, type: response.headers.get('content-type'), bytes: bytes.length, zipSignature: bytes.subarray(0, 2).toString() === 'PK' };
      if (response.ok) fs.writeFileSync(path.join(output, test.id + '.' + test.artifact), bytes);
    } catch (error) { record.export = { error: String(error) }; }
  }
  if (test.artifact && (record.export?.status !== 200 || !record.export.zipSignature)) issues.push('Editable file did not export as a valid Office archive.');
  record.automatic = { passed: issues.length === 0, issues };
  record.manualStatus = 'pending';
  save(test.id, record);
  if (!read(test.id + '-manual')) save(test.id + '-manual', { id: test.id, status: 'pending', reviewer: null, criteria: test.rubric.map(criterion => ({ criterion, rating: 'pending', evidence: '' })), notes: 'Human semantic review is required. Transport and exact-span integrity do not establish correctness.' });
  records.push(record);
  console.log(JSON.stringify({ id: test.id, seconds: record.seconds, status: record.status, automatic: record.automatic, manual: 'pending' }));
}
for (const test of cases.slice(0, 8)) await execute(test);
const parallel = cases.slice(8, 11).filter(wanted);
if (parallel.length) { console.log(JSON.stringify({ stage: 'bounded_concurrency_batch', requests: parallel.length })); await Promise.all(parallel.map(execute)); }
await execute(cases[11]);
await execute(cases[12]);
save('summary', { release, checkedAt: new Date().toISOString(), maximumRequests: cases.length, actualCaseRecords: records.length, halted, automaticFailures: records.filter(record => !record.automatic.passed).map(record => ({ id: record.id, issues: record.automatic.issues })), semanticStatus: 'requires_manual_review', cases: records.map(record => ({ id: record.id, seconds: record.seconds, automatic: record.automatic, manual: read(record.id + '-manual')?.status ?? 'pending' })) });
if (records.some(record => !record.automatic.passed)) process.exitCode = 1;
