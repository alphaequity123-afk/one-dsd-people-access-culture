import fs from 'node:fs';
import path from 'node:path';

// This verifier makes at most three Ask requests. It never generates speech.
// Saved attempts are reused; retrying a failed Ask requires --retry-failed.
const args = process.argv.slice(2);
const argument = (name, fallback) => { const at = args.indexOf(name); return at < 0 ? fallback : args[at + 1]; };
const base = argument('--base', 'https://one-people-access-culture.up.railway.app').replace(/\/$/, '');
const release = argument('--deployment', '');
const selection = argument('--case', 'all');
const directory = argument('--output', `.data/source-coverage-20261113/live-${release.slice(0, 12) || 'pending'}`);
const searchCases = [
  { id: 'ada-reading', query: 'ADA effective communication auxiliary aids companions', expected: /\/source-reading\/(?:229c48a437e8a56b030c|d8f1d38440dc1ffcbce3)/ },
  { id: 'north-crossing-transcript', query: 'North Crossing reader has to supply those details', expected: /\/learning\/course-media\/44e0bacb5e80a486103315bd11b89c328f98c7960968efe53577e6021e5df4ce\.mp4/ },
  { id: 'dli', query: 'DLI', expected: /\/minnesota-agencies\/labor-and-industry-department-of/ },
  { id: 'deed', query: 'DEED', expected: /\/minnesota-agencies\/employment-and-economic-development-department/ },
  { id: 'mmb', query: 'MMB', expected: /\/minnesota-agencies\/minnesota-management-and-budget/ },
  { id: 'pacer', query: 'PACER', title: /PACER/i },
];
const askCases = [
  { id: 'ada-source-only', input: { question: 'Use only the application sources. What does the ADA Effective Communication reading say about companions and auxiliary aids? Explain the practical distinction in about 150 words and cite the reading.', researchMode: 'program_only' }, sourceOnly: true, expectedSource: /\/source-reading\/(?:229c48a437e8a56b030c|d8f1d38440dc1ffcbce3)/ },
  { id: 'north-crossing-recording', input: { question: 'Use only the application sources. In the recorded overview of The Water We Swim In, what does the fictional North Crossing appointment notice leave unsaid, and what should staff check before changing it? Base the explanation on the recording transcript, cite the recording or transcript, and keep it to about 150 words.', researchMode: 'program_only' }, sourceOnly: true, expectedSource: /\/learning\/(?:course-media|water-we-swim-in)\/|\/videos\// },
  { id: 'agency-partner-synthesis', input: { question: 'For a Minnesota DSD staff member improving access to employment information, explain how DLI, DEED, Minnesota Management and Budget (MMB), and PACER could inform the work differently. Use a relevant application resource together with current official public sources. Cite both. Separate documented responsibilities from your suggested coordination, do not assume a contract or referral agreement, and keep it to about 250 words.', researchMode: 'current_web' }, research: true },
];

if (!args.includes('--run')) {
  console.log(JSON.stringify({ status: 'prepared_not_run', base, searchRequests: searchCases.length, maximumAskRequests: askCases.length, cases: askCases.map(item => ({ id: item.id, input: item.input })), execution: 'After the deployment is successful, pass --run --deployment <commit SHA>. Existing Ask attempts are reused.' }, null, 2));
  process.exit(0);
}
if (!/^[a-f0-9]{7,40}$/.test(release)) throw Error('A verified deployment commit SHA is required.');
if (!['all', 'search', ...askCases.map(item => item.id)].includes(selection)) throw Error('Choose a known verification case.');
if (new URL(base).protocol !== 'https:') throw Error('Live verification requires an HTTPS origin.');
fs.mkdirSync(directory, { recursive: true });
const save = (name, value) => fs.writeFileSync(path.join(directory, name + '.json'), JSON.stringify(value, null, 2));
const failures = [];
const citationUrls = new Map();
const recordFailure = (id, message) => { failures.push({ id, message }); };
const readJson = async response => {
  const body = await response.text();
  try { return JSON.parse(body); } catch { return { error: 'Non-JSON response', excerpt: body.slice(0, 2000) }; }
};

if (selection === 'all' || selection === 'search') {
  for (const test of searchCases) {
    const start = Date.now();
    let record;
    try {
      const response = await fetch(`${base}/api/search?q=${encodeURIComponent(test.query)}&limit=20`, { signal: AbortSignal.timeout(90000) });
      const result = await readJson(response);
      const found = (result.results ?? []).find(hit => test.expected ? test.expected.test(hit.href) : test.title.test(hit.title));
      record = { release, query: test.query, status: response.status, seconds: (Date.now() - start) / 1000, matched: Boolean(found), matchedResult: found, result };
      if (response.status !== 200 || !found) recordFailure(test.id, 'Expected substantive resource was not found.');
      if (found?.href) citationUrls.set(new URL(found.href, base).href, `search:${test.id}`);
    } catch (error) { record = { release, query: test.query, error: String(error) }; recordFailure(test.id, 'Search request failed.'); }
    save('search-' + test.id, record);
    console.log(JSON.stringify({ stage: 'search', id: test.id, matched: record.matched, seconds: record.seconds, error: record.error }));
  }
}

for (const test of askCases.filter(item => selection === 'all' || selection === item.id)) {
  const filename = path.join(directory, 'ask-' + test.id + '.json');
  let record = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : undefined;
  if (record?.passed === false && args.includes('--retry-failed')) record = undefined;
  if (!record) {
    record = { release, input: test.input, startedAt: new Date().toISOString(), passed: false, status: 'started' };
    save('ask-' + test.id, record);
    const start = Date.now();
    try {
      const response = await fetch(base + '/api/ask', {
        method: 'POST', headers: { 'content-type': 'application/json', origin: base },
        body: JSON.stringify({ ...test.input, contextPreference: 'one_dsd' }), signal: AbortSignal.timeout(200000),
      });
      record = { ...record, status: response.status, seconds: (Date.now() - start) / 1000, result: await readJson(response), completedAt: new Date().toISOString() };
    } catch (error) { record = { ...record, seconds: (Date.now() - start) / 1000, error: String(error), completedAt: new Date().toISOString() }; }
  }
  const answer = record.result?.answer;
  const issues = [];
  if (record.status !== 200 || record.result?.kind !== 'answer') issues.push('A complete answer was not returned.');
  if (!answer?.shortAnswer || answer.shortAnswer.length < 80 || /could not put together|temporarily unavailable|couldn.t match the answer.s references/i.test(answer.shortAnswer)) issues.push('The answer was empty or reported a generation/evidence failure.');
  if (!answer?.sources?.length) issues.push('No application evidence source was supplied.');
  if (!answer?.sources?.some(source => source.evidence) || !answer?.evidenceClaims?.length) issues.push('Current-source passage evidence was not attached to the answer.');
  if (test.expectedSource && !answer?.sources?.some(source => test.expectedSource.test(source.href))) issues.push('The requested reading or recording evidence was not cited.');
  if (test.sourceOnly && (answer?.publicResearch?.sources?.length ?? 0)) issues.push('A source-only request included public research.');
  if (test.research && !answer?.publicResearch?.sources?.length) issues.push('The requested public research was not supplied.');
  if (test.research && !/PACER/i.test(answer?.shortAnswer ?? '')) issues.push('The synthesis did not address PACER.');
  if (!answer?.followUpQuestions?.length) issues.push('No optional follow-up question was supplied.');
  record = { ...record, passed: issues.length === 0, issues };
  save('ask-' + test.id, record);
  issues.forEach(message => recordFailure(test.id, message));
  for (const source of answer?.sources ?? []) citationUrls.set(new URL(source.href, base).href, `ask:${test.id}`);
  for (const source of answer?.publicResearch?.sources ?? []) citationUrls.set(source.url, `research:${test.id}`);
  console.log(JSON.stringify({ stage: 'ask', id: test.id, passed: record.passed, seconds: record.seconds, applicationSources: answer?.sources?.length ?? 0, externalSources: answer?.publicResearch?.sources?.length ?? 0, issues }));
}

const linkChecks = [];
for (const [raw, source] of [...citationUrls].slice(0, 60)) {
  const url = new URL(raw); url.hash = '';
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || /^(?:localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(url.hostname)) {
    linkChecks.push({ url: raw, source, outcome: 'unsupported_destination' }); continue;
  }
  try {
    const response = await fetch(url, { headers: { Range: 'bytes=0-65535' }, signal: AbortSignal.timeout(30000) });
    const type = response.headers.get('content-type') ?? '';
    const reader = response.body?.getReader(); let bytes = 0; let text = '';
    if (reader) { while (bytes < 65536) { const chunk = await reader.read(); if (chunk.done) break; bytes += chunk.value.length; if (/text|json/.test(type)) text += new TextDecoder().decode(chunk.value); } await reader.cancel(); }
    const missing = response.status === 404 || response.status === 410 || /<title[^>]*>\s*(?:404|page not found|not found|content unavailable)/i.test(text);
    const blocked = [401,403,429].includes(response.status) || /<title[^>]*>[^<]*(?:access denied|just a moment|captcha)/i.test(text);
    const outcome = missing ? 'missing' : blocked ? 'not_independently_confirmed' : response.ok ? 'available' : 'http_failure';
    linkChecks.push({ url: raw, finalUrl: response.url, source, status: response.status, type, outcome });
    if (missing || (new URL(base).origin === url.origin && outcome !== 'available')) recordFailure(source, 'A cited destination failed its live content check: ' + raw);
  } catch (error) { linkChecks.push({ url: raw, source, outcome: 'request_failed', error: String(error) }); if (url.origin === new URL(base).origin) recordFailure(source, 'An internal citation could not be opened: ' + raw); }
}
save('citation-links', linkChecks);
const summary = { release, base, checkedAt: new Date().toISOString(), selection, failures, citationLinks: linkChecks.length, citationOutcomes: linkChecks.reduce((counts, item) => ({ ...counts, [item.outcome]: (counts[item.outcome] ?? 0) + 1 }), {}), limitExceeded: citationUrls.size > 60 };
save('summary', summary);
console.log(JSON.stringify(summary));
if (failures.length) process.exitCode = 1;
