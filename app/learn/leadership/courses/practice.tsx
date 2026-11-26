"use client";
import { useEffect, useId, useState } from "react";
import Image from "next/image";
type Choice = { label: string; feedback: string };
type Decision = {
  decision: string;
  choices: Choice[];
  perspective: string;
  reconsider: string;
  reflection: string;
  transfer: string;
  followup: string;
};

export default function Practice({
  course,
  guide,
  guideNumber,
}: {
  course: Decision;
  guide: { src: string; name: string };
  guideNumber: number;
}) {
  const id = useId();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [selected, setSelected] = useState("");
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [revised, setRevised] = useState(false);
  return (
    <section className="leadership-section lo-practice" aria-labelledby={id}>
      <h2 id={id}>Try the decision</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (selected !== "") {
            setSubmitted(Number(selected));
            setRevised(false);
          }
        }}
      >
        <fieldset disabled={!ready}>
          <legend>{course.decision}</legend>
          {course.choices.map((choice, i) => (
            <label className="leadership-choice" key={i}>
              <input
                name={id + "-choice"}
                type="radio"
                value={i}
                checked={selected === String(i)}
                onChange={(e) => setSelected(e.target.value)}
                required
              />
              {choice.label}
            </label>
          ))}
        </fieldset>
        <button className="button" type="submit" disabled={!ready}>
          See the consequence
        </button>
      </form>
      <noscript>
        {course.choices.map((choice) => (
          <details key={choice.label}>
            <summary>{choice.label}</summary>
            <p>{choice.feedback}</p>
          </details>
        ))}
        <p>{course.perspective}</p>
        <p>{course.reconsider}</p>
        <p>{course.followup}</p>
      </noscript>
      <div aria-live="polite">
        {submitted !== null && (
          <div className="choice-response">
            <h3>What follows from that choice</h3>
            <p>{course.choices[submitted].feedback}</p>
          </div>
        )}
      </div>
      {submitted !== null && (
        <>
          <h3>Another perspective</h3>
          <p>{course.perspective}</p>
          <aside className="lo-guide">
            <Image src={guide.src} alt="" width={145} height={180} />
            <div>
              <p className="lo-kicker">
                Guide {guideNumber} · {guide.name}
              </p>
              <p>{course.reconsider}</p>
            </div>
          </aside>
          <label htmlFor={id + "-note"}>What would you keep or change?</label>
          <textarea
            id={id + "-note"}
            aria-describedby={id + "-privacy"}
            rows={3}
          />
          <p id={id + "-privacy"} className="lo-fine">
            Use a fictional example.
          </p>
          <button
            type="button"
            className="button"
            onClick={() => setRevised(true)}
          >
            Consider a follow-up
          </button>
          <div aria-live="polite">
            {revised && (
              <div className="choice-response">
                <h3>What to look for next</h3>
                <p>{course.followup}</p>
              </div>
            )}
          </div>
        </>
      )}
      <details className="lo-transfer">
        <summary>Apply this to your work</summary>
        <h3>Reflect</h3>
        <p>{course.reflection}</p>
        <h3>Try a small change</h3>
        <p>{course.transfer}</p>
        <h3>Plan, Do, Study, Act</h3>
        <p>
          Pick one action within your authority and set a date to try it. Decide
          with the people affected what would count as an improvement. Carry out
          the trial, compare what happened with what you expected, then decide
          what to keep, adjust, or stop.
        </p>
        <details>
          <summary>Write a SMART goal</summary>
          <p>
            Make the next step specific, measurable, achievable, relevant, and
            time-bound. Complete this sentence in your own words: “By ___, I
            will try ___ with ___. We will check ___ together on ___.”
          </p>
        </details>
      </details>
    </section>
  );
}
