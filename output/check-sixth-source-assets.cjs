const fs=require('fs'),crypto=require('crypto');
const {chromium}=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-611-0_26.1112.611.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
const root='https://one-people-access-culture.up.railway.app';
const clean=s=>s.replace(/\[([^\]]+)\]\([^\)]+\)/g,'$1').replace(/[*_`]/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').replace(/^[-•] /,'').trim();
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage(),results=[];
 const assets=JSON.parse(fs.readFileSync('docs/editorial/community-reference-tools-batch.json','utf8')).records;
 for(const asset of assets){
  const url=root+asset.file.slice('public'.length),response=await page.request.get(url),buffer=await response.body();
  const hash=crypto.createHash('sha256').update(buffer).digest('hex');
  const row={file:asset.file,url,status:response.status(),expectedSha256:asset.finalSha256,actualSha256:hash,passed:response.ok()&&hash===asset.finalSha256};
  results.push(row);console.log(JSON.stringify(row));
 }
 const modules=JSON.parse(fs.readFileSync('docs/editorial/community-water-curriculum-batch.json','utf8')).records;
 for(const module of modules){
  const url=root+'/learn/water-we-swim-in/'+module.source.slug;await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('details').evaluateAll(nodes=>nodes.forEach(node=>node.open=true));
  let texts=[await page.locator('main').innerText()];const nav=page.locator('.focused-contents nav button');
  for(let i=0;i<await nav.count();i++){await nav.nth(i).click();await page.locator('details').evaluateAll(nodes=>nodes.forEach(node=>node.open=true));texts.push(await page.locator('main').innerText());}
  const text=clean(texts.join(' ')),missing=module.paragraphPairs.filter(pair=>!text.includes(clean(pair.after))).map(pair=>pair.after);
  const row={target:module.id,url,expectedParagraphs:module.paragraphPairs.length,missing,passed:missing.length===0};results.push(row);console.log(JSON.stringify(row));
 }
 await page.goto(root+'/equity-review/director-toolkit',{waitUntil:'domcontentloaded'});
 await page.locator('details').evaluateAll(nodes=>nodes.forEach(node=>node.open=true));
 const start=page.locator('.focused-contents nav button').filter({hasText:'Start here'});if(await start.count() && await start.isVisible())await start.click();
 const expected='The app does not autosave or submit your entries.';const passed=(await page.locator('main').innerText()).includes(expected);
 results.push({target:'director-toolkit-ui-privacy',passed});console.log(JSON.stringify(results.at(-1)));
 fs.writeFileSync('output/live-sixth-source-assets-check.json',JSON.stringify({checkedAt:new Date().toISOString(),commit:'7c3b8a0',results},null,2));await browser.close();
})().catch(error=>{console.error(error.message);process.exit(1)});
