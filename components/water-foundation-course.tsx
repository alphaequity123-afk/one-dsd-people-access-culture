"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link, { SourceLink } from "@/components/app-link";
import course from "@/lib/content/water-foundation-course.json";
import { chapterAtTime, courseTime, WATER_FOUNDATION } from "@/lib/learning/water-foundation";
import styles from "./water-foundation-course.module.css";

const tabs = ["Overview", "Transcript", "Sources", "Continue learning"] as const;

export function WaterFoundationCourse() {
  const video = useRef<HTMLVideoElement>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [tab, setTab] = useState<number>(0);
  const chapter = course.chapters[chapterIndex];
  function seek(time: number) {
    if (video.current) video.current.currentTime = time;
    setChapterIndex(chapterAtTime(course.chapters, time));
  }
  function updateChapter() {
    const time = video.current?.currentTime ?? 0;
    setChapterIndex(chapterAtTime(course.chapters, time));
  }
  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(next);
    document.getElementById(`water-tab-${next}`)?.focus();
  }
  return <article className={styles.course}>
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}><Link href="/learn/cultural-intelligence">Cultural Intelligence</Link><span aria-hidden="true"> / </span><span>The Water We Swim In</span></nav>
    <header className={styles.header}>
      <p className={styles.eyebrow}>People, Access and Culture</p>
      <h1>The Water We Swim In</h1>
      <p className={styles.intro}>Recognize the cultural assumptions that shape the agency's work—and use that understanding to improve services, workplace decisions and organizational responsibility.</p>
      <p className={styles.meta}>For staff and leaders · About 1 hour · 12 chapters</p>
    </header>
    <div className={styles.watch}>
      <div className={styles.main}>
        <video ref={video} className={styles.video} controls controlsList="nodownload" playsInline preload="metadata" poster={WATER_FOUNDATION.poster} onTimeUpdate={updateChapter} onSeeked={updateChapter} aria-label="Watch The Water We Swim In">
          <source src={WATER_FOUNDATION.video} type="video/mp4" />
          <track kind="captions" src={WATER_FOUNDATION.captions} srcLang="en" label="English" />
          <p>The transcript is available below.</p>
        </video>
        <section className={styles.context} aria-labelledby="chapter-heading">
          <p className={styles.eyebrow}>Chapter {chapter.number}</p>
          <h2 id="chapter-heading">{chapter.title}</h2>
          <p>{chapter.objective}</p>
          <details key={chapter.number}><summary>Apply this to your work</summary><p>{chapter.application}</p><p>Pause whenever you need time to reflect or discuss.</p></details>
        </section>
      </div>
      <nav className={styles.chapters} aria-label="Course chapters">
        <h2>Chapters</h2>
        <ol>{course.chapters.map((item, index) => <li key={item.number}><button type="button" aria-current={index === chapterIndex ? "step" : undefined} onClick={() => seek(item.start)}><span className={styles.number}>{String(item.number).padStart(2, "0")}</span><span>{item.title}<small>{courseTime(item.start)}</small></span></button></li>)}</ol>
      </nav>
    </div>
    <div className={styles.tabs} role="tablist" aria-label="Course materials">{tabs.map((name, index) => <button key={name} id={`water-tab-${index}`} type="button" role="tab" aria-selected={tab === index} aria-controls={`water-panel-${index}`} tabIndex={tab === index ? 0 : -1} onClick={() => setTab(index)} onKeyDown={event => moveTab(event, index)}>{name}</button>)}</div>
    {tabs.map((name, index) => <section key={name} id={`water-panel-${index}`} role="tabpanel" aria-labelledby={`water-tab-${index}`} hidden={tab !== index} tabIndex={0} className={styles.panel}>
      {index === 0 && <>
        <h2>Turn the lens toward the agency itself</h2>
        <p>This course examines how historically dominant white cultural norms in American and Minnesota institutions can shape what seems normal, credible or fair. It connects that examination to community perspectives, disability and language access, intercultural communication, workforce decisions and leadership responsibility.</p>
        <p>Cultural patterns are a starting point for inquiry. They do not tell you what any individual believes or needs. Responsive practice combines evidence, direct listening and a willingness to change how the organization works.</p>
        <h3>By the end, you will be able to</h3>
        <ul><li>Identify assumptions in a service or workplace decision and distinguish evidence from interpretation.</li><li>Use community perspectives and cultural briefs to ask better questions without stereotyping people.</li><li>Choose a practical organizational response, identify who can act and decide how to check whether access improves.</li></ul>
        <h3>Connect the learning</h3>
        <div className={styles.resources}>{course.learning_destinations.filter(item => ["/minnesota-communities/american", "/minnesota-communities/minnesota", "/minnesota-communities"].includes(item.url)).map(item => <Link key={item.url} href={item.url}>{item.title}</Link>)}</div>
        <p className={styles.note}>{course.case_note}</p>
      </>}
      {index === 1 && <><h2>Course transcript</h2>{course.scenes.map(scene => <section className={styles.transcript} key={scene.id}><h3><button type="button" onClick={() => seek(scene.start)} aria-label={`Go to ${scene.title}`}>{courseTime(scene.start)} · {scene.title}</button></h3>{scene.narration.split("\n\n").map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</section>)}</>}
      {index === 2 && <><h2>Sources and context</h2><p>Dates and scope matter. Historical findings provide context; they are not presented as current DHS statistics.</p><ul className={styles.sourceList}>{course.sources.map(source => <li key={source.url}><h3><SourceLink original href={source.url}>{source.title}</SourceLink></h3><p className={styles.meta}>{source.date}</p><p>{source.scope}</p>{source.reading_note && <p>{source.reading_note}</p>}</li>)}</ul></>}
      {index === 3 && <><h2>Continue learning and put it into practice</h2><p>Use the briefs to prepare questions, then explore the tools and courses that match your responsibilities.</p>{[...new Set(course.learning_destinations.map(item => item.group))].map(group => <section key={group}><h3>{group}</h3><ul className={styles.sourceList}>{course.learning_destinations.filter(item => item.group === group).map(item => <li key={item.url}><Link href={item.url}>{item.title}</Link><p>{item.scope}</p></li>)}</ul></section>)}</>}
    </section>)}
  </article>;
}
