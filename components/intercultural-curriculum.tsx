'use client';

import { useEffect, useState } from 'react';
import InterculturalLessonVideo, { type LessonMedia } from './intercultural-lesson-video';
import './intercultural-curriculum.css';

type Community = { id: string; title: string; href: string; standingTribalDeference: boolean; prompt: string; lesson: number };
type Resource = { title: string; href: string; note?: string };
type Module = { id: string; title: string; sections: { title: string; paragraphs: string[] }[]; practice: { question: string; options: { text: string; feedback: string }[]; reflection: string; artifact: string } };
type Curriculum = { title: string; modules: Module[] };
type MediaIndex = { status: string; previewOnly?: boolean; lessons: Array<LessonMedia & { id: string }> };
const base = '/learn/intercultural/curriculum';
const progressKey = 'one-dsd-intercultural-curriculum-progress-v1';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function companion(modules: Module[]) {
  const reflections = modules.map(m => `Part ${Number(m.id)}: ${m.title}\n${m.practice.reflection}\n\nMy notes:\n\n`).join('\n');
  return `Intercultural understanding in everyday work\n\nUse a non-sensitive example. Keep official records in approved systems. These notes are for your own use.\n\nMY WORKING PLAN\n\nWork step and purpose:\n\nWhat is known and what I need to ask:\n\nWays people can communicate and participate:\n\nWhat I can do and what needs review or approval:\n\nHow I will listen and report back:\n\nWhat I will check and when:\n\n${reflections}`;
}
function Communities({ items }: { items: Community[] }) {
  if (!items.length) return null;
  return <section aria-labelledby="community-list"><h2 id="community-list">Explore community and place briefs</h2>
    <p>Choose what is useful for your work. A brief can help you prepare questions; it cannot tell you what a person needs or prefers.</p>
    <details><summary>See available briefs ({items.length})</summary><ul>{items.map(item => <li key={item.id}>
      <a href={item.href}>{item.title}</a><p>{item.prompt}</p>
      {item.standingTribalDeference && <p>We defer to the Office of Indian Affairs and the DHS offices that handle Tribal relations and consultation.</p>}
    </li>)}</ul></details>
  </section>;
}

export default function InterculturalCurriculum({ lessonId, communities, resources, curriculum, mediaData }: { lessonId?: string; communities: Community[]; resources: Resource[]; curriculum: Curriculum; mediaData: MediaIndex }) {
  const modules = curriculum.modules;
  const [completed, setCompleted] = useState<string[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const index = modules.findIndex(m => m.id === lessonId);
  const lesson = modules[index];
  // The release process generates this data only after all seven delivered proofs pass.
  const mediaIndex = mediaData;
  const media = mediaIndex && mediaIndex.status === 'seven-current-media-proofs-passed' && Array.isArray(mediaIndex.lessons) ? mediaIndex.lessons.find(item => item && typeof item === 'object' && item.id === lessonId) : undefined;

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(progressKey) || '[]');
      if (Array.isArray(saved)) setCompleted(saved.filter((id): id is string => typeof id === 'string' && modules.some(m => m.id === id)));
    } catch { setStorageMessage('Progress cannot be remembered in this browser. You can still use every lesson.'); }
  }, [modules]);
  useEffect(() => { setAnswer(null); setNotes(''); }, [lessonId]);
  function complete() {
    if (!lesson) return;
    const next = Array.from(new Set([...completed, lesson.id])); setCompleted(next);
    try { localStorage.setItem(progressKey, JSON.stringify(next)); setStorageMessage('Marked complete on this browser.'); }
    catch { setStorageMessage('Marked complete for this visit. This browser could not remember your progress.'); }
  }

  return <div className="intercultural-study">
    
    <nav aria-label="Intercultural learning"><a href="/learn/intercultural">Intercultural learning</a>{lesson && <a href={base}>Curriculum overview</a>}</nav>
    <header><p className="intercultural-eyebrow">SELF-DIRECTED LEARNING</p><h1>{lesson ? lesson.title : curriculum.title}</h1><p>Bring curiosity, care and practical questions to the work in front of you.</p></header>
    {!lesson ? <>
      <section><h2>A connected path, at your own pace</h2><p>Follow one work example through seven parts, from noticing an assumption to listening and learning from a change. Choose the parts and resources that support your work.</p><p>This learning is voluntary and individual. You can pause, revisit a section, and keep reflections to yourself. Leave names, case details and other private information out of learning notes.</p><a className="intercultural-primary" href={`${base}/01`}>Start the curriculum</a> <button type="button" onClick={() => download('Intercultural-working-notes.txt', companion(modules))}>Download working notes</button></section>
      <ol className="intercultural-path">{modules.map(m => <li key={m.id}><a href={`${base}/${m.id}`}><span>Part {Number(m.id)}</span><h2>{m.title}</h2></a>{completed.includes(m.id) && <p>Marked complete on this browser</p>}</li>)}</ol>
      <Communities items={communities} />
    </> : <>
      <p>Part {index + 1} of {modules.length}</p>
      <InterculturalLessonVideo id={lesson.id} title={lesson.title} media={media} />
      <section><h2>Read and reflect</h2>{lesson.sections.map((section, n) => <section key={`${n}-${section.title}`}><h3>{section.title}</h3>{section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</section>)}</section>
      <section><h2>Try a decision</h2><fieldset><legend>{lesson.practice.question}</legend>{lesson.practice.options.map((option, n) => <label key={n}><input type="radio" name={`decision-${lesson.id}`} checked={answer === n} onChange={() => setAnswer(n)}/><span>{option.text}</span></label>)}</fieldset><div className="intercultural-feedback" aria-live="polite">{answer !== null && <><h3>Think it through</h3><p>{lesson.practice.options[answer].feedback}</p><p>You can choose another response and compare the reasoning.</p></>}</div></section>
      <section><h2>Bring it into your work</h2><p>{lesson.practice.reflection}</p><p>{lesson.practice.artifact}</p><label htmlFor="intercultural-note">Optional working note</label><textarea id="intercultural-note" rows={6} value={notes} onChange={e => setNotes(e.target.value)} aria-describedby="note-privacy"/><p id="note-privacy">This note is not sent or automatically saved. Download it if you want to keep a copy. Do not include names, case details or other private information.</p><button type="button" onClick={() => download(`Intercultural-part-${lesson.id}-notes.txt`, `${lesson.title}\n\n${lesson.practice.reflection}\n\n${notes}`)}>Download my note</button> <button type="button" onClick={() => download('Intercultural-working-notes.txt', companion(modules))}>Download working notes</button></section>
      <Communities items={communities.filter(item => item.lesson === Number(lesson.id))}/>
      {resources.length > 0 && <section><h2>Continue learning</h2><ul>{resources.map(item => <li key={item.href}><a href={item.href}>{item.title}</a>{item.note && <p>{item.note}</p>}</li>)}</ul></section>}
      <section><h2>Your next step</h2><button type="button" onClick={complete}>{completed.includes(lesson.id) ? 'Marked complete' : 'Mark this lesson complete'}</button><p role="status">{storageMessage}</p><p>Progress is kept in this browser and can be cleared with browser data.</p><nav aria-label="Lesson sequence">{index > 0 && <a href={`${base}/${modules[index - 1].id}`}>Previous: {modules[index - 1].title}</a>}{index < modules.length - 1 ? <a href={`${base}/${modules[index + 1].id}`}>Next: {modules[index + 1].title}</a> : <a href={base}>Return to the curriculum overview</a>}</nav></section>
    </>}
  </div>;
}
