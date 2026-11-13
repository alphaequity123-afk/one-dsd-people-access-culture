import type { Metadata } from "next";
import { leadersAllowed } from "@/lib/auth/leaders-access";
import Link from "@/components/app-link";
import { askQuestion, goalMap, headlineNarratives, measures } from "@/lib/content/data/equity-baseline";
import { readEquityReviewTotals } from "@/lib/practice/equity-review-count-store";
import { EquityReviewCountSection } from "./review-count-section";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "./equity-baseline.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "Equity baseline",
  description: "Who gets Disability Services Division employment services, by race and ethnicity, fiscal years 2022 to 2024 pooled.",
};

export const dynamic = "force-dynamic";

export default async function EquityBaselinePage() {
  if (!(await leadersAllowed())) return null;
  const goals = goalMap();
  const headlines = headlineNarratives(5);
  const reviewTotals = await readEquityReviewTotals().catch(() => null);
  return <div className={base.page}><div className={base.content}>
    <header className={base.intro}>
      <p className={base.eyebrow}>Data</p>
      <h1>Equity baseline</h1>
      <p className={base.lede}>A baseline is the starting line. It shows who got each employment service, by race and ethnicity, before the next plan begins.</p>
      <p>These numbers pool fiscal years 2022, 2023 and 2024 into one value for each group. Three years together give a steadier picture than any one year. The plan for fiscal years 2027 to 2030 will be measured against this starting line. <Link href="/data/equity-baseline/glossary">Glossary of full names</Link>.</p>
      <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="equity-review" id="equity-baseline" noun="baseline" /></details>
    </header>

    <section className={styles.section} aria-labelledby="goals-title">
      <h2 id="goals-title">The six goals</h2>
      <p>Each goal comes from the Aging and Disability Services Administration Equity and Inclusion Implementation Plan. Open a goal to see its measures and the questions the plan asks.</p>
      <ul className={styles.goals}>
        {goals.map(({ goal, measureIds, dataGaps }) => <li key={goal.number}>
          <Link className={styles.goalCard} href={`/data/equity-baseline/goal/${goal.number}`}>
            <span className={styles.goalNumber}>Goal {goal.number}</span>
            <span className={styles.goalTitle}>{goal.title}</span>
            <span>{goal.focus}</span>
            <span className={styles.goalMeta}>{measureIds.length === 0 ? "No measures yet" : `${measureIds.length} measure${measureIds.length === 1 ? "" : "s"}`}{dataGaps.length ? ` · ${dataGaps.length} data gap${dataGaps.length === 1 ? "" : "s"}` : ""}</span>
          </Link>
        </li>)}
      </ul>
    </section>

    <section className={styles.section} aria-labelledby="numbers-title">
      <h2 id="numbers-title">What the numbers say</h2>
      <p>The five widest gaps in the baseline, in plain words.</p>
      <ul className={styles.narratives}>
        {headlines.map(({ measure, text }) => <li key={measure.id}>
          {text}
          <Link href={`/data/equity-baseline/goal/${measure.goal}#${measure.id}`}>{measure.program}</Link>
        </li>)}
      </ul>
    </section>

    <EquityReviewCountSection totals={reviewTotals} />

    <section className={styles.section} aria-labelledby="count-title">
      <div className={styles.howWeCount}>
        <h2 id="count-title">How we count</h2>
        <p>Each value pools three fiscal years, 2022 to 2024. Where the source gives counts, the pooled value is count-weighted, and a 95% confidence interval is shown. Where the source gives only a figure, the value is a simple average and no interval is shown.</p>
        <p>A risk ratio compares one group with everyone else. A value of 1.0 means no difference. Below 1.0 means less likely; above 1.0 means more likely.</p>
        <p>Small counts are suppressed in the source and appear as &quot;Not available&quot;. People whose record does not say their race are shown as &quot;Race not recorded&quot;. {measures().length} measures are included.</p>
        <p>Have a question about a measure? Each card links to Ask with a question ready, for example: {askQuestion(measures()[0])}</p>
      </div>
    </section>
  </div></div>;
}
