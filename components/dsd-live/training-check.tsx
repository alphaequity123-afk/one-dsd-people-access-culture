"use client";
import { useId, useState } from "react";
import { stableShuffle } from "@/lib/dsd-live/trainings/order";

type Option = { id: string; text: string; strong: boolean; feedback: Array<{ style: string; text: string }> };

/** A short check inside a segment: any answer opens coaching, never a mark. */
export function TrainingCheck({ prompt, options }: { prompt: string; options: Option[] }) {
  const [picked, setPicked] = useState<Option | null>(null);
  const promptId = useId();
  return <div className="training-check">
    <h3 id={promptId}>{prompt}</h3>
    <ul className="sim-choices" aria-labelledby={promptId}>{stableShuffle(options, prompt).map(o => <li key={o.id}>
      <button type="button" className="sim-choice" aria-pressed={picked?.id === o.id} onClick={() => setPicked(o)}>{o.text}</button>
    </li>)}</ul>
    <div aria-live="polite" aria-atomic="true">{picked?.feedback.map((f, i) => <p key={i} className="coach">{f.text}</p>)}</div>
  </div>;
}
