"use client";

import type { ToolkitRequest, ToolkitResponse } from "@/lib/consultant-toolkit/schema";
import styles from "../consultant-toolkit-workspace.module.css";

/** Page navigation, kept in one place so it can be observed in tests. */
export const navigation = { assign: (url: string) => window.location.assign(url) };

export type DownloadKind = "report" | "worksheet" | "action-plan" | "information-request" | "leadership-brief";
export type DownloadFormat = "word" | "pdf" | "json";

/** Body for the Equity Policy Analyzer's create-case route (createCaseRequestSchema in lib/policy-analysis/contract.ts). */
export function policyCaseBody(caseTitle: string, request: ToolkitRequest, result: ToolkitResponse) {
  const sources = request.sources.filter(source => source.origin !== "application-context").slice(0, 12).map(source => ({
    id: source.id, title: source.title, text: source.text,
    ...(source.url ? { url: source.url } : {}), ...(source.date ? { date: source.date } : {}),
    origin: "user" as const,
  }));
  return {
    title: caseTitle,
    policy: { title: caseTitle, programs: request.programs.slice(0, 20).map(program => program.slice(0, 120)) },
    sources,
    context: `${request.question}\n\n${result.summary}`.slice(0, 4000),
  };
}

export function OutputsPanel({ trackLabel, canDownload, dirty, busy, hasResult, onDownload, onPolicyChanges }: {
  trackLabel: string; canDownload: boolean; dirty: boolean; busy: boolean; hasResult: boolean;
  onDownload: (kind: DownloadKind, format: DownloadFormat) => void; onPolicyChanges: () => void;
}) {
  const cards: [DownloadKind, string, string][] = [
    ["report", "Analysis report", "The complete findings, alternatives, actions, and evidence."],
    ["leadership-brief", "Leadership brief", "One to two pages: the question, key findings, options, actions, what is unknown and the decision needed."],
    ["information-request", "Request for information", "A request to whoever holds the missing information: what is needed, why, and how to send it back."],
    ["worksheet", trackLabel === "Equity scan" ? "Equity scan worksheet" : "Full analysis worksheet", "Responses organized around the toolkit questions."],
    ["action-plan", "Action plan", "Responsibilities, resources, measures, and follow-up."],
  ];
  const disabled = busy || !canDownload || dirty;
  return <>
    <section className={styles.panel} aria-labelledby="downloads-heading"><h2 id="downloads-heading">Download the outputs</h2>
      <p>Each download includes its saved status and source information.</p>
      {dirty && <p className={styles.notice}>Save your changes first so the download matches your current work.</p>}
      {!canDownload && !dirty && <p className={styles.notice}>Save the analysis to download it.</p>}
      <div className={styles.downloads}>{cards.map(([kind, title, description]) => <div className={styles.downloadCard} key={kind}><h3>{title}</h3><p>{description}</p><div className={styles.actions}>
        <button type="button" className={styles.secondary} disabled={disabled} onClick={() => onDownload(kind, "word")} aria-label={`Download ${title} as Word`}>Word</button>
        <button type="button" className={styles.secondary} disabled={disabled} onClick={() => onDownload(kind, "pdf")} aria-label={`Download ${title} as PDF`}>PDF</button>
      </div></div>)}</div>
      <details className={styles.disclosure}><summary>Keep a complete data copy</summary><p>The data copy includes the analysis and source text. Store it with the same care as your source documents.</p><button type="button" className={styles.textButton} disabled={disabled} onClick={() => onDownload("report", "json")}>Download data copy</button></details>
    </section>
    <section className={styles.panel} aria-labelledby="policy-changes-heading"><h2 id="policy-changes-heading">Turn the recommendations into policy changes</h2>
      <p>Open this analysis in the Equity Policy Analyzer to draft specific changes to policy wording, protocols, processes and training, and to record a decision on each. Your documents, the question and the summary go with it; related application references do not.</p>
      <button type="button" className={styles.primary} disabled={busy || !hasResult} onClick={onPolicyChanges}>Turn the recommendations into policy changes</button>
      {!hasResult && <p className={styles.muted}>Run the analysis first.</p>}
    </section>
  </>;
}
