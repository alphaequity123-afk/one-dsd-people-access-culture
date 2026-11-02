'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import curriculum from '@/lib/content/clas-curriculum.json';
import { EMPTY_FRONT_PAGE_DATA, EMPTY_LESSON_PAGE_DATA, type ClasFrontPageData, type ClasLessonPageData } from '@/lib/learning/clas-page-data';
import { workbookText } from '@/lib/learning/clas-workbook';
import type { Chapter } from '@/lib/learning/vtt';
import { downloadText } from './clas-curriculum/download';
import { KeyPointsPanel } from './clas-curriculum/key-points';
import { SyncedMediaPlayer } from './clas-curriculum/media-player';
import { ImprovementPlan, WorkingNote } from './clas-curriculum/notes';
import { DecisionList, OrderingQuestion, RecallSection } from './clas-curriculum/practice';
import { WalkthroughPlaylist } from './clas-curriculum/walkthrough-playlist';
import './clas-curriculum.css';

const base = '/learn/clas/curriculum';
const progressKey = 'one-dsd-clas-curriculum-progress-v1';
const minutes = (seconds: number) => Math.ceil(seconds / 60);

type Props = {
  lessonId?: string;
  /** Server-loaded extras for a lesson page; every field defaults to empty so older content still renders. */
  data?: Partial<ClasLessonPageData>;
  /** Server-loaded extras for the front page. */
  front?: Partial<ClasFrontPageData>;
};

