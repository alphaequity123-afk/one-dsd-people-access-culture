import {mkdtempSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createServer} from 'node:net';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import postgres from 'postgres';
const root=fileURLToPath(new URL('../../',import.meta.url));
const bin=path.resolve(root,'../offline-readiness-20260927/runtime/pgsql/bin');
const folder=mkdtempSync(path.join(tmpdir(),'pac-recovery-sql-'));
const data=path.join(folder,'data');const report={kind:'local-recovery-sql-execution',passed:false,postgres:'16.13',cloudMutations:false,limitation:'Grammar and end-to-end SQL assertions against disposable local template tables. Real Supabase constraints and provider backups are separate checks.'};
function command(exe,args){const r=spawnSync(exe,args,{encoding:'utf8',stdio:path.basename(exe)==='pg_ctl.exe'?'ignore':'pipe',windowsHide:true,timeout:120000});if(r.status!==0)throw new Error(path.basename(exe)+' failed: '+r.stderr);return r.stdout;}
const port=await new Promise((resolve,reject)=>{const s=createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
let started=false,sql;
try{
 command(path.join(bin,'initdb.exe'),['-D',data,'-U','pacdrill','-A','trust','--no-locale','--encoding=UTF8']);
 command(path.join(bin,'pg_ctl.exe'),['-D',data,'-l',path.join(folder,'postgres.log'),'-o',`-F -p ${port} -h 127.0.0.1`,'-w','start']);started=true;
 sql=postgres({host:'127.0.0.1',port,username:'pacdrill',database:'postgres',ssl:false,max:1,prepare:false,onnotice:()=>{}});
 await sql.unsafe("create schema pac;create role pac_app_runtime nologin; create table pac.runtime_work_objects(work_kind text not null,object_id text not null,value jsonb not null,primary key(work_kind,object_id)); create table pac.page_text_overrides(scope_id text not null,route text not null,element_key text not null,original_text text not null,replacement_text text not null,updated_at timestamptz not null default now(),updated_by text not null default 'consultant',primary key(scope_id,route,element_key));").simple();
 const prepared=JSON.parse(command(process.execPath,[path.join(root,'scripts/operations/prepare-isolated-recovery-sql.cjs')]));
 const seed=readFileSync(prepared.seedSql,'utf8');const split=seed.lastIndexOf('select jsonb_build_object');await sql.unsafe(seed.slice(0,split)).simple();
 const [row]=await sql.unsafe(seed.slice(split));const file=path.join(folder,'synthetic-backup.json');writeFileSync(file,JSON.stringify(row.synthetic_backup));
 const restore=JSON.parse(command(process.execPath,[path.join(root,'scripts/operations/prepare-isolated-recovery-sql.cjs'),'--restore-from',file]));const statement=readFileSync(restore.restoreSql,'utf8');const end=statement.lastIndexOf('select jsonb_build_object');await sql.unsafe(statement.slice(0,end)).simple();const [out]=await sql.unsafe(statement.slice(end));
 if(out.recovery_result?.passed!==true)throw new Error('Recovery assertions failed');report.passed=true;report.result=out.recovery_result;report.generatedSchemas=[prepared.source,prepared.restored];report.localArtifacts=folder;
}catch(error){report.error=error.message;process.exitCode=1;}finally{if(sql)await sql.end({timeout:2});if(started)command(path.join(bin,'pg_ctl.exe'),['-D',data,'-m','fast','-w','stop']);const out=path.join(root,'evidence/activation-20261004/recovery');mkdirSync(out,{recursive:true});writeFileSync(path.join(out,'local-sql-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
