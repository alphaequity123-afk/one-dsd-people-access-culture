"use client";

import { useState } from "react";
import { POLICY_LIMITS, type PolicySource, type Recommendation } from "@/lib/policy-analysis/contract";
import { blankRecommendation, problemsWith, RecommendationDisplay, RecommendationForm, toEditable, type EditableRecommendation } from "./recommendation-card";
import styles from "./policy-analysis.module.css";

/** Step 4: the recommended changes, each editable, plus changes added by hand. */
export function RecommendationsStep({ recommendations, sources, catalogTitles, principleName, editable, busy, manual, onSave }: {
  recommendations: Recommendation[];
  sources: PolicySource[];
  catalogTitles: Record<string, string>;
  principleName: (id: string) => string;
  editable: boolean;
  busy: boolean;
  /** True when the analysis service is not available and the person writes the changes. */
  manual: boolean;
  onSave: (all: EditableRecommendation[]) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<Record<string, EditableRecommendation>>({});
  const [added, setAdded] = useState<EditableRecommendation[]>([]);
  const [problems, setProblems] = useState<Record<string, string[]>>({});

  async function save(id: string) {
    const draft = editing[id] ?? added.find(item => item.id === id);
    if (!draft) return;
    const found = problemsWith(draft);
    setProblems(current => ({ ...current, [id]: found }));
    if (found.length) return;
    const isNew = added.some(item => item.id === id);
    const all = [
      ...recommendations.map(item => item.id === id ? draft : toEditable(item)),
      ...(isNew ? [draft] : []),
    ].map(toEditable);
    if (await onSave(all)) {
      setEditing(current => { const next = { ...current }; delete next[id]; return next; });
      setAdded(current => current.filter(item => item.id !== id));
      setProblems(current => { const next = { ...current }; delete next[id]; return next; });
    }
  }

  function cancel(id: string) {
    setEditing(current => { const next = { ...current }; delete next[id]; return next; });
    setAdded(current => current.filter(item => item.id !== id));
    setProblems(current => { const next = { ...current }; delete next[id]; return next; });
  }

  const full = recommendations.length + added.length >= POLICY_LIMITS.recommendations;

  return (
    <section className={styles.step} aria-labelledby="recommendations-title">
      <span className={styles.stepNumber}>Step 4</span>
      <h2 id="recommendations-title">Recommended changes</h2>
      <p className="mt-0">
        {manual
          ? "Write each change you recommend: what is done differently, the wording if the policy text changes, the equity consideration, and the person or area responsible."
          : "Each change names what is done differently, the wording when the policy text changes, the equity consideration it answers and the evidence behind it. Correct anything before it goes for decisions."}
      </p>
      {!recommendations.length && !added.length ? <p className={styles.muted}>No recommended changes yet.</p> : null}
      <ol className={styles.list}>
        {recommendations.map(item => {
          const draft = editing[item.id];
          return (
            <li key={item.id} id={`change-${item.id}`} className={styles.recCard}>
              {draft ? (
                <>
                  <RecommendationForm item={draft} problems={problems[item.id] ?? []} onChange={next => setEditing(current => ({ ...current, [item.id]: next }))} />
                  <div className={styles.row}>
                    <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void save(item.id)}>{busy ? "Saving…" : "Save this change"}</button>
                    <button type="button" className={styles.linkButton} disabled={busy} onClick={() => cancel(item.id)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <RecommendationDisplay item={toEditable(item)} decision={item.decision} sources={sources} catalogTitles={catalogTitles} principleName={principleName} />
                  {editable ? <button type="button" className="btn btn--light mt-2" disabled={busy} onClick={() => setEditing(current => ({ ...current, [item.id]: toEditable(item) }))} aria-label={`Edit ${item.title}`}>Edit</button> : null}
                </>
              )}
            </li>
          );
        })}
        {added.map((item, index) => (
          <li key={item.id} className={styles.recCard}>
            <p className={styles.recType}>New change {index + 1}</p>
            <RecommendationForm item={item} problems={problems[item.id] ?? []} onChange={next => setAdded(current => current.map(entry => entry.id === item.id ? next : entry))} />
            <div className={styles.row}>
              <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void save(item.id)}>{busy ? "Saving…" : "Save this change"}</button>
              <button type="button" className={styles.linkButton} disabled={busy} onClick={() => cancel(item.id)}>Discard</button>
            </div>
          </li>
        ))}
      </ol>
      {editable ? (
        <p className="mt-3 mb-0">
          <button type="button" className="btn btn--light" disabled={busy || full} onClick={() => setAdded(current => [...current, blankRecommendation()])}>Add a change</button>
          {full ? <span className={`${styles.muted} ml-2`}>An analysis can hold up to {POLICY_LIMITS.recommendations} changes.</span> : null}
        </p>
      ) : null}
    </section>
  );
}
