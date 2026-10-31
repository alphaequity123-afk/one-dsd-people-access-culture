import {readFileSync,existsSync,writeFileSync,mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const apply=process.argv.includes('--apply')&&process.argv.includes('--confirm-hosted-synthetic-check');
if(!apply){console.log(JSON.stringify({mode:'plan',scope:'Temporary loopback-only Next production server and existing hosted Supabase restricted roles',productionRailwayChanges:false,command:'node scripts/operations/run-local-hosted-consultation-check.mjs --apply --confirm-hosted-synthetic-check',writes:'One synthetic consultation; temporary owner session. Existing staff records are not read.'},null,2));process.exit(0);}
const feature=JSON.parse(readFileSync(path.join(root,'config/protected-feature-activation.json'),'utf8')).features.dsd_consultation;
if(feature.approval_state!=='approved'||feature.retention_calendar_years!==2||Object.values(feature.requirements).some(r=>r.state!=='verified'||!r.evidence_id))throw Error('Local operational prerequisites are not recorded.');
if(!existsSync(path.join(root,'.next/BUILD_ID')))throw Error('A verified current production build is required.');
const s=JSON.parse(readFileSync(path.join(root,'.data/supabase-activation/secrets.json'),'utf8'));
for(const name of ['runtimePassword','ownerPassword','ownerKey','rateLimit','tracking','cron'])if(typeof s[name]!=='string'||!s[name])throw Error('Private local test credentials are incomplete.');
function database(role,password){const u=new URL('postgresql://aws-1-us-east-2.pooler.supabase.com:5432/postgres');u.username=role+'.htdefyecztafxkvfbrlo';u.password=password;return u.href;}
const env={...process.env};
for(const k of Object.keys(env))if(k.startsWith('PAC_')||k.startsWith('RAILWAY_')||k.startsWith('VERCEL')||k==='DATABASE_URL'||k==='CRON_SECRET')delete env[k];
Object.assign(env,{NODE_ENV:'production',PAC_AUTONOMY_MAX:'A2',PAC_STORE:'postgres',PAC_DATA_ENV:'production',PAC_RUNTIME_DATABASE_URL:database('pac_app_runtime',s.runtimePassword),PAC_RUNTIME_DATABASE_SSL:'require',PAC_OWNER_DATABASE_URL:database('pac_owner_writer',s.ownerPassword),PAC_OWNER_DATABASE_SSL:'require',PAC_OWNER_KEY:s.ownerKey,PAC_RATE_LIMIT_SECRET:s.rateLimit,PAC_CONSULTATION_TRACKING_SECRET:s.tracking,CRON_SECRET:s.cron,PAC_CONTENT_SOURCE:'static',PAC_STATIC_RESOURCE_EDITING:'on',PAC_STAFF_SCOPE:'dsd',PAC_DEDICATED_DSD_DATABASE:'yes',PAC_CONSULTATION_RETENTION_CALENDAR_YEARS:'2',PAC_CONSULTATION_POLICY_VERSION:feature.policy_version,PAC_CONSULTATION_ACTIVATION_EVIDENCE_ID:feature.evidence_id,PAC_CONSULTATION_INTAKE_ENABLED:'on'});
for(const k of ['DELETION','BACKUP','RESTORE','RECOVERY','INCIDENT','CORRECTION','DELIVERY'])env['PAC_CONSULTATION_'+k+'_READY']='on';
const surfaces=path.join(root,'evidence/activation-20261004/baseline-seeding/selected-surfaces.txt');if(existsSync(surfaces))env.PAC_DATABASE_EDITABLE_SURFACES=readFileSync(surfaces,'utf8').trim();
await new Promise((resolve,reject)=>{const probe=createServer();probe.once('error',()=>reject(Error('Local port 8774 is occupied; no existing process was stopped.')));probe.listen(8774,'127.0.0.1',()=>probe.close(resolve));});
let server;const receipt={kind:'local-hosted-consultation-runner',checkedAt:new Date().toISOString(),scope:'Loopback production API with actual hosted Supabase',productionRailwayChanges:false,actualStaffRecordsRead:false,passed:false,serverStopped:false,buildId:readFileSync(path.join(root,'.next/BUILD_ID'),'utf8').trim()};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','8774'],{cwd:root,env,windowsHide:true,stdio:'ignore'});
 let serverError=false;server.on('error',()=>{serverError=true;});
 let ready=false;for(let i=0;i<60;i++){if(serverError||server.exitCode!==null)throw Error('Temporary local server could not start; raw output withheld.');try{const r=await fetch('http://127.0.0.1:8774/support/request',{signal:AbortSignal.timeout(1000)});if(r.status===200){ready=true;break;}}catch{}await delay(500);}
 if(!ready)throw Error('Temporary local server readiness timeout.');
 const code=await new Promise(resolve=>{const child=spawn(process.execPath,['scripts/operations/verify-live-consultation.mjs','--local-origin','http://127.0.0.1:8774','--apply','--confirm-synthetic-request',...(process.argv.includes('--retain-validation-reference')?['--retain-validation-reference']:[])],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',d=>{output+=d;});child.stderr.on('data',()=>{});child.once('error',()=>resolve(-1));child.once('exit',code=>{try{const result=JSON.parse(output);receipt.workflowRunId=result.runId;receipt.workflowPassed=result.passed;receipt.failedPhase=result.failedPhase;receipt.failure=result.failure;receipt.checksPassed=result.checks?.length;receipt.requestId=result.requestId;}catch{receipt.failure='Verifier did not produce its sanitized JSON receipt.';}resolve(code);});});
 if(code!==0&&process.argv.includes('--diagnose-validation'))await new Promise(resolve=>{const probe=spawn(process.execPath,['scripts/operations/diagnose-local-hosted-consultation.cjs'],{cwd:root,env,windowsHide:true,stdio:['ignore','inherit','ignore']});probe.once('exit',resolve);});
 receipt.passed=code===0&&receipt.workflowPassed===true;if(!receipt.passed)process.exitCode=1;
}catch(error){receipt.failure=error.message;process.exitCode=1;}
finally{
 if(server&&server.exitCode===null){server.kill();for(let i=0;i<40&&server.exitCode===null&&server.signalCode===null;i++)await delay(100);}
 receipt.serverStopped=!server||server.exitCode!==null||server.signalCode!==null;
 const folder=path.join(root,'evidence/activation-20261004/local-hosted-workflow');mkdirSync(folder,{recursive:true});writeFileSync(path.join(folder,'runner.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}
