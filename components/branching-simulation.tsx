"use client";
import { useState } from "react";
import { decisionOrder } from "@/lib/trainings/order";

type Feedback = { style: string; text: string };
type Choice = { id: string; text: string; consequence: string; feedback: Feedback[]; next: string };
type Decision = { id: string; recovery: boolean; setup: string; prompt: string; choices: Choice[] };
type Sim = { title: string; learner_role: string; background: string; start: string; decisions: Decision[]; practiced: string[]; this_week: string[] };

const STYLE_LABEL: Record<string, string> = {
  "affirm-extend": "What worked", "compare-coach": "Another way", "normalize-reframe": "A common reaction",
  "reflective-prompt": "Reflect", "feed-forward": "Next time", "another-perspective": "See another perspective",
};

/**
 * The simulation: one decision at a time, the consequence of the choice, then coaching. Nothing is scored; the
 * path taken is kept only on this page and is gone when the page closes.
 */
export function BranchingSimulation({ sim }: { sim: Sim }) {
  const [path, setPath] = useState<Array<{ decision: Decision; choice: Choice }>>([]);
  const [current, setCurrent] = useState<string>(sim.start);
  const [picked, setPicked] = useState<Choice | null>(null);
  const decision = sim.decisions.find(d => d.id === current);

  const choose = (choice: Choice) => setPicked(choice);
  const advance = () => {
    if (!decision || !picked) return;
    setPath([...path, { decision, choice: picked }]);
    setCurrent(picked.next);
    setPicked(null);
  };
  const restart = () => { setPath([]); setCurrent(sim.start); setPicked(null); };

  return <section className="simulation" aria-labelledby="sim-title">
    <h2 id="sim-title">{sim.title}</h2>
    {path.length === 0 && !picked ? <div className="reading"><p><strong>Your role.</strong> {sim.learner_role}</p><p>{sim.background}</p></div> : null}

    {path.map(({ decision: d, choice: c }, i) => <details key={i} className="sim-step">
      <summary>{d.prompt} <span className="meta">{c.text}</span></summary>
      <p>{c.consequence}</p>
    </details>)}

    {decision ? <div className="sim-decision" aria-live="polite">
      {decision.recovery ? <p className="meta">A second chance</p> : null}
      <p className="reading">{decision.setup}</p>
      <h3>{decision.prompt}</h3>
      {!picked ? <ul className="sim-choices">{decisionOrder(decision).map(c => <li key={c.id}>
        <button type="button" className="sim-choice" onClick={() => choose(c)}>{c.text}</button>
      </li>)}</ul> : <div className="sim-result">
        <p className="sim-chosen"><strong>You chose:</strong> {picked.text}</p>
        <h4>What happens</h4>
        <p>{picked.consequence}</p>
        {picked.feedback.map((f, i) => <div key={i} className={`coach coach-${f.style}`}><h4>{STYLE_LABEL[f.style] ?? "Coaching"}</h4><p>{f.text}</p></div>)}
        <button type="button" className="button" onClick={advance}>{picked.next === "end" ? "See what you practiced" : "Continue"}</button>
      </div>}
    </div> : <div className="sim-end">
      <h3>What you practiced</h3>
      <ul>{sim.practiced.map(p => <li key={p}>{p}</li>)}</ul>
      <h3>Try this week</h3>
      <ul>{sim.this_week.map(p => <li key={p}>{p}</li>)}</ul>
      <button type="button" className="button secondary" onClick={restart}>See another path</button>
    </div>}
  </section>;
}
