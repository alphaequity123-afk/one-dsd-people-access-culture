import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { writeSourceLinkMap } from './source-link-map.mjs';
writeSourceLinkMap();
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const links=[['Start','/start'],['Learn','/learn'],['Practice','/practice'],['Support','/support'],['One DSD','/one-dsd'],['Cultural Intelligence','/learn/cultural-intelligence'],['My work','/my-work'],['Leadership','/leading']];
const header=`<header class="dsd-header" data-pilot-header="true"><div class="dsd-shell dsd-brand-row"><a href="/home" class="dsd-brand" aria-label="One DSD People, Access and Culture home"><img src="/images/dhs-logo.png" width="319" height="68" alt="Minnesota Department of Human Services"><span><strong>One DSD</strong><span>People, Access and Culture</span></span></a><div class="dsd-utilities"><button type="button" class="dsd-tool-button" data-tool="ask" aria-controls="dsd-ask-panel" aria-expanded="false">Ask</button><button type="button" class="dsd-tool-button" data-tool="search" aria-controls="dsd-search-panel" aria-expanded="false">Search</button><button type="button" id="dsd-menu" aria-controls="dsd-navigation" aria-expanded="false" class="dsd-menu">Menu</button></div></div><nav id="dsd-navigation" aria-label="Program" class="dsd-nav"><div class="dsd-shell">${links.map(([title,href])=>`<a href="${href}">${title}</a>`).join('')}</div></nav>${['ask','search'].map(tool=>`<section id="dsd-${tool}-panel" class="dsd-tool-panel" data-tool-panel="${tool}" aria-label="${tool==='ask'?'Ask':'Search'}" hidden><div class="dsd-shell"><div class="dsd-tool-heading"><h2>${tool==='ask'?'Ask':'Search'}</h2><button type="button" data-close-tool>Close</button></div><div class="standalone-frame"></div></div></section>`).join('')}</header>`;
const overrideFile='config/standalone-public-overrides/index.json';
const override=JSON.parse(fs.readFileSync(overrideFile));
const releaseFile='config/railway-release-assets.json';
const release=JSON.parse(fs.readFileSync(releaseFile));
let count=0;
for(const file of walk('public').filter(f=>f.endsWith('.html'))){
 let html=fs.readFileSync(file,'utf8');
 if(!html.includes('data-page-purpose='))continue;
 html=html.replace(/<header\b[^>]*class="dsd-header"[^>]*>[\s\S]*?<\/header>/,header);
 if(!html.includes('data-pilot-header="true"'))html=html.replace(/<body\b[^>]*>/,m=>m+header);
 html=html.replace(/<script\b[^>]*id="one-dhs-program-menu"[^>]*>[\s\S]*?<\/script>/g,'');
 if(!html.includes('src="/standalone-shell.js"'))html=html.replace('</body>','<script src="/standalone-shell.js" defer></script></body>');
 if(!html.includes('href="/standalone-shell.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/standalone-shell.css"></head>');
 html=html.replace(/(<body\b[^>]*\bclass=")([^"]*)"/,(_,start,classes)=>start+[...new Set([...classes.split(/\s+/),'dsd-program-chrome','dsd-calm'])].filter(Boolean).join(' ')+'"');
 if(!/<body[^>]*class=/.test(html))html=html.replace(/<body\b/,'<body class="dsd-program-chrome dsd-calm"');
 const relative=file.split(path.sep).join('/');
 if (['public/audio-player.html','public/audio/ONE-DSD-AUDIO-BROWSER.html'].includes(relative) && !html.includes('http-equiv="refresh"')) {
   html=html.replace(/<\/head>/i,'<meta http-equiv="refresh" content="0;url=/audio-library"></head>');
 }
 const bytes=Buffer.from(html);
 fs.writeFileSync(file,bytes);
 const saved=path.join('config/standalone-public-overrides/files',relative);fs.mkdirSync(path.dirname(saved),{recursive:true});fs.writeFileSync(saved,bytes);
 const identity={path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 const old=override.files.findIndex(f=>f.path===relative);if(old>=0)override.files[old]={...override.files[old],...identity};else override.files.push(identity);
 const original=release.assets.find(a=>a.path===relative);if(original)Object.assign(original,identity);
 count++;
}
fs.writeFileSync(overrideFile,JSON.stringify(override,null,2)+'\n');fs.writeFileSync(releaseFile,JSON.stringify(release,null,2)+'\n');
const shared=fs.readFileSync('components/dsd-header-tools.css','utf8');
fs.writeFileSync('public/standalone-shell.css',shared+`\n.dsd-tool-panel[hidden]{display:none!important}.standalone-frame iframe{display:block;width:100%;height:55vh;min-height:330px;border:0;background:#f3f5f8}.dsd-tool-heading button{color:#003865;border:0;background:transparent;font:inherit}.dsd-calm .dsd-header{position:static}.dsd-calm .dsd-header *{box-sizing:border-box}.dsd-calm .dsd-utilities button{font:inherit}.dsd-calm .dsd-brand strong{font-weight:600}.dsd-calm .dsd-brand-row{max-width:1000px}.dsd-calm .dsd-header .dsd-nav > div{max-width:1000px}.standalone-topic[hidden]{display:none}.standalone-topic{max-width:52rem;margin:2.5rem auto}.standalone-contents{margin:2rem 0;border-block:1px solid #a9bbce;padding:1rem}.standalone-contents summary{cursor:pointer;min-height:44px}.standalone-contents button,.standalone-topic-pager button{min-height:44px;background:transparent;color:#003865;border:0;text-decoration:underline;font:inherit;cursor:pointer;padding:.6rem}.standalone-contents ol{padding-left:1.3rem}.standalone-topic-pager{display:flex;justify-content:space-between;align-items:center;gap:1rem;border-top:1px solid #a9bbce;margin-block:2rem}.standalone-topic-pager button:disabled{color:#687785;text-decoration:none;cursor:default}.standalone-topic h2{border-top:2px solid #a9bbce;padding-top:1rem}@media(max-width:700px){body[data-page-purpose] main .grid2,body[data-page-purpose] main .grid3{grid-template-columns:minmax(0,1fr)}body[data-page-purpose] main .wrap{padding-inline:0}}@media print{.standalone-topic[hidden]{display:block}.standalone-contents,.standalone-topic-pager{display:none}}\n`);
console.log(`Updated ${count} standalone pages and their release identities.`);
