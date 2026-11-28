"use client";

import { useId, useMemo, useState } from "react";
import styles from "./equity-scan-companion.module.css";

/**
 * The four-question Equity Scan Companion (v2 prototype, owner decision 2026-11-26). It helps a person prepare
 * their thinking before a formal equity analysis; it is not the analysis and records no approval.
 *
 * The four questions are quoted exactly from the DHS Equity Policy, Version 2.0, effective 8/4/2023
 * (https://mn.gov/dhs/assets/equity-policy_tcm1053-646921.pdf, checked 2026-11-26). Everything typed here stays
 * in this browser tab: nothing is saved, sent or stored, and closing the tab clears it.
 */
const POLICY_URL = "https://mn.gov/dhs/assets/equity-policy_tcm1053-646921.pdf";
const ACTION_TYPES = [
  "Policy, procedure or legislative change",
  "Public notice, letter or communication",
  "Service delivery or waiver change",
  "Budget, grant, request for proposals or contract",
  "Information technology or digital tool",
  "Hiring, onboarding, meeting or team practice",
];
/** The groups named in the policy's first question. */
const GROUPS = ["Racial and ethnic groups", "LGBTQIA2S+ individuals", "People with disabilities", "Veterans"];
const CONSULTATION = [
  { id: "early", label: "Yes, early, while we were still identifying the issue" },
  { id: "underway", label: "Underway: working sessions are planned or happening" },
  { id: "not-yet", label: "Not yet: we need to consult before the proposal is final" },
];
const QUESTIONS = {
  q1: ["What groups are impacted by the proposed policy or budget item? (racial and ethnic groups, LGBTQIA2S+ individuals, people with disabilities and veterans)", "What is the nature of the impact?", "Have representatives from these groups been consulted and collaborated with to determine how to address these impacts?"],
  q2: ["Is the proposed item submitted to reduce or eliminate any disparities for racial and ethnic groups, LGBTQIA2S+ individuals, and people with disabilities and veterans?", "Please explain how implementation of the proposed item(s) will reduce or eliminate these disparities."],
  q3: ["Are there potential positive or negative impacts on the identified groups?", "Explain those impacts.", "If negative, please adjust the proposal to achieve a more equitable outcome."],
  q4: ["Can the policy or budget idea be sustainably successful?", "Discuss the on-going funding, implementation strategies/opportunities and performance measures/accountability mechanisms."],
} as const;

type State = { action: string; title: string; groups: string[]; impact: string; consultation: string; q2: string; q3: string; q4: string };
const EMPTY: State = { action: ACTION_TYPES[0], title: "", groups: [], impact: "", consultation: "", q2: "", q3: "", q4: "" };

export function summaryText(state: State): string {
  const blank = (value: string) => value.trim() || "(not answered yet)";
  const consult = CONSULTATION.find(option => option.id === state.consultation)?.label ?? "(not answered yet)";
  return [
    `Equity scan preparation notes: ${state.title.trim() || "(untitled)"}`,
    `Type of action: ${state.action}`,
    "",
    "1. Groups affected and consultation",
    `Groups: ${state.groups.length ? state.groups.join(", ") : "(none chosen yet)"}`,
    `Nature of the impact: ${blank(state.impact)}`,
    `Consultation: ${consult}`,
    "",
    "2. Reducing or eliminating disparities",
    blank(state.q2),
    "",
    "3. Positive and negative impacts, and adjustments",
    blank(state.q3),
    "",
    "4. Sustainable success and accountability",
    blank(state.q4),
    "",
    "These are preparation notes, not a completed equity analysis. Questions from the DHS Equity Policy, Version 2.0.",
    "Formal review and approval go through your supervisor and your business area's Equity Director (equity.directors.dhs@state.mn.us).",
  ].join("\n");
}

