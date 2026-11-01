import { useId } from "react";
import { TOOL_DECISION_QUESTIONS, type ToolDecisionQuestionKey, type ToolDecisionQuestionSet } from "@/lib/content/tool-decision-questions";

/** Questions for a tool's own decision points. Nothing is entered or stored. */
export function ToolDecisionQuestions({ tool, className = "" }: { tool: ToolDecisionQuestionKey; className?: string }) {
  const titleId = useId();
  const set: ToolDecisionQuestionSet = TOOL_DECISION_QUESTIONS[tool];
  return <section aria-labelledby={titleId} className={`space-y-3 rounded-xl border border-line p-5 ${className}`.trim()}>
    <h2 id={titleId} className="text-xl font-semibold">{set.title}</h2>
    <dl className="space-y-3">{set.moments.map(moment => <div key={moment.when}>
      <dt className="font-semibold">{moment.when}</dt>
      <dd className="mt-1 leading-7">{moment.question}</dd>
    </div>)}</dl>
    <div className="space-y-2 text-sm">
      {set.note && <p>{set.note}</p>}
    </div>
  </section>;
}
