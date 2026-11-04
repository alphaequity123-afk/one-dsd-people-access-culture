import type { TutorTotals } from "@/lib/tutor/counter-store";
import { PRACTICE_COUNTERS_ENABLED } from "@/lib/practice/equity-review-count";
import styles from "./equity-baseline.module.css";

/** Every static string a leader can see here. Tests check reading level and banned words against this table. */
export const TUTOR_SIGNALS_COPY = {
  heading: "Guidance signals",
  intro: "When a learner asks for guidance on a practice question, one is added to an anonymous count for that lesson. The questions come from the Culturally and Linguistically Appropriate Services curriculum and the leadership styles pathway. The count does not record who the learner is, what they wrote, or which browser they used. These are totals only.",
  off: "Guidance sessions are not counted yet. Nothing is recorded when someone asks for guidance.",
  firstTry: "First try correct is the share of learners who chose the stronger option on their first attempt, among those who then asked for guidance.",
  unavailable: "The count could not be loaded right now. Try again later.",
  zero: "No guidance sessions have been counted yet.",
  caption: "Guidance by lesson",
  columns: { lesson: "Lesson", rate: "First try correct", answered: "Questions answered", rounds: "Guidance rounds", average: "Rounds per question", hints: "Hints given" },
  none: "None yet",
} as const;

const percent = (value: number | null) => (value === null ? TUTOR_SIGNALS_COPY.none : `${Math.round(value * 100)}%`);
const average = (value: number | null) => (value === null ? TUTOR_SIGNALS_COPY.none : (Math.round(value * 10) / 10).toString());

/** Anonymous totals only: per lesson, first-try correctness, questions answered, guidance rounds and hints. */
export function TutorSignalsSection({ totals }: { totals: TutorTotals | null }) {
  const c = TUTOR_SIGNALS_COPY;
  return <section className={styles.section} aria-labelledby="guidance-signals-title">
    <h2 id="guidance-signals-title">{c.heading}</h2>
    {!PRACTICE_COUNTERS_ENABLED ? <p>{c.off}</p> : <p>{c.intro}</p>}
    {!PRACTICE_COUNTERS_ENABLED ? null : totals === null ? <p>{c.unavailable}</p>
      : totals.total === 0 ? <p>{c.zero}</p>
      : <>
        <p>{c.firstTry}</p>
        <table className={styles.table}>
          <caption>{c.caption}</caption>
          <thead><tr>
            <th scope="col">{c.columns.lesson}</th>
            <th scope="col">{c.columns.rate}</th>
            <th scope="col">{c.columns.answered}</th>
            <th scope="col">{c.columns.rounds}</th>
            <th scope="col">{c.columns.average}</th>
            <th scope="col">{c.columns.hints}</th>
          </tr></thead>
          <tbody>{totals.lessons.map(lesson => <tr key={lesson.lessonId}>
            <th scope="row">{/^ls/.test(lesson.lessonId) ? lesson.title : `Part ${Number(lesson.lessonId)}: ${lesson.title}`}</th>
            <td>{percent(lesson.firstAttemptRate)}</td>
            <td>{lesson.firstAttemptTotal}</td>
            <td>{lesson.rounds}</td>
            <td>{average(lesson.averageRounds)}</td>
            <td>{lesson.hints}</td>
          </tr>)}</tbody>
        </table>
      </>}
  </section>;
}
