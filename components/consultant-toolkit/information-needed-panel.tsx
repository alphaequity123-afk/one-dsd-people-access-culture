"use client";

import type { ReactNode } from "react";

import { INFORMATION_CHECK_NOTE, type InformationNeed } from "@/lib/consultant-toolkit/information-needed";
import styles from "../consultant-toolkit-workspace.module.css";

export function ClosedSinceLastRun({ closed }: { closed: { questionId: string; title: string }[] }) {
  if (!closed.length) return null;
  return <section className={styles.closed} aria-labelledby="closed-since-heading">
    <h3 id="closed-since-heading">Closed since the last run</h3>
    <ul className={styles.briefList}>{closed.map(item => <li key={item.questionId}>{item.title}</li>)}</ul>
  </section>;
}

/** The needs list. Before a run it is a check of the attached material; after a run it lists recorded gaps. */
export function InformationNeededPanel({ items, mode, prompts, children }: { items: InformationNeed[]; mode: "before" | "after"; prompts: Map<string, string>; children?: ReactNode }) {
  const missing = items.filter(item => item.status === "missing");
  const found = items.filter(item => item.status === "found");
  const heading = mode === "before" ? "What is still needed" : "What is still needed after this run";
  return <section className={styles.panel} aria-labelledby={`needs-${mode}-heading`}>
    <h3 id={`needs-${mode}-heading`}>{heading}</h3>
    <p className={styles.muted}>{mode === "before" ? `${INFORMATION_CHECK_NOTE} You can run the analysis at any time; missing information is recorded as a gap.` : "These come from the responses the analysis could not answer from the material, its stated limits and its open questions."}</p>
    {missing.length ? <ul className={styles.needList}>{missing.map(item => <li key={item.id}>
      <strong className={styles.plain}>{item.need}</strong>
      <p className={styles.plain}>{item.why}</p>
      <p className={styles.muted}>Who might have it: {item.whoMightHaveIt}.</p>
      {item.questionIds.length > 0 && <details><summary>Toolkit {item.questionIds.length === 1 ? "question" : "questions"} it helps answer</summary><ul className={styles.briefList}>{item.questionIds.map(id => <li key={id}>{prompts.get(id) ?? id}</li>)}</ul></details>}
    </li>)}</ul> : <p>{mode === "before" ? "The attached material appears to touch on each kind of information this check looks for. Read it closely during the analysis." : "No gaps, limits or open questions were recorded. This does not establish that none exist."}</p>}
    {found.length > 0 && <details className={styles.disclosure}><summary>Already in the attached material ({found.length})</summary><ul className={styles.briefList}>{found.map(item => <li key={item.id}>{item.need}</li>)}</ul></details>}
    {children}
  </section>;
}
