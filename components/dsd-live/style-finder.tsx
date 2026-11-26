"use client";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { FINDER_QUESTIONS, STRETCH_STYLES } from "@/lib/dsd-live/leadership/style-finder";

type StyleLink = { slug: string; name: string; summary: string; href: string };

/** A few everyday situations that point to leadership styles worth exploring. Nothing chosen is kept. */
export function StyleFinder({ styles }: { styles: StyleLink[] }) {
  const base = useId();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [shown, setShown] = useState(false);
  const answered = Object.keys(answers).length;
  const bySlug = useMemo(() => new Map(styles.map(s => [s.slug, s])), [styles]);

  const result = useMemo(() => {
    const tally = new Map<string, number>();
    for (const q of FINDER_QUESTIONS) {
      const pick = answers[q.id];
      if (pick === undefined) continue;
      q.options[pick].styles.forEach((slug, i) => tally.set(slug, (tally.get(slug) ?? 0) + (i === 0 ? 2 : 1)));
    }
    const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([slug]) => slug);
    const leaning = ranked.slice(0, 3);
    const stretch = STRETCH_STYLES.find(slug => !leaning.includes(slug));
    return { leaning, stretch };
  }, [answers]);

  return <section id="find-a-style" className="finder" aria-labelledby={`${base}-title`}>
    <p className="eyebrow">Find a style to explore</p>
    <h2 id={`${base}-title`}>Which styles do you reach for?</h2>
    <p className="finder-intro">Answer as you usually act, not as you think you should. Your answers point to styles worth reading about.</p>
    <ol className="finder-questions">{FINDER_QUESTIONS.map(q => <li key={q.id}>
      <fieldset>
        <legend>{q.prompt}</legend>
        <div className="finder-options">{q.options.map((o, i) => <label key={i} className={`finder-option${answers[q.id] === i ? " is-chosen" : ""}`}>
          <input type="radio" name={`${base}-${q.id}`} checked={answers[q.id] === i} onChange={() => { setAnswers(a => ({ ...a, [q.id]: i })); setShown(false); }} />
          <span>{o.text}</span>
        </label>)}</div>
      </fieldset>
    </li>)}</ol>
    <p className="finder-actions">
      <button type="button" className="button" disabled={answered < 3} onClick={() => setShown(true)}>See styles to explore</button>
      <span className="meta">{answered < 3 ? `Answer at least three to see suggestions (${answered} of ${FINDER_QUESTIONS.length}).` : `${answered} of ${FINDER_QUESTIONS.length} answered.`}</span>
    </p>
    <div aria-live="polite">{shown && result.leaning.length ? <div className="finder-result">
      <h3>Styles you tend to reach for</h3>
      <ul className="finder-cards">{result.leaning.map(slug => { const s = bySlug.get(slug); return s ? <li key={slug}><Link href={s.href}><strong>{s.name}</strong><span>{s.summary}</span></Link></li> : null; })}</ul>
      {result.stretch && bySlug.get(result.stretch) ? <>
        <h3>A style to stretch toward</h3>
        <ul className="finder-cards finder-stretch"><li><Link href={bySlug.get(result.stretch)!.href}><strong>{bySlug.get(result.stretch)!.name}</strong><span>{bySlug.get(result.stretch)!.summary}</span></Link></li></ul>
      </> : null}
      <p className="finder-note">Strong leaders move between styles on purpose. On each style page, try the situation in &ldquo;In the moment&rdquo; to see how that style plays out.</p>
      <p><button type="button" className="button secondary" onClick={() => { setAnswers({}); setShown(false); }}>Start again</button></p>
    </div> : null}</div>
  </section>;
}
