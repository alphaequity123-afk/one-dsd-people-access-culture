"use client";

import Link from "@/components/app-link";
import { useId } from "react";
import { CHANGE_TYPES, EFFORT, type PolicySource, type Recommendation } from "@/lib/policy-analysis/contract";
import { Quotes } from "./analysis-view";
import { CHANGE_TYPE_LABELS, EFFORT_LABELS, formatDate, OUTCOME_LABELS } from "./labels";
import styles from "./policy-analysis.module.css";

/** The fields a person can change by hand. Decisions and history are never edited here. */
export type EditableRecommendation = Omit<Recommendation, "decision" | "history">;

export function toEditable(item: Recommendation | EditableRecommendation): EditableRecommendation {
  const { id, type, title, change, currentWording, proposedWording, equityConsideration, principleIds, evidence, affectedPolicies, responsibleRole, effort, reviewDate } = item;
  return {
    id, type, title, change, equityConsideration, principleIds, evidence, affectedPolicies, responsibleRole, effort,
    ...(currentWording ? { currentWording } : {}),
    ...(proposedWording ? { proposedWording } : {}),
    ...(reviewDate ? { reviewDate } : {}),
  };
}

export function blankRecommendation(): EditableRecommendation {
  return { id: `manual-${crypto.randomUUID()}`, type: "policy-wording", title: "", change: "", equityConsideration: "", principleIds: [], evidence: [], affectedPolicies: [], responsibleRole: "", effort: "medium" };
}

/** Returns a list of plain-language problems, empty when the change can be saved. */
export function problemsWith(item: EditableRecommendation): string[] {
  const problems: string[] = [];
  if (!item.title.trim()) problems.push("Add a title.");
  if (!item.change.trim()) problems.push("Describe the change.");
  if (!item.equityConsideration.trim()) problems.push("Describe the equity consideration.");
  if (!item.responsibleRole.trim()) problems.push("Name the person or area responsible.");
  if (item.reviewDate && !/^\d{4}-\d{2}-\d{2}$/.test(item.reviewDate)) problems.push("Use a full date for the review date.");
  return problems;
}

export function RecommendationDisplay({ item, sources, catalogTitles, principleName, decision }: {
  item: EditableRecommendation;
  sources: PolicySource[];
  catalogTitles: Record<string, string>;
  principleName: (id: string) => string;
  decision?: Recommendation["decision"];
}) {
  const hasWording = Boolean(item.currentWording?.trim() || item.proposedWording?.trim());
  return (
    <>
      <p className={styles.recType}>{CHANGE_TYPE_LABELS[item.type]}</p>
      <h3 className={styles.recTitle}>{item.title}</h3>
      {decision ? <p className="m-0 font-bold">Decision: {OUTCOME_LABELS[decision.outcome]}</p> : null}
      <p className={`${styles.pre} mt-2 mb-0`}>{item.change}</p>
      {hasWording ? (
        <div className={`${styles.compare} mt-3`}>
          <div><span className={styles.compareLabel}>Current wording</span><p>{item.currentWording?.trim() || "No current wording; this adds new wording."}</p></div>
          <div><span className={styles.compareLabel}>Proposed wording</span><p>{item.proposedWording?.trim() || "Remove the current wording."}</p></div>
        </div>
      ) : null}
      <h4 className="font-bold mt-3 mb-0">Equity consideration</h4>
      <p className={`${styles.pre} m-0`}>{item.equityConsideration}</p>
      {item.principleIds.length ? <p className={`${styles.muted} m-0 mt-1`}>Principles: {item.principleIds.map(principleName).join(", ")}</p> : null}
      {item.evidence.length ? <><h4 className="font-bold mt-3 mb-0">Evidence</h4><Quotes citations={item.evidence} sources={sources} /></> : null}
      <dl className={styles.facts}>
        {item.affectedPolicies.length ? <>
          <dt>Policies affected</dt>
          <dd>{item.affectedPolicies.map((id, index) => <span key={id}>{index ? ", " : ""}<Link href={`/community-outreach/policies/${encodeURIComponent(id)}`}>{catalogTitles[id] ?? id}</Link></span>)}</dd>
        </> : null}
        <dt>The person or area responsible</dt><dd>{item.responsibleRole}</dd>
        <dt>Effort</dt><dd>{EFFORT_LABELS[item.effort]}</dd>
        {item.reviewDate ? <><dt>Review date</dt><dd>{formatDate(item.reviewDate)}</dd></> : null}
      </dl>
    </>
  );
}

