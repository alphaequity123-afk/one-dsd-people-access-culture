"use client";
import { useId } from "react";

/** A short planning space for the learner's own next step. */
export default function Plan({ prompts }: { prompts: string[] }) {
  const id = useId();
  return (
    <section className="lo-band" aria-labelledby={id}>
      <h2 id={id}>Plan your next step</h2>
      <p className="lo-fine">Use a fictional example or leave out personal and case details.</p>
      {prompts.map((p, i) => (
        <label key={i} className="lo-plan-field">
          <span>{p}</span>
          <textarea rows={2} />
        </label>
      ))}
    </section>
  );
}
