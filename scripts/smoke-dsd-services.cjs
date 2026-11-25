const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');
const base = new URL(process.env.DSD_SMOKE_BASE || 'http://127.0.0.1:8770').origin;
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw new Error('This smoke check is limited to a local application.');
const allDownloads = process.argv.includes('--downloads-only');
const directory = process.env.DSD_AUDIT_OUT || 'evidence/dsd-full-smoke';
const out = path.resolve(directory, `${allDownloads ? 'all-downloads' : 'services'}.json`);
const buildId = fs.existsSync('.next/BUILD_ID') ? fs.readFileSync('.next/BUILD_ID', 'utf8').trim() : null;
const checks = [];
const failures = [];
fs.mkdirSync(path.dirname(out), { recursive: true });
function save() {
  const endingBuildId = fs.existsSync('.next/BUILD_ID') ? fs.readFileSync('.next/BUILD_ID', 'utf8').trim() : null;
  fs.writeFileSync(out, JSON.stringify({ base, buildId, endingBuildId, buildUnchanged: buildId === endingBuildId, checkedAt: new Date().toISOString(), checks, failures }, null, 2));
}
async function check(url, method, status, verify) {
  const start = Date.now();
  try {
    const response = await fetch(base + url, {
      method, headers: { origin: base, ...(method === 'POST' ? { 'content-type': 'application/json' } : {}) },
      ...(method === 'POST' ? { body: '{"synthetic":"smoke check; no personal information"}' } : {}),
      signal: AbortSignal.timeout(120000), redirect: 'manual',
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const issues = [];
    if (response.status !== status) issues.push(`Expected ${status}, got ${response.status}`);
    if (verify) issues.push(...await verify(response, buffer));
    const row = { url, method, status: response.status, bytes: buffer.length, type: response.headers.get('content-type'), durationMs: Date.now() - start, ok: issues.length === 0, issues };
    checks.push(row);
    if (issues.length) failures.push(row);
    console.log(`${row.ok ? 'PASS' : 'FAIL'} ${method} ${url} ${response.status}`);
    save();
    return buffer.toString('utf8');
  } catch (error) {
    const row = { url, method, ok: false, issues: [error.message], durationMs: Date.now() - start };
    checks.push(row); failures.push(row); save();
    console.log(`FAIL ${method} ${url}: ${error.message}`);
    return '';
  }
}
const json = (validate) => (response, buffer) => {
  if (!response.headers.get('content-type')?.includes('application/json')) return ['Response was not JSON'];
  try { return validate(JSON.parse(buffer.toString('utf8'))); } catch { return ['Malformed JSON']; }
};
const closed = json(value => value.code === 'staff_browse_download_only' ? [] : ['Unexpected staff-write response']);
const download = format => async (response, buffer) => {
  const issues = [];
  if (!response.headers.get('content-disposition')?.startsWith('attachment;')) issues.push('Missing attachment disposition');
  if (response.headers.get('x-download-fallback')) issues.push('Requested renderer failed; substitute format returned');
  if (buffer.length < 100) issues.push('Empty or unexpectedly short download');
  const signature = { pdf: '%PDF-', docx: 'PK\x03\x04', xlsx: 'PK\x03\x04', pptx: 'PK\x03\x04' }[format];
  if (signature && buffer.subarray(0, signature.length).toString('latin1') !== signature) issues.push('Invalid file signature');
  const mime = { pdf:'application/pdf', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation', html:'text/html', txt:'text/plain' }[format];
  if (!response.headers.get('content-type')?.startsWith(mime)) issues.push('Unexpected MIME type for requested format');
  if (format === 'pdf' && !buffer.subarray(-100).toString('latin1').includes('%%EOF')) issues.push('PDF end marker missing');
  if (['docx','xlsx','pptx'].includes(format)) {
    try {
      const archive = await JSZip.loadAsync(buffer, { checkCRC32:true });
      for (const member of ['[Content_Types].xml', {docx:'word/document.xml',xlsx:'xl/workbook.xml',pptx:'ppt/presentation.xml'}[format]]) {
        const entry = archive.file(member);
        if (!entry || !(await entry.async('string')).trim()) issues.push('Missing or empty Office document part: '+member);
      }
    } catch(error) { issues.push('Invalid Office archive: '+error.message); }
  }
  if (format === 'html' && !buffer.toString('utf8').includes('<html')) issues.push('HTML document missing');
  return issues;
};
async function main() {
  if (allDownloads) {
    const inventory = JSON.parse(fs.readFileSync(path.join(directory, 'content-routes.json'), 'utf8'));
    if (inventory.base !== base || inventory.buildId !== buildId || !inventory.buildUnchanged) throw new Error('Download audit needs a completed content inventory from this same server/build.');
    const documents = [...new Set(inventory.skipped.filter(url => url.startsWith('/api/downloads/')))];
    if (!documents.length) throw new Error('Content crawl found no downloadable documents');
    for (const url of documents) {
      const format = new URL(url, base).searchParams.get('format');
      if (!['pdf', 'docx', 'xlsx', 'pptx', 'html', 'txt'].includes(format)) throw new Error(`Unsupported format in published download link: ${url}`);
      await check(url, 'GET', 200, download(format));
    }
    if (fs.readFileSync('.next/BUILD_ID','utf8').trim() !== buildId) throw new Error('Build changed during the download audit; rerun against one stable build.');
    console.log(JSON.stringify({ checks: checks.length, failures: failures.length, receipt: out }));
    if (failures.length) process.exitCode = 1;
    return;
  }
  await check('/api/health', 'GET', 200, json(value => value.status === 'ok' ? [] : ['Unexpected health response']));
  await check('/api/page-text?route=%2Fprogram%2Ffoundation', 'GET', 200, json(value => value.degraded === true && value.reason === 'not-configured' && value.entries.length === 0 ? [] : ['Local database availability incorrectly reported']));
  await check('/api/page-text?route=https%3A%2F%2Finvalid.example', 'GET', 400);
  // Consultation intake and tracking are retired: they answer with a clear closed message, never a silent success.
  await check('/api/intake', 'POST', 410);
  await check('/api/intake/synthetic', 'POST', 503);
  for (const url of ['/api/ask', '/api/equity-analysis', '/api/equity-analysis/follow-ups', '/api/equity-analysis/survey-waves', '/api/program/outcomes', '/api/sp-clone-request', '/api/one-dsd/team']) await check(url, 'POST', 403, closed);
  for (const url of ['/api/consultant/ask-records', '/api/one-dsd/team', '/api/sp-clone-request?trackingId=SYNTHETIC']) await check(url, 'GET', 401);
  for (const url of ['/api/page-text', '/api/media']) await check(url, 'POST', 401);
  await check('/api/intake/synthetic', 'GET', 405);
  await check('/api/offline/owner', 'GET', 404);
  await check('/api/offline/connectors', 'POST', 404);
  await check('/equity-policy/analysis/smoke-nonexistent', 'GET', 200, (_response, buffer) => buffer.toString('utf8').includes('Analysis records are not shown here') ? [] : ['Private analysis-record route did not preserve its browse-only boundary']);
  await check('/api/media/not-a-file', 'GET', 404);
  await check('/api/downloads/equity-toolkit/companion?format=invalid', 'GET', 400);
  await check('/api/downloads/library/not-a-resource?format=pdf', 'GET', 404);
  await check('/api/downloads/course/not-a-resource?format=pdf', 'GET', 404);
  const ask = await check('/ask', 'GET', 200);
  const links = [...new Set([...ask.matchAll(/href="([^"<>]*\/api\/downloads\/[^"<>]+)"/g)].map(match => match[1].replaceAll('&amp;', '&')))];
  const documents = [...new Set(links.map(href => href.split('?')[0]))];
  if (!documents.length) { failures.push({ url: '/ask', issues: ['No real download links discovered'] }); save(); }
  for (const url of documents) await check(`${url}?format=txt`, 'GET', 200, download('txt'));
  const samples = ['library/ext-dhs-equity-toolkit', 'scenario/dsd-hiring-panel', 'program/hcbs-policy', 'amplify/materials', 'brief/african-american', 'path/gp-1', 'area/access-language', 'team/one-dsd', 'leadership/one-dsd', 'equity-toolkit/companion', 'community-connections/home', 'learning-journey/intercultural', 'measurement/worksheet', 'sources/register', 'equity-framework/framework', 'operationalizing-equity/program', 'understanding-dhs/reference', 'support-directory/dhs', 'toolkit-studio/insights-checklist'];
  for (const spec of samples) for (const format of ['pdf', 'docx', 'xlsx', 'pptx', 'html', 'txt']) await check(`/api/downloads/${spec}?format=${format}`, 'GET', 200, download(format));
  for (const format of ['pdf', 'docx', 'xlsx', 'pptx', 'html', 'txt']) await check(`/api/downloads/equity-toolkit/companion?format=${format}&view=one_dhs`, 'GET', 200, async (response, buffer) => [...await download(format)(response, buffer), ...(['html', 'txt'].includes(format) && !buffer.toString('utf8').includes('One DSD People, Access and Culture') ? ['Legacy query changed DSD attribution'] : [])]);
  if (fs.readFileSync('.next/BUILD_ID','utf8').trim() !== buildId) throw new Error('Build changed during the service audit; rerun against one stable build.');
  console.log(JSON.stringify({ checks: checks.length, failures: failures.length, receipt: out }));
  if (failures.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
