"use client";

import { useCallback, useEffect, useState } from "react";
import { api, isConflict, type CaseSummary } from "./api";
import { formatDate, plural, STATUS_LABELS } from "./labels";
import styles from "./policy-analysis.module.css";

export function CaseLibrary({ onOpen, onStart, onError, savingAvailable, refreshKey }: {
  onOpen: (id: string) => void;
  onStart: () => void;
  onError: (error: unknown) => void;
  savingAvailable: boolean;
  refreshKey: number;
}) {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(savingAvailable);
  const [loadFailed, setLoadFailed] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async (offset: number) => {
    setLoading(true);
    try {
      const page = await api.listCases(offset);
      setCases(current => offset === 0 ? page.cases : [...current, ...page.cases.filter(item => !current.some(existing => existing.id === item.id))]);
      setNextOffset(page.nextOffset);
      setLoadFailed(false);
    } catch (error) {
      setLoadFailed(true);
      onError(error);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    if (!savingAvailable) return;
    let active = true;
    api.listCases(0)
      .then(page => { if (!active) return; setCases(page.cases); setNextOffset(page.nextOffset); setLoadFailed(false); })
      .catch(error => { if (!active) return; setLoadFailed(true); onError(error); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [onError, refreshKey, savingAvailable]);

  async function remove(item: CaseSummary) {
    setDeleting(item.id);
    setMessage("");
    try {
      await api.deleteCase(item.id, item.version);
      setCases(current => current.filter(entry => entry.id !== item.id));
      setConfirming(null);
      setMessage(`Deleted "${item.title}".`);
    } catch (error) {
      onError(error);
      if (isConflict(error)) void load(0);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className={styles.step} aria-labelledby="case-library-title">
      <div className={styles.between}>
        <h2 id="case-library-title" className="m-0">Saved policy analyses</h2>
        <button type="button" className="btn btn--primary" onClick={onStart}>Start a new analysis</button>
      </div>
      <p className={styles.muted}>Each analysis keeps its policy, the material you added, the recommended changes, every decision and the formal proposal.</p>
      <p className={`${styles.small} m-0`} role="status">{message}</p>
      {!savingAvailable ? (
        <p className="m-0">Saved analyses cannot be shown here because saving is not available on this server.</p>
      ) : loading && !cases.length ? (
        <p className="m-0" role="status">Loading saved analyses…</p>
      ) : loadFailed && !cases.length ? (
        <p className="m-0">The saved analyses could not be loaded. <button type="button" className={styles.linkButton} onClick={() => void load(0)}>Try again</button></p>
      ) : !cases.length ? (
        <p className="m-0">No analyses are saved yet. Start a new analysis to choose a policy.</p>
      ) : (
        <ul className={styles.list}>
          {cases.map(item => (
            <li key={item.id} className={styles.item}>
              <div className={styles.between}>
                <div style={{ minWidth: 0 }}>
                  <p className={`${styles.choiceTitle} m-0`}>{item.title}</p>
                  <p className="m-0">{item.policyTitle}</p>
                </div>
                <p className="m-0 font-bold">{STATUS_LABELS[item.status] ?? item.status}</p>
              </div>
              <p className={`${styles.muted} m-0 mt-1`}>
                {plural(item.recommendationCount, "recommended change", "recommended changes")} · {plural(item.approvedCount, "approved", "approved")}
                {" · "}Started {formatDate(item.createdAt)} · Last changed {formatDate(item.updatedAt)}
                {item.finalizedAt ? ` · Formalized ${formatDate(item.finalizedAt)}` : ""}
              </p>
              <div className={`${styles.row} mt-2`}>
                <button type="button" className="btn btn--light" onClick={() => onOpen(item.id)} aria-label={`Open ${item.title}`}>Open</button>
                {confirming === item.id ? (
                  <>
                    <span className={styles.small}>Delete this analysis and everything in it? This cannot be undone.</span>
                    <button type="button" className="btn btn--light" disabled={deleting === item.id} onClick={() => void remove(item)}>
                      {deleting === item.id ? "Deleting…" : "Yes, delete it"}
                    </button>
                    <button type="button" className={styles.linkButton} disabled={deleting === item.id} onClick={() => setConfirming(null)}>Keep it</button>
                  </>
                ) : (
                  <button type="button" className={`${styles.linkButton} ${styles.danger}`} onClick={() => setConfirming(item.id)} aria-label={`Delete ${item.title}`}>Delete</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {nextOffset !== null ? (
        <p className="mt-3 mb-0"><button type="button" className="btn btn--light" disabled={loading} onClick={() => void load(nextOffset)}>{loading ? "Loading…" : "Show more"}</button></p>
      ) : null}
    </section>
  );
}
