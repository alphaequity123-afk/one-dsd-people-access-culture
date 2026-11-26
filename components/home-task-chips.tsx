"use client";
import Link from "@/components/app-link";
import { useState } from "react";

export type FinderTask = { id: string; label: string; picks: { title: string; text: string; href: string }[] };

/**
 * "What do you need to do?" on the home page: choose a task, get the two or three places that help most.
 * Carried over unchanged from the live One DSD landing page (owner decision 2026-11-25).
 */
export function HomeTaskChips({ tasks }: { tasks: FinderTask[] }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const task = tasks.find(t => t.id === chosen);
  return <section className="pilot-section task-finder" aria-labelledby="task-finder-title">
    <h2 id="task-finder-title">What do you need to do?</h2>
    <div className="task-finder-chips" role="group" aria-label="Choose a task">{tasks.map(t => <button key={t.id} type="button" aria-pressed={chosen === t.id} className={`task-chip${chosen === t.id ? " is-chosen" : ""}`} onClick={() => setChosen(chosen === t.id ? null : t.id)}>{t.label}</button>)}</div>
    <div aria-live="polite">{task ? <ul className="task-finder-picks">{task.picks.map(p => <li key={p.href}><Link href={p.href} original={p.href.startsWith("https://")}><strong>{p.title}</strong><span>{p.text}</span></Link></li>)}</ul> : null}</div>
  </section>;
}