export default function ClasCurriculum({ lessonId, data, front }: Props) {
  const [completed, setCompleted] = useState<string[]>([]), [answer, setAnswer] = useState<number | null>(null), [storageMessage, setStorageMessage] = useState(''), [noteVersion, setNoteVersion] = useState(0);
  const index = curriculum.modules.findIndex(m => m.id === lessonId), lesson = curriculum.modules[index];
  const page: ClasLessonPageData = { ...EMPTY_LESSON_PAGE_DATA, ...data };
  const frontPage: ClasFrontPageData = { ...EMPTY_FRONT_PAGE_DATA, ...front };
  const practice = page.practice;
  const moduleIds = curriculum.modules.map(m => m.id);
  // Browser storage is unavailable during server rendering; restore progress after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(progressKey) || '[]'); if (Array.isArray(saved)) setCompleted(saved.filter((x: unknown) => typeof x === 'string' && curriculum.modules.some(m => m.id === x))); } catch { setStorageMessage('Progress cannot be remembered in this browser. You can still use every lesson.'); } }, []);
  function complete() { if (!lesson) return; const next = Array.from(new Set([...completed, lesson.id])); setCompleted(next); try { localStorage.setItem(progressKey, JSON.stringify(next)); setStorageMessage('Marked complete on this browser.'); } catch { setStorageMessage('Marked complete for this visit. This browser could not remember your progress.'); } }
  function workbook() { downloadText('CLAS-personal-working-notes.txt', workbookText()); }
  const chapters = (lesson?.chapters ?? []) as Chapter[];
  const walkthrough = page.walkthrough;
  const lastPart = index === curriculum.modules.length - 1;
  return <div className="clas-study">
    <nav aria-label="CLAS learning"><Link prefetch={false} href="/learn/clas">National CLAS Standards collection</Link>{lesson && <a href={base}>Curriculum overview</a>}</nav>
    <header><p className="clas-study-eyebrow">SELF-DIRECTED LEARNING</p><h1>{lesson ? lesson.title : curriculum.title}</h1>{practice?.outcome && <p className="clas-study-outcome">{practice.outcome}</p>}<p className="clas-study-lede">{lesson ? lesson.deliverable : 'Follow one work example from understanding a barrier to planning and reviewing an improvement.'}</p></header>
    {!lesson ? <>
      <section aria-labelledby="start"><h2 id="start">A connected path you can use at your own pace</h2><p>Begin with the person’s experience, then explore communication, responsibility, participation and improvement. Every part includes recorded guidance, a synced transcript, decisions to practice, a working note that builds into your own plan and, where available, a one-page job aid.</p><p>You do not need a group. You can pause, revisit a lesson or use the sample service notice. Reflection is optional and does not need to be shared. Leave names, case details and other private information out of learning notes.</p><a className="clas-study-primary text-white" href={`${base}/01`}>Start the curriculum</a> <button type="button" onClick={workbook}>Download the companion working notes</button></section>
      {frontPage.walkthroughs.length > 0 && <section aria-labelledby="listen"><h2 id="listen">Listen to the full walkthrough</h2><p>Two voices discuss the whole curriculum, one chapter per part. Listen here from start to finish, or open any part to hear its chapter with a synced transcript. The lessons stand on their own; this is a second, deeper pass.</p><WalkthroughPlaylist items={frontPage.walkthroughs} /></section>}
      <ol className="clas-study-path">{curriculum.modules.map(m => <li key={m.id}><a href={`${base}/${m.id}`}><span>Part {Number(m.id)}</span><h2>{m.title}</h2></a><p>{m.deliverable}</p>{m.durationSeconds > 0 && <p>Video: about {minutes(m.durationSeconds)} minutes, plus time for your own practice.</p>}<p>CLAS standards: {m.standards.join(', ')}{completed.includes(m.id) ? ' · Marked complete' : ''}</p>{frontPage.jobAidIds.includes(m.id) && <p><a href={`${base}/${m.id}/job-aid`}>One-page job aid for Part {Number(m.id)}</a></p>}</li>)}</ol>
      <section><h2>Where the standards fit</h2><p>These brief descriptions help you find the relevant lesson. Read the original standards for their complete wording.</p><ol>{curriculum.standards.map(s => <li key={s.number}><a href={`${base}/${s.lesson}`}>{s.focus}</a></li>)}</ol></section>
      <section><h2>Use the standards alongside current guidance</h2><p>This curriculum connects the National CLAS Standards to individual work. It does not replace agency requirements, specialist guidance or approval processes. Identify what you can change and where coordination is needed.</p><a href="https://thinkculturalhealth.hhs.gov/clas/standards" target="_blank" rel="noreferrer">Read the current National CLAS Standards</a></section>
    </> : <>
      <p>Part {index + 1} of {curriculum.modules.length} · CLAS standards {lesson.standards.join(', ')}{lesson.durationSeconds > 0 ? ` · Video: about ${minutes(lesson.durationSeconds)} minutes` : ''}{walkthrough && walkthrough.durationSeconds > 0 ? ` · Discussion: about ${minutes(walkthrough.durationSeconds)} minutes` : ''}</p>
      {page.jobAidAvailable && <p><a href={`${base}/${lesson.id}/job-aid`}>Open the one-page job aid for this part</a> (printable, with a text download)</p>}
      {page.recall.length > 0 && index > 0 && <RecallSection questions={page.recall} previousTitle={curriculum.modules[index - 1].title} previousPart={index} />}
      <section aria-labelledby="watch"><h2 id="watch">Watch the lesson</h2>
        <SyncedMediaPlayer mediaId={`video:${lesson.id}`} kind="video" src={lesson.video} captions={lesson.captions} poster={`/learning/clas-curriculum/${lesson.id}/poster.png`} label={lesson.title} chapters={chapters} cues={page.cues} keyPoints={practice?.keyPoints} cardDescriptions={practice?.cardDescriptions} transcriptTitle="Transcript of the lesson video">
          <p>Pause when you want time to think or use the activity below. Playback does not begin automatically.</p>
          <p><a href={lesson.video}>Open the video</a> · <a href={lesson.captions}>Download captions</a></p>
        </SyncedMediaPlayer>
        {practice && practice.keyPoints.length > 0 && <KeyPointsPanel keyPoints={practice.keyPoints} chapters={chapters} />}
      </section>
      {walkthrough && <section aria-labelledby="discuss"><h2 id="discuss">Hear it discussed</h2><p>Two voices talk through this part in more depth. Listen when you want the longer version; the lesson above stands on its own.</p>
        <SyncedMediaPlayer mediaId={`walkthrough:${lesson.id}`} kind="audio" src={walkthrough.audio} captions={walkthrough.captions} label={`Walkthrough discussion, Part ${index + 1}: ${lesson.title}`} chapters={walkthrough.chapters} cues={page.walkthroughCues} transcriptTitle="Transcript of the discussion">
          <p>Playback does not begin automatically. Pause whenever you want time to think.</p>
          <p><a href={walkthrough.audio}>Open the audio</a>{walkthrough.captions && <> · <a href={walkthrough.captions}>Download captions</a></>}{walkthrough.transcript && <> · <a href={walkthrough.transcript}>Download the transcript</a></>}</p>
        </SyncedMediaPlayer>
      </section>}
      <section><h2>{lesson.example.title}</h2><p>{lesson.example.situation}</p><details><summary>Work through the example</summary><p>{lesson.example.response}</p><p>{lesson.example.reason}</p></details></section>
      <section aria-labelledby="practice"><h2 id="practice">Try a decision</h2><fieldset className="clas-question"><legend>{lesson.practice.question}</legend>{lesson.practice.options.map((o, n) => <label key={n}><input type="radio" name="decision" checked={answer === n} onChange={() => setAnswer(n)} /><span>{o.text}</span></label>)}</fieldset><div className="clas-study-feedback" aria-live="polite">{answer !== null && <><h3>Think it through</h3><p>{lesson.practice.options[answer].feedback}</p><p>You can choose another response and compare the reasoning.</p></>}</div>
        {practice && <DecisionList decisions={practice.decisions} />}
        {practice?.ordering && <div className="clas-decisions"><h3>What would you check first?</h3><OrderingQuestion ordering={practice.ordering} /></div>}
      </section>
      <section aria-labelledby="apply"><h2 id="apply">Bring it into your work</h2><p>{lesson.practice.reflection}</p>
        <WorkingNote moduleId={lesson.id} title={lesson.title} prompt={lesson.practice.reflection} allModuleIds={moduleIds} onChange={() => setNoteVersion(v => v + 1)} />
        <button type="button" onClick={workbook}>Download the full working-notes companion</button><p><Link prefetch={false} href="/practice/clas">Open the existing CLAS planning worksheet</Link></p>
        {lastPart && <ImprovementPlan curriculumTitle={curriculum.title} modules={curriculum.modules} version={noteVersion} />}
      </section>
      <section aria-labelledby="transcript"><h2 id="transcript">Read the full lesson</h2>{lesson.sections.map(s => <section key={s.title}><h3>{s.title}</h3>{s.paragraphs.map((p, n) => <p key={n}>{p}</p>)}</section>)}</section>
      <section><h2>Your next step</h2><button type="button" onClick={complete}>{completed.includes(lesson.id) ? 'Marked complete' : 'Mark this lesson complete'}</button><p role="status">{storageMessage}</p><nav aria-label="Lesson sequence">{index > 0 && <a href={`${base}/${curriculum.modules[index - 1].id}`}>Previous: {curriculum.modules[index - 1].title}</a>}{index < curriculum.modules.length - 1 ? <a href={`${base}/${curriculum.modules[index + 1].id}`}>Next: {curriculum.modules[index + 1].title}</a> : <a href={base}>Return to the curriculum overview</a>}</nav></section>
      <section><h2>Sources and further guidance</h2><ul><li><a href="https://thinkculturalhealth.hhs.gov/clas/standards" target="_blank" rel="noreferrer">HHS Office of Minority Health: National CLAS Standards</a></li><li><a href="https://thinkculturalhealth.hhs.gov/assets/pdfs/EnhancedNationalCLASStandards_Revised_June2025.pdf" target="_blank" rel="noreferrer">HHS National CLAS Standards (June 2025 PDF)</a></li><li><a href="https://mn.gov/dhs/assets/language-disability-assistance_tcm1053-646948.pdf" target="_blank" rel="noreferrer">Minnesota DHS language and disability assistance — published policy reference</a></li></ul><p>Use the current procedures applicable to your role and program when taking action.</p></section>
    </>}
  </div>;
}
