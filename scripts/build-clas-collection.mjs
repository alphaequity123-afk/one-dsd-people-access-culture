import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import JSZip from 'jszip';

// Build only from published curriculum files; never include learner/browser data.
const root = process.cwd();
const readJson = async name => JSON.parse(await fsp.readFile(path.join(root, name), 'utf8'));
const curriculum = await readJson('lib/content/clas-curriculum.json');
const practice = await readJson('lib/content/clas-curriculum-practice.json');
const origin = 'https://one-dsd-people-access-culture-production.up.railway.app';
const zip = new JSZip();
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const p = value => `<p>${escape(value)}</p>`;
const list = items => `<ul>${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`;
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} — One DSD</title><style>body{font:18px/1.65 system-ui,sans-serif;color:#183247;max-width:1000px;margin:auto;padding:24px}h1,h2,h3,a{color:#003865}header,section{margin:28px 0}header{background:#eef4f8;padding:24px;border-left:5px solid #008eaa}video{width:100%}audio{width:100%}li{margin:12px 0}details{padding:14px;border:1px solid #bacbd7;margin:12px 0}summary{cursor:pointer;font-weight:600}a:focus-visible,summary:focus-visible{outline:3px solid #b88000;outline-offset:4px}pre{white-space:pre-wrap;font:inherit}nav{display:flex;flex-wrap:wrap;gap:20px}@media print{video,audio,nav{display:none}details>*{display:block}}</style></head><body><nav><a href="index.html">Collection home</a><a href="${origin}/learn/clas/collection">Current online collection</a></nav><header><h1>${escape(title)}</h1></header>${body}<footer><p>One DSD People, Access and Culture · Property of Gary Banks</p><p>Use current procedures applicable to your role. <a href="https://thinkculturalhealth.hhs.gov/clas/standards">Read the original National CLAS Standards (internet required).</a></p></footer></body></html>`;
const added = new Set();
async function asset(url) {
  if (!url) return null;
  if (!/^\/learning\/clas-curriculum\/[0-9]{2}\/[a-zA-Z0-9._-]+$/.test(url)) throw new Error(`Unexpected curriculum asset path: ${url}`);
  const relative = url.slice(1);
  if (!added.has(relative)) {
    const source = path.join(root, 'public', relative);
    const stat = await fsp.stat(source);
    if (!stat.size) throw new Error(`Empty asset: ${relative}`);
    zip.file(relative, fs.createReadStream(source));
    added.add(relative);
  }
  return relative;
}
function choices(question) {
  return `<h3>${escape(question.question)}</h3>${question.scenario ? p(question.scenario) : ''}${question.options.map(option => `<details><summary>${escape(option.text)}</summary>${p(option.feedback)}</details>`).join('')}`;
}
const notes = [curriculum.title, 'BLANK WORKING NOTES', 'Use a non-sensitive example. Keep official records in approved systems.', ...['Work example and the experience I want to improve', 'Relevant standards', 'Proposed change and why', 'What I can do and what needs coordination or approval', 'How I will involve people affected', 'Language assistance and accessibility', 'Evidence and review', 'How concerns can be raised', 'Follow-up date and next step'].map(label => `${label}:\n\n\n`)];
for (const [index, module] of curriculum.modules.entries()) {
  const extra = practice.modules.find(item => item.id === module.id);
  const video = await asset(module.video);
  const captions = await asset(module.captions);
  await asset(`/learning/clas-curriculum/${module.id}/transcript.txt`);
  await asset(`/learning/clas-curriculum/${module.id}/chapters.json`);
  const walkthrough = module.walkthrough;
  const audio = walkthrough ? await asset(walkthrough.audio) : null;
  if (walkthrough?.captions) await asset(walkthrough.captions);
  const transcriptPath = walkthrough?.transcript ? await asset(walkthrough.transcript) : null;
  const transcript = transcriptPath ? await fsp.readFile(path.join(root, 'public', transcriptPath), 'utf8') : '';
  const aid = extra?.jobAid;
  const aidBody = aid ? `<section><h2>${escape(aid.title)}</h2>${p(aid.useWhen)}${aid.sections.map(s => `<h3>${escape(s.heading)}</h3>${list(s.items)}`).join('')}<h3>Remember</h3>${list(aid.remember)}<h3>Who to ask</h3>${list(aid.askWho)}</section>` : '';
  if (aid) zip.file(`job-aid-${module.id}.html`, page(`Part ${index + 1}: job aid`, aidBody));
  const body = p(module.deliverable) + p(`CLAS standards: ${module.standards.join(', ')}`)
    + `<section><h2>Watch the lesson</h2><video controls preload="metadata"><source src="${escape(video)}" type="video/mp4"><track kind="captions" src="${escape(captions)}" srclang="en" label="English" default></video><p><a href="${escape(captions)}">Caption file</a>. If your browser restricts local captions, read the full lesson below.</p></section>`
    + (audio ? `<section><h2>Listen to the discussion</h2><audio controls preload="metadata" src="${escape(audio)}"></audio><details><summary>Read the discussion transcript</summary><pre>${escape(transcript)}</pre></details></section>` : '')
    + `<section><h2>Read the full lesson</h2>${module.sections.map(s => `<h3>${escape(s.title)}</h3>${s.paragraphs.map(p).join('')}`).join('')}</section>`
    + `<section><h2>${escape(module.example.title)}</h2>${p(module.example.situation)}<details><summary>Work through the example</summary>${p(module.example.response)}${p(module.example.reason)}</details></section>`
    + `<section><h2>Practice and compare your reasoning</h2>${choices(module.practice)}${(extra?.recall ?? []).map(choices).join('')}${(extra?.decisions ?? []).map(choices).join('')}`
    + (extra?.ordering ? `<h3>${escape(extra.ordering.prompt)}</h3>${p(extra.ordering.scenario)}${list(extra.ordering.steps)}<details><summary>Compare the sequence and reasoning</summary><ol>${extra.ordering.correctOrder.map(n => `<li>${escape(extra.ordering.steps[n])}</li>`).join('')}</ol>${p(extra.ordering.feedback)}</details>` : '') + '</section>'
    + (extra?.keyPoints?.length ? `<section><h2>Key points</h2>${extra.keyPoints.map(k => `<h3>${escape(k.chapter)}</h3>${list(k.points)}`).join('')}</section>` : '')
    + `<section><h2>Bring it into your work</h2>${p(module.practice.reflection)}<p><a href="working-notes.txt" download>Save the blank working notes</a> and write in your own copy.</p></section>` + aidBody
    + `<nav>${index > 0 ? `<a href="lesson-${curriculum.modules[index - 1].id}.html">Previous lesson</a>` : ''}${index < curriculum.modules.length - 1 ? `<a href="lesson-${curriculum.modules[index + 1].id}.html">Next lesson</a>` : '<a href="index.html">Return to the collection</a>'}</nav>`;
  zip.file(`lesson-${module.id}.html`, page(`Part ${index + 1}: ${module.title}`, body));
  notes.push(`Part ${index + 1}: ${module.title}\n${module.practice.reflection}\n\nMy notes:\n\n\n`);
}
notes.push('STANDARDS INDEX', ...curriculum.standards.map(s => `Standard ${s.number}: ${s.focus} — Part ${Number(s.lesson)}`));
zip.file('working-notes.txt', notes.join('\n\n'));
zip.file('curriculum.json', JSON.stringify(curriculum, null, 2));
zip.file('practice.json', JSON.stringify(practice, null, 2));
const checklist = 'documents/engagement/clas-implementation-checklist.pdf';
await fsp.access(path.join(root, 'public', checklist));
zip.file('implementation-checklist.pdf', fs.createReadStream(path.join(root, 'public', checklist)));
zip.file('index.html', page('CLAS curriculum collection', `<p>Nine connected lessons for individual learning and shared discussion. Extract the whole ZIP before opening this page. Videos, audio, transcripts, captions and practice feedback are included and work without an internet connection. Links to the live app and original standards require internet access.</p><ol>${curriculum.modules.map(m => `<li><a href="lesson-${m.id}.html">${escape(m.title)}</a>${p(m.deliverable)}</li>`).join('')}</ol><section><h2>Planning and working notes</h2><ul><li><a href="working-notes.txt" download>Blank working notes and improvement plan</a></li><li><a href="implementation-checklist.pdf">Implementation checklist and action worksheet</a></li><li><a href="${origin}/practice/clas">Online cultural and language access planning worksheet</a> (internet required)</li></ul><p>Use a non-sensitive work example. This package contains no personal progress or saved notes. Practice feedback is available by opening each response; the live app also offers interactive activities and progress tracking.</p></section>`));
zip.file('README.txt', 'CLAS CURRICULUM COLLECTION\n\nExtract the entire ZIP, then open index.html in a browser. Keep the folders together.\nAll nine videos, discussion audio, transcripts, captions, practice and feedback, job aids, blank working notes and implementation checklist are included.\nBrowser restrictions may prevent captions loading from local files; complete lesson and discussion transcripts are included on each page.\nThe live app and official source links need internet. Personal progress and notes are not included.\n\nCurrent collection: ' + origin + '/learn/clas/collection\n');
const destination = path.join(root, 'public/downloads/clas-curriculum-collection.zip');
await fsp.mkdir(path.dirname(destination), { recursive: true });
const temporary = destination + '.tmp';
await pipeline(zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true, compression: 'STORE' }), fs.createWriteStream(temporary));
await fsp.rename(temporary, destination);
console.log(`CLAS collection built: ${curriculum.modules.length} lessons, ${added.size} media/text assets, ${(await fsp.stat(destination)).size} bytes.`);
