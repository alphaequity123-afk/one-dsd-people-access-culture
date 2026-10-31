import fs from 'node:fs';
const origin=process.argv[2];
if (!origin || !/^https?:\/\/(127\.0\.0\.1:8773|one-dsd-people-access-culture-production\.up\.railway\.app)$/.test(origin)) throw Error('Expected reviewed test origin');
const inventory=JSON.parse(fs.readFileSync('evidence/staff-foundation-inventory.json','utf8'));
const source=fs.readFileSync('lib/content/leadership-intercultural-pathway.ts','utf8');
const leadership=[...new Set([...source.matchAll(/courseIds:\s*\[([^\]]+)\]/g)].flatMap(m=>[...m[1].matchAll(/"([^"]+)"/g)].map(x=>x[1])))];
const paths=new Set(['/program/foundation','/one-dsd/leadership',...inventory.courses.map(c=>'/courses/'+c.id),...leadership.map(id=>'/courses/'+id)]);
const results=[];
async function verify(route){
  const response=await fetch(origin+route,{signal:AbortSignal.timeout(30000)}),html=await response.text();
  const page=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  const heading=page.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]*>/g,'');
  if(response.status!==200 || !heading || /not found|something went wrong/i.test(heading)) throw Error('Broken course route: '+route+' '+response.status);
  results.push({route,status:response.status,heading});
  if(/^\/courses\/[^/]+$/.test(route))for(const match of page.matchAll(/href="(\/courses\/[^"?#]+)"/g))if(match[1].startsWith(route+'/'))paths.add(match[1]);
}
let checked=new Set();
while(checked.size<paths.size){const batch=[...paths].filter(p=>!checked.has(p)).slice(0,4);await Promise.all(batch.map(verify));for(const p of batch)checked.add(p);}
const receipt={checkedAt:new Date().toISOString(),origin,foundationCourses:inventory.courses.length,leadershipCourses:leadership.length,totalRoutes:results.length,results};
fs.writeFileSync('evidence/activation-20261004/'+(origin.includes('127.0.0.1')?'local':'live')+'-course-routes.json',JSON.stringify(receipt,null,2));
console.log(JSON.stringify({verified:true,foundationCourses:receipt.foundationCourses,leadershipCourses:receipt.leadershipCourses,totalRoutes:receipt.totalRoutes}));
