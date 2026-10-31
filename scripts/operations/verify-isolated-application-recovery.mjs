import {randomUUID,createHash,createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import postgres from 'postgres';
const root=fileURLToPath(new URL('../../',import.meta.url));
const applying=process.argv.includes('--apply')&&process.argv.includes('--confirm-isolated-hosted-drill');
if(!applying){console.log(JSON.stringify({mode:'plan',writes:'Two new isolated schemas only; never program rows.',tables:['runtime_work_objects','page_text_overrides'],requires:['PAC_DATABASE_URL','PAC_RECOVERY_BACKUP_KEY (base64,32 bytes)'],command:'--apply --confirm-isolated-hosted-drill',limitations:'Does not certify provider backups, PITR, all program tables, actual hosted routes, or runtime roles.'},null,2));process.exit(0);}
if(!process.env.PAC_DATABASE_URL)throw new Error('Recovery database configuration missing.');
const key=Buffer.from(process.env.PAC_RECOVERY_BACKUP_KEY??'','base64');
if(key.length!==32)throw new Error('A 32-byte recovery encryption key is required.');
const id=randomUUID().replaceAll('-','');
const schemas=['pac_drill_'+id,'pac_restore_'+id];
const folder=path.join(root,'evidence','activation-20261004','recovery',id);mkdirSync(folder,{recursive:true});
const receipt={kind:'isolated-consultation-page-recovery',checkedAt:new Date().toISOString(),schemas,passed:false,productionRowsRead:false,productionRowsChanged:false,checks:[],limitation:'Encrypted logical recovery of synthetic consultation/page-text tables only. Does not prove provider-managed backups, PITR, all program recovery, hosted route behavior, or least-privilege access.'};
const connection=new URL(process.env.PAC_DATABASE_URL);connection.searchParams.delete('sslmode');
const sql=postgres(connection.href,{ssl:process.env.PAC_DATABASE_SSL==='disable'?false:{rejectUnauthorized:true},max:1,prepare:false,connect_timeout:20,onnotice:()=>{}});
const fixture=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/operations/export-recovery-fixtures.cjs')],{encoding:'utf8',windowsHide:true}));
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function check(condition,name){if(!condition)throw new Error(name);receipt.checks.push(name);}
async function run(schema,query,args=[]){if(!schemas.includes(schema)||!/^pac_(?:drill|restore)_[a-f0-9]{32}$/.test(schema))throw new Error('Invalid isolated schema.');return sql.unsafe(query.replaceAll('$SCHEMA',schema),args);}
try{
 for(const schema of schemas){await sql.unsafe('create schema '+schema);await sql.unsafe('revoke all on schema '+schema+' from public');await run(schema,'create table $SCHEMA.runtime_work_objects (like pac.runtime_work_objects including all)');await run(schema,'create table $SCHEMA.page_text_overrides (like pac.page_text_overrides including all)');}
 const [source,destination]=schemas;
 for(const record of [fixture.active,fixture.expired])await run(source,'insert into $SCHEMA.runtime_work_objects(work_kind,object_id,value) values ($1,$2,$3::jsonb)',['consult_request',record.request_id,JSON.stringify(record)]);
 const transition=await run(source,"update $SCHEMA.runtime_work_objects set value=$1::jsonb where object_id=$2 and work_kind='consult_request' and (value->>'version')::int=1 and value->>'retention_expires_at'=$3 returning object_id",[JSON.stringify(fixture.received),fixture.active.request_id,fixture.active.retention_expires_at]);check(transition.length===1,'valid consultation version transition preserved expiry');
 const stale=await run(source,"update $SCHEMA.runtime_work_objects set value=$1::jsonb where object_id=$2 and work_kind='consult_request' and (value->>'version')::int=1 returning object_id",[JSON.stringify(fixture.reviewed),fixture.active.request_id]);check(stale.length===0,'stale consultation version rejected');
 await run(source,"insert into $SCHEMA.page_text_overrides(scope_id,route,element_key,original_text,replacement_text) values ('dsd','/synthetic-recovery','heading','Original synthetic heading','Saved synthetic heading')");
 const payload={version:1,sourceCreatedAt:receipt.checkedAt,consultations:await run(source,'select work_kind,object_id,value from $SCHEMA.runtime_work_objects order by object_id'),pageText:await run(source,'select scope_id,route,element_key,original_text,replacement_text,updated_at,updated_by from $SCHEMA.page_text_overrides order by element_key')};
 const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);const ciphertext=Buffer.concat([cipher.update(JSON.stringify(payload),'utf8'),cipher.final()]);const backup=Buffer.concat([Buffer.from('PACDRILL1'),nonce,cipher.getAuthTag(),ciphertext]);
 const backupFile=path.join(folder,'synthetic-recovery.aes');writeFileSync(backupFile,backup,{mode:0o600});receipt.backupSha256=createHash('sha256').update(backup).digest('hex');receipt.backupBytes=backup.length;
 await run(source,"delete from $SCHEMA.runtime_work_objects where work_kind='consult_request'");await run(source,"update $SCHEMA.page_text_overrides set replacement_text='Later synthetic heading'");
 const bytes=readFileSync(backupFile);check(bytes.subarray(0,9).toString()==='PACDRILL1','encrypted backup header verified');
 const decipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(9,21));decipher.setAuthTag(bytes.subarray(21,37));const recovered=JSON.parse(Buffer.concat([decipher.update(bytes.subarray(37)),decipher.final()]).toString('utf8'));check(sha(recovered)===sha(JSON.parse(JSON.stringify(payload))),'encrypted backup authenticated and payload digest matched');
 for(const r of recovered.consultations)await run(destination,'insert into $SCHEMA.runtime_work_objects(work_kind,object_id,value) values ($1,$2,$3::jsonb)',[r.work_kind,r.object_id,JSON.stringify(r.value)]);
 for(const r of recovered.pageText)await run(destination,'insert into $SCHEMA.page_text_overrides(scope_id,route,element_key,original_text,replacement_text,updated_at,updated_by) values ($1,$2,$3,$4,$5,$6,$7)',[r.scope_id,r.route,r.element_key,r.original_text,r.replacement_text,r.updated_at,r.updated_by]);
 const restored=await run(destination,'select work_kind,object_id,value from $SCHEMA.runtime_work_objects order by object_id');check(sha(restored)===sha(recovered.consultations),'full consultation payloads restored exactly');
 const restoredPage=await run(destination,'select scope_id,route,element_key,original_text,replacement_text,updated_at,updated_by from $SCHEMA.page_text_overrides order by element_key');check(sha(JSON.parse(JSON.stringify(restoredPage)))===sha(recovered.pageText),'saved page edit restored exactly');
 const redaction=await run(destination,"update $SCHEMA.runtime_work_objects set value=$1::jsonb where work_kind='consult_request' and object_id=$2 and (value->>'version')::int=$3 and (value->>'retention_expires_at')::timestamptz <= $4::timestamptz returning object_id",[JSON.stringify(fixture.tombstone),fixture.expired.request_id,fixture.expired.version,fixture.asOf]);check(redaction.length===1,'expired restored consultation redacted before access');
 const [expired]=await run(destination,'select value from $SCHEMA.runtime_work_objects where object_id=$1',[fixture.expired.request_id]);check(!('work_name' in expired.value)&&!('packet' in expired.value)&&!('goals' in expired.value)&&expired.value.record_type==='consultation_tombstone','expired restored request text not resurrected');
 const [active]=await run(destination,'select value from $SCHEMA.runtime_work_objects where object_id=$1',[fixture.active.request_id]);check(active.value.version===2&&active.value.retention_expires_at===fixture.active.retention_expires_at,'current request version and immutable expiry preserved');
 const afterGrace=new Date(Date.parse(fixture.asOf)+31*86400000).toISOString();
 const purged=await run(destination,"delete from $SCHEMA.runtime_work_objects where work_kind='consult_request' and value->>'record_type'='consultation_tombstone' and (value->>'redacted_at')::timestamptz <= $1::timestamptz - interval '30 days' returning object_id",[afterGrace]);check(purged.length===1,'expired-status tombstone deleted after simulated grace interval');
 const [schemaAccess]=await sql.unsafe('select has_schema_privilege(\'pac_app_runtime\',$1,\'USAGE\') as source_access,has_schema_privilege(\'pac_app_runtime\',$2,\'USAGE\') as restore_access',schemas);check(!schemaAccess.source_access&&!schemaAccess.restore_access,'application role cannot access either isolated schema');
 receipt.passed=true;receipt.schemasRetainedForReview=true;
}catch(error){receipt.error='isolated_recovery_failed';receipt.failure=receipt.checks.length;receipt.databaseCode=/^[A-Z0-9]{5}$/.test(error?.code??'')?error.code:null;receipt.invariant=error?.message?.match(/^[a-zA-Z -]{1,100}$/)?error.message:null;process.exitCode=1;}
finally{await sql.end({timeout:3});writeFileSync(path.join(folder,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));}
