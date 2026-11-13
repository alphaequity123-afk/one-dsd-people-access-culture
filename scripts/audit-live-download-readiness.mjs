/** Check every featured document/format with the explicit publication-guarded HEAD route. */
import fs from 'node:fs';
import path from 'node:path';
const directory = '.data/source-coverage-completion/featured-links';
const manifest = JSON.parse(fs.readFileSync(path.join(directory,'download-links.json')));
const concurrency = Math.max(1,Math.min(8,Number(process.env.DSD_DOWNLOAD_CONCURRENCY || 4)));
const expected = {pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',html:'text/html',txt:'text/plain'};
const probe = await fetch(manifest[0].url,{method:'HEAD',signal:AbortSignal.timeout(45000)});
if(probe.headers.get('x-download-readiness')!=='available')throw new Error('Explicit HEAD readiness handler is not deployed. Stop rather than rendering every binary through implicit HEAD.');
const receipt = path.join(directory,'download-head-checks.jsonl'), done=new Map();
if(fs.existsSync(receipt))for(const line of fs.readFileSync(receipt,'utf8').split('\n').filter(Boolean)){const row=JSON.parse(line);if(row.ok)done.set(row.url,row);}
const batchLimit = Math.max(1,Number(process.env.DSD_DOWNLOAD_BATCH_LIMIT || Infinity));
const pending=manifest.filter(row=>!done.has(row.url)).slice(0,batchLimit);
async function inspect(row){
  const started=Date.now(),format=new URL(row.url).searchParams.get('format');let result;
  for(let attempt=0;attempt<2;attempt++){
    try{
      const response=await fetch(row.url,{method:'HEAD',signal:AbortSignal.timeout(45000),headers:{'User-Agent':'OneDSD-Owner-Download-Readiness/1.0'}});
      const type=response.headers.get('content-type')||'',disposition=response.headers.get('content-disposition')||'',readiness=response.headers.get('x-download-readiness');
      const ok=response.ok&&readiness==='available'&&type.startsWith(expected[format])&&/^attachment;/.test(disposition)&&response.headers.get('x-content-type-options')==='nosniff';
      result={url:row.url,pages:row.pages,format,status:response.status,type,disposition,readiness,ok,checkedAt:new Date().toISOString(),ms:Date.now()-started};
      if(!ok&&!attempt&&(response.status===429||response.status>=500)){await new Promise(resolve=>setTimeout(resolve,1500));continue;}
      break;
    }catch(error){result={url:row.url,format,ok:false,error:String(error),checkedAt:new Date().toISOString(),ms:Date.now()-started};if(!attempt){await new Promise(resolve=>setTimeout(resolve,1500));continue;}}
  }
  done.set(row.url,result);fs.appendFileSync(receipt,JSON.stringify(result)+'\n');
  if(!result.ok)console.log('FAIL '+JSON.stringify(result));
  if(done.size%250===0)console.log(JSON.stringify({checked:done.size,total:manifest.length,failures:[...done.values()].filter(row=>!row.ok).length}));
}
let cursor=0;
await Promise.all(Array.from({length:concurrency},async()=>{while(cursor<pending.length){await inspect(pending[cursor++]);await new Promise(resolve=>setTimeout(resolve,40));}}));
const results=manifest.flatMap(row=>done.has(row.url)?[done.get(row.url)]:[]);
const summary={checkedAt:new Date().toISOString(),total:manifest.length,checked:results.length,remaining:manifest.length-results.length,concurrency,passed:results.filter(row=>row.ok).length,failures:results.filter(row=>!row.ok),method:'Explicit HEAD resolves published document and supported format with same guards as GET; binary rendering is checked separately on representative downloads',results};
fs.writeFileSync(path.join(directory,'download-head-results.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({...summary,results:undefined}));
