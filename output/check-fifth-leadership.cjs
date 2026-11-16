const fs=require('fs');const {chromium}=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-611-0_26.1112.611.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'}),p=await b.newPage(),results=[];
for(const row of JSON.parse(fs.readFileSync('docs/editorial/community-leadership-final-batch.json','utf8')).records.filter(r=>r.changes.length)){
 const slug=row.source.match(/slug:\s*"([^"]+)"/)?.[1];const route=row.file.includes('lessons')?'/learn/leadership-styles/'+slug:'/learn/leadership-styles/scenarios';
 await p.goto('https://one-people-access-culture.up.railway.app'+route);await p.locator('details').evaluateAll(a=>a.forEach(x=>x.open=true));
 const texts=[await p.locator('main').innerText()];const nav=p.locator('.focused-contents nav button');for(let i=0;i<await nav.count();i++){await p.locator('details').evaluateAll(a=>a.forEach(x=>x.open=true));await nav.nth(i).click();texts.push(await p.locator('main').innerText());}
 const text=texts.join(' ').replace(/\s+/g,' ');const missing=row.changes.filter(c=>!text.includes(c.after.replace(/\s+/g,' '))).map(c=>c.after);
 const result={target:row.id,route,expected:row.changes.length,missing,passed:!missing.length};results.push(result);console.log(JSON.stringify(result));
}await b.close();fs.writeFileSync('output/live-fifth-leadership-check.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));})();
