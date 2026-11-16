'use client';
import { SourceLink } from "@/components/app-link";

import Link from "@/components/app-link";
import { useEffect, useState, type ReactNode } from 'react';
import curriculum from '@/lib/content/clas-curriculum.json';
import { EMPTY_FRONT_PAGE_DATA, EMPTY_LESSON_PAGE_DATA, type ClasFrontPageData, type ClasLessonPageData } from '@/lib/learning/clas-page-data';
import { workbookText } from '@/lib/learning/clas-workbook';
import type { Chapter } from '@/lib/learning/vtt';
import { downloadText } from './clas-curriculum/download';
import { KeyPointsPanel } from './clas-curriculum/key-points';
import { SyncedMediaPlayer } from './clas-curriculum/media-player';
import { ImprovementPlan, WorkingNote } from './clas-curriculum/notes';
import { DecisionList, OrderingQuestion, RecallSection } from './clas-curriculum/practice';
import TutorPanel from './tutor-panel';
import { WalkthroughPlaylist } from './clas-curriculum/walkthrough-playlist';
import { ShareClasCollection } from './clas-curriculum/share-collection';
import { ClTabs } from './cl-tabs';
import { CourseMediaSlot } from './course-media-for-page';
import { FeaturedMediaPanel, MediaQuickLinks, mediaLength } from './featured-media-panel';
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
  /** The page's "Download or share" panel. It sits after the lesson video and discussion, so the players are near the top. */
  downloads?: ReactNode;
};

