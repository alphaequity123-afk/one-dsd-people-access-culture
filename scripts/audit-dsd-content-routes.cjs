/* Read-only local HTTP crawl. No form submissions or external requests. */
const fs = require('node:fs');
const path = require('node:path');
const base = new URL(process.env.DSD_AUDIT_BASE || 'http://127.0.0.1:8770').origin;
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw new Error('This audit is limited to a local application.');
const out = process.env.DSD_AUDIT_OUT || 'evidence/dsd-full-smoke';
const buildId = fs.existsSync('.next/BUILD_ID') ? fs.readFileSync('.next/BUILD_ID', 'utf8').trim() : null;
fs.mkdirSync(out, { recursive: true });
const pages = [], queue = [], queued = new Set(), assets = new Map(), references = [], external = new Set(), skipped = new Set();
const ids = new Map();
const decode = s => s.replace(/&amp;/g, '&').replace(/&#x([a-f\d]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&quot;/g, '"').replace(/&apos;/g, "'");
function files(dir) { return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
function add(raw, source, kind = 'href') {
  if (!raw || /^(data:|mailto:|tel:|blob:|javascript:)/i.test(raw)) return;
  let url; try { url = new URL(decode(raw), base + source); } catch { return; }
  if (url.origin !== base) { external.add(url.href); return; }
  if (url.pathname === '/_next/image' && url.searchParams.has('url')) { add(url.searchParams.get('url'),source,'src'); return; }
  if (url.pathname.startsWith('/_next/') && !url.pathname.startsWith('/_next/static/')) return;
  if (/^\/(api|consultant|contribute)(\/|$)/.test(url.pathname)) { skipped.add(url.pathname + url.search); return; }
  let pathname = url.pathname.replace(/\/$/, '') || '/';
  references.push({source, target:pathname + url.search, fragment:url.hash ? decodeURIComponent(url.hash.slice(1)) : undefined, kind});
  if (kind !== 'href' || /\.(?:pdf|docx?|xlsx?|pptx?|png|jpe?g|webp|svg|ico|mp3|mp4|wav|webm|zip|txt|json|html)$/i.test(pathname)) {
    if (!assets.has(pathname)) assets.set(pathname, {route:pathname, source});
    return;
  }
  const documentRoute = url.hash ? pathname + url.search : pathname;
  if (!queued.has(documentRoute)) { queued.add(documentRoute); queue.push(documentRoute); }
}
for (const file of files('app').filter(p => /(?:^|[\\/])page\.tsx$/.test(p) && !p.includes('['))) {
  add('/' + path.dirname(file).split(path.sep).slice(1).filter(p => !p.startsWith('(')).join('/'), '/');
}
const savedInventory = path.join(out, 'published-route-inventory.json');
if (!fs.existsSync(savedInventory)) throw new Error('Generate a current published-route-inventory.json in the audit output directory first.');
for (const route of JSON.parse(fs.readFileSync(savedInventory,'utf8')).routes) add(route,'/');
const queryVariants = ['/library?q=language+access', '/library?q=meeting', '/library?q=xyznomatching99881', '/library?browse=all', '/library?type=job_aid', '/library?q=degree&area=workforce&task=design-role&browse=all', '/library?view=one_dhs', '/learn?browse=all', '/ask?q=meeting', '/share/library/ext-dhs-equity-toolkit?view=one_dhs'];
for (const route of queryVariants) if (!queued.has(route)) { queued.add(route); queue.push(route); }
const progress = () => fs.writeFileSync(path.join(out,'crawl-progress.json'),JSON.stringify({completed:pages.length,discovered:queue.length,failures:pages.filter(p=>!p.ok),assets:assets.size},null,2));
let cursor=0, active=0;
async function document(route, visited=[]) {
  if(visited.includes(route) || visited.length>5) throw new Error('Redirect loop: '+[...visited,route].join(' -> '));
  const response=await fetch(base+route,{signal:AbortSignal.timeout(180000),redirect:'manual'});
  if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
    const target = new URL(response.headers.get('location'), base + route);
    await response.body?.cancel();
    if (target.origin !== base) throw new Error('Unexpected external redirect: ' + target.href);
    const result = await document(target.pathname + target.search, [...visited, route]);
    return {...result, redirects:[route,...(result.redirects || [])]};
  }
  const html=await response.text();
  const digests=[...html.matchAll(/:E\{\\?"digest\\?":\\?"([^"\\]*)/g)].map(m=>m[1]);
  const streamRedirect=digests.find(digest=>digest.startsWith('NEXT_REDIRECT;'))?.split(';')[2];
  if(streamRedirect) {
    const target=new URL(streamRedirect,base+route);
    if(target.origin!==base) throw new Error('Unexpected external redirect: '+target.href);
    const result=await document(target.pathname+target.search, [...visited,route]);
    return {...result,redirects:[route,...(result.redirects||[])]};
  }
  return {response,html,digests,redirects:[]};
}
async function one(route) {
  const started=Date.now();
  try {
    const {response,html,digests,redirects}=await document(route);
    const ok=response.ok && !html.includes('id="__next_error__"') && !html.includes('NEXT_HTTP_ERROR_FALLBACK;404') && !digests.length;
    const row={route,status:response.status,ok,ms:Date.now()-started,final:new URL(response.url).pathname,redirects,title:decode(html.match(/<title>(.*?)<\/title>/s)?.[1] || ''),bytes:html.length};
    pages.push(row);
    if (!ok) console.log('FAIL '+JSON.stringify(row));
    if (ok && /text\/html/.test(response.headers.get('content-type') || '')) {
      ids.set(route,new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>decode(m[1]))));
      for (const m of html.matchAll(/<(?:a)\b[^>]*\bhref="([^"]*)"/g)) add(m[1],route);
      for (const m of html.matchAll(/<(?:img|audio|video|source|script)\b[^>]*\bsrc="([^"]+)"/g)) add(m[1],route,'src');
      for (const m of html.matchAll(/<link\b[^>]*>/g)) if (/\brel="(?:stylesheet|preload|modulepreload|icon)"/.test(m[0])) {
        const href=m[0].match(/\bhref="([^"]+)"/)?.[1]; if(href) add(href,route,'dependency');
      }
      for (const m of html.matchAll(/<video\b[^>]*\bposter="([^"]+)"/g)) add(m[1],route,'poster');
    }
  } catch(error) { const row={route,ok:false,error:String(error),cause:String(error.cause || ''),ms:Date.now()-started}; pages.push(row);console.log('FAIL '+JSON.stringify(row)); }
  if (pages.length%10===0) { progress();console.log(`Pages ${pages.length}/${queue.length}; assets ${assets.size}`); }
}
async function worker() {
  while(true) {
    if(cursor>=queue.length) { if(active===0) return; await new Promise(r=>setTimeout(r,50));continue; }
    const route=queue[cursor++];active++;await one(route);active--;
  }
}
async function main() {
  console.log(`Starting content crawl with ${queue.length} concrete routes.`);
  await Promise.all([worker(),worker()]);
  const localAsset = route => route.startsWith('/_next/static/') ? path.resolve('.next/static', '.' + decodeURIComponent(route.slice('/_next/static'.length))) : path.resolve('public', '.' + decodeURIComponent(route));
  // Stylesheets can reference fonts and background images that are absent from page markup.
  for (const asset of assets.values()) if (/\.css$/i.test(asset.route)) {
    const local = localAsset(asset.route);
    if (fs.existsSync(local)) for (const match of fs.readFileSync(local,'utf8').matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) add(match[1], asset.route, 'css-dependency');
  }
  const assetResults=[];const assetQueue=[...assets.values()];let ai=0;
  await Promise.all([0,1,2].map(async()=>{while(ai<assetQueue.length){const asset=assetQueue[ai++];try{const r=await fetch(base+asset.route,{method:'HEAD',signal:AbortSignal.timeout(60000),redirect:'manual'});const file=localAsset(asset.route);const sourceBytes=fs.existsSync(file)?fs.statSync(file).size:0;assetResults.push({...asset,status:r.status,ok:r.ok&&sourceBytes>0&&(!/text\/html/.test(r.headers.get('content-type')||'')||/\.html$/i.test(asset.route)),sourceBytes,bytes:r.headers.get('content-length'),type:r.headers.get('content-type')});}catch(e){assetResults.push({...asset,ok:false,error:String(e)});}}}));
  const missingFragments = [...new Map(references.filter(r=>r.fragment && !r.fragment.startsWith(':~:') && ids.has(r.target) && !ids.get(r.target).has(r.fragment)).map(r=>[r.target+'#'+r.fragment,r])).values()];
  const negativeRoutes=['/program/not-a-stage','/courses/not-a-course','/courses/dhs-equity-analysis-toolkit/not-a-lesson','/share/courses/not-a-course','/share/courses/dhs-equity-analysis-toolkit/not-a-lesson','/library/not-a-resource','/resources/not-a-resource','/share/library/not-a-resource','/minnesota-communities/not-a-community','/podcasts/not-a-podcast','/journeys/not-a-journey','/practice/not-a-path','/toolkit-studio/not-a-card','/one-dsd/programs/not-a-program','/one-dsd/scenarios/not-a-scenario','/areas/not-an-area','/areas/work/not-an-area','/domains/not-a-domain','/learn/not-a-stage','/practice-guides/not-a-guide'];
  const negativeResults=[];
  for(const route of negativeRoutes) { try { const {response,html}=await document(route);const streamed404=html.includes('NEXT_HTTP_ERROR_FALLBACK;404')&&html.includes('We could not find that page')&&/<meta[^>]*name="robots"[^>]*content="noindex"/.test(html);negativeResults.push({route,status:response.status,streamed404,ok:response.status===404||streamed404}); } catch(e) { negativeResults.push({route,ok:false,error:String(e)}); } }
  const endingBuildId=fs.existsSync('.next/BUILD_ID')?fs.readFileSync('.next/BUILD_ID','utf8').trim():null;
  const result={base,buildId,endingBuildId,buildUnchanged:buildId===endingBuildId,completedAt:new Date().toISOString(),scope:'All concrete staff page routes plus current published inventory and recursively discovered local links, with explicit query variants. Includes local page assets and referenced Next.js JS/CSS/font files. External destinations inventoried without requests; APIs and owner/contributor workflows checked separately.',queryVariants,pageCount:pages.length,pageFailures:pages.filter(p=>!p.ok),assetCount:assetResults.length,assetFailures:assetResults.filter(a=>!a.ok),negativeResults,missingFragments,skipped:[...skipped].sort(),externalReferences:[...external].sort(),pages:pages.sort((a,b)=>a.route.localeCompare(b.route)),assets:assetResults.sort((a,b)=>a.route.localeCompare(b.route))};
  fs.writeFileSync(path.join(out,'content-routes.json'),JSON.stringify(result,null,2));
  progress();
  console.log(JSON.stringify({pages:result.pageCount,failures:result.pageFailures,assets:result.assetCount,assetFailures:result.assetFailures,missingFragments:result.missingFragments.length,negativeFailures:negativeResults.filter(r=>!r.ok),externalReferences:external.size}));
  process.exitCode=!result.buildUnchanged||result.pageFailures.length||result.assetFailures.length||missingFragments.length||negativeResults.some(r=>!r.ok)?1:0;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
