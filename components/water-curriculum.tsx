import Link from "next/link";
import { SyncedMediaPlayer } from "@/components/clas-curriculum/media-player";
import { KeyPointsPanel } from "@/components/clas-curriculum/key-points";
import { ChoiceQuestion, OrderingQuestion } from "@/components/clas-curriculum/practice";
import { JobAidActions } from "@/components/clas-curriculum/job-aid-actions";
import type { JobAid, PracticeModule, RecallQuestion } from "@/lib/content/clas-curriculum-practice";
import type { WaterImage, WaterLesson } from "@/lib/content/water-curriculum";
import { loadCaptionCues } from "@/lib/content/clas-curriculum-page-data";
import "@/components/clas-curriculum.css";
import "./water-curriculum.css";
import { FeaturedMediaPanel, mediaLength } from "./featured-media-panel";

/** A full-width 4K photograph. The browser picks a smaller rendering for small screens. */
export function WaterFigure({ image, priority = false }: { image: WaterImage; priority?: boolean }) {
  return <figure className={image.slot === "hero" ? "water-figure water-figure-hero" : "water-figure"}>
    {/* eslint-disable-next-line @next/next/no-img-element -- static 4K WebP served as is, sized by CSS */}
    <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading={priority ? "eager" : "lazy"} decoding="async" />
  </figure>;
}

export const heroOf = (lesson: WaterLesson | null) => lesson?.images.find(img => img.slot === "hero") ?? null;

/** Images placed at the start of a module section, keyed by the section heading. */
export function chapterImages(lesson: WaterLesson | null): Record<string, WaterImage> {
  return Object.fromEntries((lesson?.images ?? []).filter(img => img.slot === "chapter" && img.chapter).map(img => [img.chapter!, img]));
}

/**
 * The module podcast, placed directly under the module title and goal so it is found without
 * scrolling. Renders nothing until the release step marks the podcast ready.
 */
export function WaterLessonPodcast({ lesson, moduleTitle }: { lesson: WaterLesson | null; moduleTitle: string }) {
  const podcast = lesson?.podcast;
  if (!podcast) return null;
  const cues = loadCaptionCues(podcast.captions);
  return <div className="water-lesson-opening clas-study">
    <FeaturedMediaPanel kind="podcast" length={mediaLength(podcast.durationSeconds)}><section aria-labelledby="water-podcast-title" className="water-podcast">
      <h2 id="water-podcast-title">Listen: {podcast.title}</h2>
      <p>{podcast.summary} About {Math.max(1, Math.round(podcast.durationSeconds / 60))} minutes. Two colleagues talk the module through; the full text and its sources follow below.</p>
      <SyncedMediaPlayer mediaId={`water:${lesson!.id}`} kind="audio" src={podcast.src} captions={podcast.captions} label={`${moduleTitle} podcast`}
        chapters={podcast.chapters} cues={cues} transcriptTitle="Podcast transcript">
        <p className="water-podcast-links"><a href={podcast.src} download>Download the podcast (MP3)</a> · <a href={podcast.transcript}>Read the transcript</a></p>
      </SyncedMediaPlayer>
    </section></FeaturedMediaPanel>
  </div>;
}

/** After the podcast, before the module text: what this module leads to, a recall from the last one, and the key points. */
export function WaterLessonOpening({ practice, recall, previousTitle, previousNumber }: {
  practice: PracticeModule | null; recall: RecallQuestion[];
  previousTitle?: string; previousNumber?: number;
}) {
  return <div className="water-lesson-opening clas-study">
    {practice?.outcome && <p className="water-outcome"><strong>What you will be able to do: </strong>{practice.outcome.replace(/^After this module you can\s*/i, "")}</p>}
    {previousTitle && previousNumber && recall.length > 0 && <section aria-labelledby="water-recall-title">
      <h2 id="water-recall-title">Before you start: a quick recall from module {previousNumber}</h2>
      <p>Two short questions from “{previousTitle}”. Answer from memory; the feedback explains the reasoning. Nothing is scored or recorded.</p>
      {recall.map(q => <ChoiceQuestion key={q.id} id={`recall-${q.id}`} question={q.question} options={q.options} />)}
    </section>}
    {practice?.keyPoints.length ? <KeyPointsPanel keyPoints={practice.keyPoints} chapters={[]} title="Key points from this module" headingLevel={2} /> : null}
  </div>;
}

function jobAidText(aid: JobAid, title: string): string {
  const lines = [aid.title, `The Water We Swim In: ${title}`, "", aid.useWhen ? `Use when: ${aid.useWhen}` : ""];
  for (const s of aid.sections) lines.push("", s.heading, ...s.items.map(i => `- ${i}`));
  if (aid.remember.length) lines.push("", "Remember", ...aid.remember.map(i => `- ${i}`));
  if (aid.askWho.length) lines.push("", "Who to ask", ...aid.askWho.map(i => `- ${i}`));
  return lines.filter((l, i) => l || i > 3).join("\n") + "\n";
}

/** After the module text: decisions, an ordering exercise and a printable one-page job aid. */
export function WaterLessonPractice({ practice, moduleTitle, moduleNumber }: { practice: PracticeModule | null; moduleTitle: string; moduleNumber: number }) {
  if (!practice) return null;
  const aid = practice.jobAid;
  return <section aria-labelledby="water-practice-title" className="water-practice clas-study">
    <h2 id="water-practice-title">Practice what this module covers</h2>
    {practice.decisions.length > 0 && <div className="clas-decisions">
      <h3>Decisions to practice</h3>
      <p>Each situation is made up and about your next decision. Check an answer to read why it is stronger or weaker; you can try again as often as you like.</p>
      {practice.decisions.map(d => <ChoiceQuestion key={d.id} id={`decision-${d.id}`} question={d.question} scenario={d.scenario} options={d.options} />)}
    </div>}
    {practice.ordering && <OrderingQuestion ordering={practice.ordering} />}
    {aid && <details className="water-job-aid">
      <summary>One-page job aid: {aid.title}</summary>
      <article className="clas-job-aid" aria-labelledby={`water-job-aid-${moduleNumber}`}>
        <p className="clas-study-eyebrow">ONE-PAGE JOB AID · MODULE {moduleNumber}: {moduleTitle.toUpperCase()}</p>
        <h3 id={`water-job-aid-${moduleNumber}`}>{aid.title}</h3>
        {aid.useWhen && <p className="clas-job-aid-use"><strong>Use when:</strong> {aid.useWhen}</p>}
        <div className="clas-job-aid-grid">{aid.sections.map(s => <section key={s.heading}><h4>{s.heading}</h4><ul>{s.items.map(i => <li key={i}>{i}</li>)}</ul></section>)}</div>
        {aid.remember.length > 0 && <section><h4>Remember</h4><ul>{aid.remember.map(i => <li key={i}>{i}</li>)}</ul></section>}
        {aid.askWho.length > 0 && <section><h4>Who to ask</h4><ul>{aid.askWho.map(i => <li key={i}>{i}</li>)}</ul></section>}
        <p className="clas-job-aid-foot">Leave names, case details and other private information out of your notes.</p>
      </article>
      <JobAidActions fileName={`water-we-swim-in-module-${moduleNumber}-job-aid.txt`} text={jobAidText(aid, moduleTitle)} />
    </details>}
    <p className="water-practice-note">Nothing here is scored or recorded. <Link href="#top">Back to the top of the module</Link></p>
  </section>;
}
