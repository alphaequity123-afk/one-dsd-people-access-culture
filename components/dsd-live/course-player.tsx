"use client";
import { useId, useRef, useState } from "react";
import { chapterAt, formatTime, seekTo, spokenTime } from "@/lib/dsd-live/media/player";
import type { MediaPart } from "@/lib/dsd-live/media/manifest";
import { CaptionsBelow } from "@/components/dsd-live/captions-below";

export type PlayerPart = MediaPart & { title: string };

/**
 * Video for one or more course parts, with chapters that seek the recording and a Listen choice that plays the audio
 * from the same recording. Plain text controls only. Nothing about what a person watches is stored or sent anywhere.
 */
export function CoursePlayer({ parts }: { parts: PlayerPart[] }) {
  const [selected, setSelected] = useState(parts[0]?.part);
  const part = parts.find(p => p.part === selected) ?? parts[0];
  if (!part) return null;
  return <section className="player-block" aria-label={`${part.title}: course media`}>
    <PartPlayer key={part.part} part={part} />
    {/* The part choice sits below the video so the video itself stays directly under the title. */}
    {parts.length > 1 ? <div className="part-choice" role="group" aria-label={`${part.title}: choose a course part`}>
      {parts.map(p => <button type="button" key={p.part} className="choice" aria-pressed={p.part === part.part} onClick={() => setSelected(p.part)}>
        Part {p.part}: {p.title}
      </button>)}
    </div> : null}
  </section>;
}

function PartPlayer({ part }: { part: PlayerPart }) {
  const [mode, setMode] = useState<"video" | "audio">("video");
  const [current, setCurrent] = useState(0);
  const [message, setMessage] = useState("");
  const helpId = useId();
  const media = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const pendingChapter = useRef<number | null>(null);
  // When switching between watching and listening, pick up where the other recording was.
  const carry = useRef<{ time: number; playing: boolean } | null>(null);
  const crossOrigin = /^https:/.test(part.captions) ? "anonymous" as const : undefined;

  const switchTo = (next: "video" | "audio") => {
    if (next === mode) return;
    const el = media.current;
    carry.current = el ? { time: el.currentTime, playing: !el.paused } : null;
    setMode(next);
    setMessage(next === "audio" ? "Audio version selected." : "Video version selected. Captions appear under the video.");
  };
  const resume = () => {
    const el = media.current, from = carry.current;
    carry.current = null;
    if (el && pendingChapter.current !== null) { seekTo(el, pendingChapter.current); pendingChapter.current = null; return; }
    if (!el || !from) return;
    if (from.playing) seekTo(el, from.time); else el.currentTime = from.time;
  };
  const onTime = () => { const el = media.current; if (el) setCurrent(chapterAt(part.chapters, el.currentTime)); };
  const goTo = (index: number) => { setCurrent(index); if (media.current && media.current.readyState < 1) { pendingChapter.current = part.chapters[index].start; media.current.load(); } else seekTo(media.current, part.chapters[index].start); setMessage(`Selected ${part.chapters[index].title}, starting at ${spokenTime(part.chapters[index].start)}.`); };

  return <div className="player">
    <div className="player-media">
      {mode === "video"
        ? <video ref={media} controls controlsList="nodownload" aria-label={`${part.title}: video`} aria-describedby={helpId} onError={() => setMessage("The video could not be loaded. Open the transcript below or try Listen.")} preload="metadata" playsInline poster={part.poster} crossOrigin={crossOrigin} onTimeUpdate={onTime} onSeeked={onTime} onLoadedMetadata={resume}>
            <source src={part.video} type="video/mp4" />
            <track kind="captions" src={part.captions} srcLang="en" label="English captions" default />
            Your browser cannot play this video. The transcript is on this page.
          </video>
        : <audio ref={media} controls controlsList="nodownload" aria-label={`${part.title}: audio`} aria-describedby={helpId} onError={() => setMessage("The audio could not be loaded. Open the transcript below or try Watch.")} preload="metadata" onTimeUpdate={onTime} onSeeked={onTime} onLoadedMetadata={resume}>
            <source src={part.audio} type="audio/mpeg" />
            Your browser cannot play this audio. The transcript is on this page.
          </audio>}
      {mode === "video" ? <CaptionsBelow media={media} label={part.title} /> : null}
      <p id={helpId} className="meta">The player controls let you play, pause or adjust the volume. Captions appear under the video while watching. <a href={part.transcript}>Read the transcript for {part.title}</a>.</p>
      <p className="meta" role="status" aria-live="polite">{message}</p>
      <div className="listen-choice" role="group" aria-label={`${part.title}: watch or listen`}>
        <button type="button" className="choice" aria-pressed={mode === "video"} onClick={() => switchTo("video")}>Watch</button>
        <button type="button" className="choice" aria-pressed={mode === "audio"} onClick={() => switchTo("audio")}>Listen</button>
      </div>
    </div>
    <nav className="chapters" aria-label={`${part.title}: chapters in part ${part.part}`}>
      <h2 className="chapters-title">Chapters</h2>
      <ol>
        {part.chapters.map((chapter, i) => <li key={`${chapter.start}-${chapter.title}`}>
          <button type="button" className={i === current ? "chapter is-current" : "chapter"} aria-current={i === current ? "true" : undefined} onClick={() => goTo(i)}>
            <span className="chapter-time" aria-hidden="true">{formatTime(chapter.start)}</span>
            <span className="chapter-title">{chapter.title}</span>
            <span className="skip">, starts at {spokenTime(chapter.start)}</span>
          </button>
        </li>)}
      </ol>
    </nav>
  </div>;
}
