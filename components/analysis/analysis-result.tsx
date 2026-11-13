import Link from "@/components/app-link";
import type { AnalysisAnswer, AnalysisResponse, AnswerKind, Instrument, InstrumentQuestion } from "@/lib/analysis/contract";
import styles from "./analyze.module.css";

/** Plain words for each kind; never a color alone. */
export const KIND_LABELS: Record<AnswerKind, { label: string; meaning: string }> = {
  evidence: { label: "Evidence", meaning: "quoted from the material" },
  inference: { label: "Inference", meaning: "a conclusion drawn from the material" },
  gap: { label: "Gap", meaning: "the material does not settle this" },
};

export type SourceTitle = { id: string; title: string };

function sourceTitle(sources: readonly SourceTitle[], id: string) {
  return sources.find(source => source.id === id)?.title ?? "Source";
}

function kindClass(kind: AnswerKind) {
  return kind === "evidence" ? styles.kindEvidence : kind === "inference" ? styles.kindInference : styles.kindGap;
}

function QuestionAnswer({ question, answer, sources }: { question: InstrumentQuestion; answer?: AnalysisAnswer; sources: readonly SourceTitle[] }) {
  return <div className={styles.question}>
    <p className={styles.prompt}>{question.prompt}</p>
    {answer ? <>
      <p className={styles.answer}>
        <span className={`${styles.kind} ${kindClass(answer.kind)}`}>{KIND_LABELS[answer.kind].label}</span>
        <span className="sr-only">{KIND_LABELS[answer.kind].meaning}. </span>
        {answer.text}
      </p>
      {answer.citations.length ? <ul className={styles.citations} aria-label="Quotations from the material">
        {answer.citations.map((citation, index) => <li key={`${citation.sourceId}-${index}`}>
          <blockquote>“{citation.excerpt}”<cite>From: {sourceTitle(sources, citation.sourceId)}</cite></blockquote>
        </li>)}
      </ul> : null}
    </> : <p className={styles.missing}>No answer was returned for this question.</p>}
  </div>;
}

/** The instrument's questions with room to write, for when the answer service cannot run. */
export function AnalysisWorksheet({ instrument, reason }: { instrument: Instrument; reason?: string }) {
  return <section className={styles.worksheet} aria-labelledby="analysis-worksheet-title">
    <h2 id="analysis-worksheet-title">Worksheet: {instrument.title}</h2>
    <p>The analysis could not be prepared{reason ? `: ${reason}` : "."} The questions below are the same ones the analysis would answer. Print this page and work through them with your material, marking each answer as evidence (quoted from the material), inference (a conclusion drawn from it) or gap (the material does not settle it).</p>
    <p className={styles.help}>{instrument.basis}</p>
    {instrument.stages.map(stage => <section key={stage.id} className={styles.stage} aria-labelledby={`worksheet-${stage.id}`}>
      <h3 id={`worksheet-${stage.id}`}>{stage.title}</h3>
      {stage.description ? <p>{stage.description}</p> : null}
      {stage.questions.map(question => <div key={question.id} className={styles.question}>
        <p className={styles.prompt}>{question.prompt}</p>
        {question.help ? <p className={styles.help}>{question.help}</p> : null}
        <div className={styles.worksheetLine} aria-hidden="true" />
      </div>)}
    </section>)}
  </section>;
}

