'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import type { CardDescription, ChapterKeyPoints } from '@/lib/content/clas-curriculum-practice';
import { clearPosition, readPosition, readSpeed, resumable, SPEEDS, writePosition, writeSpeed, type Speed } from '@/lib/learning/media-storage';
import { activeIndex, formatTime, groupCuesIntoSentences, parseVtt, type Chapter, type Cue } from '@/lib/learning/vtt';
import { ChapterList } from './chapter-list';
import { pauseOtherMedia } from './download';
import { SyncedTranscript } from './transcript';

type Props = {
  /** Storage id for the remembered position, for example "video:01" or "walkthrough:01". */
  mediaId: string;
  kind: 'video' | 'audio';
  src: string;
  captions?: string | null;
  poster?: string;
  label: string;
  chapters: Chapter[];
  cues: Cue[];
  keyPoints?: ChapterKeyPoints[];
  cardDescriptions?: CardDescription[];
  transcriptTitle: string;
  /** Rendered directly under the media: the pause cue and the download links. */
  children?: ReactNode;
};

/** Speed control shared by every CLAS player; the choice is remembered on this device. */
export function SpeedControl({ speed, onChange }: { speed: Speed; onChange: (speed: Speed) => void }) {
  const id = useId();
  return (
    <label className="clas-speed" htmlFor={id}>Speed
      <select id={id} value={speed} onChange={event => onChange(Number(event.target.value) as Speed)}>
        {SPEEDS.map(s => <option key={s} value={s}>{s === 1 ? 'Normal' : `${s}×`}</option>)}
      </select>
    </label>
  );
}

/**
 * One video or audio element with a synced transcript, chapter navigation, playback speed and a
 * remembered position. Playback never starts on its own: the learner presses play, a sentence or a
 * chapter. Pressing play pauses any other media on the page.
 */
export function SyncedMediaPlayer({ mediaId, kind, src, captions, poster, label, chapters, cues, keyPoints, cardDescriptions, transcriptTitle, children }: Props) {
  const media = useRef<HTMLMediaElement | null>(null);
  const lastSaved = useRef(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);
  const [fetchedCues, setFetchedCues] = useState<Cue[]>([]);
  const headingId = useId();

  const allCues = cues.length ? cues : fetchedCues;
  const activeCue = useMemo(() => activeIndex(allCues, time), [allCues, time]);
  const activeChapter = useMemo(() => activeIndex(chapters, time), [chapters, time]);
  const chapterItems = useMemo(() => chapters.map(c => ({ ...c, description: cardDescriptions?.find(d => d.chapter === c.title)?.description })), [chapters, cardDescriptions]);

  // Browser storage is unavailable during server rendering; read the remembered speed after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSpeed(readSpeed()); }, []);

  // Captions that are not a local file (a media volume, for example) are fetched in the browser.
  useEffect(() => {
    if (cues.length || !captions || typeof fetch !== 'function') return;
    let cancelled = false;
    fetch(captions).then(r => (r.ok ? r.text() : '')).then(text => { if (!cancelled && text) setFetchedCues(groupCuesIntoSentences(parseVtt(text))); }).catch(() => { /* transcript simply stays hidden */ });
    return () => { cancelled = true; };
  }, [captions, cues.length]);

  const seek = useCallback((seconds: number) => {
    const el = media.current;
    if (!el) return;
    el.currentTime = seconds;
    setTime(seconds);
    const started = el.play();
    if (started && typeof started.catch === 'function') started.catch(() => { /* the learner can press play */ });
  }, []);

  function onLoadedMetadata(event: SyntheticEvent<HTMLMediaElement>) {
    const el = event.currentTarget;
    el.playbackRate = speed;
    const position = resumable(readPosition(mediaId), el.duration);
    if (position !== null) { el.currentTime = position; setTime(position); setResumedFrom(position); }
  }
  function onTimeUpdate(event: SyntheticEvent<HTMLMediaElement>) {
    const now = event.currentTarget.currentTime;
    setTime(now);
    if (Math.abs(now - lastSaved.current) >= 3) { lastSaved.current = now; writePosition(mediaId, now); }
  }
  function onPause(event: SyntheticEvent<HTMLMediaElement>) {
    setPlaying(false);
    const now = event.currentTarget.currentTime;
    if (now > 0 && !event.currentTarget.ended) writePosition(mediaId, now);
  }
  function onPlay(event: SyntheticEvent<HTMLMediaElement>) {
    pauseOtherMedia(event.currentTarget);
    event.currentTarget.playbackRate = speed;
    setPlaying(true);
  }
  function onEnded() { setPlaying(false); clearPosition(mediaId); setResumedFrom(null); }
  function changeSpeed(next: Speed) { setSpeed(next); writeSpeed(next); if (media.current) media.current.playbackRate = next; }
  function startOver() { const el = media.current; if (el) { el.currentTime = 0; } setTime(0); setResumedFrom(null); clearPosition(mediaId); lastSaved.current = 0; }
  function goToChapter(index: number) { if (index >= 0 && index < chapters.length) seek(chapters[index].start); }

  const mediaProps = {
    ref: (el: HTMLMediaElement | null) => { media.current = el; },
    controls: true, preload: 'metadata' as const, 'aria-label': label,
    onLoadedMetadata, onTimeUpdate, onPause, onPlay, onEnded,
  };

  return (
    <div className={`clas-player clas-player--${kind}`}>
      {kind === 'video'
        ? <video {...mediaProps} playsInline poster={poster}><source src={src} type="video/mp4" />{captions && <track kind="captions" src={captions} srcLang="en" label="English" default />}Your browser cannot play this video. The transcript below has every sentence.</video>
        : <audio {...mediaProps} src={src}>Your browser cannot play this audio. The transcript below has every sentence.</audio>}
      {children}
      <div className="clas-player-controls">
        <SpeedControl speed={speed} onChange={changeSpeed} />
        {chapters.length > 0 && <>
          <button type="button" className="clas-study-secondary" onClick={() => goToChapter(Math.max(0, activeChapter - 1))} disabled={activeChapter <= 0}>Previous chapter</button>
          <button type="button" className="clas-study-secondary" onClick={() => goToChapter(activeChapter + 1)} disabled={activeChapter >= chapters.length - 1}>Next chapter</button>
        </>}
        <p className="clas-player-status" role="status">
          {resumedFrom !== null && <>Resumed at {formatTime(resumedFrom)}, where you left off on this device. <button type="button" className="clas-study-link" onClick={startOver}>Start from the beginning</button></>}
        </p>
      </div>
      <ChapterList label={`Chapters: ${label}`} chapters={chapterItems} active={activeChapter} onSelect={goToChapter} />
      <SyncedTranscript headingId={headingId} title={transcriptTitle} cues={allCues} chapters={chapters} active={activeCue} playing={playing} keyPoints={keyPoints} cardDescriptions={cardDescriptions} onSeek={seek} />
    </div>
  );
}
