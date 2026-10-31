import { createReadStream, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const manifest = JSON.parse(readFileSync('config/equity-everyday-media.json', 'utf8'));
const content = JSON.parse(readFileSync('lib/content/equity-everyday-decisions.json', 'utf8'));
const names = ['lesson.mp4', 'poster.png', 'captions.vtt', 'transcript.txt', 'chapters.json'];
const fail = (message) => { throw new Error(message); };
if (manifest.lessons !== 8 || !Array.isArray(manifest.files) || manifest.files.length !== 40 || content.modules?.length !== 8) fail('The learning media collection is incomplete.');
const files = new Map();
for (const entry of manifest.files) {
  if (!entry || typeof entry.path !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256) || files.has(entry.path)) fail('The learning media list is invalid.');
  files.set(entry.path, entry.sha256);
}
const hashFile = async (file) => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
for (let i = 1; i <= 8; i += 1) {
  const id = String(i).padStart(2, '0'); const item = content.modules[i - 1];
  if (item?.id !== id || item.mediaReady !== true || !Number.isFinite(item.durationSeconds) || item.durationSeconds <= 0 || !Array.isArray(item.chapters) || !item.chapters.length) fail(`Lesson ${id} is incomplete.`);
  for (const key of ['video', 'captions', 'poster']) {
    const expected = { video: 'lesson.mp4', captions: 'captions.vtt', poster: 'poster.png' }[key];
    if (item[key] !== `/learning/equity-everyday-decisions/${id}/${expected}`) fail(`Lesson ${id} has an unexpected media link.`);
  }
  for (const name of names) {
    const path = `public/learning/equity-everyday-decisions/${id}/${name}`;
    if (!files.has(path) || await hashFile(path) !== files.get(path)) fail(`Media verification failed: ${path}`);
  }
  const delivered = JSON.parse(readFileSync(`public/learning/equity-everyday-decisions/${id}/chapters.json`, 'utf8'));
  if (JSON.stringify(delivered) !== JSON.stringify(item.chapters)) fail(`Lesson ${id} chapters differ.`);
  if (item.chapters.some((c, n) => typeof c.title !== 'string' || !c.title || !Number.isFinite(c.start) || c.start < 0 || c.start >= item.durationSeconds || (n > 0 && c.start <= item.chapters[n - 1].start))) fail(`Lesson ${id} chapter times are invalid.`);
}
console.log('All eight learning media packages are present and verified.');
