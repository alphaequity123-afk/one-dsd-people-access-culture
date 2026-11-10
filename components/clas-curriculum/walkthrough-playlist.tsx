'use client';
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import type { Walkthrough } from '@/lib/learning/clas-walkthrough';
import { clearPosition, readPosition, readSpeed, resumable, writePosition, writeSpeed, type Speed } from '@/lib/learning/media-storage';
import { formatTime } from '@/lib/learning/vtt';
import { ChapterList } from './chapter-list';
import { pauseOtherMedia } from './download';
import { SpeedControl } from './media-player';

export type WalkthroughItem = { id: string; title: string; walkthrough: Walkthrough };
export const PLAYLIST_CHAPTER_ID = 'walkthrough-full-chapter';
export const walkthroughMediaId = (id: string) => `walkthrough:${id}`;

/**
 * One audio element that plays the nine chapter files in sequence. The learner starts playback; a
 * chapter that ends moves to the next one and keeps playing. Position and chapter are remembered on
 * this device, and the per-chapter position is shared with the lesson page's player.
 */
export function WalkthroughPlaylist({ items }: { items: WalkthroughItem[] }) {
  const audio = useRef<HTMLAudioElement>(null);
  const continueRef = useRef(false);
  const lastSaved = useRef(0);
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const current = items[index];
  const total = useMemo(() => items.reduce((sum, item) => sum + item.walkthrough.durationSeconds, 0), [items]);
  const chapters = useMemo(() => items.map((item, n) => ({ title: `Part ${n + 1}: ${item.title}`, start: n, label: item.walkthrough.durationSeconds ? formatTime(item.walkthrough.durationSeconds) : '' })), [items]);

  // Browser storage is unavailable during server rendering; restore the chapter and speed afterwards.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setSpeed(readSpeed());
    const saved = readPosition(PLAYLIST_CHAPTER_ID);
    if (saved !== null && saved - 1 > 0 && saved - 1 < items.length) setIndex(saved - 1);
  }, [items.length]);

  // After the playlist advances, the new element starts only because the learner was already listening.
  useEffect(() => {
    if (!continueRef.current) return;
    continueRef.current = false;
    const el = audio.current;
    if (!el) return;
    el.playbackRate = speed;
    const started = el.play();
    if (started && typeof started.catch === 'function') started.catch(() => setStatus('Press play to continue with the next chapter.'));
  }, [index, speed]);

  if (!current) return null;
  const mediaId = walkthroughMediaId(current.id);

  function select(next: number, play: boolean) {
    if (next < 0 || next >= items.length) return;
    const wasPlaying = audio.current ? !audio.current.paused : false;
    continueRef.current = play || wasPlaying;
    setIndex(next);
    setTime(0);
    setResumedFrom(null);
    lastSaved.current = 0;
    writePosition(PLAYLIST_CHAPTER_ID, next + 1);
    setStatus('');
  }
  function onLoadedMetadata(event: SyntheticEvent<HTMLAudioElement>) {
    const el = event.currentTarget;
    el.playbackRate = speed;
    const position = resumable(readPosition(mediaId), el.duration);
    if (position !== null) { el.currentTime = position; setTime(position); setResumedFrom(position); }
  }
  function onTimeUpdate(event: SyntheticEvent<HTMLAudioElement>) {
    const now = event.currentTarget.currentTime;
    setTime(now);
    if (Math.abs(now - lastSaved.current) >= 3) { lastSaved.current = now; writePosition(mediaId, now); writePosition(PLAYLIST_CHAPTER_ID, index + 1); }
  }
  function onPause(event: SyntheticEvent<HTMLAudioElement>) {
    const now = event.currentTarget.currentTime;
    if (now > 0 && !event.currentTarget.ended) writePosition(mediaId, now);
  }
  function onEnded() {
    clearPosition(mediaId);
    setResumedFrom(null);
    if (index < items.length - 1) select(index + 1, true);
    else { clearPosition(PLAYLIST_CHAPTER_ID); setStatus('You have reached the end of the walkthrough.'); }
  }
  function changeSpeed(next: Speed) { setSpeed(next); writeSpeed(next); if (audio.current) audio.current.playbackRate = next; }
  function startOver() { if (audio.current) audio.current.currentTime = 0; setTime(0); setResumedFrom(null); clearPosition(mediaId); lastSaved.current = 0; }

  return (
    <div className="clas-player clas-player--audio clas-playlist">
      <p className="clas-playlist-now"><strong>Now playing:</strong> Part {index + 1} of {items.length}, {current.title}{current.walkthrough.durationSeconds ? ` (${formatTime(current.walkthrough.durationSeconds)})` : ''}{time > 0 ? ` · ${formatTime(time)}` : ''}</p>
      <audio key={current.id} ref={audio} controls preload="metadata" src={current.walkthrough.audio} aria-label={`Walkthrough, Part ${index + 1}: ${current.title}`}
        onPlay={event => { pauseOtherMedia(event.currentTarget); event.currentTarget.playbackRate = speed; }}
        onLoadedMetadata={onLoadedMetadata} onTimeUpdate={onTimeUpdate} onPause={onPause} onEnded={onEnded}
        onError={() => setStatus('This chapter could not be loaded. You can open it from its lesson page.')}>
        Your browser cannot play this audio. Each lesson page offers the same chapter with a transcript.
      </audio>
      <p>When a chapter ends, the next one follows{total ? `; the full walkthrough runs about ${Math.round(total / 60)} minutes` : ''}. You can pause at any time and return later.</p>
      <div className="clas-player-controls">
        <SpeedControl speed={speed} onChange={changeSpeed} />
        <button type="button" className="clas-study-secondary" onClick={() => select(index - 1, false)} disabled={index === 0}>Previous chapter</button>
        <button type="button" className="clas-study-secondary" onClick={() => select(index + 1, false)} disabled={index >= items.length - 1}>Next chapter</button>
        <p className="clas-player-status" role="status">
          {resumedFrom !== null && <>Resumed at {formatTime(resumedFrom)}, where you left off on this device. <button type="button" className="clas-study-link" onClick={startOver}>Start this chapter from the beginning</button> </>}
          {status}
        </p>
      </div>
      <ChapterList label="Walkthrough chapters" chapters={chapters} active={index} onSelect={n => select(n, false)} />
      <p><a href={current.walkthrough.audio}>Open this chapter's audio</a>{current.walkthrough.captions && <> · <a href={current.walkthrough.captions}>Download its captions</a></>} · <a href={`/learn/clas/curriculum/${current.id}`}>Open Part {index + 1} with the synced transcript</a></p>
    </div>
  );
}
