import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'htmlparser2';
import { findAll, textContent, getOuterHTML } from 'domutils';

const base = process.env.REVIEW_BASE || 'http://127.0.0.1:8900';
const out = process.env.REVIEW_OUT || '.data/full-refactor';
fs.mkdirSync(out, { recursive: true });
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const queue = [], seen = new Set(), pages = [], external = new Map(), skipped = new Set();
function add(raw, from = '/home') {
  let url;
  try { url = new URL(raw, base + from); } catch { return; }
  if (!/^https?:$/.test(url.protocol)) return;
  url.hash = '';
  if (url.origin !== new URL(base).origin) return;
  if (/^\/(?:api|_next|consultant|contribute)(?:\/|$)/.test(url.pathname)) { skipped.add(url.pathname); return; }
  if (/\.[a-z0-9]{2,5}$/i.test(url.pathname) && !/\.html$/i.test(url.pathname)) return;
  for (const key of ['view', 'step', 'topic', 'page', 'part', 'browse', 'type', 'group', 'section']) {
    const value = url.searchParams.get(key);
    if (key === 'page' && (!/^\d+$/.test(value || '') || Number(value) > 300)) url.searchParams.delete(key);
  }
  for (const key of [...url.searchParams.keys()]) if (!['view', 'step', 'topic', 'page', 'part', 'browse', 'type', 'group', 'section'].includes(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  const route = url.pathname + url.search;
  if (!seen.has(route)) { seen.add(route); queue.push(route); }
}
for (const file of walk('app').filter(f => /[\\/]page\.tsx$/.test(f) && !f.includes('['))) add('/' + path.dirname(file).split(path.sep).slice(1).filter(x => !x.startsWith('(')).join('/'));
for (const file of walk('public').filter(f => f.endsWith('.html'))) add('/' + path.relative('public', file).split(path.sep).join('/'));
for (const route of ['/library?browse=all', '/courses', '/learn/self-directed', '/learn/sources', '/minnesota-agencies?view=partners']) add(route);
let cursor = 0, active = 0;
function save() {
  fs.writeFileSync(path.join(out, 'page-census.json'), JSON.stringify({ base, checkedAt: new Date().toISOString(), discovered: queue.length, checked: pages.length, skipped: [...skipped], pages, external: [...external.values()] }, null, 2));
}
async function worker() {
  while (true) {
    if (cursor >= queue.length) { if (!active) return; await new Promise(r => setTimeout(r, 100)); continue; }
    const route = queue[cursor++]; active++;
    try {
      let response = await fetch(base + route, { signal: AbortSignal.timeout(90000), redirect: 'manual' });
      let redirects = 0;
      while (response.status >= 300 && response.status < 400 && response.headers.get('location') && redirects++ < 6) {
        const target = new URL(response.headers.get('location'), response.url);
        if (target.origin !== new URL(base).origin) break;
        await response.body?.cancel();
        response = await fetch(target, { signal: AbortSignal.timeout(90000), redirect: 'manual' });
      }
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        const target = new URL(response.headers.get('location'), response.url);
        pages.push({ route, status: response.status, externalRedirect: target.origin !== new URL(base).origin ? target.href : undefined, failed: target.origin === new URL(base).origin });
        await response.body?.cancel();
        active--;
        continue;
      }
      const html = await response.text();
      const dom = parseDocument(html);
      const main = findAll(e => e.name === 'main', dom.children)[0] || dom;
      const anchors = findAll(e => e.name === 'a' && !!e.attribs.href, main.children);
      for (const a of anchors) {
        let url;
        try { url = new URL(a.attribs.href, base + route); } catch { continue; }
        if (!/^https?:$/.test(url.protocol)) continue;
        if (url.origin === new URL(base).origin) add(url.href, route);
        else {
          url.hash = '';
          const key = url.href;
          const entry = external.get(key) || { url: key, titles: [], pages: [] };
          const title = textContent(a).replace(/\s+/g, ' ').trim();
          if (title && !entry.titles.includes(title)) entry.titles.push(title);
          if (!entry.pages.includes(route)) entry.pages.push(route);
          external.set(key, entry);
        }
      }
      const headings = findAll(e => /^h[1-6]$/.test(e.name), main.children).map(e => ({ level: e.name, title: textContent(e).trim() }));
      const text = textContent(parseDocument(getOuterHTML(main).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ''))).replace(/\s+/g, ' ').trim();
      const failed = /NEXT_HTTP_ERROR_FALLBACK;404|id="__next_error__"/.test(html);
      pages.push({ route, status: response.status, failed, final: new URL(response.url).pathname, words: text.split(/\s+/).length, heading: headings.find(h => h.level === 'h1')?.title, headings, externalLinks: anchors.filter(a => /^https?:/.test(a.attribs.href)).length });
    } catch (error) { pages.push({ route, error: error.message }); }
    active--;
    if (pages.length % 100 === 0) { save(); console.log(JSON.stringify({ checked: pages.length, discovered: queue.length, external: external.size })); }
  }
}
await Promise.all(Array.from({ length: Number(process.env.REVIEW_CONCURRENCY || 3) }, worker));
save();
console.log(JSON.stringify({ checked: pages.length, discovered: queue.length, external: external.size, errors: pages.filter(p => p.error || p.status >= 400 || p.failed).map(({ route, status, error }) => ({ route, status, error })) }));
