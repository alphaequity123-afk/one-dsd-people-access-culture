import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import sharp from 'sharp';
import { normalizeUrl, formatSourceHtml, finalizeSourceHtml, readingSections, readingAnchors } from './source-reading-format.mjs';
import { writeSourceLinkMap } from './source-link-map.mjs';

const stage = '.data/full-refactor/sources';
const destination = 'data/source-readings';
const assetStage = '.data/full-refactor/assets';
const publish = process.argv.includes('--publish');
const refreshApproved = process.argv.includes('--refresh-approved');
const approvalsFile = 'config/source-republication.json';
const approvals = fs.existsSync(approvalsFile) ? JSON.parse(fs.readFileSync(approvalsFile, 'utf8')).approvals : [];
const approved = new Map(approvals.map(entry => [normalizeUrl(entry.url), entry]));
fs.mkdirSync(stage, {recursive:true});
fs.mkdirSync(destination, {recursive:true});
const hash = text => createHash('sha256').update(text).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
const records = new Map();
function add(url, title, from) {
  const normalized = normalizeUrl(url);
  if (!normalized || /(?:localhost|127\.0\.0\.1|up\.railway\.app|supabase\.co|example\.(?:com|org)|schema\.org|w3\.org\/2000\/svg)/.test(normalized)) return;
  if (/\.(?:mp[34]|wav|webm|png|jpe?g|gif|webp|svg|zip)(?:\?|$)/i.test(normalized)) return;
  const entry=records.get(normalized)||{id:hash(normalized).slice(0,20),url:normalized,title:title||new URL(normalized).hostname,from:[]};
  if(from&&!entry.from.includes(from))entry.from.push(from);
  records.set(normalized,entry);
}
const register=read('data/source-register/source-register.json');
for(const s of register.sources.filter(s=>s.kind==='external'&&s.href))add(s.href,s.title,'source-register');
for(const file of ['lib/content/state-agencies.json','lib/content/public-partners.json']){
  const d=read(file);for(const a of d.agencies||d.partners)add(a.href,a.name,`/minnesota-agencies/${a.id}`);
}
for(const p of read('lib/content/state-pages.json').pages)if(!/captcha|access denied|just a moment/i.test(p.title))add(p.url,p.title,'state-reading');
const censusPath=process.argv.slice(2).find(value => !value.startsWith('--'))||'.data/full-refactor-live-baseline/page-census.json';
if(fs.existsSync(censusPath))for(const s of read(censusPath).external)add(s.url,s.titles.find(t=>!/original|website|source|learn more|read more/i.test(t))||s.titles[0],s.pages.join(' '));
fs.writeFileSync(path.join(stage,'inventory.json'),JSON.stringify([...records.values()],null,2));

