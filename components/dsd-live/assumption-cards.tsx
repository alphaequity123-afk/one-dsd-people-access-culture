"use client";
import { useState } from "react";
import { ASSUMPTIONS, ASSUMPTION_REACTIONS } from "@/lib/dsd-live/communities/assumptions";

/** Each card shows a common assumption; the reader reacts first, then sees what tends to be true. Nothing is kept. */
export function AssumptionCards() {
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const turned = Object.keys(reactions).length;
  return <div className="assume">
    <p className="assume-progress meta" aria-live="polite">{turned === 0 ? "React to an assumption to turn its card." : `${turned} of ${ASSUMPTIONS.length} cards turned.`}</p>
    <ul className="assume-grid">{ASSUMPTIONS.map(card => {
      const reaction = reactions[card.id];
      return <li key={card.id} className={`assume-card${reaction ? " is-turned" : ""}`}>
        <p className="assume-kicker">A common assumption</p>
        <p className="assume-text">&ldquo;{card.assumption}&rdquo;</p>
        {!reaction ? <div className="assume-react" role="group" aria-label="Your first reaction">
          {ASSUMPTION_REACTIONS.map(r => <button key={r.id} type="button" className="button secondary" onClick={() => setReactions(x => ({ ...x, [card.id]: r.id }))}>{r.label}</button>)}
        </div> : <div className="assume-back" aria-live="polite">
          <h3>What tends to be true</h3>
          <p>{card.instead}</p>
          <h3>Try this instead</h3>
          <p>{card.doThis}</p>
          <button type="button" className="assume-reset" onClick={() => setReactions(x => { const next = { ...x }; delete next[card.id]; return next; })}>Turn back</button>
        </div>}
      </li>;
    })}</ul>
  </div>;
}
