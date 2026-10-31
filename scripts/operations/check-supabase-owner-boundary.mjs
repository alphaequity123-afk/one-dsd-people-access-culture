import fs from 'node:fs';
import postgres from 'postgres';
const runtime=postgres(process.env.PAC_RUNTIME_DATABASE_URL,{ssl:'require',prepare:false,max:1,onnotice:()=>{}});
const owner=postgres(process.env.PAC_OWNER_DATABASE_URL,{ssl:'require',prepare:false,max:1,onnotice:()=>{}});
const receipt={checkedAt:new Date().toISOString(),syntheticOnly:true,rolledBack:false,runtimeWriteDenied:false,ownerSave:false,history:false,restore:false};
try{
 try{await runtime`select pac.save_page_text_overrides('dsd','/synthetic-owner-boundary','[]'::jsonb)`;throw Error('Runtime write unexpectedly allowed');}catch(e){if(e.code!=='42501')throw e;receipt.runtimeWriteDenied=true;}
 const rollback=Error('expected rollback');try{await owner.begin(async tx=>{
  const route='/synthetic-owner-boundary';
  const first=[{key:'heading',original:'Synthetic original',text:'Synthetic first'}],second=[{key:'heading',original:'Synthetic original',text:'Synthetic second'}];
  await tx`select pac.save_page_text_overrides('dsd',${route},${tx.json(first)})`;
  await tx`select pac.save_page_text_overrides('dsd',${route},${tx.json(second)})`;receipt.ownerSave=true;
  const h=await tx`select * from pac.read_page_text_history('dsd',${route})`;receipt.history=h.some(v=>v.replacement_text==='Synthetic first');
  await tx`select pac.restore_page_text_route('dsd',${route})`;
  const r=await tx`select * from pac.read_page_text_overrides('dsd',${route})`;receipt.restore=r[0]?.replacement_text==='Synthetic first';
  if(!receipt.history||!receipt.restore)throw Error('History/restore failed');throw rollback;
 });}catch(e){if(e!==rollback)throw e;receipt.rolledBack=true;}
 fs.writeFileSync('evidence/activation-20261004/supabase-owner-boundary.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}catch(e){console.error(JSON.stringify({passed:false,code:e.code??e.name}));process.exitCode=1;}
finally{await runtime.end();await owner.end();}
