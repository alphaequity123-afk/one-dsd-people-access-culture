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
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} — One DSD</title><style>body{font:18px/1.65 system-ui,sans-serif;color:#183247;max-width:1000px;margin:auto;padding:24px}h1,h2,h3,a{color:#003865}header,section{margin:28px 0}header{background:#eef4f8;padding:24px;border-left:5px solid #008eaa}video{width:100%}audio{width:100%}li{margin:12px 0}details{padding:14px;border:1px solid #bacbd7;margin:12px 0}summary{cursor:pointer;font-weight:600}a:focus-visible,summary:focus-visible{outline:3px solid #b88000;outline-offset:4px}pre{white-space:pre-wrap;font:inherit}button,select,textarea{font:inherit;padding:10px;max-width:100%;box-sizing:border-box}button{cursor:pointer}textarea{width:100%;display:block}fieldset{margin:20px 0;padding:18px}label{display:block;margin:12px 0}[data-transcript] button{display:block;text-align:left;width:100%;margin:6px 0}[data-current-caption]{min-height:3em;background:#eef4f8;padding:12px}nav{display:flex;flex-wrap:wrap;gap:20px}@media print{video,audio,nav{display:none}details>*{display:block}}</style></head><body><nav><a href="index.html">Collection home</a><a href="${origin}/learn/clas/collection">Current online collection</a></nav><header><h1>${escape(title)}</h1></header>${body}<footer><p>One DSD People, Access and Culture · Property of Gary Banks</p><p>Use current procedures applicable to your role. <a href="https://thinkculturalhealth.hhs.gov/clas/standards">Read the original National CLAS Standards (internet required).</a></p></footer><script src="clas-offline.js" defer></script></body></html>`;
const added = new Set();
const lessonViews = [];
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
let questionNumber = 0;
function choices(question) {
  const id = `question-${++questionNumber}`;
  return `<fieldset data-question><legend>${escape(question.question)}</legend>${question.scenario ? p(question.scenario) : ''}${question.options.map(option => `<label><input type="radio" name="${id}" data-feedback="${escape(option.feedback)}"> ${escape(option.text)}</label>`).join('')}<p role="status" aria-live="polite"></p></fieldset>`;
}
async function player(kind, source, captionPath) {
  const text = captionPath ? await fsp.readFile(path.join(root, 'public', captionPath.replace(/^\//, '')), 'utf8') : '';
  const json = JSON.stringify(text).replace(/</g, '\\u003c');
  return `<section data-player><h2>${kind === 'video' ? 'Watch the lesson' : 'Listen to the discussion'}</h2><${kind} controls preload="metadata" src="${escape(source)}">${kind === 'video' ? '<track kind="captions" srclang="en" label="English" default>' : ''}</${kind}><p><button type="button" data-toggle>Play</button> <label>Playback speed <select data-speed><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label></p><p data-current-caption aria-label="Current caption"></p><details><summary>Read and navigate the synced transcript</summary><div data-transcript></div></details><p><a href="${escape(source)}">Open the ${kind} file directly</a></p><script type="application/json" data-captions>${json}</script></section>`;
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
    + await player('video', video, captions)
    + (audio ? await player('audio', audio, walkthrough.captions) + `<details><summary>Read the full discussion text</summary><pre>${escape(transcript)}</pre></details>` : '')
    + `<section><h2>Read the full lesson</h2>${module.sections.map(s => `<h3>${escape(s.title)}</h3>${s.paragraphs.map(p).join('')}`).join('')}</section>`
    + `<section><h2>${escape(module.example.title)}</h2>${p(module.example.situation)}<details><summary>Work through the example</summary>${p(module.example.response)}${p(module.example.reason)}</details></section>`
    + `<section><h2>Practice and compare your reasoning</h2>${choices(module.practice)}${(extra?.recall ?? []).map(choices).join('')}${(extra?.decisions ?? []).map(choices).join('')}`
    + (extra?.ordering ? `<div data-ordering="${escape(JSON.stringify(extra.ordering.correctOrder))}" data-feedback="${escape(extra.ordering.feedback)}"><h3>${escape(extra.ordering.prompt)}</h3>${p(extra.ordering.scenario)}${extra.ordering.steps.map((_, i) => `<label>Step ${i + 1}<select><option value="">Choose a step</option>${extra.ordering.steps.map((step, n) => `<option value="${n}">${escape(step)}</option>`).join('')}</select></label>`).join('')}<button type="button">Check the sequence</button><p role="status" aria-live="polite"></p><details><summary>Compare the sequence and reasoning</summary><ol>${extra.ordering.correctOrder.map(n => `<li>${escape(extra.ordering.steps[n])}</li>`).join('')}</ol>${p(extra.ordering.feedback)}</details></div>` : '') + '</section>'
    + (extra?.keyPoints?.length ? `<section><h2>Key points</h2>${extra.keyPoints.map(k => `<h3>${escape(k.chapter)}</h3>${list(k.points)}`).join('')}</section>` : '')
    + `<section><h2>Bring it into your work</h2>${p(module.practice.reflection)}<label for="working-note-${module.id}">Your working note for Part ${index + 1}</label><textarea id="working-note-${module.id}" rows="6" data-note="Part ${index + 1}: ${escape(module.title)}"></textarea><p data-save-status role="status"></p><button type="button" data-download-notes>Download my working notes</button> <button type="button" data-complete="${module.id}">Mark lesson complete</button><p><a href="working-notes.txt" download>Download blank working notes</a> · <a href="index.html#plan">Build your improvement plan</a></p><p>Notes stay in your browser when storage is available. Download a copy before moving to another computer. Do not enter private or case information.</p></section>` + aidBody
    + `<nav>${index > 0 ? `<a href="index.html#lesson-${curriculum.modules[index - 1].id}">Previous lesson</a>` : ''}${index < curriculum.modules.length - 1 ? `<a href="index.html#lesson-${curriculum.modules[index + 1].id}">Next lesson</a>` : '<a href="index.html">Return to the collection</a>'}</nav>`;
  lessonViews.push(`<article data-view="lesson-${module.id}" hidden><header><h1>Part ${index + 1}: ${escape(module.title)}</h1></header>${body}</article>`);
  notes.push(`Part ${index + 1}: ${module.title}\n${module.practice.reflection}\n\nMy notes:\n\n\n`);
}
notes.push('STANDARDS INDEX', ...curriculum.standards.map(s => `Standard ${s.number}: ${s.focus} — Part ${Number(s.lesson)}`));
zip.file('working-notes.txt', notes.join('\n\n'));
zip.file('clas-offline.js', await fsp.readFile(path.join(root, 'scripts/clas-offline.js')));
const planFields = ['Work example and intended experience', 'Relevant standards and barriers', 'Proposed change and why', 'Role, coordination and approval', 'Participation of people affected', 'Language assistance and accessibility', 'Evidence and review', 'Concern pathway', 'Next step and follow-up date'];
const planView = `<article data-view="plan" hidden><h1>Your CLAS improvement plan</h1><p>Your lesson notes and plan stay on this computer. Download a copy to keep them. Avoid private or case information.</p>${planFields.map((field, i) => `<label for="plan-${i}">${escape(field)}</label><textarea id="plan-${i}" rows="4" data-note="Plan: ${escape(field)}"></textarea>`).join('')}<p data-save-status role="status"></p><button type="button" data-download-notes>Download my plan and lesson notes</button></article>`;
zip.file('curriculum.json', JSON.stringify(curriculum, null, 2));
zip.file('practice.json', JSON.stringify(practice, null, 2));
const checklist = 'documents/engagement/clas-implementation-checklist.pdf';
await fsp.access(path.join(root, 'public', checklist));
zip.file('implementation-checklist.pdf', fs.createReadStream(path.join(root, 'public', checklist)));
zip.file('index.html', page('CLAS curriculum collection', `<article data-view="home"><p>Nine connected lessons for individual learning and shared discussion. Extract the whole ZIP before opening this page. Videos, audio, transcripts, captions and practice feedback are included and work without an internet connection. Links to the live app and original standards require internet access.</p><p data-progress></p><ol>${curriculum.modules.map(m => `<li><a href="index.html#lesson-${m.id}">${escape(m.title)}</a>${p(m.deliverable)}</li>`).join('')}</ol><section><h2>Planning and working notes</h2><ul><li><a href="index.html#plan">Write and download your improvement plan</a></li><li><a href="working-notes.txt" download>Blank working notes and improvement plan</a></li><li><a href="implementation-checklist.pdf">Implementation checklist and action worksheet</a></li><li><a href="${origin}/practice/clas">Online cultural and language access planning worksheet</a> (internet required)</li></ul><p>Use a non-sensitive work example. This package contains no personal progress or saved notes. Choose responses to see feedback, check your activity sequence, mark lessons complete, and write and download your notes and plan. Browser storage is used when available; download your notes to keep a reliable copy.</p></section></article>${lessonViews.join('')}${planView}`));
zip.file('README.txt', 'CLAS CURRICULUM COLLECTION\n\nExtract the entire ZIP, then open index.html in a browser. Keep the folders together.\nAll nine videos, discussion audio, transcripts, captions, practice and feedback, job aids, blank working notes and implementation checklist are included.\nCaptions and synced transcripts are embedded for local playback. Practice feedback, ordering activities, working notes, plan downloads and completion controls are included. Browser storage depends on browser settings; download your notes to keep a reliable copy.\nThe live app and official source links need internet. Personal progress and notes are not included.\n\nCurrent collection: ' + origin + '/learn/clas/collection\n');
const destination = path.join(root, 'public/downloads/clas-curriculum-collection.zip');
await fsp.mkdir(path.dirname(destination), { recursive: true });
const temporary = destination + '.tmp';
await pipeline(zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true, compression: 'STORE' }), fs.createWriteStream(temporary));
await fsp.rename(temporary, destination);
console.log(`CLAS collection built: ${curriculum.modules.length} lessons, ${added.size} media/text assets, ${(await fsp.stat(destination)).size} bytes.`);
