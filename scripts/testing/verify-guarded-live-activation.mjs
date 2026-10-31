import fs from 'node:fs';
const origin='https://one-dsd-people-access-culture-production.up.railway.app';
const checks=[
  {path:'/api/consultant/evals',method:'POST',body:'{}',expected:401},
  {path:'/api/consultant/orchestrator',method:'POST',body:'{}',expected:401},
  {path:'/api/intake',method:'POST',body:'{}',expected:503},
];
const results=[];
for(const check of checks){
  const response=await fetch(origin+check.path,{method:check.method,headers:{Origin:origin,'Content-Type':'application/json'},body:check.body,signal:AbortSignal.timeout(20000)});
  results.push({route:check.path,method:check.method,status:response.status,expected:check.expected});
  if(response.status!==check.expected)throw Error('Unexpected activation boundary: '+check.path+' '+response.status);
}
fs.writeFileSync('evidence/activation-20261004/live-guarded-boundaries.json',JSON.stringify({checkedAt:new Date().toISOString(),activation:'pending',realSubmissionsRemainBlocked:true,results},null,2));
console.log(JSON.stringify({protectedOwnerRoutes:true,intakeStillGuarded:true,checks:results.length}));
