import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Keep the shared, immutable media packages intact. Only the explicitly reviewed
// standalone HTML chrome is replaced, then the full release hash gate runs.
const root = process.cwd();
const manifest = JSON.parse(await fs.readFile('config/standalone-public-overrides/index.json', 'utf8'));
if (manifest.format !== 'one-dsd-public-overrides-v1') throw Error('Invalid standalone override manifest');
for (const entry of manifest.files) {
  if (!entry.path.startsWith('public/') || !/\.(html|docx)$/.test(entry.path) || entry.path.split('/').includes('..') || entry.path.includes('\\')) throw Error('Invalid standalone override path');
  const source = path.resolve(root, 'config/standalone-public-overrides/files', entry.path);
  const target = path.resolve(root, entry.path);
  if (!source.startsWith(path.resolve(root, 'config/standalone-public-overrides/files') + path.sep) || !target.startsWith(path.resolve(root, 'public') + path.sep)) throw Error('Standalone override outside approved roots');
  const bytes = await fs.readFile(source);
  if (bytes.length !== entry.bytes || createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw Error('Standalone override checksum mismatch: ' + entry.path);
  await fs.mkdir(path.dirname(target), {recursive: true});
  await fs.writeFile(target, bytes);
}
console.log(`Applied ${manifest.files.length} verified standalone identities.`);
