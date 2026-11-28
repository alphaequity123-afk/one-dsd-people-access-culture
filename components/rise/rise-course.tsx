"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "@/components/app-link";
import { LearningAudio } from "@/components/learning-audio";
import type { RiseBlock, RiseCourse, RiseLesson } from "@/lib/content/courses/rise/types";

/* Progress stays in this browser only (owner rule: no one's learning activity is recorded). */
const storageKey = (courseId: string) => `rise-progress:${courseId}`;
const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback); window.addEventListener("storage", callback);
  return () => { listeners.delete(callback); window.removeEventListener("storage", callback); };
}
function readRaw(courseId: string): string {
  try { return localStorage.getItem(storageKey(courseId)) || "[]"; } catch { return "[]"; }
}
function useDone(courseId: string) {
  const raw = useSyncExternalStore(subscribe, () => readRaw(courseId), () => "[]");
  const done = useMemo<string[]>(() => { try { return JSON.parse(raw); } catch { return []; } }, [raw]);
  const mark = (lessonId: string) => {
    const next = Array.from(new Set([...done, lessonId]));
    try { localStorage.setItem(storageKey(courseId), JSON.stringify(next)); } catch { /* private mode */ }
    listeners.forEach(listener => listener());
  };
  return { done, mark };
}
const lessonHref = (courseId: string, lessonId: string) => `/courses/${courseId}/${lessonId}`;
const allLessons = (course: RiseCourse) => course.sections.flatMap(s => s.lessons);

function Pie({ done }: { done: boolean }) {
  return <span className={`rise-pie${done ? " is-done" : ""}`} aria-label={done ? "Finished" : "Not finished"} role="img" />;
}

/* ---------- Cover page ---------- */
export function RiseCourseOverview({ course }: { course: RiseCourse }) {
  const { done } = useDone(course.id);
  const lessons = allLessons(course);
  const next = lessons.find(l => !done.includes(l.id)) ?? lessons[0];
  const started = done.length > 0;
  return <div className="rise">
    <header className="rise-cover">
      <Image src={course.cover.src} alt="" fill priority sizes="100vw" className="rise-cover-img" />
      <div className="rise-cover-in">
        <p className="rise-eyebrow">{course.eyebrow}</p>
        <h1>{course.title}</h1>
        <p className="rise-cover-sum">{course.summary}</p>
        <div className="rise-cover-actions">
          <Link className="rise-pill rise-pill--white" href={lessonHref(course.id, next.id)}>{started && done.length < lessons.length ? "Resume course" : "Start course"}</Link>
          <a className="rise-details" href="#course-details">Details</a>
        </div>
      </div>
    </header>
    <div className="rise-ov" id="course-details">
      {course.introVideo ? <figure className="rise-intro-video">
        <video controls preload="metadata" poster={course.introVideo.poster} src={course.introVideo.src}>{course.introVideo.captions ? <track kind="captions" src={course.introVideo.captions} srcLang="en" label="English" default /> : null}</video>
      </figure> : null}
      {course.description.map((p, i) => <p key={i}>{p}</p>)}
      <h2 className="rise-ov-h">By the end, you’ll be able to</h2>
      <ul className="rise-ov-outcomes">{course.outcomes.map((o, i) => <li key={i}>{o}</li>)}</ul>
      <p className="rise-ov-meta">{lessons.length} lessons · about {lessons.reduce((n, l) => n + l.minutes, 0)} minutes{started ? ` · ${done.length} of ${lessons.length} finished` : ""}</p>
      <nav aria-label="Course outline" className="rise-ov-list">
        {course.sections.map(section => <div key={section.title}>
          <h2 className="rise-sec">{section.title}</h2>
          <ol>{section.lessons.map(lesson => <li key={lesson.id}><Link href={lessonHref(course.id, lesson.id)}><span>{lesson.title}</span><Pie done={done.includes(lesson.id)} /></Link></li>)}</ol>
        </div>)}
      </nav>
      <details className="rise-sources"><summary>Sources</summary><ul>{course.sources.map(s => <li key={s.href}><a href={s.href} target="_blank" rel="noreferrer">{s.title}</a><p>{s.note}</p></li>)}</ul></details>
    </div>
  </div>;
}

