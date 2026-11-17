'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CardDescription, ChapterKeyPoints } from '@/lib/content/clas-curriculum-practice';
import { chapterBoundaries, formatTime, type Chapter, type Cue } from '@/lib/learning/vtt';

type Props = {
  headingId: string;
  title: string;
  cues: Cue[];
  chapters: Chapter[];
  active: number;
  playing: boolean;
  keyPoints?: ChapterKeyPoints[];
  cardDescriptions?: CardDescription[];
  onSeek: (seconds: number) => void;
};

/**
 * Sentence-by-sentence transcript. The sentence being spoken carries aria-current and is kept in
 * view while the media plays; each sentence is a button that seeks to its start. Chapter titles
 * appear at the boundary, with that chapter's key points and card description.
 */
export function SyncedTranscript({ headingId, title, cues, chapters, active, playing, keyPoints = [], cardDescriptions = [], onSeek }: Props) {
  const list = useRef<HTMLOListElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [follow, setFollow] = useState(false);
  const boundaries = useMemo(() => chapterBoundaries(cues, chapters), [cues, chapters]);
  const pointsFor = (chapter: string) => keyPoints.find(k => k.chapter === chapter)?.points ?? [];
  const descriptionFor = (chapter: string) => cardDescriptions.find(d => d.chapter === chapter)?.description;

  useEffect(() => {
    const container = list.current;
    if (!follow || !playing || !container || active < 0) return;
    const item = container.querySelector<HTMLElement>(`[data-cue="${active}"]`);
    if (!item || container.scrollHeight <= container.clientHeight) return;
    const top = item.offsetTop - container.offsetTop;
    if (top < container.scrollTop || top + item.offsetHeight > container.scrollTop + container.clientHeight) container.scrollTop = Math.max(0, top - container.clientHeight / 3);
  }, [active, playing, follow]);

  if (!cues.length) return null;
  return (
    <section className="clas-transcript" aria-labelledby={headingId}>
      <div className="clas-transcript-head">
        <h3 id={headingId}>{title}</h3>
        <button type="button" className="clas-study-secondary" aria-expanded={expanded} aria-controls={`${headingId}-passages`} onClick={() => setExpanded(e => !e)}>{expanded ? 'Shorten the transcript box' : 'Expand the transcript box'}</button>
      </div>
      <p className="clas-transcript-help">The sentence being spoken is highlighted. Choose a sentence or a chapter title to play from there.</p>
      <label className="clas-transcript-help"><input type="checkbox" checked={follow} onChange={event => setFollow(event.target.checked)} /> Follow the current sentence while playing</label>
      <ol id={`${headingId}-passages`} ref={list} className={expanded ? 'clas-transcript-list is-expanded' : 'clas-transcript-list'}>
        {cues.map((cue, index) => {
          const chapterIndex = boundaries.get(index);
          const chapter = chapterIndex === undefined ? null : chapters[chapterIndex];
          const points = chapter ? pointsFor(chapter.title) : [];
          const description = chapter ? descriptionFor(chapter.title) : undefined;
          return (
            <li key={`${cue.start}-${index}`} data-cue={index} className={index === active ? 'clas-transcript-cue is-active' : 'clas-transcript-cue'}>
              {chapter && (
                <div className="clas-transcript-chapter">
                  <h4><button type="button" onClick={() => onSeek(chapter.start)}>{chapter.title}<span className="sr-only"> (chapter, starts at {formatTime(chapter.start)})</span></button></h4>
                  {description && <p className="sr-only">Card shown: {description}</p>}
                  {points.length > 0 && <div className="clas-keypoints-inline"><p><strong>Key points</strong></p><ul>{points.map(point => <li key={point}>{point}</li>)}</ul></div>}
                </div>
              )}
              <button type="button" aria-current={index === active ? 'true' : undefined} onClick={() => onSeek(cue.start)}>
                <span className="clas-transcript-time" aria-hidden="true">{formatTime(cue.start)}</span>
                <span className="sr-only">{formatTime(cue.start)}: </span>
                <span className="clas-transcript-text">{cue.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
