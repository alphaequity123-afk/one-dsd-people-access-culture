import { parseDocument } from 'htmlparser2';
import { findAll, textContent, getOuterHTML, removeElement } from 'domutils';
import sanitizeHtml from 'sanitize-html';

export function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || u.port) return null;
    u.hash = '';
    return u.href.replace(/\/$/, '');
  } catch { return null; }
}

const tags = ['p','br','div','section','article','h1','h2','h3','h4','h5','h6','ul','ol','li','dl','dt','dd','blockquote','q','cite','strong','b','em','i','small','sup','sub','abbr','mark','del','ins','pre','code','kbd','samp','hr','a','img','figure','figcaption','table','caption','thead','tbody','tfoot','tr','th','td','colgroup','col','details','summary','span','time'];
const textOf = html => sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
export const sourceReadingText = html => textContent(parseDocument(html)).replace(/\s+/g,' ').trim();
const isNode = node => node && node.type === 'tag';
const chrome = /(?:^|[\s_-])(?:cookie[-_ ]?(?:consent|banner)|onetrust|ot-sdk|breadcrumb|breadcrumbs|social[-_]?share|share[-_]?tools|site[-_]?nav|site[-_]?header|site[-_]?footer|global[-_]?header|global[-_]?footer|skip[-_]?link|menu[-_]?toggle)(?:$|[\s_-])/i;

