"use client";

import { useState } from "react";
import { readyToFormalize, type PolicyCase } from "@/lib/policy-analysis/contract";
import type { ExportKind } from "./api";
import { formatDate, ROLE_NAMES } from "./labels";
import styles from "./policy-analysis.module.css";

const DOWNLOADS: Array<{ kind: ExportKind; label: string; available: (value: PolicyCase) => boolean }> = [
  { kind: "analysis", label: "Analysis", available: value => Boolean(value.analysis) },
  { kind: "recommendations", label: "Recommended changes", available: value => value.recommendations.length > 0 },
  { kind: "decision-record", label: "Decision record", available: value => value.recommendations.length > 0 },
];

function DownloadPair({ label, disabled, working, onDownload }: { label: string; disabled: boolean; working: string | null; onDownload: (format: "docx" | "pdf") => void }) {
  return (
    <li className={styles.item}>
      <div className={styles.between}>
        <span className="font-bold">{label}</span>
        <span className={styles.row}>
          <button type="button" className="btn btn--light" disabled={disabled} onClick={() => onDownload("docx")} aria-label={`Download ${label} as a Word document`}>{working === "docx" ? "Preparing…" : "Word"}</button>
          <button type="button" className="btn btn--light" disabled={disabled} onClick={() => onDownload("pdf")} aria-label={`Download ${label} as a PDF`}>{working === "pdf" ? "Preparing…" : "PDF"}</button>
        </span>
      </div>
    </li>
  );
}

/** Step 6: formalize the approved changes, download the documents, or reopen for changes. */
export function FormalizeStep({ value, busy, decidingAsLabel, onFormalize, onReopen, onDownload }: {
  value: PolicyCase;
  busy: boolean;
  decidingAsLabel: string;
  onFormalize: (documentTitle: string) => Promise<unknown>;
  onReopen: () => Promise<unknown>;
  onDownload: (kind: ExportKind, format: "docx" | "pdf") => Promise<unknown>;
}) {
  const [documentTitle, setDocumentTitle] = useState(() => `Formal policy proposal: ${value.policy.title}`.slice(0, 300));
  const [working, setWorking] = useState<{ kind: ExportKind; format: "docx" | "pdf" } | null>(null);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const final = value.status === "final";
  const ready = value.status === "review" && readyToFormalize(value);
  const approved = value.recommendations.filter(item => item.decision?.outcome === "approved").length;
  const undecided = value.recommendations.filter(item => !item.decision).length;

  async function download(kind: ExportKind, format: "docx" | "pdf") {
    setWorking({ kind, format });
    try { await onDownload(kind, format); } finally { setWorking(null); }
  }

  const disabled = busy || working !== null;

  return (
    <section className={styles.step} aria-labelledby="formalize-title">
      <span className={styles.stepNumber}>Step 6</span>
      <h2 id="formalize-title">Formalize and download</h2>
      {final && value.formalization ? (
        <>
          <p className="mt-0">
            <strong>{value.formalization.documentTitle}</strong> was formalized by the {ROLE_NAMES[value.formalization.role]} on {formatDate(value.formalization.at)}, with {value.formalization.approvedRecommendationIds.length} approved {value.formalization.approvedRecommendationIds.length === 1 ? "change" : "changes"}.
          </p>
          <p className={styles.small}>{value.formalization.statement}</p>
          <ul className={styles.list}>
            <DownloadPair label="Formal policy proposal" disabled={disabled} working={working?.kind === "formal-policy-proposal" ? working.format : null} onDownload={format => void download("formal-policy-proposal", format)} />
          </ul>
        </>
      ) : (
        <>
          <p className="mt-0">When every change has a decision and at least one is approved, formalize the approved changes into one document. Deferred changes are listed as deferred.</p>
          {value.status !== "review" ? (
            <p className={styles.muted}>Send the recommended changes for decisions first.</p>
          ) : !ready ? (
            <p className={styles.muted}>
              {undecided ? `${undecided} ${undecided === 1 ? "change still needs" : "changes still need"} a decision. ` : ""}
              {approved === 0 ? "At least one change must be approved." : ""}
            </p>
          ) : null}
          <div className="field mt-2">
            <label htmlFor="formal-document-title">Document title</label>
            <input id="formal-document-title" type="text" maxLength={300} value={documentTitle} disabled={!ready || disabled} onChange={event => setDocumentTitle(event.target.value)} />
          </div>
          <p className={styles.muted}>Formalizing as the {decidingAsLabel}. Change who is deciding in step 5.</p>
          <button type="button" className="btn btn--primary" disabled={!ready || disabled || !documentTitle.trim()} onClick={() => void onFormalize(documentTitle.trim())}>
            {busy ? "Working…" : "Formalize the approved changes"}
          </button>
        </>
      )}

      <h3>Other documents</h3>
      <p className={`${styles.muted} mt-0`}>These are available at any point and show the analysis as it stands.</p>
      <ul className={styles.list}>
        {DOWNLOADS.filter(item => item.available(value)).map(item => (
          <DownloadPair key={item.kind} label={item.label} disabled={disabled} working={working?.kind === item.kind ? working.format : null} onDownload={format => void download(item.kind, format)} />
        ))}
      </ul>
      {!DOWNLOADS.some(item => item.available(value)) ? <p className={styles.muted}>Run the analysis or add a change to make documents available.</p> : null}

      {final ? (
        <div className="mt-4">
          {confirmReopen ? (
            <div className={styles.item}>
              <p className="m-0">Reopening lets you edit changes and record new decisions, then formalize again. Earlier decisions stay in each change&apos;s history.</p>
              <div className={`${styles.row} mt-2`}>
                <button type="button" className="btn btn--light" disabled={disabled} onClick={() => void onReopen().then(() => setConfirmReopen(false))}>{busy ? "Reopening…" : "Yes, reopen for changes"}</button>
                <button type="button" className={styles.linkButton} disabled={disabled} onClick={() => setConfirmReopen(false)}>Keep it formalized</button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn--light" disabled={disabled} onClick={() => setConfirmReopen(true)}>Reopen for changes</button>
          )}
        </div>
      ) : null}
    </section>
  );
}
