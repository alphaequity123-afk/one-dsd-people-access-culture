'use client';
import { SourceLink } from "@/components/app-link";

import Link from "@/components/app-link";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import data from '@/lib/content/equity-everyday-decisions.json';
import { hasReadyMedia, validCompleted, workbookText, type Curriculum, type Resource } from '@/lib/content/equity-decisions-model';
import './equity-decisions-curriculum.css';
import { CourseMediaSlot } from './course-media-for-page';
import { FeaturedMediaPanel, mediaLength } from './featured-media-panel';

const curriculum = data as unknown as Curriculum;
const base = '/learn/equity-toolkit/curriculum';
const progressKey = 'one-dsd-equity-everyday-learning-progress-v1';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ResourceList({ resources }: { resources: Resource[] }) {
  if (!resources.length) return null;
  return <ul>{resources.map(resource => <li key={`${resource.href}-${resource.title}`}>
    <SourceLink href={resource.href}>{resource.title}</SourceLink>{resource.description && <p>{resource.description}</p>}
  </li>)}</ul>;
}

/** `downloads` is the page's "Download or share" panel; it follows the lesson video so the video sits right under the title. */
export default function EquityDecisionsCurriculum({ lessonId, downloads }: { lessonId?: string; downloads?: ReactNode }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const index = curriculum.modules.findIndex(module => module.id === lessonId);
  const lesson = curriculum.modules[index];

  useEffect(() => {
    try {
      // Progress is browser-only and must be restored after server hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompleted(validCompleted(JSON.parse(localStorage.getItem(progressKey) || '[]'), curriculum.modules));
    } catch {
      setStorageMessage('Progress cannot be remembered in this browser. You can still use every lesson.');
    }
  }, []);

  function complete() {
    if (!lesson) return;
    const next = [...new Set([...completed, lesson.id])];
    setCompleted(next);
    try {
      localStorage.setItem(progressKey, JSON.stringify(next));
      setStorageMessage('Marked complete on this browser.');
    } catch {
      setStorageMessage('Marked complete for this visit. This browser could not remember your progress.');
    }
  }
  const downloadCompanion = () => download('equity-decisions-working-notes.txt', workbookText(curriculum));

  return <div className="equity-decisions-study">
    <nav aria-label="Equity learning">
      <Link prefetch={false} href="/learn/equity-toolkit">Equity Analysis Toolkit</Link>
      {lesson && <SourceLink href={base}>Learning overview</SourceLink>}
    </nav>
    <header>
      <p className="equity-decisions-eyebrow">SELF-DIRECTED LEARNING</p>
      <h1>{lesson ? lesson.title : curriculum.title}</h1>
      <p className="equity-decisions-lede">{lesson ? lesson.deliverable : 'Follow one decision from the first question through a practical next step and a plan to learn what happened.'}</p>
    </header>
    {!lesson ? <>
      <section aria-labelledby="start">
        <h2 id="start">A connected path at your own pace</h2>
        <p>Use a work example that matters to you, or follow the example in the lessons. Each part offers guidance, a visible transcript, an individual decision to practice, and a prompt for your own work.</p>
        <p>Participation in this learning is voluntary. You do not need a group or need to share personal experiences. Leave names, case details, and other confidential information out of learning notes.</p>
        <p>The learning supports your work. Follow applicable policy and review requirements, and consult the people or areas responsible when a decision needs their approval. A quick check does not replace a full analysis when one is required.</p>
        <SourceLink className="equity-decisions-primary text-white" href={`${base}/01`}>Start the learning</SourceLink>{' '}
        <button type="button" onClick={downloadCompanion}>Download the companion working notes</button>
      </section>
      <ol className="equity-decisions-path">{curriculum.modules.map(module => <li key={module.id}>
        <SourceLink href={`${base}/${module.id}`}><span>Part {Number(module.id)}</span><h2>{module.title}</h2></SourceLink>
        <p>{module.deliverable}</p>
        {hasReadyMedia(module) && <p>Video: about {Math.ceil(module.durationSeconds! / 60)} minutes, plus time for your own practice.</p>}
        {completed.includes(module.id) && <p>Marked complete on this browser.</p>}
      </li>)}</ol>
      <section><h2>Use this learning with the tools</h2>
        <p>Start with the decision and use the resources that fit your work. Check current requirements and carry open questions to the person or area responsible.</p>
        <ResourceList resources={curriculum.sources || []}/>
      </section>
    </> : <>
      <p>Part {index + 1} of {curriculum.modules.length}{hasReadyMedia(lesson) ? ` · Video: about ${Math.ceil(lesson.durationSeconds! / 60)} minutes` : ''}</p>
      {hasReadyMedia(lesson) && <FeaturedMediaPanel kind="video" length={mediaLength(lesson.durationSeconds)}><section aria-labelledby="watch">
        <h2 id="watch">Watch and work through the lesson</h2>
        <video ref={video} onPlay={event => document.querySelectorAll<HTMLMediaElement>('audio,video').forEach(other => { if (other !== event.currentTarget) other.pause(); })} controls preload="metadata" playsInline poster={lesson.poster} aria-label={lesson.title}>
          <source src={lesson.video} type="video/mp4"/>
          <track kind="captions" src={lesson.captions} srcLang="en" label="English" default/>
          Your browser cannot play this video. The full transcript is below.
        </video>
        <SourceLink href={lesson.video}>Open the video</SourceLink> · <SourceLink href={lesson.captions}>Download captions</SourceLink>
        <details><summary>Go to a chapter</summary><ol>{lesson.chapters!.map(chapter => <li key={chapter.title}>
          <button type="button" onClick={() => { if (video.current) { video.current.currentTime = chapter.start; video.current.focus(); } }}>{chapter.title}</button>
        </li>)}</ol></details>
      </section></FeaturedMediaPanel>}
      <CourseMediaSlot />
      {downloads}
      <section><h2>{lesson.example.title}</h2><p>{lesson.example.situation}</p>
        <details><summary>Work through the example</summary><p>{lesson.example.response}</p><p>{lesson.example.reason}</p></details>
      </section>
      <section aria-labelledby="practice"><h2 id="practice">Try a decision</h2>
        <fieldset><legend>{lesson.practice.question}</legend>{lesson.practice.options.map((option, number) => <label key={number}>
          <input type="radio" name="decision" checked={answer === number} onChange={() => setAnswer(number)}/><span>{option.text}</span>
        </label>)}</fieldset>
        <div className="equity-decisions-feedback" aria-live="polite">{answer !== null && <>
          <h3>Think it through</h3><p>{lesson.practice.options[answer].feedback}</p><p>You can choose another response and compare the reasoning.</p>
        </>}</div>
      </section>
      <section aria-labelledby="apply"><h2 id="apply">Bring it into your work</h2>
        {lesson.practice.artifact && <p><strong>Take forward:</strong> {lesson.practice.artifact}</p>}
        <p>{lesson.practice.reflection}</p>
        <label htmlFor="reflection">Optional working note</label>
        <textarea id="reflection" rows={6} value={notes} onChange={event => setNotes(event.target.value)} aria-describedby="note-privacy"/>
        <p id="note-privacy">This note is not sent or automatically saved. Download it if you want to keep a copy. Do not include names, case details, health or personnel information, or other confidential information.</p>
        <button type="button" onClick={() => download(`equity-decisions-part-${lesson.id}-notes.txt`, `${lesson.title}\n\n${lesson.practice.reflection}\n\n${notes}`)}>Download my note</button>{' '}
        <button type="button" onClick={downloadCompanion}>Download the full working-notes companion</button>
      </section>
      {lesson.resources && lesson.resources.length > 0 && <details className="course-more-item"><summary><h2>Resources for this part</h2></summary><ResourceList resources={lesson.resources}/></details>}
      <section aria-labelledby="transcript"><h2 id="transcript">Read the full lesson</h2>{lesson.sections.map(section => <section key={section.title}>
        <h3>{section.title}</h3>{section.paragraphs.map((paragraph, number) => <p key={number}>{paragraph}</p>)}
      </section>)}</section>
      <details className="course-more-item"><summary><h2>Your next step</h2></summary>
        <button type="button" onClick={complete}>{completed.includes(lesson.id) ? 'Marked complete' : 'Mark this lesson complete'}</button>
        <p role="status">{storageMessage}</p><nav aria-label="Lesson sequence">
          {index > 0 && <SourceLink href={`${base}/${curriculum.modules[index - 1].id}`}>Previous: {curriculum.modules[index - 1].title}</SourceLink>}
          {index < curriculum.modules.length - 1 ? <SourceLink href={`${base}/${curriculum.modules[index + 1].id}`}>Next: {curriculum.modules[index + 1].title}</SourceLink> : <SourceLink href={base}>Return to the learning overview</SourceLink>}
        </nav>
      </details>
      {curriculum.sources && curriculum.sources.length > 0 && <details className="course-more-item"><summary><h2>Sources and further guidance</h2></summary><ResourceList resources={curriculum.sources}/></details>}
    </>}
  </div>;
}