/** Keep the whole main body, including closed disclosures; never use an excerpt algorithm. */
export function formatSourceHtml(html, url) {
  const document = parseDocument(html);
  const all = predicate => findAll(predicate, document.children);
  const title = textContent(all(e => e.name === 'title')[0] || {children: []}).trim();
  const mains = all(e => e.name === 'main' || e.attribs?.role === 'main');
  // Prefer an outer main so nested landmarks cannot duplicate content.
  const main = mains.find(e => !mains.some(other => other !== e && ancestors(e).includes(other)));
  const body = main || all(e => e.name === 'body')[0] || document;
  // The ADA publisher's in-page search is an interface, not source content.
  for (const node of findAll(e => e.name === 'div' && e.children.some(child => child.type === 'text' && child.data.trim() === 'Search this page') && findAll(child => child.attribs?.id === 'clear', e.children).length > 0, body.children)) removeElement(node);
  for (const node of findAll(e => ['script','style','noscript','template','nav','devsite-feedback','devsite-actions'].includes(e.name) || e.attribs?.role === 'navigation' || chrome.test([e.attribs?.id,e.attribs?.class].join(' ')) || e.attribs?.id === 'crt-page--sidenav' || (e.name==='a' && ['#print','#share'].includes(e.attribs?.href) && /^(print(?: this page)?|share)$/i.test(textContent(e).trim())), body.children)) removeElement(node);
  // Site headers/footers are removed only when outside an identified main; article attribution remains.
  if (!main) for (const node of findAll(e => (e.name === 'header' || e.name === 'footer') && !ancestors(e).some(a => a.name === 'article'), body.children)) removeElement(node);
  const interactive = findAll(e => ['form','iframe','video','audio','canvas'].includes(e.name), body.children).map(e => ({tag:e.name, src:e.attribs.src || e.attribs.action || ''}));
  // Publisher controls cannot work after extraction. Keep source text, but not
  // print, feedback, or bookmark buttons. Forms remain flagged for original use.
  for (const node of findAll(e => ['button','input'].includes(e.name) || e.name === 'devsite-bookmark', body.children)) removeElement(node);
  for (const node of findAll(e => ['form','iframe','canvas'].includes(e.name), body.children)) {
    // Retain any instructions, but never publish a dead form or execute the publisher's code.
    if (node.name === 'form') {
      for (const input of findAll(e => ['input','button','select','textarea'].includes(e.name), node.children)) removeElement(input);
    } else removeElement(node);
  }
  const raw = getOuterHTML(body);
  const before = textOf(raw);
  const absolute = value => {
    try { const u = new URL(value, url); return ['http:','https:','mailto:','tel:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
  };
  const clean = sanitizeHtml(raw, {
    allowedTags: tags,
    allowedAttributes: { '*': ['id','lang','dir'], a:['href','title'], img:['src','alt','title','width','height'], th:['scope','colspan','rowspan','headers'], td:['colspan','rowspan','headers'], ol:['start','reversed','type'], li:['value'], abbr:['title'], time:['datetime'], details:['open'], col:['span'] },
    allowedSchemes: ['http','https','mailto','tel'], allowProtocolRelative: false,
    transformTags: {
      a: (_, attribs) => ({tagName:attribs.href ? 'a' : 'span',attribs:{...attribs,id:attribs.id || attribs.name,href:attribs.href ? (attribs.href.startsWith('#') ? attribs.href : absolute(attribs.href)) : undefined}}),
      img: (_, attribs) => ({tagName:'img',attribs:{...attribs,src:absolute(attribs['data-src'] || attribs['data-original'] || attribs.src || ''),alt:attribs.alt || ''}}),
      h1: (_, attribs) => ({tagName:'h2',attribs}),
    },
  });
  const after = textOf(clean);
  const blocked = /^(?:Access Denied|Just a moment|Attention Required|Robot or human|Page Not Found|404|Service Unavailable)|captcha|verify you are human|checking your browser/i.test(title) || (after.length < 2500 && /access denied|verify you are human|enable javascript and cookies to continue|the page (?:you|that you).*?(?:not|can't|could not).*?found|page (?:has been moved or |could )?not (?:be )?found|requested (?:url|page) (?:was )?not found/i.test(after));
  const readingTitle=textContent(findAll(e=>e.name==='h1',body.children)[0]||{children:[]}).replace(/\s+/g,' ').trim();
  return { title:readingTitle||title, html: clean, textLength: after.length, sourceTextLength: before.length, textPreserved: before === after, hasMain: !!main, interactive, blocked, images: findAll(e => e.name === 'img', parseDocument(clean).children).map(e => e.attribs.src).filter(Boolean) };
}
function ancestors(node) { const result=[]; for (let p=node.parent;p;p=p.parent) result.push(p); return result; }

/** Local navigation replaces approved readings; other source links retain their original destinations. */
export function sourceReadingLink(entry, hash = '') {
  const id = typeof entry === 'string' ? entry : entry.id;
  let anchor = hash.replace(/^#/, '');
  try { anchor = decodeURIComponent(anchor); } catch { /* Keep a malformed publisher fragment literal. */ }
  const part = typeof entry === 'object' ? entry.anchors?.[anchor] : undefined;
  return `/source-reading/${id}${part ? `?section=${part}` : ''}${hash}`;
}
function hasReadingAnchor(entry, hash) {
  if(!hash || typeof entry==='string')return true;
  let anchor=hash.slice(1);try{anchor=decodeURIComponent(anchor);}catch{ /* Literal fragment. */ }
  return Object.hasOwn(entry.anchors||{},anchor);
}

export function finalizeSourceHtml(html, sourceUrl, available, assets, unavailable = new Set()) {
  return sanitizeHtml(html, {
    allowedTags: tags,
    allowedAttributes: { '*':['id','lang','dir'], a:['href','title'], img:['src','alt','title','width','height','loading','decoding'], th:['scope','colspan','rowspan','headers'], td:['colspan','rowspan','headers'], ol:['start','reversed','type'], li:['value'], abbr:['title'], time:['datetime'], details:['open'], col:['span'] },
    allowedSchemes:['http','https','mailto','tel'], allowProtocolRelative:false,
    transformTags: {
      a: (_, attributes) => {
        const href = attributes.href || '';
        if (/^(mailto|tel):/.test(href)) return {tagName:'a',attribs:attributes};
        if (href.startsWith('#')) {
          const own = available.get(normalizeUrl(sourceUrl));
          return {tagName:'a',attribs:{...attributes,href:own && hasReadingAnchor(own,href) ? sourceReadingLink(own,href) : new URL(href,sourceUrl).href}};
        }
        if (unavailable.has(normalizeUrl(href))) return {tagName:'span',attribs:{}};
        const entry = available.get(normalizeUrl(href));
        if (entry) return {tagName:'a',attribs:{...attributes,href:hasReadingAnchor(entry,new URL(href).hash) ? sourceReadingLink(entry,new URL(href).hash) : href}};
        if (normalizeUrl(href) === normalizeUrl(sourceUrl) && new URL(href).hash) return {tagName:'a',attribs:{...attributes,href:new URL(href).hash}};
        return {tagName:'a',attribs:attributes};
      },
      img: (_, attributes) => {
        const local = assets.get(attributes.src);
        return local ? {tagName:'img',attribs:{...attributes,src:local,loading:'lazy',decoding:'async'}} : {tagName:'span',attribs:{},text:attributes.alt || ''};
      },
    },
  });
}

export function readingSections(html) {
  const dom = parseDocument(html);
  const blocks=[];
  function visit(nodes){for(const node of nodes){
    if(isNode(node)&&['div','section','article'].includes(node.name) && findAll(child=>['div','section','article','p','h1','h2','h3','h4','h5','h6','ul','ol','dl','table','blockquote','details'].includes(child.name),node.children).length) {
      // An outer publisher ID must not force an entire book into one page.
      // Preserve its anchor while letting the contained topics flow separately.
      if(node.attribs.id) blocks.push(parseDocument(`<span id="${node.attribs.id.replaceAll('&','&amp;').replaceAll('"','&quot;')}"></span>`).children[0]);
      visit(node.children);
    } else blocks.push(node);
  }}
  visit(dom.children);
  const sections=[];let current=[];let words=0;let label='Reading';
  const flush=()=>{if(current.some(n=>textContent(n).trim()||n.name==='img'))sections.push({title:label,html:current.map(n=>getOuterHTML(n)).join('')});current=[];words=0;};
  for(const node of blocks){
    const heading=isNode(node)&&/^h[2-4]$/.test(node.name);
    const count=textContent(node).trim().split(/\s+/).length;
    if(current.length&&((heading&&words>180)||(words>1000&&count>15))) {
      let end=current.length;
      while(end>0&&!textContent(current[end-1]).trim()&&current[end-1].name!=='img')end--;
      const pending=current.splice(end);flush();current=pending;
    }
    if(!words)label=heading?textContent(node).trim():(sections.length?'Continued':'Reading');
    current.push(node);words+=count;
  }
  flush();
  return sections.map((s,i)=>({...s,id:String(i+1)}));
}

export function readingAnchors(sections) {
  const anchors={};
  for(const [index, section] of sections.entries()) {
    for(const node of findAll(e=>!!e.attribs?.id,parseDocument(section.html).children)) {
      if(!Object.hasOwn(anchors,node.attribs.id)) Object.defineProperty(anchors,node.attribs.id,{value:index+1,enumerable:true});
    }
  }
  return anchors;
}
