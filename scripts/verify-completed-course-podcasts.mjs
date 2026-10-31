import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const m=JSON.parse(await fs.readFile('config/completed-course-podcasts.json','utf8'));
if(m.files.length!==16)throw Error('Expected four complete podcast packages');
for(const f of m.files){if(!/^public\/learning\/completed-course-podcasts\/[a-z0-9-]+\/(episode.mp3|captions.vtt|transcript.txt|transcript.json)$/.test(f.path))throw Error('Unexpected podcast path');const b=await fs.readFile(f.path);if(b.length!==f.bytes||createHash('sha256').update(b).digest('hex')!==f.sha256)throw Error('Podcast asset mismatch: '+f.path);}
console.log('Verified four completed podcast packages: 16 assets');
