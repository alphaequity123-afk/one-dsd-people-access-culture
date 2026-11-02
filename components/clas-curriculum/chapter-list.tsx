'use client';
import { useId, type KeyboardEvent } from 'react';
import { formatTime } from '@/lib/learning/vtt';

export type ChapterItem = { title: string; start: number; label?: string; description?: string };

type Props = { label: string; chapters: ChapterItem[]; active: number; onSelect: (index: number) => void };

/**
 * Chapter navigation as real buttons: Tab reaches them, arrow keys move between them, and the
 * playing chapter carries aria-current. A chapter's card description is read with its button.
 */
export function ChapterList({ label, chapters, active, onSelect }: Props) {
  const baseId = useId();
  function onKeyDown(event: KeyboardEvent<HTMLOListElement>) {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0 || !buttons.length) return;
    const moves: Record<string, number> = { ArrowDown: current + 1, ArrowRight: current + 1, ArrowUp: current - 1, ArrowLeft: current - 1, Home: 0, End: buttons.length - 1 };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    buttons[Math.min(buttons.length - 1, Math.max(0, next))].focus();
  }
  if (!chapters.length) return null;
  return (
    <nav aria-label={label} className="clas-chapters">
      <ol onKeyDown={onKeyDown}>
        {chapters.map((chapter, index) => {
          const descriptionId = chapter.description ? `${baseId}-chapter-${index}` : undefined;
          return (
            <li key={`${chapter.title}-${index}`}>
              <button type="button" aria-current={index === active ? 'true' : undefined} aria-describedby={descriptionId} onClick={() => onSelect(index)}>
                <span className="clas-chapter-time">{chapter.label ?? formatTime(chapter.start)}</span>
                <span className="clas-chapter-title">{chapter.title}</span>
              </button>
              {descriptionId && <span id={descriptionId} className="sr-only">{chapter.description}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