export function RecommendationForm({ item, onChange, problems }: {
  item: EditableRecommendation;
  onChange: (next: EditableRecommendation) => void;
  problems: string[];
}) {
  const ids = useId();
  const set = <K extends keyof EditableRecommendation>(key: K, value: EditableRecommendation[K]) => onChange({ ...item, [key]: value });
  const optional = (key: "currentWording" | "proposedWording" | "reviewDate", value: string) => {
    const next = { ...item };
    if (value) next[key] = value; else delete next[key];
    onChange(next);
  };
  return (
    <div>
      {problems.length ? (
        <div className="notice notice--warn mb-3" id={`${ids}-problems`}>
          <p className="m-0 font-bold">Before saving:</p>
          <ul className="list-disc pl-6 m-0">{problems.map(problem => <li key={problem}>{problem}</li>)}</ul>
        </div>
      ) : null}
      <div className={styles.row}>
        <div className="field" style={{ flex: "1 1 14rem" }}>
          <label htmlFor={`${ids}-type`}>Kind of change</label>
          <select id={`${ids}-type`} value={item.type} onChange={event => set("type", event.target.value as EditableRecommendation["type"])}>
            {CHANGE_TYPES.map(type => <option key={type} value={type}>{CHANGE_TYPE_LABELS[type]}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: "1 1 10rem" }}>
          <label htmlFor={`${ids}-effort`}>Effort</label>
          <select id={`${ids}-effort`} value={item.effort} onChange={event => set("effort", event.target.value as EditableRecommendation["effort"])}>
            {EFFORT.map(effort => <option key={effort} value={effort}>{EFFORT_LABELS[effort]}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${ids}-title`}>Title</label>
        <input id={`${ids}-title`} type="text" maxLength={200} value={item.title} onChange={event => set("title", event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor={`${ids}-change`}>The change</label>
        <p className="help m-0" id={`${ids}-change-help`}>What is done differently, by whom, and from when.</p>
        <textarea id={`${ids}-change`} rows={4} maxLength={4_000} aria-describedby={`${ids}-change-help`} value={item.change} onChange={event => set("change", event.target.value)} required />
      </div>
      <div className={styles.compare}>
        <div className="field m-0">
          <label htmlFor={`${ids}-current`}>Current wording (optional)</label>
          <textarea id={`${ids}-current`} rows={4} maxLength={4_000} value={item.currentWording ?? ""} onChange={event => optional("currentWording", event.target.value)} />
        </div>
        <div className="field m-0">
          <label htmlFor={`${ids}-proposed`}>Proposed wording (optional)</label>
          <textarea id={`${ids}-proposed`} rows={4} maxLength={4_000} value={item.proposedWording ?? ""} onChange={event => optional("proposedWording", event.target.value)} />
        </div>
      </div>
      <div className="field mt-3">
        <label htmlFor={`${ids}-equity`}>Equity consideration</label>
        <p className="help m-0" id={`${ids}-equity-help`}>Who this change is for, what barrier it removes, and who could still be left out.</p>
        <textarea id={`${ids}-equity`} rows={3} maxLength={3_000} aria-describedby={`${ids}-equity-help`} value={item.equityConsideration} onChange={event => set("equityConsideration", event.target.value)} required />
      </div>
      <div className={styles.row}>
        <div className="field" style={{ flex: "2 1 16rem" }}>
          <label htmlFor={`${ids}-role`}>The person or area responsible</label>
          <input id={`${ids}-role`} type="text" maxLength={200} value={item.responsibleRole} onChange={event => set("responsibleRole", event.target.value)} required />
        </div>
        <div className="field" style={{ flex: "1 1 10rem" }}>
          <label htmlFor={`${ids}-review`}>Review date (optional)</label>
          <input id={`${ids}-review`} type="date" value={item.reviewDate ?? ""} onChange={event => optional("reviewDate", event.target.value)} />
        </div>
      </div>
    </div>
  );
}
