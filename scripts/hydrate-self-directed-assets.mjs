import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd();
const assets=path.join(root,'data/self-directed-assets');
const destination=path.join(root,'public/learning/self-directed/courses');
await fs.mkdir(destination,{recursive:true});
const recipes=JSON.parse(await fs.readFile(path.join(assets,'recipes.json'),'utf8'));
for(const recipe of recipes){
  const output=path.join(destination,recipe.filename);
  const temporary=output+'.tmp';
  const handle=await fs.open(temporary,'w');
  const hash=createHash('sha256');let bytes=0;
  async function write(buffer){hash.update(buffer);bytes+=buffer.length;await handle.write(buffer);}
  try{
    for(const step of recipe.steps){await write(Buffer.from(step.prefix,'base64'));await write(await fs.readFile(path.join(assets,'blobs',step.blob)));}
    await write(Buffer.from(recipe.suffix,'base64'));
  }finally{await handle.close();}
  if(bytes!==recipe.bytes||hash.digest('hex')!==recipe.sha256){await fs.unlink(temporary);throw Error('Course download did not match the approved file: '+recipe.number);}
  await fs.rename(temporary,output);
}
console.log('Verified and restored all '+recipes.length+' approved PowerPoint downloads.');
