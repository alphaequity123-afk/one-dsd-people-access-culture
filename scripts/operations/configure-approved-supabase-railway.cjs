const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const cli = path.join(process.env.APPDATA, 'npm/node_modules/@railway/cli/bin/railway.exe');
const project='93b7e865-8bf8-4d6c-b6ed-77f3fea181ad', service='6cd9836c-4591-422f-ab26-7cc062cebdd4';
const target=['--project',project,'--service',service,'--environment','production'];
const secrets=JSON.parse(fs.readFileSync('.data/supabase-activation/secrets.json','utf8'));
function url(role,password){const u=new URL('postgresql://aws-1-us-east-2.pooler.supabase.com:5432/postgres');u.username=role+'.htdefyecztafxkvfbrlo';u.password=password;return u.href;}
const settings={PAC_STORE:'postgres',PAC_DATA_ENV:'production',PAC_RUNTIME_DATABASE_URL:url('pac_app_runtime',secrets.runtimePassword),PAC_RUNTIME_DATABASE_SSL:'require',PAC_OWNER_DATABASE_URL:url('pac_owner_writer',secrets.ownerPassword),PAC_OWNER_DATABASE_SSL:'require',PAC_OWNER_KEY:secrets.ownerKey,PAC_RATE_LIMIT_SECRET:secrets.rateLimit,PAC_CONSULTATION_TRACKING_SECRET:secrets.tracking,CRON_SECRET:secrets.cron,PAC_PUBLIC_ORIGIN:'https://one-dsd-people-access-culture-production.up.railway.app',PAC_TRUSTED_PROXY:'railway',PAC_CONTENT_SOURCE:'static',PAC_STATIC_RESOURCE_EDITING:'on',PAC_STAFF_SCOPE:'dsd',PAC_CONSULTATION_RETENTION_CALENDAR_YEARS:'2',PAC_CONSULTATION_INTAKE_ENABLED:'off'};
if(process.argv.includes('--selected-surfaces'))settings.PAC_DATABASE_EDITABLE_SURFACES=fs.readFileSync('evidence/activation-20261004/baseline-seeding/selected-surfaces.txt','utf8').trim();
if(process.argv.includes('--selected-surfaces-only')){
 for(const key of Object.keys(settings))delete settings[key];
 const parity=JSON.parse(fs.readFileSync('evidence/activation-20261004/baseline-seeding/applied.json'));
 if(parity.resourceParity!==63||parity.surfaceParity!==344||parity.failures.length)throw Error('Stored baseline verification missing');
 settings.PAC_DATABASE_EDITABLE_SURFACES=fs.readFileSync('evidence/activation-20261004/baseline-seeding/selected-surfaces.txt','utf8').trim();
}
if(process.argv.includes('--activate')||process.argv.includes('--verify-dependencies')){
 const preflight=JSON.parse(fs.readFileSync('evidence/activation-20261004/local-hosted-workflow/runner.json'));
 if(preflight.passed!==true&&preflight.workflowPassed!==true)throw Error('Hosted consultation preflight must pass first');
 const f=JSON.parse(fs.readFileSync('config/protected-feature-activation.json')).features.dsd_consultation;
 if(f.approval_state!=='approved'||f.retention_calendar_years!==2||Object.values(f.requirements).some(r=>r.state!=='verified'||!r.evidence_id))throw Error('Actual activation evidence is incomplete');
 settings.PAC_CONSULTATION_POLICY_VERSION=f.policy_version;
 settings.PAC_CONSULTATION_ACTIVATION_EVIDENCE_ID=f.evidence_id;
 for(const k of ['DELETION','BACKUP','RESTORE','RECOVERY','INCIDENT','CORRECTION','DELIVERY'])settings['PAC_CONSULTATION_'+k+'_READY']='on';
 settings.PAC_AUTONOMY_MAX='A2';
 settings.PAC_CONSULTATION_INTAKE_ENABLED=process.argv.includes('--activate')?'on':'off';
}
function run(args,input){return execFileSync(cli,args,{input,encoding:'utf8',stdio:['pipe','pipe','pipe'],windowsHide:true});}
try {
 const current=JSON.parse(run(['variable','list',...target,'--json']));
 for(const k of ['PAC_DATABASE_URL','PAC_DATABASE_SSL','PAC_CONSULTATION_RETENTION_DAYS'])if(k in current)run(['variable','delete',k,...target,'--skip-deploys']);
 for(const [key,value] of Object.entries(settings)){run(['variable','set',key,'--stdin','--skip-deploys',...target],value);console.log('Configured '+key+' (value withheld)');}
 console.log(JSON.stringify({target:'separate One DSD production service',configured:true,deploymentTriggered:false,intakeEnabled:settings.PAC_CONSULTATION_INTAKE_ENABLED==='on',administrativeDatabaseCredentialInstalled:false}));
}catch{console.error('Railway configuration failed; secret-bearing provider output withheld.');process.exitCode=1;}
