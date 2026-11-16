const fs=require('fs');const{chromium}=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-611-0_26.1112.611.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
const root='https://one-people-access-culture.up.railway.app';const rev=JSON.parse(fs.readFileSync('lib/content/professional-language-revisions.json','utf8')).revisions;
const tasks=rev.filter(r=>/^(domain|dsd-program|dsd-scenario)\./.test(r.target)||r.target==='learn.page').map(r=>({target:r.target,url:root+r.route,expect:r.changes.filter(c=>r.target!=='learn.page'||c.path[0]==='introLede').map(c=>c.after)}));
const files={
'lib/content/community-360/american.json':'/minnesota-communities/american/profile',
'lib/content/community-360/minnesota.json':'/minnesota-communities/minnesota/profile',
'lib/content/community-research/somali.json':'/minnesota-communities/somali/people',
'lib/content/community-research/american.json':'/minnesota-communities/american/people',
'lib/content/community-research/african-american.json':'/minnesota-communities/african-american/people',
'lib/content/community-research/amharic.json':'/minnesota-communities/amharic/people',
'lib/content/hub/organizations.json':'/community-outreach/organizations/adaptive-wilderness-within-reach',
'lib/content/hub/system-connections.json':'/community-outreach/how-the-system-connects',
'lib/content/reading-collection.json':'/learn/readings/reading-001'};
for(const name of ['community-first-batch.json','community-second-batch.json'])for(const r of JSON.parse(fs.readFileSync('docs/editorial/'+name,'utf8')).records){if(!r.changes.length)continue;let task=tasks.find(t=>t.target===r.file);if(!task){task={target:r.file,url:root+files[r.file],expect:[]};tasks.push(task);}task.expect.push(...r.changes.map(c=>c.after));}
const clean=s=>s.replace(/\[([^\]]+)\]\([^\)]+\)/g,'$1').replace(/\*\*/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});const p=await b.newPage();const results=[];for(const t of tasks){try{const r=await p.goto(t.url,{waitUntil:'domcontentloaded',timeout:90000});await p.locator('main').first().waitFor();await p.locator('details').evaluateAll(a=>a.forEach(e=>e.open=true));const text=clean(await p.locator('main').innerText());const matches=t.expect.filter(s=>text.includes(clean(s)));const row={target:t.target,url:t.url,status:r.status(),expectedFields:t.expect.length,matchedFields:matches.length,passed:r.ok()&&matches.length===t.expect.length};results.push(row);console.log(JSON.stringify(row));}catch(e){results.push({target:t.target,url:t.url,passed:false,error:e.message});console.log(JSON.stringify(results.at(-1)));}}
fs.writeFileSync('output/live-second-release-check.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));await b.close();})();
