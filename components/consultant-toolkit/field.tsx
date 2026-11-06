"use client";

import { useId } from "react";
import styles from "../consultant-toolkit-workspace.module.css";

export function Field({ label, value, onChange, hint, rows = 3, maxLength = 6000, disabled = false }: { label: string; value: string; onChange: (value: string) => void; hint?: string; rows?: number; maxLength?: number; disabled?: boolean }) {
  const id = useId();
  return <div className={styles.field}>
    <label htmlFor={id}>{label}</label>
    {hint && <small id={`${id}-help`}>{hint}</small>}
    <textarea id={id} aria-describedby={hint ? `${id}-help` : undefined} value={value} onChange={event => onChange(event.target.value)} rows={rows} maxLength={maxLength} disabled={disabled} />
  </div>;
}

export const SCOPE_LABELS = { agency: "Department of Human Services", administration: "Administration", division: "Division", team: "Team", individual: "Individual work" } as const;

export const ROUTING_LABELS = [
  ["priorAnalysisIntegrated", "A relevant full analysis or scan already informs this proposal."],
  ["materialChange", "The proposal makes a substantial new change."],
  ["knownDisparities", "There are known disparities or unresolved equity concerns."],
  ["timeLimited", "There is limited time before the decision."],
] as const;

export const TRACK_LABELS = { scan: "Equity scan", full: "Full equity analysis" } as const;

/** Resource titles written without the short form. */
export const spelledOut = (text: string) => text.replace(/\bLTSS\b/g, "long-term services and supports").replace(/^long-term/, "Long-term");
