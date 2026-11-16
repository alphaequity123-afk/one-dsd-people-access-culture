const fs=require('fs'); const {chromium}=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-611-0_26.1112.611.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
const courses=JSON.parse(fs.readFileSync('lib/content/course-language-revisions.json','utf8')).courses.slice(6,7);
const inventory=JSON.parse(fs.readFileSync('output/editorial-source-inventory.json','utf8'));
const clean=s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});const p=await b.newPage();const results=[];
for(const c of courses){const lessons=inventory.surfaces.find(s=>s.surfaceId==='course.'+c.courseId).values.pack.course.lessons;for(let i=0;i<lessons.length;i++){
 await p.goto('https://one-people-access-culture.up.railway.app/courses/'+c.courseId+'/'+lessons[i].id);let texts=[];let steps=0;
 while(steps++<15){await p.locator('details').evaluateAll(a=>a.forEach(e=>e.open=true));texts.push(await p.locator('main').innerText());const tabs=p.getByRole('tab');for(let n=0;n<await tabs.count();n++){await tabs.nth(n).click();texts.push(await p.locator('main').innerText());}const next=p.getByRole('button',{name:'Next',exact:true});if(!await next.count()||!await next.isEnabled())break;await next.click();}
 const expected=c.changes.filter(x=>x.path[0]==='course'&&x.path[1]==='lessons'&&x.path[2]===i&&x.path[3]==='blocks'&&(x.path.at(-1)==='body'||x.path.at(-1)==='question'||x.path.at(-1)==='control'||x.path.at(-1)==='failure'||x.path.at(-1)==='next'));
 const seen=clean(texts.join(' '));const matches=expected.filter(x=>seen.includes(clean(x.after)));const row={course:c.courseId,lesson:lessons[i].id,steps,expectedTeachingFields:expected.length,matchedTeachingFields:matches.length,missing:expected.filter(x=>!matches.includes(x)).map(x=>x.path)};results.push(row);console.log(JSON.stringify(row));
}}
 fs.writeFileSync('output/live-fourth-lesson-sequence-check.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));await b.close();})();
