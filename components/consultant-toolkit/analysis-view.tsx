"use client";

import { fullNames } from "@/lib/consultant-toolkit/auto-route";
import { getInstrument, getQuestions, type ToolkitQuestion } from "@/lib/consultant-toolkit/instrument";
import type { ToolkitRequest, ToolkitResponse } from "@/lib/consultant-toolkit/schema";
import styles from "../consultant-toolkit-workspace.module.css";
import { Field } from "./field";

type Source = ToolkitRequest["sources"][number];
export const safeHref = (value?: string) => { try { const url = new URL(value || ""); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; } };
export const sourceNotes = (source: Source) => source.origin === "application-context" ? ["Related application reference", ...source.text.split("\n").filter(line => /^(Authority:|Resource location:|Source review date:|Official source entry point|No dashboard dataset)/.test(line)).map(fullNames)] : ["Supplied document or pasted evidence"];
const kindWords = (kind?: string) => kind === "evidence" ? "Supported by the cited material" : kind === "inference" ? "Interpretation — review against the evidence" : "Evidence still needed";

/** The analysis: a decision brief, what needs attention, every response with its evidence, options and actions. */
export function AnalysisView({ request, result, locked, busy, contextNote, editResult, editAnswer }: {
  request: ToolkitRequest; result: ToolkitResponse; locked: boolean; busy: boolean; contextNote: string;
  editResult: (next: ToolkitResponse) => void; editAnswer: (id: string, text: string) => void;
}) {
  const instrument = getInstrument(request.track);
  const question = (item: ToolkitQuestion, rows: number) => {
    const answer = result.answers.find(entry => entry.questionId === item.id);
    return <div className={styles.question} key={item.id}>
      <Field label={item.prompt} hint={item.help} value={answer?.text || "No answer recorded."} onChange={value => editAnswer(item.id, value)} disabled={locked || busy || !answer} rows={rows} />
      <p className={styles.muted}>{kindWords(answer?.kind)}</p>
      {answer?.citations.map((citation, i) => { const source = request.sources.find(entry => entry.id === citation.sourceId); const href = safeHref(source?.url); return <div className={styles.evidence} key={`${citation.sourceId}-${i}`}><strong>{source?.title || "Source"}</strong><blockquote>{citation.excerpt}</blockquote>{href && <a href={href} target="_blank" rel="noopener noreferrer">Open source</a>}</div>; })}
    </div>;
  };
  return <>
    <section className={`${styles.panel} ${styles.brief}`} aria-labelledby="decision-brief-heading">
      <h2 id="decision-brief-heading">Decision brief</h2>
      <p className={styles.caseTitle}>{request.title}</p>
      <h3>The decision being considered</h3><p className={styles.plain}>{request.question}</p>
      <details className={styles.disclosure}><summary>See what supports this draft</summary><p>These labels describe how the draft uses its sources. They are not a confidence score or a substitute for reviewing the quotations.</p><dl className={styles.briefColumns}>{([["evidence", "Responses citing evidence"], ["inference", "Responses needing interpretation review"], ["gap", "Responses needing evidence"]] as const).map(([kind, label]) => <div key={kind}><dt>{label}</dt><dd>{result.answers.filter(answer => answer.kind === kind).length}</dd></div>)}</dl><p>Start with the evidence gaps and limitations below. Then examine the source quotations and the alternatives before finalizing.</p></details>
      <h3>What the analysis says</h3><p className={styles.plain}>{result.summary}</p>
      <p className={styles.muted}>Read these findings alongside the evidence gaps below. The complete responses, source quotations, alternatives, and actions remain available for your review.</p>
      {!locked && <details className={styles.disclosure}><summary>Edit the summary</summary><Field label="Summary" value={result.summary} onChange={value => editResult({ ...result, summary: value })} rows={5} disabled={busy} /></details>}
      {contextNote && <p className={styles.muted}>{fullNames(contextNote)}</p>}
    </section>
    <section className={styles.panel} aria-labelledby="analysis-attention-heading"><h2 id="analysis-attention-heading">What needs attention before a decision</h2>
      <div className={styles.briefColumns}>
        <div><h3>Limits of the evidence</h3>{result.limitations.length ? <ul className={styles.briefList}>{result.limitations.map((value, index) => <li className={styles.plain} key={index}>{value}</li>)}</ul> : <p>No limitations have been recorded. Check the evidence before relying on this analysis.</p>}</div>
        <div><h3>Questions for your review</h3>{result.questionsForReview.length ? <ul className={styles.briefList}>{result.questionsForReview.map((value, index) => <li className={styles.plain} key={index}>{value}</li>)}</ul> : <p>No review questions have been recorded. Consider whose perspectives or evidence may still be missing.</p>}</div>
      </div>
      {!locked && <details className={styles.disclosure}><summary>Edit limitations and review questions</summary><fieldset disabled={locked || busy} className={styles.fields}>{result.limitations.map((value, index) => <Field key={`lim-${index}`} label={`Limitation ${index + 1}`} value={value} rows={2} onChange={next => editResult({ ...result, limitations: result.limitations.map((item, i) => i === index ? next : item) })} />)}{result.questionsForReview.map((value, index) => <Field key={`review-${index}`} label={`Review question ${index + 1}`} value={value} rows={2} onChange={next => editResult({ ...result, questionsForReview: result.questionsForReview.map((item, i) => i === index ? next : item) })} />)}</fieldset></details>}
    </section>
    <details className={`${styles.panel} ${styles.analysisDisclosure}`}><summary>Read the complete analysis — {getQuestions(request.track).length} responses and evidence</summary>
      <p className={styles.muted}>Every response is retained in full. Source quotations support examination of the findings; they do not replace your judgment about their accuracy or relevance.</p>
      <nav className={styles.stageNav} aria-label="Toolkit stages"><a href="#toolkit-preparation">Preparation</a>{instrument.stages.map((stage, index) => <a key={stage.id} href={`#toolkit-${stage.id}`}>{index + 1}. {stage.title}</a>)}</nav>
      <details className={styles.disclosure}><summary>Sources considered</summary><p className={styles.muted}>Application references provide context. Their source status and review date still need to fit this decision.</p>{request.sources.map(source => <div className={styles.source} key={source.id}><strong>{source.title}</strong>{sourceNotes(source).map(note => <p className={styles.muted} key={note}>{note}</p>)}{safeHref(source.url) && <a href={safeHref(source.url)!} target="_blank" rel="noopener noreferrer">Open source</a>}</div>)}</details>
      <section id="toolkit-preparation" className={`${styles.panel} ${styles.stage}`}><h2>Prepare the analysis</h2><p>{fullNames(instrument.preparationIntro)}</p>{instrument.preparation.map(item => question(item, 4))}</section>
      {instrument.stages.map((stage, index) => <section className={`${styles.panel} ${styles.stage}`} id={`toolkit-${stage.id}`} key={stage.id}><h2>{index + 1}. {stage.title}</h2><p>{fullNames(stage.description)}</p>{stage.questions.map(item => question(item, 5))}</section>)}
    </details>
    <details className={`${styles.panel} ${styles.analysisDisclosure}`}><summary>Compare the options</summary><div className={styles.compare}>{result.alternatives.map((option, index) => <fieldset className={styles.option} disabled={locked || busy} key={index}><Field label={`Option ${index + 1}`} value={option.title} rows={2} onChange={value => editResult({ ...result, alternatives: result.alternatives.map((item, i) => i === index ? { ...item, title: value } : item) })} />{([["benefits", "Potential benefits"], ["burdens", "Burdens and unintended effects"], ["evidenceNeeded", "Evidence still needed"]] as const).map(([key, label]) => <div className={styles.fields} key={key}><Field label={label} value={option[key]} onChange={value => editResult({ ...result, alternatives: result.alternatives.map((item, i) => i === index ? { ...item, [key]: value } : item) })} /></div>)}</fieldset>)}</div></details>
    <details className={`${styles.panel} ${styles.analysisDisclosure}`}><summary>Turn findings into action</summary>{result.actions.map((action, index) => <fieldset className={styles.question} key={index} disabled={locked || busy}><Field label={`Action ${index + 1}`} value={action.action} onChange={value => editResult({ ...result, actions: result.actions.map((item, i) => i === index ? { ...item, action: value } : item) })} /><div className={`${styles.twoColumns} ${styles.fields}`}>{([["responsibleRole", "Responsible role"], ["dueDate", "Timing"], ["resources", "Resources and support"], ["measure", "How to check progress"], ["followUp", "Follow-up and reporting back"]] as const).map(([key, label]) => <Field label={label} key={key} value={action[key]} rows={2} onChange={value => editResult({ ...result, actions: result.actions.map((item, i) => i === index ? { ...item, [key]: value } : item) })} />)}</div></fieldset>)}</details>
  </>;
}
