import type { Metadata } from "next";
import { leadersAllowed } from "@/lib/auth/leaders-access";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EquityBarChart, EquityNumbersTable } from "@/components/equity-chart";
import { askQuestion, GOALS, goalMap, measure, narrative } from "@/lib/content/data/equity-baseline";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "../../equity-baseline.module.css";

type Params = { params: Promise<{ number: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return GOALS.map(goal => ({ number: String(goal.number) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { number } = await params;
  const goal = GOALS.find(g => String(g.number) === number);
  return { title: goal ? `Goal ${goal.number}: ${goal.title} — Equity baseline` : "Equity baseline" };
}

export default async function EquityGoalPage({ params }: Params) {
  if (!(await leadersAllowed())) return null;
  const { number } = await params;
  const entry = goalMap().find(e => String(e.goal.number) === number);
  if (!entry) notFound();
  const { goal, measureIds, dataGaps } = entry;
  const list = measureIds.map(id => measure(id)!).filter(Boolean);
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/data/equity-baseline">Equity baseline</Link></p>
    <header className={base.intro}>
      <p className={base.eyebrow}>Goal {goal.number}</p>
      <h1>{goal.title}</h1>
      <p className={base.lede}>{goal.focus}</p>
      <p>{goal.summary}</p>
    </header>

    <div className={styles.questions}>
      <div>
        <h2>The measures</h2>
        {list.length === 0 && <p>No measure serves this goal yet. The list below says what data would fill the gap.</p>}
        {list.length > 0 && <p>Each card shows one program or service: who gets it, by race and ethnicity, fiscal years 2022 to 2024 pooled. Young people age 14 to 21 and adults age 22 to 64 are shown separately.</p>}
      </div>
      <aside aria-labelledby={`questions-${goal.number}`}>
        <h2 id={`questions-${goal.number}`}>The plan asks</h2>
        <ol>{goal.questions.map(q => <li key={q}>{q}</li>)}</ol>
      </aside>
    </div>

    {dataGaps.length > 0 && <section className={styles.gaps} aria-labelledby={`gaps-${goal.number}`}>
      <h2 id={`gaps-${goal.number}`}>Data we still need</h2>
      <ul>{dataGaps.map(gap => <li key={gap}>{gap}</li>)}</ul>
    </section>}

    {list.map(m => <article key={m.id} id={m.id} className={styles.measure} aria-labelledby={`${m.id}-title`}>
      <span className={styles.ageTag}>{m.ageGroup === "youth" ? "Young people age 14 to 21" : "Adults age 22 to 64"}</span>
      <h3 id={`${m.id}-title`}>{m.title}</h3>
      <p className={styles.note}>{m.plainWhat}</p>
      <p className={styles.narrative}>{narrative(m)}</p>
      {m.note && <p className={styles.note}>{m.note}</p>}
      <EquityBarChart measure={m} />
      <details className={styles.details}>
        <summary>Show the numbers</summary>
        <EquityNumbersTable measure={m} />
      </details>
      <p className={styles.note}>Source: {m.source}.</p>
      <Link className={styles.ask} href={`/ask?q=${encodeURIComponent(askQuestion(m))}`}>Ask about this measure</Link>
    </article>)}

    <aside className={base.continue}>
      <h2>Keep exploring</h2>
      <p>
        {GOALS.filter(g => g.number !== goal.number).map(g => <Link key={g.number} href={`/data/equity-baseline/goal/${g.number}`}>Goal {g.number}: {g.title}</Link>)}
        <Link href="/data/equity-baseline/glossary">Glossary of full names</Link>
      </p>
    </aside>
  </div></div>;
}