export function EquityScanCompanion() {
  const [state, setState] = useState<State>(EMPTY);
  const [copied, setCopied] = useState("");
  const id = useId();
  const summary = useMemo(() => summaryText(state), [state]);
  const set = <K extends keyof State>(key: K, value: State[K]) => { setState(current => ({ ...current, [key]: value })); setCopied(""); };
  function toggleGroup(group: string) {
    set("groups", state.groups.includes(group) ? state.groups.filter(item => item !== group) : [...state.groups, group]);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(summary); setCopied("Copied. Paste it into an email or document to share it."); }
    catch { setCopied("Copying did not work here. Select the summary text and copy it yourself."); }
  }
  return <section className={styles.scan} aria-labelledby={`${id}-title`}>
    <p className={styles.kicker}>DHS Equity Policy, Version 2.0</p>
    <h2 id={`${id}-title`}>Equity Scan Companion</h2>
    <p className={styles.lede}>Before a decision moves forward, the policy asks four questions. Work through them here to prepare. What you type stays in this browser tab: nothing is saved or sent, and closing the tab clears it. When you are ready, copy your notes to share with your supervisor or Equity Director.</p>

    <form className={styles.form} onSubmit={event => event.preventDefault()}>
      <div className={styles.row}>
        <label>Type of action<select value={state.action} onChange={event => set("action", event.target.value)}>{ACTION_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
        <label>Working title<input value={state.title} maxLength={200} onChange={event => set("title", event.target.value)} placeholder="For example: updated waiver notice" /></label>
      </div>

      <fieldset className={styles.question}>
        <legend>1. Groups affected and consultation</legend>
        <blockquote>{QUESTIONS.q1.join(" ")}</blockquote>
        <div className={styles.checks}>{GROUPS.map(group => <label key={group}><input type="checkbox" checked={state.groups.includes(group)} onChange={() => toggleGroup(group)} /> {group}</label>)}</div>
        <p className={styles.help}>Minnesota&apos;s Tribal Nations are sovereign governments. Formal consultation goes through DHS Tribal relations, under Executive Order 19-24.</p>
        <label>What is the nature of the impact?<textarea rows={3} value={state.impact} onChange={event => set("impact", event.target.value)} /></label>
        <fieldset className={styles.radios}>
          <legend>Have representatives been consulted?</legend>
          {CONSULTATION.map(option => <label key={option.id}><input type="radio" name={`${id}-consult`} checked={state.consultation === option.id} onChange={() => set("consultation", option.id)} /> {option.label}</label>)}
        </fieldset>
        {state.consultation === "not-yet" ? <p className={styles.reminder} role="note">The policy&apos;s human-centered equity framework asks you to confer early and, if at all possible, gather information from the people affected before the proposal is set: research identification, development co-creation, then implementation with a joint feedback loop.</p> : null}
      </fieldset>

      <fieldset className={styles.question}>
        <legend>2. Reducing or eliminating disparities</legend>
        <blockquote>{QUESTIONS.q2.join(" ")}</blockquote>
        <label>Your notes<textarea rows={3} value={state.q2} onChange={event => set("q2", event.target.value)} /></label>
      </fieldset>

      <fieldset className={styles.question}>
        <legend>3. Positive and negative impacts</legend>
        <blockquote>{QUESTIONS.q3.join(" ")}</blockquote>
        <label>Your notes<textarea rows={3} value={state.q3} onChange={event => set("q3", event.target.value)} /></label>
      </fieldset>

      <fieldset className={styles.question}>
        <legend>4. Sustainable success</legend>
        <blockquote>{QUESTIONS.q4.join(" ")}</blockquote>
        <label>Your notes<textarea rows={3} value={state.q4} onChange={event => set("q4", event.target.value)} /></label>
      </fieldset>
    </form>

    <div className={styles.summary}>
      <h3 id={`${id}-summary`}>Your preparation notes</h3>
      <pre aria-labelledby={`${id}-summary`} tabIndex={0}>{summary}</pre>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => void copy()}>Copy notes</button>
        <button type="button" className={styles.secondary} onClick={() => { setState(EMPTY); setCopied(""); }}>Start over</button>
      </div>
      <p aria-live="polite" className={styles.status}>{copied}</p>
      <p className={styles.help}>Questions quoted from the <a href={POLICY_URL}>DHS Equity Policy, Version 2.0</a>. These notes prepare you for a formal equity analysis; they do not replace it.</p>
    </div>
  </section>;
}
