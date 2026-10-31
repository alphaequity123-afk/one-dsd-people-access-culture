import fs from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

export async function downloadVerifiedPackage(url, headers, destination, item, timeoutMs=600000) {
  const response=await fetch(url,{headers,signal:AbortSignal.timeout(timeoutMs)});
  if(!response.ok || !response.body) throw Error('Current asset download HTTP '+response.status);
  let bytes=0;
  const digest=createHash('sha256');
  const verifier=new Transform({transform(chunk,encoding,callback){
    bytes+=chunk.length;
    if(bytes>item.bytes){callback(Error('Current package exceeds expected size'));return;}
    digest.update(chunk);callback(null,chunk);
  }});
  try {
    await pipeline(Readable.fromWeb(response.body),verifier,createWriteStream(destination,{flags:'w'}));
    if(bytes!==item.bytes || digest.digest('hex')!==item.sha256) throw Error('Current package checksum mismatch');
  } catch(error) {
    await fs.rm(destination,{force:true});
    throw error;
  }
}