function publicIp(ip){return !(/^(?:0|10|127)\.|^169\.254\.|^192\.168\.|^172\.(?:1[6-9]|2\d|3[01])\.|^(?:22[4-9]|23\d|24\d|25[0-5])\.|^::|^f[cd]|^fe[89ab]/i.test(ip));}
const hosts=new Map();
async function publicUrl(raw){
  const u=new URL(raw);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port||!u.hostname.includes('.')||isIP(u.hostname))throw new Error('Non-public destination');
  if(!hosts.has(u.hostname))hosts.set(u.hostname,lookup(u.hostname,{all:true}).then(rows=>rows.length&&rows.every(r=>publicIp(r.address))).catch(()=>false));
  if(!await hosts.get(u.hostname))throw new Error('Address unavailable');return u;
}
async function get(raw,maxBytes=20*1024*1024){
  let url=raw;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  try{
    for(let hops=0;hops<7;hops++){
      await publicUrl(url);
      const r=await fetch(url,{redirect:'manual',signal:controller.signal,headers:{'user-agent':'OneDSD-ResourceReader/1.0 (public resource verification)','accept':'text/html,application/pdf,text/plain,*/*;q=0.5'}});
      if(r.status>=300&&r.status<400&&r.headers.get('location')){url=new URL(r.headers.get('location'),url).href;await r.body?.cancel();continue;}
      if(!r.ok){await r.body?.cancel();throw new Error(`HTTP ${r.status}`);}
      if(Number(r.headers.get('content-length'))>maxBytes){await r.body?.cancel();throw new Error('Document exceeds import limit');}
      const reader=r.body.getReader();let total=0;const chunks=[];
      for(;;){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>maxBytes){await reader.cancel();throw new Error('Document exceeds import limit');}chunks.push(value);}
      return {bytes:Buffer.concat(chunks),url,type:(r.headers.get('content-type')||'').split(';')[0].toLowerCase(),modified:r.headers.get('last-modified')};
    }throw new Error('Too many redirects');
  }finally{clearTimeout(timer);}
}
let cursor=0, done=0;const entries=[...records.values()];
async function worker(){
  while(cursor<entries.length){
const entry=entries[cursor++];const file=path.join(stage,entry.id+'.json');
    if ((publish || refreshApproved) && !approved.has(entry.url)) continue;
    if(fs.existsSync(file) && !refreshApproved){done++;continue;}
    let receipt;
    try{
      const r=await get(entry.url);const checkedAt=new Date().toISOString();
      if(r.type==='application/pdf'||r.bytes.subarray(0,5).toString()==='%PDF-'){
        const local=`/source-documents/${entry.id}.pdf`;fs.mkdirSync(assetStage+'/source-documents',{recursive:true});fs.writeFileSync(assetStage+local,r.bytes);
        receipt={...entry,status:'document',format:'pdf',original:r.url,document:local,checkedAt,bytes:r.bytes.length,sha256:hash(r.bytes)};
      }else if(/html|text\/plain/.test(r.type)){
        const formatted=formatSourceHtml(r.bytes.toString('utf8'),r.url);
        if(formatted.blocked||formatted.textLength<180)throw new Error(formatted.blocked?'Publisher access page':'No substantive reading');
        if(!formatted.textPreserved)throw new Error('Text preservation needs review');
        receipt={...entry,status:'reading',original:r.url,checkedAt,bytes:r.bytes.length,sha256:hash(r.bytes),...formatted};
      }else throw new Error(`Unsupported document type: ${r.type}`);
    }catch(error){receipt={...entry,status:'review',checkedAt:new Date().toISOString(),reason:error.message};}
    fs.writeFileSync(file,JSON.stringify(receipt));done++;
    if(done%50===0)console.log(JSON.stringify({phase:'collect',done,total:entries.length}));
  }
}
await Promise.all(Array.from({length:8},worker));
const collected=entries.filter(e=>fs.existsSync(path.join(stage,e.id+'.json'))).map(e=>read(path.join(stage,e.id+'.json')));
fs.writeFileSync(path.join(stage,'review.json'),JSON.stringify({checkedAt:new Date().toISOString(),total:entries.length,collected:collected.length,needsReview:collected.filter(r=>r.status==='review').map(({id,url,title,reason,from})=>({id,url,title,reason,from}))},null,2));
if (!publish) {
  console.log(JSON.stringify({collected:collected.length,total:entries.length,stagedOnly:true}));
  process.exit(0);
}
const results=collected.filter(r=>approved.has(normalizeUrl(r.url)));
if (!results.length) throw new Error('No source republication permissions have been recorded. Collected sources remain private staging files.');
const assets=new Map(), imageFailures=[];
const images=[...new Set(results.flatMap(r=>r.images||[]))];cursor=0;done=0;
fs.mkdirSync(assetStage+'/source-images',{recursive:true});
async function imageWorker(){while(cursor<images.length){const src=images[cursor++];const local=`/source-images/${hash(src).slice(0,24)}.webp`;try{
  if(!fs.existsSync(assetStage+local)){const r=await get(src,12*1024*1024);await sharp(r.bytes,{limitInputPixels:40_000_000}).rotate().webp({quality:88}).toFile(assetStage+local);}
  assets.set(src,local);
}catch(e){imageFailures.push({src,reason:e.message});}done++;if(done%100===0)console.log(JSON.stringify({phase:'images',done,total:images.length}));}}
await Promise.all(Array.from({length:6},imageWorker));
// A page with an interactive tool needs its own content review; a text-only
// extraction cannot stand in for a working form, embedded media or a canvas.
const eligible=results.filter(r=>r.status!=='review' && !(r.interactive||[]).length && !(r.images||[]).some(src=>!assets.has(src)));
const available=new Map();
const prepared=new Map();
const unsupported=[];
for(const r of eligible){
  const permission=approved.get(normalizeUrl(r.url));
  if(!['public-domain','CC-BY-4.0','CC-BY-SA-4.0','CC-BY-SA-3.0','CC0'].includes(permission?.license) || !permission?.basis || !permission?.attribution || !permission?.evidenceUrls?.length || permission?.contentSha256!==hash(r.html||r.sha256)) throw new Error(`Source ${r.id} needs a current, specific public-domain or open-license review.`);
  const sections=r.html?readingSections(r.html):undefined;
  if(sections?.some(section=>section.html.replace(/<[^>]*>/g,' ').trim().split(/\s+/).length>5000)) { unsupported.push({id:r.id,url:r.url,reason:'Long table or list requires a dedicated reading layout; keep original link.'});continue; }
  const entry={id:r.id,anchors:sections?readingAnchors(sections):{}};
  prepared.set(r.id,{sections,entry});
  available.set(normalizeUrl(r.url),entry);available.set(normalizeUrl(r.original),entry);
}
const manifest=[];
const unavailable=new Set(read(path.join(destination,'unavailable.json')).map(normalizeUrl));
for(const r of eligible.filter(r=>prepared.has(r.id))){
  const permission=approved.get(normalizeUrl(r.url));
  if (!permission?.basis || !permission?.attribution) throw new Error(`Missing rights record for ${r.id}`);
  for (const local of [r.document,...(r.images||[]).map(src=>assets.get(src))].filter(Boolean)) {
    fs.mkdirSync(path.dirname('public'+local),{recursive:true});
    fs.copyFileSync(assetStage+local,'public'+local);
  }
  const file=path.join(destination,r.id+'.json');
  const {sections,entry}=prepared.get(r.id);
  const formatted=sections?.map(section=>({...section,html:finalizeSourceHtml(section.html,r.original,available,assets,unavailable)}));
const record={id:r.id,title:r.title,url:r.url,original:r.original,checkedAt:r.checkedAt,format:r.format||'html',document:r.document,sections:formatted,textLength:r.textLength,sha256:r.sha256,contentSha256:permission.contentSha256,textSha256:permission.textSha256,interactive:r.interactive,attribution:permission.attribution,licenseUrl:permission.licenseUrl,license:permission.license,anchors:entry.anchors};
  fs.writeFileSync(file,JSON.stringify(record));
  manifest.push({id:r.id,title:r.title,url:r.url,original:r.original,format:record.format,anchors:entry.anchors});
}
fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2));
writeSourceLinkMap();
// Import limitations and publisher access checks do not prove a link is broken.
// The unavailable list is maintained only from separately confirmed failures.
const report={checkedAt:new Date().toISOString(),total:results.length,published:manifest.length,readings:results.filter(r=>r.status==='reading').length,documents:results.filter(r=>r.status==='document').length,needsReview:results.filter(r=>r.status==='review').map(({id,url,title,reason,from})=>({id,url,title,reason,from})),imageFailures,unsupported};
fs.writeFileSync(path.join(stage,'publication-review.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({total:report.total,published:report.published,readings:report.readings,documents:report.documents,needsReview:report.needsReview.length,images:assets.size,imageFailures:imageFailures.length}));
