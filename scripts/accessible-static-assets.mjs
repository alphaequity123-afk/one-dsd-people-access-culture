import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import JSZip from 'jszip';

// Accessibility changes are derived from exact approved originals. A local ignored cache
// retains verified originals for repeated builds; clean builds use the normal source
// restoration pipeline. Unknown hashes fail closed. Office outputs are standard ZIPs.
const root=process.cwd();
const folder=path.join(root,'config/accessible-static-assets');
const manifest=JSON.parse(await fs.readFile(path.join(folder,'index.json'),'utf8'));
if(manifest.format!=='one-dhs-accessible-static-v1')throw Error('Invalid accessible artifact manifest');
const mode=process.argv[2]||'apply';
if(!['apply','restore','record','verify'].includes(mode))throw Error('Invalid accessibility artifact operation');
const alt=JSON.parse(await fs.readFile(path.join(folder,'image-alt.json'),'utf8'));
const patches=JSON.parse(await fs.readFile(path.join(folder,'pdf-title-patches.json'),'utf8'));
const htmlPatches=JSON.parse(await fs.readFile(path.join(folder,'html-patches.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>');
function directory(bytes){
 let end=bytes.length-22;
 for(;end>=Math.max(0,bytes.length-65557);end--)if(bytes.readUInt32LE(end)===0x06054b50&&end+22+bytes.readUInt16LE(end+20)===bytes.length)break;
 if(end<0)throw Error('ZIP directory not found');
 const count=bytes.readUInt16LE(end+10),offset=bytes.readUInt32LE(end+16);const entries=[];const names=new Set();let at=offset;
 for(let i=0;i<count;i++){
  if(bytes.readUInt32LE(at)!==0x02014b50)throw Error('Invalid ZIP central directory');
  const size=46+bytes.readUInt16LE(at+28)+bytes.readUInt16LE(at+30)+bytes.readUInt16LE(at+32);
  const record=Buffer.from(bytes.subarray(at,at+size));const name=record.subarray(46,46+record.readUInt16LE(28)).toString('utf8');
  if(names.has(name))throw Error('Duplicate ZIP entry: '+name);names.add(name);entries.push({name,record});at+=size;
 }
 return {entries,end};
}

function htmlRepair(original,entry){
 let output=original;
 const edits=htmlPatches[entry.path];if(!Array.isArray(edits))throw Error('Missing reviewed HTML patches');
 let boundary=original.length;
 for(const edit of [...edits].reverse()){
  if(!Number.isSafeInteger(edit.start)||!Number.isSafeInteger(edit.end)||edit.start<0||edit.end<edit.start||edit.end>boundary||original.subarray(edit.start,edit.end).toString('utf8')!==edit.before)throw Error('Invalid reviewed HTML patch: '+entry.path);
  output=Buffer.concat([output.subarray(0,edit.start),Buffer.from(edit.after,'utf8'),output.subarray(edit.end)]);boundary=edit.start;
 }
 return output;
}

async function officeRepair(original,kind){
 const zip=await JSZip.loadAsync(original);const changes=new Map();
 if(kind==='docx'){
  let styles=await zip.file('word/styles.xml').async('string');
  styles=styles.replace(/(<w:rPrDefault>\s*<w:rPr>)([\s\S]*?)(<\/w:rPr>)/,(all,start,body,end)=>start+body+(body.includes('<w:lang')?'':'<w:lang w:val="en-US"/>')+end);
  changes.set('word/styles.xml',styles);
  const doc=await zip.file('word/document.xml').async('string');
  const titleParagraph=[...doc.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)].map(x=>x[0]).find(p=>/<w:pStyle[^>]*w:val="Title"/.test(p));
  if(!titleParagraph)throw Error('No existing document title');
  const title=[...titleParagraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(x=>x[1]).join('');
  let core=await zip.file('docProps/core.xml').async('string');core=core.replace(/<dc:title(?:\s[^>]*)?>[\s\S]*?<\/dc:title>/,`<dc:title>${title}</dc:title>`);changes.set('docProps/core.xml',core);
 }else{
  for(const name of Object.keys(zip.files).filter(n=>/^ppt\/(slides\/slide|slideMasters\/slideMaster|slideLayouts\/slideLayout)\d+\.xml$/.test(n))){
   let xml=await zip.file(name).async('string');const originalText=[...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map(x=>x[1]).join('\n');
   if(name.startsWith('ppt/slides/')){
   const shapes=[...xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map(x=>x[0]);
   const title=shapes.find(s=>/<p:cNvPr[^>]*name="(?:Course title|Slide title|Closing title)"/.test(s)&&s.includes('<a:t>'))||shapes.filter(s=>s.includes('<a:t>'))[1];
   if(!title)throw Error('No known slide title: '+name);
   if(!/<p:ph[^>]*type="(?:title|ctrTitle)"/.test(xml)){
    const revised=title.replace(/<p:nvPr\s*\/>/,'<p:nvPr><p:ph type="title"/></p:nvPr>').replace(/<p:nvPr><\/p:nvPr>/,'<p:nvPr><p:ph type="title"/></p:nvPr>');
    if(revised===title)throw Error('Unsupported title structure: '+name);xml=xml.replace(title,revised);
   }
   }
   const relName=path.posix.dirname(name)+'/_rels/'+path.posix.basename(name)+'.rels';
   const rel=await zip.file(relName).async('string');const targets=new Map([...rel.matchAll(/<Relationship\s[^>]*>/g)].map(x=>{const id=x[0].match(/\bId="([^"]+)"/)[1];const target=x[0].match(/\bTarget="([^"]+)"/)[1];return[id,decode(target)];}));
   for(const match of [...xml.matchAll(/<p:pic>[\s\S]*?<\/p:pic>/g)]){
    const pic=match[0];const prop=pic.match(/<p:cNvPr\b[^>]*>/)?.[0];if(!prop||/\bdescr="[^"]+"/.test(prop))continue;
    const id=pic.match(/\br:embed="([^"]+)"/)?.[1];if(!id)continue;const target=targets.get(id);const image=target.startsWith('/')?target.slice(1):path.posix.normalize(path.posix.join(path.posix.dirname(name),target));
    const hash=sha(await zip.file(image).async('nodebuffer'));if(!alt[hash])throw Error('Unreviewed image needs alternative text: '+hash);
    const labeled=prop.replace(/\sdescr="[^"]*"/,'').replace(/\/?>(?=$)/,ending=>` descr="${escape(alt[hash])}"${ending}`);xml=xml.replace(pic,pic.replace(prop,labeled));
   }
   xml=xml.replace(/<a:(rPr|defRPr|endParaRPr)\b([^>]*?)(\/?)>/g,(all,tag,attrs,end)=>/\blang=/.test(attrs)?all:`<a:${tag}${attrs} lang="en-US"${end}>`);
   const finalText=[...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map(x=>x[1]).join('\n');if(finalText!==originalText)throw Error('Slide content changed');
   changes.set(name,xml);
  }
 }
 for(const [name,xml] of changes){const date=zip.file(name).date;zip.file(name,xml,{date,createFolders:false});}
 const result=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:9},platform:'DOS'});directory(result);await JSZip.loadAsync(result,{checkCRC32:true});return result;
}

let count=0;
for(const entry of manifest.files){
 if(!entry.path.startsWith('public/')||entry.path.includes('\\')||entry.path.split('/').some(p=>!p||p==='.'||p==='..')||!['pdf','docx','pptx','html'].includes(entry.kind))throw Error('Invalid artifact path');
 const filename=path.join(root,entry.path);let bytes=await fs.readFile(filename).catch(error=>{if(mode==='restore'&&error.code==='ENOENT')return null;throw error;});
 if(bytes===null)continue;
 // Leave missing/unhydrated sources to the existing verified restoration pipeline.
 if(mode==='restore'&&bytes.length<1024&&/^version https:\/\/git-lfs.github.com\/spec\/v1\r?\noid sha256:[a-f0-9]{64}\r?\nsize \d+\r?\n?$/.test(bytes.toString('utf8')))continue;
 const current=sha(bytes);
 if(mode==='restore'){
  if(current===entry.originalSha256&&bytes.length===entry.originalBytes)continue;
  if(current!==entry.repairedSha256||bytes.length!==entry.repairedBytes)throw Error('Unknown artifact identity before restore: '+entry.path);
  bytes=await fs.readFile(path.join(root,'.cache/accessible-static-assets',entry.originalSha256)).catch(()=>{throw Error('Verified original cache unavailable; restore approved source assets before rebuilding: '+entry.path);});
  if(bytes.length!==entry.originalBytes||sha(bytes)!==entry.originalSha256)throw Error('Cached original identity mismatch');await fs.writeFile(filename,bytes);count++;continue;
 }
 if(mode==='verify'){
  if(current!==entry.repairedSha256||bytes.length!==entry.repairedBytes)throw Error('Accessible artifact mismatch: '+entry.path);if(['docx','pptx'].includes(entry.kind))directory(bytes);count++;continue;
 }
 if(current===entry.repairedSha256&&bytes.length===entry.repairedBytes){if(mode!=='record'){count++;continue;}bytes=await fs.readFile(path.join(root,'.cache/accessible-static-assets',entry.originalSha256));}
 if(sha(bytes)!==entry.originalSha256||bytes.length!==entry.originalBytes)throw Error('Unapproved source artifact: '+entry.path);
 const cache=path.join(root,'.cache/accessible-static-assets');await fs.mkdir(cache,{recursive:true});await fs.writeFile(path.join(cache,entry.originalSha256),bytes);
 const revised=entry.kind==='html'?htmlRepair(bytes,entry):entry.kind==='pdf'?Buffer.concat([bytes,Buffer.from(patches[entry.path],'base64')]):await officeRepair(bytes,entry.kind);
 const hash=sha(revised);
 if(mode==='record'){entry.repairedSha256=hash;entry.repairedBytes=revised.length;}
 else if(hash!==entry.repairedSha256||revised.length!==entry.repairedBytes)throw Error('Derived artifact identity mismatch: '+entry.path);
 await fs.writeFile(filename,revised);count++;if(count%10===0)console.log(`Verified ${count}/${manifest.files.length} artifact repairs`);
}
if(mode==='record')await fs.writeFile(path.join(folder,'index.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Verified ${mode} of ${count} accessible static artifacts; exact source identities retained.`);
