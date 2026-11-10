"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Item = {
  id: string; title: string; kind: "video" | "audio"; summary: string; media: string; captions: string;
  transcript: string; poster?: string; durationSeconds: number; chapters: { title: string; start: number }[];
};

function minutes(seconds: number) {
  const m = Math.round(seconds / 60);
  return m <= 1 ? "about 1 minute" : `about ${m} minutes`;
}
function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Player({ item }: { item: Item }) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const seek = (start: number) => { if (ref.current) { ref.current.currentTime = start; void ref.current.play().catch(() => undefined); } };
  const label = item.kind === "video" ? "Watch" : "Listen";
  return <section className="course-media-item" aria-labelledby={`cm-${item.id}`}>
    <p className="calm-kicker">{label}, {minutes(item.durationSeconds)}</p>
    <h2 id={`cm-${item.id}`}>{item.title}</h2>
    {item.summary ? <p className="calm-muted">{item.summary}</p> : null}
    {item.kind === "video"
      ? <video ref={ref} controls preload="none" poster={item.poster} style={{ width: "100%", maxWidth: "960px", borderRadius: "8px", background: "#000" }}>
          <source src={item.media} type="video/mp4" />
          <track kind="captions" src={item.captions} srcLang="en" label="English" default />
        </video>
      : <audio ref={ref} controls preload="none" style={{ width: "100%", maxWidth: "720px" }}>
          <source src={item.media} type="audio/mpeg" />
          <track kind="captions" src={item.captions} srcLang="en" label="English" default />
        </audio>}
    {item.chapters.length > 1 ? <details>
      <summary>Chapters</summary>
      <ol className="calm-list">{item.chapters.map(chapter => <li key={`${chapter.start}-${chapter.title}`}>
        <button type="button" className="course-media-chapter" onClick={() => seek(chapter.start)}>{chapter.title}</button> <span className="calm-muted calm-small">{clock(chapter.start)}</span>
      </li>)}</ol>
    </details> : null}
    <p className="calm-small"><a href={item.transcript}>Read the full transcript</a></p>
  </section>;
}

/** Published course media for this page, if any. Shown only when something is published; nothing is recorded. */
export function CourseMediaForPage() {
  const pathname = usePathname();
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let live = true;
    setItems([]);
    fetch(`/api/course-media?page=${encodeURIComponent(pathname)}`).then(r => r.ok ? r.json() : { items: [] }).then(body => {
      if (live && Array.isArray(body.items)) setItems(body.items as Item[]);
    }).catch(() => undefined);
    return () => { live = false; };
  }, [pathname]);
  if (!items.length) return null;
  return <div className="calm course-media" style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
    {items.map(item => <Player key={item.id} item={item} />)}
  </div>;
}