/* ---------- Lesson page ---------- */
export function RiseLessonView({ course, lessonId }: { course: RiseCourse; lessonId: string }) {
  const { done, mark } = useDone(course.id);
  const [menuOpen, setMenuOpen] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  const lessons = allLessons(course);
  const index = lessons.findIndex(l => l.id === lessonId);
  const lesson = lessons[index];
  const next = lessons[index + 1];
  const pct = Math.round(100 * done.length / lessons.length);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => { const h = document.documentElement; setProgress(Math.min(100, 100 * h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight))); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [lessonId]);
  return <div className={`rise rise-shell${menuOpen ? "" : " is-closed"}${listOpen ? " list-open" : ""}`}>
    <nav className="rise-side" aria-label="Course menu" hidden={!menuOpen}>
      <Link className="rise-side-head" href={`/courses/${course.id}`}>
        <Image src={course.cover.src} alt="" fill sizes="280px" className="rise-cover-img" />
        <span className="rise-side-title">{course.title}</span>
        <span className="rise-side-prog">{pct}% complete</span>
        <span className="rise-side-bar"><i style={{ width: `${pct}%` }} /></span>
      </Link>
      <button type="button" className="rise-list-btn" aria-expanded={listOpen} onClick={() => setListOpen(o => !o)}>{listOpen ? "Hide lessons" : "Show lessons"}</button>
      {course.sections.map(section => <div key={section.title}>
        <h2 className="rise-sec">{section.title}</h2>
        <ol>{section.lessons.map(l => <li key={l.id}><Link className={l.id === lessonId ? "is-on" : undefined} aria-current={l.id === lessonId ? "page" : undefined} href={lessonHref(course.id, l.id)}><span>{l.title}</span><Pie done={done.includes(l.id)} /></Link></li>)}</ol>
      </div>)}
    </nav>
    <div className="rise-main">
      <div className="rise-topline" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
      <button type="button" className="rise-menu-btn" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>{menuOpen ? "Hide menu" : "Menu"}</button>
      <div className="rise-lh">
        <p className="rise-count">Lesson {index + 1} of {lessons.length}</p>
        <h1>{lesson.title}</h1>
        <p className="rise-lh-min">{lesson.minutes} minutes</p>
        <span className="rise-lh-bar" />
      </div>
      <div className="rise-rule" />
      {lesson.narration?.src ? <section className="rise-b"><div className="rise-col rise-audio"><p className="rise-label">Listen to this lesson</p><LearningAudio src={lesson.narration.src} title={`Listen to the lesson: ${lesson.title}`} /><details><summary>Read the narration</summary>{lesson.narration.script.split(/\n\n/).map((t, k) => <p key={k}>{t}</p>)}</details></div></section> : null}
      <LessonBlocks key={lesson.id} lesson={lesson} />
      {next
        ? <Link className="rise-next" href={lessonHref(course.id, next.id)} onClick={() => mark(lesson.id)}>Lesson {index + 2} – {next.title}<span className="rise-chev" aria-hidden="true" /></Link>
        : <Link className="rise-next" href={`/courses/${course.id}`} onClick={() => mark(lesson.id)}>Finish and return to the course<span className="rise-chev" aria-hidden="true" /></Link>}
    </div>
  </div>;
}

function LessonBlocks({ lesson }: { lesson: RiseLesson }) {
  const parts = useMemo(() => {
    const out: RiseBlock[][] = [[]];
    lesson.blocks.forEach(b => b.kind === "continue" ? out.push([]) : out[out.length - 1].push(b));
    return out;
  }, [lesson]);
  const [shown, setShown] = useState(1);
  return <>{parts.slice(0, shown).map((part, p) => <div key={p} className="rise-part" id={`part-${p}`}>
    {part.map((block, i) => <Block key={`${p}-${i}`} block={block} id={`${lesson.id}-${p}-${i}`} />)}
    {p === shown - 1 && p < parts.length - 1 ? <div className="rise-continue"><button type="button" onClick={() => { setShown(shown + 1); setTimeout(() => document.getElementById(`part-${p + 1}`)?.scrollIntoView({ behavior: "smooth" }), 60); }}>Continue</button></div> : null}
  </div>)}</>;
}

