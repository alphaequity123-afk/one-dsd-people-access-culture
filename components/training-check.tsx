"use client";
import { useState } from "react";
import { stableShuffle } from "@/lib/trainings/order";

type Option = { id: string; text: string; strong: boolean; feedback: Array<{ style: string; text: string }> };

/** A short check inside a segment: any answer opens coaching, never a mark. */
export function TrainingCheck({ prompt, options }: { prompt: string; options: Option[] }) {
  const [picked, setPicked] = useState<Option | null>(null);
  return <div className="training-check">
    <h3>{prompt}</h3>
    <ul className="sim-choices">{stableShuffle(options, prompt).map(o => <li key={o.id}>
      <button type="button" className="sim-choice" aria-pressed={picked?.id === o.id} onClick={() => setPicked(o)}>{o.text}</button>
    </li>)}</ul>
    {picked ? <div aria-live="polite">{picked.feedback.map((f, i) => <p key={i} className="coach">{f.text}</p>)}</div> : null}
  </div>;
}
