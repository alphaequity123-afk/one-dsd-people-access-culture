/** Actual file rendering, separate from the exhaustive HEAD readiness census. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {unzipSync,strFromU8} from 'fflate';
const root='.data/source-coverage-completion/featured-links';
const files=path.join(root,'rendered-downloads');fs.mkdirSync(files,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(root,'download-links.json')));
const selected=new Map(),seenKinds=new Set();
for(const row of manifest){
  const url=new URL(row.url),kind=url.pathname.split('/')[3];
  if(url.searchParams.get('format')==='txt'&&!seenKinds.has(kind)){seenKinds.add(kind);selected.set(row.url,{...row,reason:'one complete text render per document family'});}
}
for(const identity of ['water-we-swim-in/essay','course/the-record','library/ext-dhs-equity-toolkit']){
  const rows=manifest.filter(row=>new URL(row.url).pathname===`/api/downloads/${identity}`);
  if(rows.length!==6)throw Error('Missing six-format representative: '+identity);
  for(const row of rows)selected.set(row.url,{...row,reason:identity==='course/the-record'?'largest indexed course text; all six formats':'long-form essay or operational toolkit; all six formats'});
}
function validate(format,bytes){
  const text=bytes.toString('utf8');
  if(format==='pdf')return {ok:bytes.subarray(0,5).toString()==='%PDF-'&&bytes.subarray(-1024).toString().includes('%%EOF')&&/\/Type\s*\/Page\b/.test(bytes.toString('latin1')),bytes:bytes.length,pages:(bytes.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length};
  if(['docx','xlsx','pptx'].includes(format)){
    const zip=unzipSync(bytes),names=Object.keys(zip),prefix=format==='docx'?'word/document.xml':format==='xlsx'?'xl/':'ppt/slides/slide';
    const content=names.filter(name=>name.startsWith(prefix)&&name.endsWith('.xml')).map(name=>strFromU8(zip[name])).join(' ');
    const words=content.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    return {ok:names.includes('[Content_Types].xml')&&words.length>100,entries:names.length,contentCharacters:words.length,bytes:bytes.length};
  }
  const content=format==='html'?text.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim():text.trim();
  return {ok:content.length>100&&(format!=='html'||/<html\b/i.test(text)),bytes:bytes.length,contentCharacters:content.length};
}
const results=[];
for(const row of selected.values()){
  const started=Date.now(),url=new URL(row.url),format=url.searchParams.get('format');let result;
  try{
    const response=await fetch(row.url,{signal:AbortSignal.timeout(90000),headers:{'User-Agent':'OneDSD-Owner-Rendered-Download-Audit/1.0'}});
    const bytes=Buffer.from(await response.arrayBuffer()),fallback=response.headers.get('x-download-fallback'),validation=validate(format,bytes);
    const filename=createHash('sha256').update(row.url).digest('hex').slice(0,16)+'.'+format;fs.writeFileSync(path.join(files,filename),bytes);
    result={url:row.url,reason:row.reason,format,status:response.status,type:response.headers.get('content-type'),fallback,validation,ok:response.ok&&!fallback&&validation.ok,file:filename,checkedAt:new Date().toISOString(),ms:Date.now()-started};
  }catch(error){result={url:row.url,format,ok:false,error:String(error),checkedAt:new Date().toISOString(),ms:Date.now()-started};}
  results.push(result);fs.appendFileSync(path.join(root,'download-render-checks.jsonl'),JSON.stringify(result)+'\n');
  console.log(JSON.stringify({checked:results.length,total:selected.size,url:row.url,ok:result.ok,ms:result.ms}));
  await new Promise(resolve=>setTimeout(resolve,100));
}
const summary={checkedAt:new Date().toISOString(),total:results.length,passed:results.filter(row=>row.ok).length,failures:results.filter(row=>!row.ok),families:seenKinds.size,method:'Full GET: each family text plus all six formats for three substantive documents; Office ZIP structure/content, PDF signature/page objects/EOF, HTML and text content verified',results};
fs.writeFileSync(path.join(root,'download-render-results.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({...summary,results:undefined}));
