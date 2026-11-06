"use client";

import { useId } from "react";
import type { PolicyAnalysis, PolicySource } from "@/lib/policy-analysis/contract";
import { ANSWER_KIND_LABELS, formatDate, humanizeId, type QuestionLabels } from "./labels";
import styles from "./policy-analysis.module.css";

type Citation = { sourceId: string; excerpt: string };

export function Quotes({ citations, sources }: { citations: Citation[]; sources: PolicySource[] }) {
  if (!citations.length) return null;
  return (
    <>
      {citations.map((citation, index) => (
        <blockquote key={`${citation.sourceId}-${index}`} className={styles.quote}>
          “{citation.excerpt}”
          <cite>From: {sources.find(source => source.id === citation.sourceId)?.title ?? "a source no longer in this analysis"}</cite>
        </blockquote>
      ))}
    </>
  );
}

function AnswerBlock({ kind, text, citations, sources }: { kind: "evidence" | "inference" | "gap"; text: string; citations: Citation[]; sources: PolicySource[] }) {
  if (kind === "gap") {
    return (
      <div className={styles.gap}>
        <p className={`${styles.gapLabel} m-0`}>{ANSWER_KIND_LABELS.gap}</p>
        <p className={`${styles.pre} m-0`}>{text}</p>
        <Quotes citations={citations} sources={sources} />
      </div>
    );
  }
  return (
    <div>
      <span className={styles.answerLabel}>{ANSWER_KIND_LABELS[kind]}</span>
      <p className={`${styles.pre} m-0`}>{text}</p>
      <Quotes citations={citations} sources={sources} />
    </div>
  );
}

/** The equity analysis: summary, the information still needed, answers by question, principle findings and limitations. */
export function AnalysisView({ analysis, sources, questions, principleLabels }: {
  analysis: PolicyAnalysis;
  sources: PolicySource[];
  questions: QuestionLabels;
  principleLabels?: Record<string, string>;
}) {
  const ids = useId();
  const principleName = (id: string) => principleLabels?.[id] ?? humanizeId(id);
  const gaps = [
    ...analysis.answers.filter(answer => answer.kind === "gap").map(answer => ({ key: `q-${answer.questionId}`, about: questions[answer.questionId]?.prompt ?? humanizeId(answer.questionId), text: answer.text })),
    ...analysis.principles.filter(finding => finding.kind === "gap").map(finding => ({ key: `p-${finding.principleId}`, about: principleName(finding.principleId), text: finding.finding })),
  ];

  // Group answers by the instrument's stages, keeping the instrument's order; unknown questions go last.
  const groups = new Map<string, { order: number; answers: PolicyAnalysis["answers"] }>();
  for (const answer of analysis.answers) {
    const stage = questions[answer.questionId]?.stage ?? "Other questions";
    const order = questions[answer.questionId]?.stageOrder ?? 999;
    const group = groups.get(stage) ?? { order, answers: [] };
    group.answers.push(answer);
    groups.set(stage, group);
  }
  const ordered = [...groups.entries()].sort((a, b) => a[1].order - b[1].order);

  return (
    <div className={styles.stack}>
      <div>
        <h3 className="mt-0">Summary</h3>
        <p className={`${styles.pre} m-0`}>{analysis.summary}</p>
        <p className={`${styles.muted} mb-0`}>Prepared {formatDate(analysis.generatedAt)}.</p>
      </div>

      {gaps.length ? (
        <div className={styles.gap} aria-labelledby={`${ids}-gaps`} role="region">
          <h3 id={`${ids}-gaps`} className="mt-0">Information still needed</h3>
          <ul className="list-disc pl-6 m-0">
            {gaps.map(gap => <li key={gap.key}><strong>{gap.about}</strong> {gap.text}</li>)}
          </ul>
          <p className="mb-0 mt-2">Attach more material in step 2, such as the full policy, data or notes from the people affected, and run the analysis again to fill these in.</p>
        </div>
      ) : null}

      <div>
        <h3 className="mt-0">Answers to the policy review questions</h3>
        {ordered.map(([stage, group]) => (
          <section key={stage} className="mt-3" aria-label={stage}>
            <h4 className="font-bold text-lg m-0">{stage}</h4>
            <ol className={`${styles.list} mt-2`}>
              {group.answers.map(answer => (
                <li key={answer.questionId} className={styles.item}>
                  <p className="m-0 font-bold">{questions[answer.questionId]?.prompt ?? humanizeId(answer.questionId)}</p>
                  <div className="mt-2"><AnswerBlock kind={answer.kind} text={answer.text} citations={answer.citations} sources={sources} /></div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {analysis.principles.length ? (
        <div>
          <h3 className="mt-0">Equity principles</h3>
          <ul className={styles.list}>
            {analysis.principles.map(finding => (
              <li key={finding.principleId} className={styles.item}>
                <p className="m-0 font-bold">{principleName(finding.principleId)}</p>
                <div className="mt-2"><AnswerBlock kind={finding.kind} text={finding.finding} citations={finding.citations} sources={sources} /></div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.limitations.length ? (
        <div>
          <h3 className="mt-0">Limitations</h3>
          <ul className="list-disc pl-6 m-0">{analysis.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </div>
      ) : null}
    </div>
  );
}
