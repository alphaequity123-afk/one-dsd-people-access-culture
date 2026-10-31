import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const origin='https://one-dsd-people-access-culture-production.up.railway.app';
const {ownerKey}=JSON.parse(readFileSync(path.join(root,'.data/supabase-activation/secrets.json'),'utf8'));
let cookie='';
const receipt={checkedAt:new Date().toISOString(),target:origin,action:'Restore consultation intake saving only',passed:false};
try {
 const login=await fetch(origin+'/api/consultant/login',{method:'POST',redirect:'manual',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({key:ownerKey,returnTo:'/consultant'}),signal:AbortSignal.timeout(45000)});
 if(login.status!==303)throw Error('Owner sign-in failed');
 cookie=login.headers.getSetCookie().find(v=>v.startsWith('pac_owner='))?.split(';',1)[0];
 if(!cookie)throw Error('Owner session unavailable');
 const res=await fetch(origin+'/api/consultant/orchestrator',{method:'POST',headers:{origin,cookie,'content-type':'application/json'},body:JSON.stringify({action:'agent',agent_id:'consult_intake',ceiling:'A2'}),signal:AbortSignal.timeout(45000)});
 receipt.status=res.status;
 const body=await res.json();
 receipt.savedCeiling=body.policy?.agents?.consult_intake?.ceiling;
 if(res.status!==200||receipt.savedCeiling!=='A2')throw Error('Consultation setting was not confirmed');
 receipt.passed=true;
}catch(e){receipt.failure=e.message;process.exitCode=1;}
finally{
 if(cookie){const res=await fetch(origin+'/api/consultant/logout',{method:'POST',redirect:'manual',headers:{origin,cookie,'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(45000)});receipt.logoutStatus=res.status;}
 const folder=path.join(root,'work/consultation-reopen-20261007');mkdirSync(folder,{recursive:true});writeFileSync(path.join(folder,'policy-repair-receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));
}
