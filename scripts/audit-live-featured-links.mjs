/** Read-only HTTP audit of published pages, links and media. No browser automation or AI calls. */
import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { parseDocument } from 'htmlparser2';

const base = new URL(process.env.DSD_AUDIT_BASE || 'https://one-people-access-culture.up.railway.app').origin;
const out = process.env.DSD_AUDIT_OUT || '.data/source-coverage-completion/featured-links';
const baseline = JSON.parse(fs.readFileSync('.data/full-refactor/licensed-census/page-census.json', 'utf8'));
const concurrency = Math.max(1, Math.min(4, Number(process.env.DSD_AUDIT_CONCURRENCY || 4)));
const replayOnly = process.env.DSD_AUDIT_REPLAY_ONLY === '1';
fs.mkdirSync(out, { recursive: true });
const receipts = path.join(out, 'pages.jsonl');
const queue = [], queued = new Set(), completed = new Set(), pages = [];
const external = new Map(), assets = new Map(), downloads = new Map(), excluded = new Set();
const fragments = new Map(), anchors = new Map();
const filePath = /\.(?:pdf|docx?|xlsx?|pptx?|png|jpe?g|webp|svg|ico|mp3|mp4|wav|webm|zip|txt|json|vtt|srt|ics|csv|woff2?|ttf)$/i;
const hostAliases = new Set([new URL(base).hostname, 'one-dsd-people-access-culture-production-2454.up.railway.app', 'one-dsd-people-access-culture-production.up.railway.app']);
let cursor = 0, active = 0;
const text = node => !node ? '' : node.type === 'text' ? node.data : ['script', 'style', 'template'].includes(node.name) ? '' : (node.children || []).map(text).join(' ');
const compact = value => String(value || '').replace(/\s+/g, ' ').trim();
const nodes = (node, predicate, result = []) => { if (predicate(node)) result.push(node); if (!['script', 'style', 'template'].includes(node.name)) for (const child of node.children || []) nodes(child, predicate, result); return result; };
const isTag = node => node.type === 'tag';
const serialize = map => [...map.values()].map(row => ({...row, pages: [...row.pages].sort()})).sort((a,b) => a.url.localeCompare(b.url));

