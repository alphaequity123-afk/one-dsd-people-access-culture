import { GOALS } from "@/lib/content/data/equity-baseline";
import type { EquityReviewTotals } from "@/lib/practice/equity-review-count-store";
import { DECISION_TYPES, DECISION_TYPE_LABELS, EQUITY_REVIEW_TOOLS, EQUITY_REVIEW_TOOLS_COUNTED, EQUITY_REVIEW_TOOL_TITLES, PRACTICE_COUNTERS_ENABLED } from "@/lib/practice/equity-review-count";
import styles from "./equity-baseline.module.css";

function monthName(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
const reviews = (count: number) => `${count} review${count === 1 ? "" : "s"}`;

function ReviewCountTable({ caption, heading, rows }: { caption: string; heading: string; rows: { label: string; count: number }[] }) {
  return <table className={styles.table}>
    <caption>{caption}</caption>
    <thead><tr><th scope="col">{heading}</th><th scope="col">Reviews completed</th></tr></thead>
    <tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.count}</td></tr>)}</tbody>
  </table>;
}

/** Anonymous totals only: no names, units, counties or review content are stored. */
export function EquityReviewCountSection({ totals }: { totals: EquityReviewTotals | null }) {
  if (!PRACTICE_COUNTERS_ENABLED) return null;
  const countedTools = EQUITY_REVIEW_TOOLS_COUNTED.map(tool => EQUITY_REVIEW_TOOL_TITLES[tool]).join(", ");
  return <section className={styles.section} aria-labelledby="reviews-completed-title">
    <h2 id="reviews-completed-title">Equity reviews completed</h2>
    <p>When staff finish an equity review on this site, one is added to the count.</p>
    <p>Right now the count comes from this review: {countedTools}.</p>
    {totals === null ? <p>The count could not be loaded right now. Try again later.</p>
      : totals.total === 0 ? <p>No reviews have been counted yet.</p>
      : <>
        <p>{reviews(totals.total)} completed to date. {reviews(totals.lastThreeMonths.reduce((sum, entry) => sum + entry.count, 0))} in the last three months, including this month.</p>
        <p>A review can connect to more than one goal, so the goal numbers can add up to more than the total. Choosing goals and a kind of decision is optional, so those numbers can also add up to less.</p>
        <ReviewCountTable caption="Last three months" heading="Month" rows={totals.lastThreeMonths.map(entry => ({ label: monthName(entry.month), count: entry.count }))} />
        <ReviewCountTable caption="By goal" heading="Goal" rows={GOALS.map(goal => ({ label: `Goal ${goal.number}: ${goal.title}`, count: totals.byGoal[goal.number] ?? 0 }))} />
        <ReviewCountTable caption="By kind of decision" heading="Kind of decision" rows={DECISION_TYPES.map(type => ({ label: DECISION_TYPE_LABELS[type], count: totals.byDecisionType[type] }))} />
        <ReviewCountTable caption="By review" heading="Review" rows={EQUITY_REVIEW_TOOLS.map(tool => ({ label: EQUITY_REVIEW_TOOL_TITLES[tool], count: totals.byTool[tool] }))} />
      </>}
  </section>;
}
