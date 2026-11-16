import fs from 'node:fs';
const D='https://one-people-access-culture.up.railway.app';
const ent={'&quot;':'"','&#x27;':"'",'&#39;':"'",'&amp;':'&','&lt;':'<','&gt;':'>','&nbsp;':' ','&rsquo;':'’','&ldquo;':'“','&rdquo;':'”'};
const clean=s=>String(s).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,' ').replace(/&[#a-z0-9]+;/g,m=>ent[m]??m).replace(/\{["'`]|["'`]\}/g,'').replace(/\n/g,' ').replace(/\s+/g,' ').trim();
const get=async u=>{const r=await fetch(D+u);return {s:r.status,h:await r.text()}};
let routes=['/equity-framework','/equity-review','/equity-review/structural','/growth','/leading/paths','/my-work/decision-records','/my-work/reflections','/team-kits','/learn/water-we-swim-in','/learn/water-we-swim-in/collection','/learn/clas/curriculum','/learn/clas/collection'];
for(const base of ['/leading/paths','/learn/water-we-swim-in','/learn/clas/curriculum']){const {h}=await get(base);for(const m of h.matchAll(/href="(\/(?:leading\/paths|learn\/water-we-swim-in|learn\/clas)\/[^"#?]+)"/g)) if(!routes.includes(m[1])) routes.push(m[1]);}
let text='', raw='', status=[];
for(const u of routes){const {s,h}=await get(u);status.push(u+' '+s);raw+=h;text+=' '+clean(h);}
// also the RSC payload carries client-component strings
const rawText=clean(raw.replace(/\\"/g,'"').replace(/\u0026/g,'&'));
const found=[],missing=[];
for(const f of ['eighth-framework-review','eighth-learning-route-review','eighth-team-learning-review']) for(const r of JSON.parse(fs.readFileSync('docs/editorial/'+f+'.json','utf8')).records) for(const c of r.changes){
  const a=clean(c.after).slice(0,90); (text.includes(a)||rawText.includes(a)?found:missing).push(r.file+' :: '+a.slice(0,70)); }
const out={checkedAt:new Date().toISOString(),routes:status,found:found.length,missing};
fs.writeFileSync('output/eighth-live-check.json',JSON.stringify(out,null,1)); console.log(JSON.stringify({routes:status.length,bad:status.filter(s=>!s.endsWith(' 200')),found:found.length,missing}));
