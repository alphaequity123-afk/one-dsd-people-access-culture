const fs=require('fs');
const {chromium}=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-611-0_26.1112.611.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
const root='https://one-people-access-culture.up.railway.app';
const surfaces=JSON.parse(fs.readFileSync('lib/content/professional-language-revisions.json','utf8')).revisions.slice(0,15);
const courses=JSON.parse(fs.readFileSync('lib/content/course-language-revisions.json','utf8')).courses;
const inventory=JSON.parse(fs.readFileSync('output/editorial-source-inventory.json','utf8'));
const clean=s=>s.replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|amp);/g,m=>m==='&amp;'?'&':' ').replace(/\s+/g,' ').trim();
const tasks=surfaces.map(s=>({target:s.target,url:root+s.route+(s.target==='ask.page'?'?mode=review':''),expect:s.changes.map(c=>c.after)}));
for(const c of courses){
 const original=inventory.surfaces.find(s=>s.surfaceId==='course.'+c.courseId).values.pack;
 tasks.push({target:'course.'+c.courseId,url:root+'/courses/'+c.courseId,expect:c.changes.filter(p=>p.path[0]==='jobAid'||p.path[1]==='learning'||p.path[1]==='subtitle').map(p=>p.after)});
 original.course.lessons.forEach((l,n)=>tasks.push({target:'lesson.'+l.id,url:root+'/courses/'+c.courseId+'/'+l.id,expect:c.changes.filter(p=>p.path[0]==='course'&&p.path[1]==='lessons'&&p.path[2]===n&&p.path[3]==='blocks').map(p=>p.after)}));
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();const report=[];
 for(const task of tasks){try{
 const response=await page.goto(task.url,{waitUntil:'domcontentloaded',timeout:90000});await page.locator('main').first().waitFor({timeout:20000});await page.locator('details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
 const visible=clean(await page.locator('body').innerText());const hits=task.expect.filter(t=>visible.includes(clean(t)));
 const row={target:task.target,url:task.url,status:response.status(),expectedFields:task.expect.length,visibleMatches:hits.length,passed:response.ok()&&hits.length>0,heading:await page.locator('h1').first().innerText().catch(()=>null)};report.push(row);console.log(JSON.stringify(row));
 }catch(e){report.push({target:task.target,url:task.url,passed:false,error:e.message});console.log(JSON.stringify(report.at(-1)));}}
 fs.writeFileSync('output/live-first-release-check.json',JSON.stringify({checkedAt:new Date().toISOString(),results:report},null,2));await browser.close();process.exitCode=report.every(r=>r.passed)?0:1;
})();
