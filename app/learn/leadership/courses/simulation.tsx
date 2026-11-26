"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Step } from "@/lib/dsd-live/leadership/deep";

type Taken = { step: Step; choice: number };

/** A connected case: each choice leads to the next situation, with Guidance on every decision. */
export default function Simulation({
  setup,
  steps,
  debrief,
}: {
  setup: string;
  steps: Step[];
  debrief: string;
}) {
  const id = useId();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [path, setPath] = useState<Taken[]>([]);
  const [current, setCurrent] = useState<string>(steps[0]?.id ?? "end");
  const [selected, setSelected] = useState("");
  const [shown, setShown] = useState<number | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const step = steps.find((s) => s.id === current);

  function choose() {
    if (!step || selected === "") return;
    setShown(Number(selected));
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }
  function advance() {
    if (!step || shown === null) return;
    const next = step.choices[shown].next;
    setPath((p) => [...p, { step, choice: shown }]);
    setCurrent(steps.some((s) => s.id === next) ? next : "end");
    setSelected("");
    setShown(null);
  }
  function restart() {
    setPath([]);
    setCurrent(steps[0]?.id ?? "end");
    setSelected("");
    setShown(null);
  }

  return (
    <section className="leadership-section lo-practice lo-sim" aria-labelledby={id}>
      <h2 id={id}>Work through the case</h2>
      <p className="lo-fine">A fictional situation in DHS work</p>
      <p>{setup}</p>
      {path.length > 0 && (
        <ol className="lo-sim-path" aria-label="Your decisions so far">
          {path.map((t, i) => (
            <li key={i}>
              <span>{t.step.question}</span> {t.step.choices[t.choice].label}
            </li>
          ))}
        </ol>
      )}
      {step ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            choose();
          }}
        >
          <p className="lo-sim-situation">{step.situation}</p>
          <fieldset disabled={!ready || shown !== null}>
            <legend>{step.question}</legend>
            {step.choices.map((c, i) => (
              <label className="leadership-choice" key={i}>
                <input
                  type="radio"
                  name={id + step.id}
                  value={i}
                  checked={selected === String(i)}
                  onChange={(e) => setSelected(e.target.value)}
                  required
                />
                {c.label}
              </label>
            ))}
          </fieldset>
          {shown === null ? (
            <button className="button" type="submit" disabled={!ready}>
              See what follows
            </button>
          ) : (
            <div
              ref={feedbackRef}
              tabIndex={-1}
              className={"lo-sim-feedback " + step.choices[shown].quality}
              aria-live="polite"
            >
              <h3>Guidance</h3>
              <p>{step.choices[shown].feedback}</p>
              <button className="button" type="button" onClick={advance}>
                {steps.some((s) => s.id === step.choices[shown].next)
                  ? "Continue the case"
                  : "See how it ends"}
              </button>
            </div>
          )}
        </form>
      ) : (
        <div className="lo-sim-debrief">
          <h3>Looking back at the case</h3>
          <p>{debrief}</p>
          <button className="button" type="button" onClick={restart}>
            Try a different path
          </button>
        </div>
      )}
    </section>
  );
}