function note(map, url, source, label, kind) {
  let row = map.get(url);
  if (!row) { row = {url, titles: [], kinds: [], pages: new Set()}; map.set(url, row); }
  if (label && !row.titles.includes(label) && row.titles.length < 10) row.titles.push(label);
  if (kind && !row.kinds.includes(kind)) row.kinds.push(kind);
  row.pages.add(source);
}
function add(raw, source, label = '', kind = 'link', documentRoute = source) {
  if (!raw || /^(?:mailto:|tel:|data:|blob:|javascript:)/i.test(raw)) return;
  let url; try { url = new URL(raw, base + documentRoute); } catch { return; }
  if (!['https:', 'http:'].includes(url.protocol)) return;
  if (!hostAliases.has(url.hostname)) { note(external, url.href, source, label, kind); return; }
  url.host = new URL(base).host; url.protocol = new URL(base).protocol;
  if (url.pathname === '/_next/image') return add(url.searchParams.get('url'), source, label, 'image');
  if (url.pathname.startsWith('/_next/')) return;
  for (const key of [...url.searchParams.keys()]) if (/^(?:utm_|fbclid|gclid)/.test(key)) url.searchParams.delete(key);
  // These three values carry a return path, not different resource content.
  if (/^\/(?:library|resources|practice|paths)\/.+/.test(url.pathname)) for (const key of ['originArea','area','task']) url.searchParams.delete(key);
  const route = url.pathname + url.search;
  if (url.hash && !url.hash.startsWith('#:~:')) {
    let hash; try { hash = decodeURIComponent(url.hash.slice(1)); } catch { hash = url.hash.slice(1); }
    fragments.set(route + '#' + hash, {source, route, hash, label});
  }
  if (/^\/api\/downloads\//.test(url.pathname)) { note(downloads, base + route, source, label, kind); return; }
  if (/^\/api\/media\//.test(url.pathname)) { note(assets, base + route, source, label, kind); return; }
  if (/^\/(?:api|consultant|contribute)(?:\/|$)/.test(url.pathname)) { excluded.add(route); return; }
  if (filePath.test(url.pathname) || !['link', 'seed'].includes(kind)) {
    note(assets, base + route, source, label, kind); return;
  }
  // Calendar navigation is unbounded; inspect dates linked by other pages, not endlessly following previous/next months.
  if (url.pathname === '/minnesota-communities/calendar' && source.startsWith('/minnesota-communities/calendar') && url.search) return;
  // Verify real catalog entry links and pagination without multiplying every combination of the same filters.
  const sourceUrl = new URL(documentRoute, base);
  if (url.pathname === '/library' && sourceUrl.pathname === '/library' && ['area','task','type','authority','q'].some(key=>sourceUrl.searchParams.has(key))) {
    const filterKey = value => { const copy=new URL(value);copy.searchParams.delete('page');copy.searchParams.delete('originArea');copy.searchParams.sort();return copy.search; };
    if (filterKey(url)!==filterKey(sourceUrl)) { excluded.add('catalog-filter-permutation:'+route); return; }
  }
  if (!queued.has(route)) { queued.add(route); queue.push(route); }
}
function absorb(row) {
  // A resumed audit classifies caption/calendar files by format, rather than expecting an HTML title.
  if (filePath.test(new URL(row.route, base).pathname)) { add(row.route, '/', '', 'link'); return; }
  completed.add(row.route); pages.push({...row, links: undefined, ids: undefined});
  if (row.ids) anchors.set(row.route, new Set(row.ids));
  for (const link of row.links || []) add(link.href, row.route, link.label, link.kind, row.final ?? row.route);
}
function progress() {
  const summary = {base, checkedAt: new Date().toISOString(), checked: pages.length, discovered: queue.length, failures: pages.filter(p => !p.ok), review: pages.filter(p => p.flags?.length), assets: assets.size, downloads: downloads.size, external: external.size, excluded: [...excluded].sort()};
  fs.writeFileSync(path.join(out, 'progress.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(out, 'external-links.json'), JSON.stringify(serialize(external), null, 2));
  fs.writeFileSync(path.join(out, 'asset-links.json'), JSON.stringify(serialize(assets), null, 2));
  fs.writeFileSync(path.join(out, 'download-links.json'), JSON.stringify(serialize(downloads), null, 2));
  return summary;
}
async function fetchPage(route, trail = []) {
  if (trail.length > 6 || trail.includes(route)) throw new Error('Redirect loop: ' + trail.join(' -> '));
  const response = await fetch(base + route, {redirect: 'manual', signal: AbortSignal.timeout(45000), headers: {'User-Agent': 'OneDSD-Owner-Link-Audit/1.0'}});
  if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
    const target = new URL(response.headers.get('location'), base + route); await response.body?.cancel();
    if (!hostAliases.has(target.hostname)) return {status: response.status, redirectExternal: target.href, html: '', type: ''};
    return fetchPage(target.pathname + target.search, [...trail, route]);
  }
  const type = response.headers.get('content-type') || '';
  const html = await response.text();
  const digest = [...html.matchAll(/:E\{\\?"digest\\?":\\?"([^"\\]*)/g)].map(match => match[1]);
  const stream = digest.find(value => value.startsWith('NEXT_REDIRECT;'))?.split(';')[2];
  if (stream) {
    const target = new URL(stream, base + route);
    if (!hostAliases.has(target.hostname)) return {status: 307, redirectExternal: target.href, html: '', type};
    return fetchPage(target.pathname + target.search, [...trail, route]);
  }
  return {status: response.status, html, type, final: route, digest};
}
async function one(route) {
  const started = Date.now(); let row;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await fetchPage(route);
      if ((result.status === 429 || result.status >= 500) && !attempt) { await new Promise(resolve => setTimeout(resolve, 1200)); continue; }
      if (result.redirectExternal) { row = {route, status: result.status, ok: true, kind: 'external-redirect', redirectExternal: result.redirectExternal, links: [{href: result.redirectExternal, label: '', kind: 'link'}]}; break; }
      const doc = parseDocument(result.html), tags = nodes(doc, isTag);
      const main = tags.find(n => n.name === 'main') || tags.find(n => n.name === 'body') || doc;
      const body = compact(text(main)), title = compact(text(tags.find(n => n.name === 'title')));
      const heading = compact(text(tags.find(n => n.name === 'h1')));
      const words = body.split(/\s+/).filter(Boolean).length;
      const links = [];
      for (const n of tags) {
        const a = n.attribs || {};
        if (n.name === 'a' && a.href) links.push({href: a.href, label: compact(text(n)).slice(0,200), kind: 'link'});
        if (['img','audio','video','source','track','iframe'].includes(n.name) && a.src) links.push({href:a.src,label:a.alt || a.title || '',kind:n.name});
        if (n.name === 'video' && a.poster) links.push({href:a.poster,label:'',kind:'poster'});
      }
      const flags = [];
      if (words < 25 && !tags.some(n => ['input','textarea','audio','video','iframe'].includes(n.name))) flags.push('short-content');
      if (/\b(?:this|the) (?:resource|reading|page|content|collection) (?:is |was |is currently )?(?:unavailable|not available)|content (?:could not|couldn't) be loaded/i.test(body)) flags.push('unavailable-message');
      const ok = result.status >= 200 && result.status < 300 && /text\/html/.test(result.type) && !result.digest?.length && !result.html.includes('id="__next_error__"') && !result.html.includes('NEXT_HTTP_ERROR_FALLBACK;404') && !/^(?:404|page not found|application error)/i.test(title);
      row = {route,status:result.status,ok,final:result.final,title,heading,words,flags,bytes:result.html.length,ids:tags.flatMap(n=>n.attribs?.id ? [n.attribs.id] : []),links};
      if (!ok || flags.length) { const key = Buffer.from(route).toString('base64url').slice(0,180); fs.writeFileSync(path.join(out, key + '.html'), result.html); }
      break;
    } catch(error) { row = {route,ok:false,error:String(error),cause:String(error.cause || '')}; if (!attempt) { await new Promise(resolve=>setTimeout(resolve,1200)); continue; } }
  }
  row.checkedAt = new Date().toISOString(); row.ms = Date.now() - started;
  fs.appendFileSync(receipts, JSON.stringify(row) + '\n'); absorb(row);
  if (!row.ok) console.log('FAIL ' + JSON.stringify({...row,links:undefined,ids:undefined}));
  if (pages.length % 100 === 0) { const p = progress(); console.log(JSON.stringify({checked:p.checked,discovered:p.discovered,failures:p.failures.length,external:p.external,assets:p.assets,downloads:p.downloads})); }
}
for (const route of ['/home','/learn','/library?browse=all','/practice','/minnesota-communities','/understanding-dhs','/minnesota-agencies','/site-map']) add(route,'/','', 'seed');
for (const row of baseline.pages) add(row.route, '/','', 'seed');
if (fs.existsSync(receipts)) for await (const line of createInterface({input:fs.createReadStream(receipts),crlfDelay:Infinity})) if (line) absorb(JSON.parse(line));
if (!replayOnly) await Promise.all(Array.from({length:concurrency},async()=>{while(true){
  if(cursor>=queue.length){if(!active)return;await new Promise(resolve=>setTimeout(resolve,100));continue;}
  const route=queue[cursor++];if(completed.has(route))continue;active++;await one(route);active--;await new Promise(resolve=>setTimeout(resolve,100));
}}));
const summary = progress();
const pendingStates = queue.filter(route=>!completed.has(route));
const missingFragments = [...fragments.values()].filter(r=>anchors.has(r.route) && !anchors.get(r.route).has(r.hash));
fs.writeFileSync(path.join(out,'missing-fragments.json'),JSON.stringify(missingFragments,null,2));
fs.writeFileSync(path.join(out,'page-results.json'),JSON.stringify({...summary,pages,missingFragments:missingFragments.length,replayOnly,pendingStates},null,2));
console.log(JSON.stringify({complete:!pendingStates.length,checked:pages.length,failures:summary.failures.length,review:summary.review.length,external:external.size,assets:assets.size,downloads:downloads.size,missingFragments:missingFragments.length,pendingStates:pendingStates.length,replayOnly}));
