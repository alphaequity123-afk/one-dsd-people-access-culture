"use client";

import type { ReactNode } from "react";

import type { SuggestedSetup } from "@/lib/consultant-toolkit/auto-route";
import type { ToolkitRequest } from "@/lib/consultant-toolkit/schema";
import styles from "../consultant-toolkit-workspace.module.css";
import { ROUTING_LABELS, SCOPE_LABELS, TRACK_LABELS } from "./field";

type Fields = Partial<Pick<ToolkitRequest, "title" | "track" | "routing" | "programs" | "scope" | "question">>;

/** Shows the suggested setup beside the current one. Nothing is applied until a "Use" button is chosen. */
export function SuggestedSetupPanel({ suggestion, request, disabled, onUse }: { suggestion: SuggestedSetup; request: ToolkitRequest; disabled: boolean; onUse: (fields: Fields, label: string) => void }) {
  const all: Fields = { track: suggestion.track, routing: suggestion.routing, programs: suggestion.programs, scope: suggestion.scope, question: suggestion.suggestedQuestion, ...(!request.title.trim() && suggestion.title ? { title: suggestion.title } : {}) };
  const signalsFor = (key: keyof ToolkitRequest["routing"]) => suggestion.signals.filter(signal => signal.key === key);
  const row = (label: string, value: ReactNode, fields: Fields, useLabel: string, detail?: ReactNode) => <div className={styles.setupRow}>
    <div><h4>{label}</h4><div className={styles.plain}>{value}</div>{detail}</div>
    <button type="button" className={styles.secondary} disabled={disabled} onClick={() => onUse(fields, useLabel)} aria-label={`Use the suggested ${useLabel}`}>Use</button>
  </div>;
  return <section className={styles.panel} aria-labelledby="suggested-setup-heading">
    <h3 id="suggested-setup-heading">Suggested setup</h3>
    <p>{suggestion.advisory} The suggestion comes from reading the attached material. Use all of it, use one field at a time, or change any field in your setup below.</p>
    <div className={styles.actions}><button type="button" className={styles.primary} disabled={disabled} onClick={() => onUse(all, "setup")}>Use this setup</button></div>
    {"title" in all && row("Title", all.title, { title: all.title }, "title")}
    {row("Depth of the analysis", TRACK_LABELS[suggestion.track], { track: suggestion.track }, "depth of the analysis",
      <details className={styles.disclosure}><summary>Why this depth</summary>{suggestion.trackReasons.map(reason => <p className={styles.muted} key={reason}>{reason}</p>)}</details>)}
    {row("The four routing answers", <ul className={styles.briefList}>{ROUTING_LABELS.map(([key, label]) => <li key={key}><strong>{suggestion.routing[key] ? "Yes" : "No"}:</strong> {label}{signalsFor(key).map(signal => <span className={styles.muted} key={signal.phrase}> The document says “{signal.phrase}”.</span>)}</li>)}</ul>, { routing: suggestion.routing }, "routing answers")}
    {row("Programs and service lines", suggestion.programs.length ? suggestion.programs.join(", ") : "No program names were found in the material. Add them in your setup if you know them.", { programs: suggestion.programs }, "programs")}
    {row("Scope of the work", SCOPE_LABELS[suggestion.scope], { scope: suggestion.scope }, "scope", <p className={styles.muted}>{suggestion.scopeReason}</p>)}
    {row("Drafted analysis question", suggestion.suggestedQuestion, { question: suggestion.suggestedQuestion }, "analysis question")}
    <details className={styles.disclosure}><summary>What the suggestion is based on</summary><ul className={styles.briefList}>{suggestion.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></details>
  </section>;
}