/* ---------- Blocks ---------- */
function Block({ block, id }: { block: RiseBlock; id: string }) {
  switch (block.kind) {
    case "audio": return <section className="rise-b"><div className="rise-col rise-audio"><p className="rise-label">{block.title}</p><LearningAudio src={block.src} title={block.title} />{block.transcript ? <details><summary>Read the words</summary>{block.transcript.split(/\n\n/).map((t, i) => <p key={i}>{t}</p>)}</details> : null}</div></section>;
    case "text": return <section className="rise-b"><div className="rise-col">{block.heading ? <h2>{block.heading}</h2> : null}{block.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div></section>;
    case "twoColumn": return <section className="rise-b"><div className="rise-col rise-two">{block.columns.map((c, i) => <div key={i}><h3>{c.heading}</h3><p>{c.text}</p></div>)}</div></section>;
    case "image": return <figure className="rise-b rise-img"><Image src={block.image.src} alt={block.image.alt} width={1536} height={1024} sizes="(max-width: 1100px) 100vw, 1100px" />{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure>;
    case "statement": return <section className="rise-b"><div className="rise-col rise-statement"><span /><p>{block.text}</p></div></section>;
    case "note": return <section className="rise-b"><div className="rise-col"><div className="rise-note"><p><strong>{block.lead}</strong> {block.text}</p></div></div></section>;
    case "numbered": return <section className="rise-b"><div className="rise-col"><h3>{block.heading}</h3><ol className="rise-num">{block.items.map((t, i) => <li key={i}>{t}</li>)}</ol></div></section>;
    case "useAtWork": return <section className="rise-b"><div className="rise-col"><div className="rise-work"><p className="rise-label">Use this at work</p><h3>{block.step ? `${block.tool}: ${block.step}` : block.tool}</h3><p>{block.text}</p><div className="rise-work-links"><Link className="rise-pill" href={block.href}>Open {block.step ?? block.tool}</Link>{block.also?.map(a => <Link key={a.href} className="rise-work-also" href={a.href}>{a.label}</Link>)}</div></div></div></section>;
    case "quote": return <section className="rise-b"><div className="rise-col"><blockquote className="rise-quote"><p>“{block.text}”</p><footer>{block.who}</footer></blockquote></div></section>;
    case "accordion": return <Accordion block={block} id={id} />;
    case "tabs": return <Tabs block={block} id={id} />;
    case "flashcards": return <Flashcards block={block} />;
    case "process": return <Process block={block} />;
    case "sorting": return <Sorting block={block} />;
    case "scenario": return <Scenario block={block} />;
    case "check": return <Check block={block} id={id} />;
    default: return null;
  }
}

function Accordion({ block, id }: { block: Extract<RiseBlock, { kind: "accordion" }>; id: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return <section className="rise-b"><div className="rise-col"><h3>{block.heading}</h3>{block.intro ? <p>{block.intro}</p> : null}
    <div className="rise-card">{block.items.map((item, i) => <div className="rise-acc" key={i}>
      <h4><button type="button" aria-expanded={open === i} aria-controls={`${id}-a${i}`} onClick={() => setOpen(open === i ? null : i)}><span>{item.title}</span><span className="rise-pm" aria-hidden="true">{open === i ? "–" : "+"}</span></button></h4>
      <div id={`${id}-a${i}`} className="rise-acc-body" hidden={open !== i}><p>{item.body}</p></div>
    </div>)}</div></div></section>;
}

function Tabs({ block, id }: { block: Extract<RiseBlock, { kind: "tabs" }>; id: string }) {
  const [on, setOn] = useState(0);
  return <section className="rise-b"><div className="rise-col"><h3>{block.heading}</h3>{block.intro ? <p>{block.intro}</p> : null}
    <div className="rise-card"><div className="rise-tabs" role="tablist" aria-label={block.heading}>{block.items.map((t, i) => <button key={i} type="button" role="tab" id={`${id}-t${i}`} aria-controls={`${id}-p${i}`} aria-selected={on === i} tabIndex={on === i ? 0 : -1} onClick={() => setOn(i)}
      onKeyDown={e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const n = (on + (e.key === "ArrowRight" ? 1 : block.items.length - 1)) % block.items.length; setOn(n); document.getElementById(`${id}-t${n}`)?.focus(); } }}>{t.label}</button>)}</div>
      {block.items.map((t, i) => <div key={i} role="tabpanel" id={`${id}-p${i}`} aria-labelledby={`${id}-t${i}`} hidden={on !== i} className="rise-tabpanel"><p>{t.body}</p></div>)}
    </div></div></section>;
}

function Flashcards({ block }: { block: Extract<RiseBlock, { kind: "flashcards" }> }) {
  const [turned, setTurned] = useState<number[]>([]);
  return <section className="rise-b rise-band"><div className="rise-col"><h3>{block.heading}</h3>{block.intro ? <p>{block.intro}</p> : null}
    <div className="rise-flash">{block.cards.map((c, i) => { const t = turned.includes(i); return <button key={i} type="button" className={`rise-fc${t ? " is-turned" : ""}`} aria-pressed={t} onClick={() => setTurned(t ? turned.filter(x => x !== i) : [...turned, i])}>
      <span className="rise-fc-in"><span className="rise-fc-front">{c.front}<small>Turn over</small></span><span className="rise-fc-back">{c.back}</span></span>
      <span className="sr-only">{t ? c.back : ""}</span>
    </button>; })}</div></div></section>;
}

function Process({ block }: { block: Extract<RiseBlock, { kind: "process" }> }) {
  const [step, setStep] = useState(-1);
  const s = block.steps[step];
  return <section className="rise-b rise-band"><div className="rise-proc">
    <div className="rise-card rise-proc-card" aria-live="polite">
      {step < 0 ? <><h3>{block.title}</h3><p>{block.intro}</p><button type="button" className="rise-pill" onClick={() => setStep(0)}>Start</button></>
        : <><p className="rise-label">Step {step + 1} of {block.steps.length}</p><h3>{s.title}</h3><p>{s.body}</p>
          <div className="rise-dots" aria-hidden="true">{block.steps.map((_, i) => <i key={i} className={i === step ? "is-on" : undefined} />)}</div>
          {step === block.steps.length - 1 ? <button type="button" className="rise-pill" onClick={() => setStep(-1)}>Start again</button> : null}</>}
    </div>
    {step >= 0 ? <button type="button" className="rise-arrow rise-arrow--prev" onClick={() => setStep(step - 1)} aria-label="Previous step">‹</button> : null}
    {step < block.steps.length - 1 ? <button type="button" className="rise-arrow rise-arrow--next" onClick={() => setStep(step + 1)} aria-label="Next step">›</button> : null}
  </div></section>;
}

function Sorting({ block }: { block: Extract<RiseBlock, { kind: "sorting" }> }) {
  const [k, setK] = useState(0);
  const [counts, setCounts] = useState(block.categories.map(() => 0));
  const [msg, setMsg] = useState("");
  const finished = k >= block.items.length;
  const place = (c: number) => {
    if (block.items[k].category === c) { const n = [...counts]; n[c]++; setCounts(n); setK(k + 1); setMsg("That fits."); }
    else setMsg(`Not quite. Think again about where “${block.items[k].text}” belongs.`);
  };
  return <section className="rise-b rise-band"><div className="rise-col rise-sort"><h3>{block.heading}</h3><p>{block.intro}</p>
    <div className="rise-card rise-sort-card">{finished ? block.done : block.items[k].text}</div>
    <div className="rise-bins">{block.categories.map((c, i) => <button key={i} type="button" className="rise-bin" disabled={finished} onClick={() => place(i)}>{c}<small>{counts[i]} placed</small></button>)}</div>
    <p className="rise-sort-msg" aria-live="polite">{finished ? <button type="button" className="rise-pill" onClick={() => { setK(0); setCounts(block.categories.map(() => 0)); setMsg(""); }}>Sort again</button> : msg}</p>
  </div></section>;
}

function Scenario({ block }: { block: Extract<RiseBlock, { kind: "scenario" }> }) {
  const [stage, setStage] = useState<"setup" | "ask" | number>("setup");
  return <section className="rise-b rise-scen">
    <Image src={block.image.src} alt="" fill sizes="(max-width: 1100px) 100vw, 1100px" className="rise-cover-img" />
    <div className={`rise-card rise-scen-card${block.character ? " has-character" : ""}`}>
      {block.character ? <figure className="rise-scen-person"><Image src={block.character.src} alt={block.character.alt} width={600} height={1066} sizes="180px" /><figcaption>{block.character.role}</figcaption></figure> : null}
      <div className="rise-scen-text" aria-live="polite">
      {stage === "setup" ? <><h3>{block.title}</h3><p>{block.setup}</p>{block.lines?.length ? <ol className="rise-lines">{block.lines.map((line, i) => <li key={i}><Image src={`/images/cast/C${line.cast}.webp`} alt="" width={600} height={1066} sizes="44px" className="rise-line-face" /><div><p className="rise-line-role">{line.role}</p><p className="rise-line-text">“{line.text}”</p>{line.audio ? <LineAudio src={line.audio} label={`Hear the ${line.role.toLowerCase()}`} /> : null}</div></li>)}</ol> : null}<button type="button" className="rise-pill" onClick={() => setStage("ask")}>Continue</button></>
        : stage === "ask" ? <><h3>{block.question}</h3><div className="rise-opts">{block.options.map((o, i) => <button key={i} type="button" onClick={() => setStage(i)}>{o.text}</button>)}</div></>
        : <><h3>{block.options[stage].best ? "That’s the one" : "Think about it"}</h3><p>{block.options[stage].feedback}</p><button type="button" className="rise-pill" onClick={() => setStage(block.options[stage].best ? "setup" : "ask")}>{block.options[stage].best ? "Play again" : "Try again"}</button></>}
      </div>
    </div>
  </section>;
}

/** One spoken line: a small play button, so a scenario can be heard line by line. */
function LineAudio({ src, label }: { src: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  return <button type="button" className="rise-line-play" aria-label={label} aria-pressed={playing} onClick={event => {
    const audio = event.currentTarget.querySelector("audio");
    if (!audio) return;
    if (playing) { audio.pause(); return; }
    document.querySelectorAll<HTMLMediaElement>("audio, video").forEach(media => { if (media !== audio) media.pause(); });
    audio.currentTime = 0; void audio.play();
  }}>{playing ? "Pause" : "Play"}<audio src={src} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} /></button>;
}

function Check({ block, id }: { block: Extract<RiseBlock, { kind: "check" }>; id: string }) {
  const [pick, setPick] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const ok = pick !== null && !!block.options[pick].correct;
  return <section className="rise-b"><div className="rise-col"><form className="rise-card rise-kc" onSubmit={e => { e.preventDefault(); setSent(true); }}>
    <p className="rise-label">Knowledge check</p>
    <fieldset disabled={sent}><legend className="rise-kc-q">{block.question}</legend>
      {block.options.map((o, i) => <label key={i}><input type="radio" name={id} checked={pick === i} onChange={() => setPick(i)} /><span>{o.text}</span></label>)}
    </fieldset>
    <div className="rise-kc-actions">{sent ? <button type="button" className="rise-pill" onClick={() => { setSent(false); setPick(null); }}>Take again</button> : <button type="submit" className="rise-pill" disabled={pick === null}>Submit</button>}</div>
    <div aria-live="polite">{sent ? <div className={`rise-fb ${ok ? "is-good" : "is-bad"}`}><p className="rise-fb-h">{ok ? "Correct" : "Not quite"}</p><p>{ok ? block.right : block.wrong}</p></div> : null}</div>
  </form></div></section>;
}
