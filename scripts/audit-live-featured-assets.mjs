/** Bounded, read-only format checks of actual featured files. Never downloads a whole large video. */
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.DSD_AUDIT_BASE || 'https://one-people-access-culture.up.railway.app';
const out = '.data/source-coverage-completion/featured-links';
const manifest = new Map();
function add(raw, sources = []) {
  const url = new URL(raw, base); url.hash = '';
  const row = manifest.get(url.href) || {url: url.href, sources: []};
  row.sources = [...new Set([...row.sources, ...sources])]; manifest.set(url.href, row);
}
for (const row of JSON.parse(fs.readFileSync(path.join(out, 'asset-links.json')))) add(row.url, row.pages);
for (const row of JSON.parse(fs.readFileSync('.data/source-coverage-20261113/manifest-media-assets.json'))) add(row.href, row.sources);
// Older crawler receipts include text-caption/calendar files; include them in the correct file audit.
for (const line of fs.readFileSync(path.join(out, 'pages.jsonl'), 'utf8').split('\n').filter(Boolean)) {
  const row = JSON.parse(line);
  if (/\.(vtt|srt|ics|csv)(\?|$)/i.test(row.route)) add(row.route, [row.route]);
}
const receiptPath = path.join(out, 'asset-checks.jsonl');
const done = new Map();
if (fs.existsSync(receiptPath)) for (const line of fs.readFileSync(receiptPath, 'utf8').split('\n').filter(Boolean)) {
  const row = JSON.parse(line); if (row.ok) done.set(row.url, row);
}
const queue = [...manifest.values()].filter(row => !done.has(row.url));
const concurrency = Math.min(4, Math.max(1, Number(process.env.DSD_ASSET_CONCURRENCY || 2)));
const ascii = data => data.toString('latin1');
function formatCheck(url, type, bytes) {
  const extension = new URL(url).pathname.split('.').pop().toLowerCase();
  // Static image optimization may serve WebP bytes at a reviewed .jpg path; browsers use its MIME type.
  const imageFormats = {'image/webp':'webp','image/jpeg':'jpeg','image/png':'png','image/svg+xml':'svg'};
  const ext = imageFormats[type.split(';')[0]] || extension;
  const raw = ascii(bytes), text = bytes.toString('utf8').replace(/^\uFEFF/, '').trimStart();
  const html = /^<(?:!doctype html|html|head)/i.test(text);
  if (!bytes.length) return {ok: false, reason: 'empty-body', ext};
  if (html && !['html', 'htm'].includes(ext)) return {ok:false, reason:'unexpected-html',ext};
  const signatures = {
    pdf: raw.startsWith('%PDF-'), png: bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    jpg: bytes[0]===255 && bytes[1]===216, jpeg: bytes[0]===255 && bytes[1]===216,
    webp: raw.startsWith('RIFF') && raw.slice(8,12)==='WEBP',
    wav: raw.startsWith('RIFF') && raw.slice(8,12)==='WAVE',
    mp3: raw.startsWith('ID3') || (bytes[0]===255 && (bytes[1]&224)===224),
    mp4: raw.slice(4,8)==='ftyp', webm: bytes.subarray(0,4).equals(Buffer.from([26,69,223,163])),
    docx: raw.startsWith('PK'), pptx: raw.startsWith('PK'), xlsx: raw.startsWith('PK'), zip: raw.startsWith('PK'),
    vtt: text.startsWith('WEBVTT'), ics: text.startsWith('BEGIN:VCALENDAR'),
    svg: /<svg[\s>]/i.test(text), txt: !html && !type.includes('application/json'),
    json: /^[{[]/.test(text), srt: /^\d+\s+\d\d:/.test(text), csv: !html,
  };
  if (ext in signatures) return {ok:signatures[ext],reason:signatures[ext] ? 'format-signature' : 'format-mismatch',ext};
  return {ok:!html && /^(?:image|audio|video)\/|application\/(?:pdf|octet-stream)/.test(type),reason:'content-type',ext};
}
async function inspect(row) {
  const started = Date.now(); let result;
  for (let attempt=0;attempt<2;attempt++) {
    try {
      const response = await fetch(row.url, {headers:{Range:'bytes=0-8191','User-Agent':'OneDSD-Owner-Asset-Audit/1.0'},signal:AbortSignal.timeout(45000)});
      const reader = response.body?.getReader(), chunks=[]; let count=0;
      if (reader) {
        while(count<8192) { const value=await reader.read(); if(value.done)break; chunks.push(value.value); count+=value.value.length; }
        await reader.cancel();
      }
      const bytes=Buffer.concat(chunks).subarray(0,8192), type=response.headers.get('content-type') || '';
      const format=formatCheck(row.url,type,bytes);
      result={...row,status:response.status,final:response.url,type,range:response.headers.get('content-range'),length:response.headers.get('content-length'),sampleBytes:bytes.length,format,ok:response.ok&&format.ok,checkedAt:new Date().toISOString(),ms:Date.now()-started};
      if (!result.ok && attempt===0 && (response.status===429||response.status>=500)) {await new Promise(resolve=>setTimeout(resolve,1200));continue;}
      break;
    } catch(error) {result={...row,ok:false,error:String(error),checkedAt:new Date().toISOString(),ms:Date.now()-started};if(attempt===0){await new Promise(resolve=>setTimeout(resolve,1200));continue;}}
  }
  fs.appendFileSync(receiptPath,JSON.stringify(result)+'\n');done.set(row.url,result);
  if(!result.ok)console.log('FAIL '+JSON.stringify(result));
  if(done.size%100===0)console.log(JSON.stringify({checked:done.size,total:manifest.size,failures:[...done.values()].filter(row=>!row.ok).length}));
}
let cursor=0;
await Promise.all(Array.from({length:concurrency},async()=>{while(cursor<queue.length){await inspect(queue[cursor++]);await new Promise(resolve=>setTimeout(resolve,80));}}));
const results=[...manifest.keys()].map(url=>done.get(url));
const summary={checkedAt:new Date().toISOString(),base,total:results.length,passed:results.filter(row=>row.ok).length,failures:results.filter(row=>!row.ok),method:'GET byte range 0-8191; response headers and file signature checked; full media decoding not asserted',results};
fs.writeFileSync(path.join(out,'asset-results.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({...summary,results:undefined}));
