"use client";
import { useId, useState } from "react";
import type { Depth } from "@/lib/dsd-live/leadership/deep";

const LEVELS = [
  ["brief", "Brief"],
  ["working", "Working"],
  ["full", "Full"],
] as const;

/** Three readings of one lesson. Each level adds to the one before it. */
export default function Depths({
  depths,
}: {
  depths: { brief: Depth; working: Depth; full: Depth };
}) {
  const id = useId();
  const [level, setLevel] = useState<(typeof LEVELS)[number][0]>("brief");
  const current = depths[level];
  return (
    <section className="lo-depths" aria-labelledby={id}>
      <h2 id={id}>The lesson</h2>
      <p>
        Start with the Brief reading. Working adds the evidence and how to
        apply it. Full adds the limits, harder cases and the research detail.
      </p>
      <div role="tablist" aria-label="Reading depth" className="lo-depth-tabs">
        {LEVELS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            id={id + key}
            aria-selected={level === key}
            aria-controls={id + "-panel"}
            tabIndex={level === key ? 0 : -1}
            onClick={() => setLevel(key)}
            onKeyDown={(e) => {
              const i = LEVELS.findIndex(([k]) => k === level);
              const step =
                e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!step) return;
              const next = LEVELS[(i + step + LEVELS.length) % LEVELS.length];
              setLevel(next[0]);
              document.getElementById(id + next[0])?.focus();
            }}
          >
            {label}
            <span> · about {depths[key].minutes} min</span>
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={id + "-panel"}
        aria-labelledby={id + level}
        tabIndex={0}
      >
        {current.sections.map((s, i) => (
          <article key={level + i} className="lo-depth-section">
            <h3>{s.title}</h3>
            {s.text
              .split(/\n\s*\n|\n/)
              .filter(Boolean)
              .map((p, j) => (
                <p key={j}>{p}</p>
              ))}
          </article>
        ))}
      </div>
    </section>
  );
}