export function AnalysisResult({ result, instrument, sources }: { result: AnalysisResponse; instrument: Instrument; sources: readonly SourceTitle[] }) {
  if (result.unavailable) return <AnalysisWorksheet instrument={instrument} reason={result.unavailableReason} />;
  const answered = new Map(result.answers.map(answer => [answer.questionId, answer]));
  const known = new Set(instrument.stages.flatMap(stage => stage.questions.map(question => question.id)));
  const extra = result.answers.filter(answer => !known.has(answer.questionId));
  const counts: Array<[AnswerKind, number]> = [["evidence", result.counts.evidence], ["inference", result.counts.inference], ["gap", result.counts.gap]];
  return <article className={styles.result} aria-labelledby="analysis-result-title">
    <h2 id="analysis-result-title">Analysis: {instrument.title}</h2>
    <p className={styles.summary}>{result.summary}</p>
    <ul className={styles.chips} aria-label="How the answers are typed">
      {counts.map(([kind, count]) => <li key={kind} className={styles.chip}>{KIND_LABELS[kind].label}: {count}</li>)}
    </ul>
    <p className={styles.help}>Evidence is quoted from the material. Inference is a conclusion drawn from the material. Gap means the material does not settle the question.</p>
    {instrument.stages.map(stage => <section key={stage.id} className={styles.stage} aria-labelledby={`result-${stage.id}`}>
      <h3 id={`result-${stage.id}`}>{stage.title}</h3>
      {stage.description ? <p>{stage.description}</p> : null}
      {stage.questions.map(question => <QuestionAnswer key={question.id} question={question} answer={answered.get(question.id)} sources={sources} />)}
    </section>)}
    {extra.length ? <section className={styles.stage} aria-labelledby="result-other"><h3 id="result-other">Other findings</h3>
      {extra.map(answer => <QuestionAnswer key={answer.questionId} question={{ id: answer.questionId, prompt: "Further point from the material" }} answer={answer} sources={sources} />)}
    </section> : null}
    <section className={styles.stage} aria-labelledby="result-next-steps">
      <h3 id="result-next-steps">Next steps</h3>
      {result.nextSteps.length ? <ul className={styles.nextSteps}>
        {result.nextSteps.map((step, index) => <li key={`${step.questionId}-${step.href}-${index}`}><Link href={step.href}>{step.label}</Link><p>{step.why}</p></li>)}
      </ul> : <p className={styles.missing}>No next steps were added. Every question was answered from the material.</p>}
    </section>
    <section className={styles.stage} aria-labelledby="result-limitations">
      <h3 id="result-limitations">Limitations</h3>
      {result.limitations.length ? <ul className={styles.limitations}>{result.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className={styles.missing}>No limitations were listed.</p>}
    </section>
  </article>;
}

/** The result as plain text, for copying. */
export function analysisResultText(result: AnalysisResponse, instrument: Instrument, sources: readonly SourceTitle[]): string {
  const lines: string[] = [`Analysis: ${instrument.title}`, "", result.notice, ""];
  if (result.unavailable) {
    lines.push(`The analysis could not be prepared${result.unavailableReason ? `: ${result.unavailableReason}` : "."}`, "");
    for (const stage of instrument.stages) {
      lines.push(stage.title.toUpperCase());
      for (const question of stage.questions) lines.push(`- ${question.prompt}`);
      lines.push("");
    }
    return lines.join("\n");
  }
  const answered = new Map(result.answers.map(answer => [answer.questionId, answer]));
  lines.push("Summary", result.summary, "", `Evidence: ${result.counts.evidence}. Inference: ${result.counts.inference}. Gap: ${result.counts.gap}.`, "");
  for (const stage of instrument.stages) {
    lines.push(stage.title.toUpperCase());
    for (const question of stage.questions) {
      const answer = answered.get(question.id);
      lines.push(`Q: ${question.prompt}`);
      if (!answer) { lines.push("No answer was returned for this question.", ""); continue; }
      lines.push(`${KIND_LABELS[answer.kind].label}: ${answer.text}`);
      for (const citation of answer.citations) lines.push(`  "${citation.excerpt}" (${sourceTitle(sources, citation.sourceId)})`);
      lines.push("");
    }
  }
  lines.push("NEXT STEPS");
  if (result.nextSteps.length) for (const step of result.nextSteps) lines.push(`- ${step.label} (${step.href}): ${step.why}`);
  else lines.push("No next steps were added.");
  lines.push("", "LIMITATIONS");
  if (result.limitations.length) for (const item of result.limitations) lines.push(`- ${item}`);
  else lines.push("No limitations were listed.");
  return lines.join("\n");
}
