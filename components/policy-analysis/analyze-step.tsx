"use client";

import { useEffect, useState } from "react";
import type { PolicyCase } from "@/lib/policy-analysis/contract";
import { AnalysisView } from "./analysis-view";
import type { QuestionLabels } from "./labels";
import styles from "./policy-analysis.module.css";

function Elapsed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <span aria-hidden="true"> ({seconds} seconds so far)</span>;
}

/** Step 3: run the equity analysis, or explain the manual route when the analysis service is not available. */
export function AnalyzeStep({ value, saved, manual, manualReason, running, busy, onAnalyze, questions, principleLabels }: {
  value: PolicyCase | null;
  saved: boolean;
  manual: boolean;
  manualReason?: string | null;
  running: boolean;
  busy: boolean;
  onAnalyze: () => void;
  questions: QuestionLabels;
  principleLabels?: Record<string, string>;
}) {
  const analysis = value?.analysis ?? null;
  const final = value?.status === "final";
  return (
    <section className={styles.step} aria-labelledby="analyze-title" aria-busy={running}>
      <span className={styles.stepNumber}>Step 3</span>
      <h2 id="analyze-title">Analyze</h2>
      {manual ? (
        <div className="notice notice--warn">
          <p className="m-0"><strong>The analysis service is not available right now.</strong> {manualReason || ""}</p>
          <p className="mb-0 mt-2">You can still finish this work by hand: write the recommended changes yourself in step 4, then send them for decisions.</p>
        </div>
      ) : (
        <>
          <p className="mt-0">The analysis reads the sources against the policy review questions and the equity principles, quotes the passages it relies on, says plainly where information is missing, and drafts recommended changes.</p>
          {!value ? <p className={styles.muted}>Save the analysis in step 2 first.</p> : null}
          {value && !value.sources.length ? <p className={styles.muted}>No sources are attached. The analysis will be far more exact with the policy text added in step 2.</p> : null}
          {value && !final ? (
            <div className={styles.row}>
              <button type="button" className="btn btn--primary" disabled={busy || !value} onClick={onAnalyze}>
                {running ? "Analyzing…" : analysis ? "Run the analysis again" : "Run the equity analysis"}
              </button>
              {!saved ? <span className={styles.muted}>Your unsaved changes in step 2 are saved first.</span> : null}
            </div>
          ) : null}
          {analysis && value?.recommendations.length && !final ? <p className={`${styles.muted} mb-0`}>Running it again drafts a new set of recommended changes from the current sources.</p> : null}
        </>
      )}
      <p className="mt-2 mb-0" role="status">
        {running ? <>Analyzing the policy. This can take up to two minutes. Keep this page open.<Elapsed /></> : ""}
      </p>
      {analysis ? <div className="mt-4"><AnalysisView analysis={analysis} sources={value?.sources ?? []} questions={questions} principleLabels={principleLabels} /></div> : null}
    </section>
  );
}
