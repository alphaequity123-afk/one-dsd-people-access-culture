// Verify the seven published media sets without altering the assets.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config/intercultural-curriculum-media.json'), 'utf8'));
const names = ['lesson.mp4', 'poster.png', 'captions.vtt', 'transcript.txt', 'chapters.json'];
const expected = new Set(Array.from({length:7}, (_, i) => names.map(n => `public/learning/intercultural-curriculum/${String(i + 1).padStart(2, '0')}/${n}`)).flat());
if (manifest.lessons !== 7 || !Array.isArray(manifest.files) || manifest.files.length !== 35) throw Error('Intercultural media manifest incomplete');
for (const item of manifest.files) {
  if (!item || !expected.delete(item.path) || !/^[a-f0-9]{64}$/.test(item.sha256)) throw Error('Unexpected Intercultural media entry');
  const file = path.join(process.cwd(), ...item.path.split('/'));
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error(`Invalid Intercultural media file: ${item.path}`);
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  try { const buffer = Buffer.allocUnsafe(1024 * 1024); let n; while ((n = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, n)); }
  finally { fs.closeSync(fd); }
  if (hash.digest('hex') !== item.sha256) throw Error(`Intercultural media differs: ${item.path}`);
}
if (expected.size) throw Error('Missing Intercultural media');
console.log('Intercultural media integrity verified.');
