import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const localIndex=process.argv.indexOf('--local-origin');
const local=localIndex!==-1;
if(local&&process.argv[localIndex+1]!=='http://127.0.0.1:8774')throw new Error('Only the fixed loopback test origin is allowed.');
const origin=local?'http://127.0.0.1:8774':'https://one-dsd-people-access-culture-production.up.railway.app';
const retain=process.argv.includes('--retain-validation-reference');
if(retain&&!local)throw new Error('Private validation reference is restricted to the local synthetic workflow.');
const target=local?'Loopback Next production API with hosted Supabase; Railway unchanged':'Separate One DSD Railway production service';
const apply=process.argv.includes('--apply')&&process.argv.includes('--confirm-synthetic-request');
if(!apply){console.log(JSON.stringify({mode:'plan',target,writes:'One invented consultation, owner eligibility confirmation, correction, credential replacement, withdrawal, and temporary owner session.',reads:'Only the synthetic request; never the owner queue listing or existing staff requests.',retention:'No production clock/expiry change. Two-year expiry is tested by isolated retention tests and database evidence.',command:'node scripts/operations/verify-live-consultation.mjs '+(local?'--local-origin http://127.0.0.1:8774 ':'')+'--apply --confirm-synthetic-request'},null,2));process.exit(0);}
const secrets=JSON.parse(readFileSync(path.join(root,'.data/supabase-activation/secrets.json'),'utf8'));
if(typeof secrets.ownerKey!=='string'||secrets.ownerKey.length<32)throw new Error('Private owner credential is not ready.');
const runId=randomUUID();const receipt={kind:local?'local-hosted-synthetic-consultation-workflow':'live-synthetic-consultation-workflow',runId,checkedAt:new Date().toISOString(),target,scope:local?'local-api-hosted-supabase':'railway-production',passed:false,checks:[],requestId:null,actualStaffRecordsRead:false,limitations:[...(local?['Does not prove public Railway routing, browser cookie transport, or production activation.']:[]),'Does not prove provider backups or automated scheduler operation.','Does not fast-forward or change production retention. Synthetic withdrawn request follows the configured retention period.','On-screen credential and protected single-request owner page are tested; no email or calendar invitation is expected.']};
let cookie='',key='',requestId='',phase='readiness',loggedOut=false;
const headers={'origin':origin};
function check(ok,name){if(!ok)throw new Error(name);receipt.checks.push(name);}
async function send(route,{method='POST',body,owner=false,type='application/json'}={}){
 if(!route.startsWith('/')||route.startsWith('//'))throw new Error('Unsafe test route.');
 const res=await fetch(origin+route,{method,redirect:'manual',signal:AbortSignal.timeout(45000),headers:{...headers,...(method==='GET'?{}:{'content-type':type}),...(owner?{cookie}:{})},body:method==='GET'?undefined:type==='application/json'?JSON.stringify(body):body});
 return res;
}
async function json(res,status,name,requireNoStore=true){check(res.status===status,name+' status expected '+status+' received '+res.status);if(requireNoStore)check(res.headers.get('cache-control')?.includes('no-store'),name+' not cached');try{return await res.json();}catch{throw new Error(name+' invalid JSON');}}
function safeView(view){check(!['owner_notes','access_key_hash','packet','submission_fingerprint','tracking_secret','access_key'].some(k=>k in view),'requester response excludes owner and secret fields');}
const track=(action,extra={},accessKey=key)=>send('/api/intake/'+encodeURIComponent(requestId),{body:{action,access_key:accessKey,...extra}});
try{
 const page=await send('/support/request',{method:'GET'});check(page.status===200,'consultation page reachable');const html=await page.text();check(/2 calendar years/.test(html)&&/Submit request/.test(html),'live form shows two-calendar-year retention and submission');
 phase='owner sign-in';const login=await send('/api/consultant/login',{body:new URLSearchParams({key:secrets.ownerKey,returnTo:'/consultant'}).toString(),type:'application/x-www-form-urlencoded'});check(login.status===303,'owner sign-in redirects');const setCookie=login.headers.getSetCookie().find(v=>v.startsWith('pac_dsd_owner='));check(Boolean(setCookie)&&/HttpOnly/i.test(setCookie)&&(local||/Secure/i.test(setCookie)),local?'local owner cookie is HttpOnly':'owner session cookie protected');cookie=setCookie.split(';',1)[0];
 phase='submission';const input={program_context:'one_dsd',dsd_eligibility_attestation:true,requester_role:'analyst_tech',work_name:'Synthetic activation check',stage:'designing',goals:'Verify a clear and accessible general service notice through the consultation process.',equity_questions_considered:'Consider access, burden, and missing community perspectives.',desired_support_type:['scoping_goals'],timing_urgency:'exploratory',affected_populations:['disability_access'],access_language_needs:['plain_language_materials'],preferred_meeting_mode:'virtual',links:[],situation:'This invented work item checks the consultation process without including any client, employee, or private case information.',participation_notice_id:'dsd_consultation_request',participation_notice_version:'1.0.0',share_confirmation:true};
 const body={mode:'submit',input,idempotency_key:'live-synthetic-'+runId};const created=await json(await send('/api/intake',{body}),201,'synthetic submission');check(created.kind==='created'&&created.duplicate===false,'new submission confirmed');requestId=created.request?.request_id;key=created.request?.access_key;check(/^CR-[0-9]{8}-[0-9]{4,10}$/.test(requestId)&&typeof key==='string'&&key.length>=32,'private reference and key delivered');receipt.requestId=requestId;check(Object.keys(created.request).sort().join(',')==='access_key,created_at,request_id,work_name','submission receipt contains only intended fields');
 const duplicate=await json(await send('/api/intake',{body}),200,'idempotent replay');check(duplicate.duplicate===true&&duplicate.request.request_id===requestId&&duplicate.request.access_key===key,'retry returns same private receipt without second request');
 let view=await json(await track('lookup'),200,'initial tracking');safeView(view);check(view.status==='pending_eligibility_review','new request waits for DSD eligibility');
 await json(await track('lookup',{},'z'.repeat(43)),404,'wrong access key');
 phase='owner review';await json(await send('/api/consultant/queue/'+requestId,{method:'PATCH',body:{eligibility_decision:'confirmed_dsd'}}),401,'unauthenticated owner mutation',false);
 const ownerPage=await send('/consultant/queue/'+requestId,{method:'GET',owner:true});check(ownerPage.status===200,'owner can open only synthetic request');check((await ownerPage.text()).includes('Synthetic activation check'),'owner receives submitted synthetic work');
 const eligible=await json(await send('/api/consultant/queue/'+requestId,{method:'PATCH',owner:true,body:{eligibility_decision:'confirmed_dsd'}}),200,'owner eligibility confirmation');check(eligible.ok===true&&eligible.status==='received','DSD eligibility enters received state');
 view=await json(await track('lookup'),200,'confirmed tracking');safeView(view);check(view.status==='received'&&view.can_correct===true,'requester sees eligibility outcome');
 phase='correction';const beforeVersion=view.version;const correctedGoal='Review a clearer service notice and identify a practical next step for improving access.';
 view=await json(await track('correct',{expected_version:beforeVersion,corrections:{goals:correctedGoal}}),200,'requester correction');safeView(view);check(view.version===beforeVersion+1&&view.editable?.goals===correctedGoal,'correction increments version and persists');
 await json(await track('correct',{expected_version:beforeVersion,corrections:{goals:'This stale correction must never replace the current request wording.'}}),409,'stale correction');
 phase='credential replacement';const oldKey=key;const rotation=await json(await track('rotate_key',{expected_version:view.version}),200,'access key replacement');check(rotation.kind==='rotated'&&rotation.access_key!==oldKey&&rotation.access_key.length>=32,'fresh access key delivered');key=rotation.access_key;safeView(rotation.request);
 await json(await track('lookup',{},oldKey),404,'old access key revoked');view=await json(await track('lookup'),200,'new access key accepted');check(view.editable?.goals===correctedGoal,'correction survives independent tracking request');
 phase='withdrawal';const withdrawn=await json(await track('withdraw'),200,'requester withdrawal');check(withdrawn.ok===true,'withdrawal confirmed');view=await json(await track('lookup'),200,'withdrawn tracking');safeView(view);check(view.status==='withdrawn'&&view.can_withdraw===false,'withdrawn request persists with terminal withdrawal status');
 phase='logout';const logout=await send('/api/consultant/logout',{owner:true,body:{}});check(logout.status===303,'owner session revoked');loggedOut=true;
 await json(await send('/api/consultant/queue/'+requestId,{method:'PATCH',owner:true,body:{status:'under_review'}}),401,'revoked owner session rejected',false);
 if(retain){const privateFolder=path.join(root,'.data/supabase-activation');mkdirSync(privateFolder,{recursive:true});writeFileSync(path.join(privateFolder,'validation-reference.json'),JSON.stringify({syntheticOnly:true,requestId,accessKey:key,disposition:'withdrawn',createdByRun:runId},null,2)+'\n',{mode:0o600});}
 receipt.passed=true;receipt.syntheticRequestDisposition='withdrawn; retained under configured two-calendar-year policy';
}catch(error){receipt.failedPhase=phase;receipt.failure=/^[a-zA-Z0-9 ;:-]{1,150}$/.test(error.message??'')?error.message:'Unexpected response or network failure; no response body retained.';process.exitCode=1;}
finally{
 // Best-effort cleanup only for the exact request created here, never a queue listing.
 if(!receipt.passed&&requestId&&key){try{const result=await track('withdraw');receipt.failureCleanupWithdrawalStatus=result.status;}catch{receipt.failureCleanupWithdrawalStatus='not confirmed';}}
 if(cookie&&!loggedOut){try{const result=await send('/api/consultant/logout',{owner:true,body:{}});receipt.finalSessionRevocationStatus=result.status;}catch{receipt.finalSessionRevocationStatus='not confirmed';}}
 const folder=path.join(root,'evidence/activation-20261004',local?'local-hosted-workflow':'live-workflow');mkdirSync(folder,{recursive:true});writeFileSync(path.join(folder,runId+'.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}