export default function ClasCurriculum({ lessonId, data, front, downloads }: Props) {
  const [completed, setCompleted] = useState<string[]>([]), [storageMessage, setStorageMessage] = useState(''), [noteVersion, setNoteVersion] = useState(0);
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
  const showRecall = page.recall.length > 0 && index > 0;
  const hasKeyPoints = Boolean(practice && practice.keyPoints.length > 0);
  const clasNav = <nav aria-label="CLAS learning"><Link prefetch={false} href="/learn/clas/collection">Shareable curriculum collection</Link><Link prefetch={false} href="/learn/clas">National Culturally and Linguistically Appropriate Services Standards collection</Link>{lesson && <SourceLink href={base}>Curriculum overview</SourceLink>}</nav>;
  return <div className="clas-study">
    {/* On a lesson the collection links follow the media, so the video starts in the first screen. */}
    {!lesson && clasNav}
    <header><p className="clas-study-eyebrow">SELF-DIRECTED LEARNING</p><h1>{lesson ? lesson.title : curriculum.title}</h1>{practice?.outcome && <p className="clas-study-outcome">{practice.outcome}</p>}<p className="clas-study-lede">{lesson ? lesson.deliverable : 'Follow one work example from understanding a barrier to planning and reviewing an improvement.'}</p></header>
    {!lesson ? <>
      {frontPage.walkthroughs.length > 0 && <FeaturedMediaPanel kind="podcast"><section aria-labelledby="listen"><h2 id="listen">Listen to the full walkthrough</h2><p>Two voices discuss the whole curriculum, one chapter per part. Listen here from start to finish, or open any part to hear its chapter with a synced transcript. The lessons stand on their own; this is a second, deeper pass.</p><WalkthroughPlaylist items={frontPage.walkthroughs} /></section></FeaturedMediaPanel>}
      <CourseMediaSlot />
      <ShareClasCollection />
      <section aria-labelledby="start"><h2 id="start">A connected path you can use at your own pace</h2><p>Begin with the person’s experience, then explore communication, responsibility, participation and improvement. Every part includes recorded guidance, a synced transcript, decisions to practice, a working note that builds into your own plan and, where available, a one-page job aid.</p><p>You do not need a group. You can pause, revisit a lesson or use the sample service notice. Leave names, case details and other private information out of learning notes.</p><SourceLink className="clas-study-primary text-white" href={`${base}/01`}>Start the curriculum</SourceLink> <button type="button" onClick={workbook}>Download the companion working notes</button></section>
      <ol className="clas-study-path">{curriculum.modules.map(m => <li key={m.id}><SourceLink href={`${base}/${m.id}`}><span>Part {Number(m.id)}</span><h2>{m.title}</h2></SourceLink><p>{m.deliverable}</p>{m.durationSeconds > 0 && <p>Video: about {minutes(m.durationSeconds)} minutes, plus time for your own practice.</p>}<p>CLAS standards: {m.standards.join(', ')}{completed.includes(m.id) ? ' · Marked complete' : ''}</p>{frontPage.jobAidIds.includes(m.id) && <p><SourceLink href={`${base}/${m.id}/job-aid`}>One-page job aid for Part {Number(m.id)}</SourceLink></p>}</li>)}</ol>
      <section><h2>Where the standards fit</h2><p>These brief descriptions help you find the relevant lesson. Read the original standards for their complete wording.</p><ol>{curriculum.standards.map(s => <li key={s.number}><SourceLink href={`${base}/${s.lesson}`}>{s.focus}</SourceLink></li>)}</ol></section>
      <section><h2>Use the standards alongside current guidance</h2><p>This curriculum connects the National Culturally and Linguistically Appropriate Services Standards to individual work. It does not replace agency requirements, specialist guidance or approval processes. Identify what you can change and where coordination is needed.</p><SourceLink href="https://thinkculturalhealth.hhs.gov/clas/standards" target="_blank" rel="noreferrer">Read the current National Culturally and Linguistically Appropriate Services Standards</SourceLink></section>
    </> : <>
      <p>Part {index + 1} of {curriculum.modules.length} · CLAS standards {lesson.standards.join(', ')}</p>
      <MediaQuickLinks links={[
        { href: '#watch', kind: 'video', text: 'Watch the lesson' },
        ...(walkthrough ? [{ href: '#discuss', kind: 'podcast' as const, text: 'Listen to the discussion' }] : []),
      ]} />
      {/* The lesson video and its discussion come first, right under the title, so nobody has to scroll to find them. */}
      <FeaturedMediaPanel kind="video" length={mediaLength(lesson.durationSeconds)}><section aria-labelledby="watch"><h2 id="watch">Watch the lesson</h2>
        <SyncedMediaPlayer mediaId={`video:${lesson.id}`} kind="video" src={lesson.video} captions={lesson.captions} poster={`/learning/clas-curriculum/${lesson.id}/poster.png`} label={lesson.title} chapters={chapters} cues={page.cues} keyPoints={practice?.keyPoints} cardDescriptions={practice?.cardDescriptions} transcriptTitle="Transcript of the lesson video">
          <p><SourceLink href={lesson.video}>Open the video</SourceLink> · <SourceLink href={lesson.captions}>Download captions</SourceLink></p>
        </SyncedMediaPlayer>
      </section></FeaturedMediaPanel>
      {walkthrough && <FeaturedMediaPanel kind="podcast" length={mediaLength(walkthrough.durationSeconds)}><section aria-labelledby="discuss"><h2 id="discuss">Listen to the discussion</h2>
        <SyncedMediaPlayer mediaId={`walkthrough:${lesson.id}`} kind="audio" src={walkthrough.audio} captions={walkthrough.captions} label={`Walkthrough discussion, Part ${index + 1}: ${lesson.title}`} chapters={walkthrough.chapters} cues={page.walkthroughCues} transcriptTitle="Transcript of the discussion">
          <p><SourceLink href={walkthrough.audio}>Open the audio</SourceLink>{walkthrough.captions && <> · <SourceLink href={walkthrough.captions}>Download captions</SourceLink></>}{walkthrough.transcript && <> · <SourceLink href={walkthrough.transcript}>Download the transcript</SourceLink></>}</p>
        </SyncedMediaPlayer>
      </section></FeaturedMediaPanel>}
      <CourseMediaSlot />
      {clasNav}
      {page.jobAidAvailable && <p><SourceLink href={`${base}/${lesson.id}/job-aid`}>Open the one-page job aid for this part</SourceLink> (printable, with a text download)</p>}
      {downloads}
      <ClTabs label="Lesson sections" tabs={[
        ...(showRecall || hasKeyPoints ? [{ id: 'tab-watch', label: showRecall ? 'Recall and key points' : 'Key points', content: <>
      {showRecall && <RecallSection questions={page.recall} previousTitle={curriculum.modules[index - 1].title} previousPart={index} />}
      {hasKeyPoints && <KeyPointsPanel keyPoints={practice!.keyPoints} chapters={chapters} headingLevel={2} />}
      </> }] : []),
        { id: 'tab-discuss', label: 'Example', content: <>
      <section><h2>{lesson.example.title}</h2><p>{lesson.example.situation}</p><details><summary>Work through the example</summary><p>{lesson.example.response}</p><p>{lesson.example.reason}</p></details></section>
      </> },
        { id: 'tab-practice', label: 'Practice', content: <>
      <section aria-labelledby="practice"><h2 id="practice">Practice with guidance</h2>
        <p className="clas-guidance-intro">Guidance is ready for every answer, right or wrong, before you move on.</p>
        <p>Answer the question, then get guidance that works through your thinking step by step.</p>
        <TutorPanel key={lesson.id} lessonId={lesson.id} />
        {practice && <DecisionList decisions={practice.decisions} />}
        {practice?.ordering && <div className="clas-decisions"><h3>What would you check first?</h3><OrderingQuestion ordering={practice.ordering} /></div>}
      </section>
      </> },
        { id: 'tab-use-at-work', label: 'Use it at work', content: <>
      <section aria-labelledby="apply"><h2 id="apply">Bring it into your work</h2><p>{lesson.practice.reflection}</p>
        <WorkingNote moduleId={lesson.id} title={lesson.title} prompt={lesson.practice.reflection} allModuleIds={moduleIds} onChange={() => setNoteVersion(v => v + 1)} />
        <button type="button" onClick={workbook}>Download the full working-notes companion</button><p><Link prefetch={false} href="/practice/clas">Open the existing CLAS planning worksheet</Link></p>
        {lastPart && <ImprovementPlan curriculumTitle={curriculum.title} modules={curriculum.modules} version={noteVersion} />}
      </section>
      <section><h2>Your next step</h2><button type="button" onClick={complete}>{completed.includes(lesson.id) ? 'Marked complete' : 'Mark this lesson complete'}</button><p role="status">{storageMessage}</p><nav aria-label="Lesson sequence">{index > 0 && <SourceLink href={`${base}/${curriculum.modules[index - 1].id}`}>Previous: {curriculum.modules[index - 1].title}</SourceLink>}{index < curriculum.modules.length - 1 ? <SourceLink href={`${base}/${curriculum.modules[index + 1].id}`}>Next: {curriculum.modules[index + 1].title}</SourceLink> : <SourceLink href={base}>Return to the curriculum overview</SourceLink>}</nav></section>
      </> },
        { id: 'tab-full-lesson', label: 'Full lesson text', content: <>
      <section aria-labelledby="transcript"><h2 id="transcript">Read the full lesson</h2>{lesson.sections.map(s => <section key={s.title}><h3>{s.title}</h3>{s.paragraphs.map((p, n) => <p key={n}>{p}</p>)}</section>)}</section>
      </> },
        { id: 'tab-sources', label: 'Sources', content: <>
      <section><h2>Sources and further guidance</h2><ul><li><SourceLink href="https://thinkculturalhealth.hhs.gov/clas/standards" target="_blank" rel="noreferrer">HHS Office of Minority Health: National Culturally and Linguistically Appropriate Services Standards</SourceLink></li><li><SourceLink href="https://thinkculturalhealth.hhs.gov/assets/pdfs/EnhancedNationalCLASStandards_Revised_June2025.pdf" target="_blank" rel="noreferrer">HHS National Culturally and Linguistically Appropriate Services Standards (June 2025 PDF)</SourceLink></li><li><SourceLink href="https://mn.gov/dhs/assets/language-disability-assistance_tcm1053-646948.pdf" target="_blank" rel="noreferrer">Minnesota DHS language and disability assistance — published policy reference</SourceLink></li></ul><p>Use the current procedures applicable to your role and program when taking action.</p></section>
      </> },
      ]} />
    </>}
  </div>;
}
