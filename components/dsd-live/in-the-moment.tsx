"use client";
import { useId, useState } from "react";
import type { InTheMoment as Moment } from "@/lib/dsd-live/leadership/in-the-moment";

const FIT_WORDS = { strong: "A strong fit for this moment", partial: "Helps in part", risky: "Likely to backfire" } as const;

/** Choose a response to a realistic situation and see how it lands. Nothing chosen or written here is kept. */
export function InTheMoment({ moment, kitHref }: { moment: Moment; kitHref?: string }) {
  const name = useId();
  const [chosen, setChosen] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [plan, setPlan] = useState(moment.tryThisWeek);
  const [note, setNote] = useState("");
  const picked = moment.responses.find(r => r.id === revealed);

  async function copyPlan() {
    try { await navigator.clipboard.writeText(plan); setNote("Copied. Keep it somewhere you'll see it this week."); }
    catch { setNote("You can select the text and copy it instead."); }
  }

  return <section id="moment" aria-labelledby="moment-title" className="moment">
    <p className="eyebrow">Try it</p>
    <h2 id="moment-title">In the moment</h2>
    <div className="moment-situation"><p>{moment.situation}</p></div>
    <fieldset className="moment-choices">
      <legend>{moment.question}</legend>
      {moment.responses.map(r => <label key={r.id} className={`moment-choice${chosen === r.id ? " is-chosen" : ""}`}>
        <input type="radio" name={name} value={r.id} checked={chosen === r.id} onChange={() => { setChosen(r.id); setRevealed(null); }} />
        <span>{r.text}</span>
      </label>)}
    </fieldset>
    <p><button type="button" className="button" disabled={!chosen} onClick={() => setRevealed(chosen)}>See how it lands</button></p>

    <div aria-live="polite">{picked ? <div className={`moment-result moment-${picked.fit}`}>
      <p className="moment-fit">{FIT_WORDS[picked.fit]}</p>
      <p>{picked.feedback}</p>
      <dl>
        <div><dt>For your staff</dt><dd>{picked.staff}</dd></div>
        <div><dt>For fair service</dt><dd>{picked.service}</dd></div>
      </dl>
      <p className="moment-actions">
        <button type="button" className="button secondary" onClick={() => { setChosen(null); setRevealed(null); }}>Try another response</button>
        <button type="button" className="button secondary" onClick={() => setShowAll(v => !v)} aria-expanded={showAll}>{showAll ? "Hide the other responses" : "Compare all three"}</button>
      </p>
    </div> : null}</div>

    {picked && showAll ? <div className="moment-compare">{moment.responses.filter(r => r.id !== picked.id).map(r => <div key={r.id} className={`moment-result moment-${r.fit}`}>
      <p className="moment-fit">{FIT_WORDS[r.fit]}</p>
      <p className="moment-quote">{r.text}</p>
      <p>{r.feedback}</p>
    </div>)}</div> : null}

    {picked ? <div className="moment-reflect">
      <h3>Pause and reflect</h3>
      <p>{moment.reflection}</p>
      <h3>Try this week</h3>
      <label className="moment-plan-label" htmlFor={`${name}-plan`}>Make it your own, then copy it into your calendar or notes.</label>
      <textarea id={`${name}-plan`} rows={3} value={plan} onChange={e => setPlan(e.target.value)} />
      <p className="moment-actions"><button type="button" className="button" onClick={() => void copyPlan()}>Copy my plan</button></p>
      <p className="meta" role="status">{note}</p>
    </div> : null}
    {kitHref ? <p className="moment-kit"><a href={kitHref}>Use this situation with your team</a>: a 20-minute discussion guide you can print.</p> : null}
  </section>;
}
