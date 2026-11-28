"use client";
import { useMemo, useState } from "react";
import { HARD_WORDS, type RewriteItem } from "@/lib/dsd-live/practice/plain-language";

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const longestSentence = (text: string) => Math.max(0, ...text.split(/[.!?]+/).map(words));
const hardWordsIn = (text: string) => {
  const lower = ` ${text.toLowerCase().replace(/[^a-z\s-]/g, " ")} `;
  return HARD_WORDS.filter(([word]) => lower.includes(` ${word} `));
};

function Measures({ text, label }: { text: string; label: string }) {
  const hard = hardWordsIn(text);
  return <dl className="rewrite-measures" aria-label={label}>
    <div><dt>Words</dt><dd>{words(text)}</dd></div>
    <div><dt>Longest sentence</dt><dd>{longestSentence(text)} words</dd></div>
    <div><dt>Harder words</dt><dd>{hard.length ? hard.map(([w, plain]) => <span key={w} className="rewrite-hard" title={`Try: ${plain}`}>{w} <small>(try: {plain})</small></span>) : "None found"}</dd></div>
  </dl>;
}

/** Rewrite a dense sentence, see simple checks as you type, then compare a stronger version. Nothing typed is kept. */
export function PlainLanguageRewrite({ items }: { items: RewriteItem[] }) {
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [compared, setCompared] = useState<Record<string, boolean>>({});
  const item = items[index];
  const draft = drafts[item.id] ?? "";
  const originalMeasures = useMemo(() => <Measures text={item.original} label="Checks on the original" />, [item]);

  return <div className="rewrite">
    <nav className="rewrite-steps" aria-label="Sentences to rewrite">{items.map((it, i) => <button key={it.id} type="button" aria-current={i === index ? "step" : undefined} className={`rewrite-step${i === index ? " is-current" : ""}${compared[it.id] ? " is-done" : ""}`} onClick={() => setIndex(i)}>{i + 1}</button>)}</nav>

    <section className="rewrite-card" aria-labelledby="rewrite-original">
      <p className="eyebrow">{item.context}</p>
      <h2 id="rewrite-original">The original</h2>
      <blockquote>{item.original}</blockquote>
      {originalMeasures}
    </section>

    <section className="rewrite-card" aria-labelledby="rewrite-yours">
      <h2 id="rewrite-yours">Your version</h2>
      <label htmlFor={`draft-${item.id}`} className="rewrite-help">Write it the way you would say it to someone across the table. Short sentences, everyday words, and say who does what.</label>
      <textarea id={`draft-${item.id}`} rows={5} value={draft} onChange={e => setDrafts(d => ({ ...d, [item.id]: e.target.value }))} />
      {draft.trim() ? <Measures text={draft} label="Checks on your version" /> : null}
      <p className="rewrite-actions">
        <button type="button" className="button" disabled={!draft.trim()} onClick={() => setCompared(c => ({ ...c, [item.id]: true }))}>Compare with a stronger version</button>
      </p>
    </section>

    <div aria-live="polite">{compared[item.id] ? <section className="rewrite-card rewrite-compare" aria-labelledby="rewrite-stronger">
      <h2 id="rewrite-stronger">A stronger version</h2>
      <blockquote>{item.stronger}</blockquote>
      <h3>What changed</h3>
      <ul>{item.changes.map(c => <li key={c}>{c}</li>)}</ul>
      <p className="rewrite-note">Yours doesn&apos;t need to match. Ask yourself: would the reader know what to do, by when, and where to get help?</p>
      {index < items.length - 1 ? <p><button type="button" className="button secondary" onClick={() => setIndex(index + 1)}>Next sentence</button></p> : <p className="rewrite-note">That&apos;s all {items.length}. Bring the same questions to the next notice you write.</p>}
    </section> : null}</div>
  </div>;
}
