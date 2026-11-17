'use client';
import { SourceLink } from "@/components/app-link";


import { useRef, useState } from 'react';
import transcripts from '@/lib/content/intercultural-transcripts.json';
import { FeaturedMediaPanel, mediaLength } from './featured-media-panel';

// Isolated presentation candidate. Its parent must supply media only after a
// separate seven-lesson release gate validates current source, audio and video
// proofs. A URL-shape check by itself is not media verification.
export type LessonMedia = {
  video: string;
  captions: string;
  poster: string;
  durationSeconds: number;
  chapters: { title: string; start: number }[];
};

export function validLessonMedia(id: string, media: LessonMedia | undefined): media is LessonMedia {
  if (!/^0[1-7]$/.test(id) || !media || typeof media !== 'object') return false;
  const base = `/learning/intercultural-curriculum/${id}/`;
  if (media.video !== base + 'lesson.mp4' || media.captions !== base + 'captions.vtt' || media.poster !== base + 'poster.png') return false;
  if (!Number.isFinite(media.durationSeconds) || media.durationSeconds <= 0 || !Array.isArray(media.chapters) || media.chapters.length !== 6) return false;
  return media.chapters.every((chapter, i, chapters) => Boolean(chapter) && typeof chapter === 'object' && typeof chapter.title === 'string' && Boolean(chapter.title.trim()) &&
    Number.isFinite(chapter.start) && chapter.start >= 0 && chapter.start < media.durationSeconds &&
    (i === 0 || chapter.start > chapters[i - 1].start));
}

export default function InterculturalLessonVideo({ id, title, media }: { id: string; title: string; media?: LessonMedia }) {
  const video = useRef<HTMLVideoElement>(null);
  const pendingSeek = useRef<number | null>(null);
  const [message, setMessage] = useState('');
  if (!validLessonMedia(id, media)) return null;
  const sections = (transcripts as Record<string, { title: string; text: string }[]>)[id] ?? [];
  return <FeaturedMediaPanel kind="video" length={mediaLength(media.durationSeconds)}><section aria-labelledby={`watch-${id}`}>
    <h2 id={`watch-${id}`}>Watch and work through the lesson</h2>
    <video ref={video} onLoadedMetadata={() => { if (video.current && pendingSeek.current !== null) { video.current.currentTime = pendingSeek.current; pendingSeek.current = null; } }} onError={() => setMessage('This video could not be loaded. You can read its complete transcript below.')} controls preload="metadata" playsInline poster={media.poster} aria-label={title}
      onPlay={event => document.querySelectorAll<HTMLMediaElement>('audio,video').forEach(other => { if (other !== event.currentTarget) other.pause(); })}>
      <source src={media.video} type="video/mp4" />
      <track kind="captions" src={media.captions} srcLang="en" label="English" default />
      Your browser cannot play this video. The full transcript is below.
    </video>
    <p role="status">{message}</p>
    <SourceLink href={media.video}>Open the video</SourceLink>{' | '}<SourceLink href={media.captions}>Download captions</SourceLink>
    <details><summary>Go to a chapter</summary><ol>{media.chapters.map((chapter, i) => <li key={`${i}-${chapter.title}`}>
      <button type="button" onClick={() => { if (video.current) { if (video.current.readyState < 1) { pendingSeek.current = chapter.start; video.current.load(); } else video.current.currentTime = chapter.start; video.current.focus(); } }}>{chapter.title}</button>
    </li>)}</ol></details>
    <details><summary>Read the complete transcript for {title}</summary>{sections.map(section => <section key={section.title}><h3>{section.title}</h3><p>{section.text}</p></section>)}</details>
  </section></FeaturedMediaPanel>;
}
