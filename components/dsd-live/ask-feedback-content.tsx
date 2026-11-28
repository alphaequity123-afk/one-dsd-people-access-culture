import { askCitationHref } from "@/lib/dsd-live/ask/citation-href";
import type { AskFeedback } from "@/lib/dsd-live/learning/applied-learning";

export function AskFeedbackContent({ feedback }: { feedback: AskFeedback }) {
  return <>
    <p style={{ whiteSpace: "pre-wrap" }}>{feedback.text}</p>
    {feedback.sources.length ? <ol aria-label="Sources for the feedback">
      {feedback.sources.map(source =>
        <li key={source.n} value={source.n}><a href={askCitationHref(source)}>{source.title}</a></li>
      )}
    </ol> : null}
  </>;
}
