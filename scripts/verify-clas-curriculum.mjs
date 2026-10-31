import fs from 'node:fs';import crypto from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('config/clas-curriculum-media.json','utf8'));
if(manifest.lessons!==9||manifest.files.length!==45)throw new Error('Incomplete CLAS learning media');
for(const f of manifest.files){if(crypto.createHash('sha256').update(fs.readFileSync(f.path)).digest('hex')!==f.sha256)throw new Error('CLAS media changed: '+f.path);}
console.log('Nine complete CLAS video packages verified');
