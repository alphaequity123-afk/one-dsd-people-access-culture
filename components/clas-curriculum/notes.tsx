'use client';
import { SourceLink } from "@/components/app-link";

import { useEffect, useState } from 'react';
import { assemblePlan, clearNotes, planText, readAllNotes, readNote, writeNote, type PlanModule } from '@/lib/learning/clas-notes';
import { downloadText } from './download';

export const NOTE_PRIVACY = 'Your note is saved in this browser profile when browser storage is available. Someone using the same profile may be able to read it. Clearing browser data can remove it; downloaded or printed copies are separate. The working-note feature does not submit your note to supervisors or program staff. Do not include names, case details or other private information.';

type NoteProps = { moduleId: string; title: string; prompt: string; allModuleIds: string[]; onChange?: () => void };

/** The lesson's working note, kept in this browser under one key per part, with a clear-all control. */
export function WorkingNote({ moduleId, title, prompt, allModuleIds, onChange }: NoteProps) {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Browser storage is unavailable during server rendering; show the saved note after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const saved = readNote(moduleId); setNote(saved); if (saved) setStatus('Your earlier note for this part is shown from this browser profile.'); }, [moduleId]);

  function update(text: string) {
    setNote(text);
    setStatus(writeNote(moduleId, text) ? 'Saved in this browser profile.' : 'This browser could not save the note. Download it if you want to keep a copy.');
    onChange?.();
  }
  function clearAll() {
    const cleared = clearNotes(allModuleIds);
    setNote('');
    setConfirming(false);
    setStatus(cleared ? 'Your notes for the nine parts have been removed from this browser profile. Downloaded or printed copies are unchanged.' : 'This browser could not remove the notes.');
    onChange?.();
  }
  return (
    <div className="clas-note">
      <label htmlFor="reflection">Your working note for this part (optional)</label>
      <textarea id="reflection" rows={6} value={note} onChange={e => update(e.target.value)} aria-describedby="note-privacy" />
      <p id="note-privacy">{NOTE_PRIVACY}</p>
      <p role="status">{status}</p>
      <button type="button" onClick={() => downloadText(`CLAS-part-${moduleId}-notes.txt`, `${title}\n\n${prompt}\n\n${note}`)}>Download my note</button>
      {!confirming
        ? <button type="button" className="clas-study-secondary" onClick={() => setConfirming(true)}>Clear my notes in this browser</button>
        : <span className="clas-note-confirm" role="group" aria-label="Confirm clearing notes">
          <span>Remove your notes for all nine parts from this browser profile? This cannot be undone. Downloaded or printed copies will remain.</span>
          <button type="button" onClick={clearAll}>Yes, clear all my notes</button>
          <button type="button" className="clas-study-secondary" onClick={() => setConfirming(false)}>Keep my notes</button>
        </span>}
    </div>
  );
}

type PlanProps = { curriculumTitle: string; modules: PlanModule[]; version: number };

/**
 * Part 9 assembles the nine working notes into the learner's improvement plan, with each lesson's
 * reflection prompt as a heading. Downloadable as .txt and printable on its own.
 */
export function ImprovementPlan({ curriculumTitle, modules, version }: PlanProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNotes(readAllNotes(modules.map(m => m.id))); }, [modules, version]);
  const sections = assemblePlan(modules, notes);
  const written = sections.filter(s => s.note).length;
  function print() {
    const root = document.querySelector('.clas-study');
    root?.setAttribute('data-print', 'plan');
    const done = () => root?.removeAttribute('data-print');
    window.addEventListener('afterprint', done, { once: true });
    window.print();
    setTimeout(done, 2000);
  }
  return (
    <section className="clas-plan" aria-labelledby="plan">
      <h2 id="plan">Your improvement plan</h2>
      <p>This plan is assembled from the working notes saved in this browser profile for the nine parts ({written} of {modules.length} parts have a note). Each heading is the lesson's prompt. Edit any part's note on its own page; the plan updates when you return.</p>
      <p>{NOTE_PRIVACY}</p>
      <div className="clas-plan-actions">
        <button type="button" onClick={() => downloadText('CLAS-my-improvement-plan.txt', planText(curriculumTitle, sections))}>Download my plan (.txt)</button>
        <button type="button" className="clas-study-secondary" onClick={print}>Print my plan</button>
      </div>
      <div className="clas-plan-body">
        <p className="clas-plan-title">{curriculumTitle}: my improvement plan</p>
        {sections.map(s => (
          <article key={s.id}>
            <h3>Part {s.part}: {s.title}</h3>
            <p className="clas-plan-prompt">{s.prompt}</p>
            {s.note ? <p className="clas-plan-note">{s.note}</p> : <p className="clas-plan-empty">No note yet. <SourceLink href={`/learn/clas/curriculum/${s.id}#apply`}>Add one on Part {s.part}</SourceLink>.</p>}
          </article>
        ))}
        <article><h3>Follow-up</h3><p>Voluntary follow-up date: ______. What changed? What evidence do I have? What remains?</p></article>
      </div>
    </section>
  );
}
