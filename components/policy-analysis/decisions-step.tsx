"use client";

import { useId, useState } from "react";
import { DECISION_ROLE_LABELS, DECISION_ROLES, POLICY_LIMITS, type DecisionOutcome, type DecisionRoleId, type Recommendation } from "@/lib/policy-analysis/contract";
import { CHANGE_TYPE_LABELS, formatDate, OUTCOME_ACTIONS, OUTCOME_LABELS, ROLE_NAMES } from "./labels";
import styles from "./policy-analysis.module.css";

export type DecisionInput = { recommendationId: string; outcome: DecisionOutcome; reason: string; conditions?: string; deferredUntil?: string; decidingAs?: DecisionRoleId };

function DecisionSummary({ decision }: { decision: NonNullable<Recommendation["decision"]> }) {
  return (
    <>
      <strong>{OUTCOME_LABELS[decision.outcome]}</strong> by the {ROLE_NAMES[decision.role]} on {formatDate(decision.at)}. {decision.reason}
      {decision.conditions ? <> Conditions: {decision.conditions}</> : null}
      {decision.deferredUntil ? <> Come back to it on {formatDate(decision.deferredUntil)}.</> : null}
    </>
  );
}

function DecisionForm({ item, outcome, busy, onCancel, onSubmit }: {
  item: Recommendation;
  outcome: DecisionOutcome;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (input: DecisionInput) => Promise<unknown>;
}) {
  const ids = useId();
  const [reason, setReason] = useState("");
  const [conditions, setConditions] = useState("");
  const [deferredUntil, setDeferredUntil] = useState("");
  const [problem, setProblem] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!reason.trim()) { setProblem("Give the reason for this decision."); return; }
    if (outcome === "deferred" && !/^\d{4}-\d{2}-\d{2}$/.test(deferredUntil)) { setProblem("Choose the date to come back to this change."); return; }
    setProblem("");
    await onSubmit({
      recommendationId: item.id,
      outcome,
      reason: reason.trim(),
      ...(conditions.trim() ? { conditions: conditions.trim() } : {}),
      ...(outcome === "deferred" ? { deferredUntil } : {}),
    });
  }

  return (
    <form noValidate className={styles.decisionForm} onSubmit={event => void submit(event)} aria-label={`${OUTCOME_ACTIONS[outcome]}: ${item.title}`}>
      <p className="m-0 font-bold">{OUTCOME_ACTIONS[outcome]} this change</p>
      {problem ? <p className="field m-0 mt-1"><span className="error" role="alert">{problem}</span></p> : null}
      <div className="field mt-2">
        <label htmlFor={`${ids}-reason`}>Reason</label>
        <textarea id={`${ids}-reason`} rows={3} maxLength={POLICY_LIMITS.reasonCharacters} value={reason} onChange={event => setReason(event.target.value)} required aria-invalid={problem.startsWith("Give") || undefined} />
      </div>
      <div className="field">
        <label htmlFor={`${ids}-conditions`}>Conditions (optional)</label>
        <p className="help m-0" id={`${ids}-conditions-help`}>For example: approved once the notice is available in the five most-used languages.</p>
        <textarea id={`${ids}-conditions`} rows={2} maxLength={POLICY_LIMITS.reasonCharacters} aria-describedby={`${ids}-conditions-help`} value={conditions} onChange={event => setConditions(event.target.value)} />
      </div>
      {outcome === "deferred" ? (
        <div className="field">
          <label htmlFor={`${ids}-until`}>Date to come back to it</label>
          <input id={`${ids}-until`} type="date" value={deferredUntil} onChange={event => setDeferredUntil(event.target.value)} required aria-invalid={problem.startsWith("Choose") || undefined} />
        </div>
      ) : null}
      <div className={styles.row}>
        <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? "Recording…" : `Record: ${OUTCOME_LABELS[outcome].toLowerCase()}`}</button>
        <button type="button" className={styles.linkButton} disabled={busy} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

/** Step 5: approve, reject or defer each change, recorded by role with the reason. */
export function DecisionsStep({ recommendations, canDecide, busy, decidingAs, onDecidingAs, onDecide, notReadyText }: {
  recommendations: Recommendation[];
  canDecide: boolean;
  busy: boolean;
  decidingAs: DecisionRoleId;
  onDecidingAs: (role: DecisionRoleId) => void;
  onDecide: (input: DecisionInput) => Promise<boolean>;
  notReadyText?: string;
}) {
  const [open, setOpen] = useState<{ id: string; outcome: DecisionOutcome } | null>(null);
  const decided = recommendations.filter(item => item.decision).length;

  return (
    <section className={styles.step} aria-labelledby="decisions-title">
      <span className={styles.stepNumber}>Step 5</span>
      <h2 id="decisions-title">Decide</h2>
      <p className="mt-0">Approve, reject or defer each change and give the reason. Each decision is recorded with the role of the person who made it, never a name.</p>
      <div className="field">
        <label htmlFor="deciding-as">Deciding as</label>
        <p className="help m-0" id="deciding-as-help">Choose your role before you record a decision. It applies to each decision you record and to formalizing in step 6.</p>
        <select id="deciding-as" aria-describedby="deciding-as-help" value={decidingAs} disabled={busy} onChange={event => onDecidingAs(event.target.value as DecisionRoleId)}>
          {DECISION_ROLES.map(role => <option key={role} value={role}>{DECISION_ROLE_LABELS[role]}</option>)}
        </select>
      </div>
      {notReadyText ? <p className={styles.muted}>{notReadyText}</p> : null}
      {recommendations.length ? <p className={styles.muted}>{decided} of {recommendations.length} changes have a decision.</p> : null}
      <ol className={styles.list}>
        {recommendations.map(item => (
          <li key={item.id} className={styles.item}>
            <p className={styles.recType}>{CHANGE_TYPE_LABELS[item.type]}</p>
            <p className="m-0 font-bold"><a href={`#change-${item.id}`}>{item.title}</a></p>
            <div className={`${styles.decision} mt-2`} aria-live="polite">
              {item.decision ? <DecisionSummary decision={item.decision} /> : "No decision yet."}
            </div>
            {canDecide ? (
              open?.id === item.id ? (
                <DecisionForm key={open.outcome} item={item} outcome={open.outcome} busy={busy} onCancel={() => setOpen(null)} onSubmit={async input => {
                  const ok = await onDecide(input);
                  if (ok) setOpen(null);
                  return ok;
                }} />
              ) : (
                <div className={`${styles.row} mt-2`} role="group" aria-label={`${item.decision ? "Change the decision" : "Decision"} for ${item.title}`}>
                  {item.decision ? <span className={styles.small}>Change the decision:</span> : null}
                  {(["approved", "rejected", "deferred"] as const).map(outcome => (
                    <button key={outcome} type="button" className="btn btn--light" disabled={busy} onClick={() => setOpen({ id: item.id, outcome })}>
                      {OUTCOME_ACTIONS[outcome]}
                    </button>
                  ))}
                </div>
              )
            ) : null}
            {item.history.length ? (
              <details className="mt-2">
                <summary className={styles.small}>Decision history ({item.history.length})</summary>
                <ol className={styles.history}>
                  {[...item.history].reverse().map((entry, index) => (
                    <li key={`${entry.at}-${index}`}>
                      {formatDate(entry.at)}: {OUTCOME_LABELS[entry.outcome]} by the {ROLE_NAMES[entry.role]}. {entry.reason}
                      {entry.conditions ? ` Conditions: ${entry.conditions}` : ""}
                      {entry.deferredUntil ? ` Come back to it on ${formatDate(entry.deferredUntil)}.` : ""}
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
