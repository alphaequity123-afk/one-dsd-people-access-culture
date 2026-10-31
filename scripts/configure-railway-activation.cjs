const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const cli=path.join(process.env.APPDATA,'npm/node_modules/@railway/cli/bin/railway.exe');
const project='93b7e865-8bf8-4d6c-b6ed-77f3fea181ad',service='6cd9836c-4591-422f-ab26-7cc062cebdd4';
function railway(args,input){return execFileSync(cli,args,{input,encoding:'utf8',stdio:['pipe','pipe','pipe']});}
const target=['--project',project,'--service',service,'--environment','production'];
const vars=JSON.parse(railway(['variables','--project',project,'--service','6ec5c613-04b5-48e7-8936-5b9797e9c632','--environment','production','--json']));
const file='.data/railway-activation/owner-access.json';
fs.mkdirSync(path.dirname(file),{recursive:true});
let secrets=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{ownerKey:crypto.randomBytes(36).toString('base64url'),runtimePassword:crypto.randomBytes(36).toString('base64url'),rateLimit:crypto.randomBytes(36).toString('base64url'),tracking:crypto.randomBytes(36).toString('base64url')};
fs.writeFileSync(file,JSON.stringify(secrets,null,2));
const runtime=new URL(vars.DATABASE_URL);runtime.username='pac_app_runtime';runtime.password=secrets.runtimePassword;
const settings={PAC_DATABASE_URL:vars.DATABASE_URL,PAC_DATABASE_SSL:'require',PAC_RUNTIME_DATABASE_URL:runtime.href,PAC_RUNTIME_DATABASE_SSL:'require',PAC_STORE:'postgres',PAC_DATA_ENV:'production',PAC_OWNER_KEY:secrets.ownerKey,PAC_RATE_LIMIT_SECRET:secrets.rateLimit,PAC_CONSULTATION_TRACKING_SECRET:secrets.tracking};
for(const [key,value] of Object.entries(settings)){railway(['variable','set',key,'--stdin','--skip-deploys',...target],value);console.log('Configured '+key+' (value withheld)');}
console.log(railway(['api','--file','evidence/activation-20261004/configure-init.graphql']));
