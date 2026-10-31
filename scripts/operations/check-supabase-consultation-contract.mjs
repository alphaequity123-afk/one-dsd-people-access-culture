import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import postgres from 'postgres';
const secrets=JSON.parse(fs.readFileSync('.data/supabase-activation/secrets.json','utf8'));
const url=new URL('postgresql://db.htdefyecztafxkvfbrlo.supabase.co:5432/postgres');
url.username='pac_app_runtime';url.password=secrets.runtimePassword;
const db=postgres(url.href,{ssl:'require',prepare:false,max:1,onnotice:()=>{}});
const fixtures=JSON.parse(execFileSync(process.execPath,['scripts/operations/export-recovery-fixtures.cjs'],{encoding:'utf8',windowsHide:true}));
// The server checks mutation times against its own clock. The isolated backup
// fixture uses historical transitions, so give these live CAS checks fresh times.
fixtures.received.updated_at=new Date().toISOString();
fixtures.received.history.at(-1).at=fixtures.received.updated_at;
fixtures.reviewed.updated_at=new Date(Date.now()+1).toISOString();
fixtures.reviewed.history.at(-2).at=fixtures.received.updated_at;
fixtures.reviewed.history.at(-1).at=fixtures.reviewed.updated_at;
const rollback=new Error('Synthetic transaction complete');
const receipt={checkedAt:new Date().toISOString(),target:'Separate One DSD pac schema',syntheticOnly:true,scope:'Database contracts, not hosted submission workflow',insert:false,read:false,statusUpdate:false,staleUpdateRejected:false,expiredPayloadRedacted:false,rolledBack:false};
try {
  await db.begin(async tx=>{
    for(const r of [fixtures.active,fixtures.expired])await tx`insert into pac.runtime_work_objects(work_kind,object_id,value) values ('consult_request',${r.request_id},${tx.json(r)})`;
    receipt.insert=true;
    const [read]=await tx`select value from pac.runtime_work_objects where work_kind='consult_request' and object_id=${fixtures.active.request_id}`;
    if(read.value.request_id!==fixtures.active.request_id)throw Error('Read failed');receipt.read=true;
    const [update]=await tx`select * from pac.compare_and_swap_consultation(${fixtures.active.request_id},1,'consultation_request',${fixtures.active.retention_expires_at},'owner_update',${fixtures.received.updated_at}::timestamptz,${tx.json(fixtures.received)})`;
    if(!update.applied)throw Error('Status update failed');receipt.statusUpdate=true;
    const [stale]=await tx`select * from pac.compare_and_swap_consultation(${fixtures.active.request_id},1,'consultation_request',${fixtures.active.retention_expires_at},'owner_update',${fixtures.reviewed.updated_at}::timestamptz,${tx.json(fixtures.reviewed)})`;
    if(stale.applied || stale.reason!=='conflict')throw Error('Stale update accepted');receipt.staleUpdateRejected=true;
    const [expiry]=await tx`select * from pac.compare_and_swap_consultation(${fixtures.expired.request_id},1,'consultation_request',${fixtures.expired.retention_expires_at},'expiry_tombstone',${fixtures.asOf}::timestamptz,${tx.json(fixtures.tombstone)})`;
    if(!expiry.applied || expiry.current_value.packet || expiry.current_value.work_name)throw Error('Redaction failed');receipt.expiredPayloadRedacted=true;
    throw rollback;
  });
} catch(error) {
  if(error===rollback)receipt.rolledBack=true;
  else {console.error(JSON.stringify({passed:false,code:error.code??error.name,message:String(error.message).slice(0,300)}));process.exitCode=1;}
} finally {await db.end({timeout:5});}
fs.writeFileSync('evidence/activation-20261004/supabase-consultation-contract.json',JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt));
