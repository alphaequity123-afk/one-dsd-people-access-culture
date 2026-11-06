import type { Metadata } from "next";
import Link from "next/link";
import { EngagementPlan } from "@/components/hub/engagement-plan";
import { BEFORE_YOU_REACH_OUT, OUTREACH_PRACTICE } from "@/lib/content/hub/before-you-reach-out";
import { CommunityPractice } from "@/components/community-experience-controls";
import "@/components/community-editorial.css";
import styles from "../hub.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "Plan an engagement",
  description: "Questions to answer before you reach out to a community, and a fill-in engagement and report-back plan that saves nothing.",
};


export default function PlanPage() {
  return <div className={styles.page}>
    <p className={`${styles.kicker} ${styles.noPrint}`}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>Plan an engagement</h1>
    <p className={styles.lede}>Answer these questions before you reach out. Then draft your engagement and report-back plan below.</p>
    <p className={styles.note}>This page saves nothing. Your plan stays on this page until you print it or copy it. Nothing about what you plan is recorded or shared.</p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="community-outreach" id="plan" noun="blank plan" /></details>

    <section className={styles.section} aria-labelledby="before-title">
      <h2 id="before-title">Before you reach out</h2>
      <div className={styles.grid}>
        {BEFORE_YOU_REACH_OUT.map(group => <div className={styles.card} key={group.title}>
          <h3>{group.title}</h3>
          <ul className="list-disc pl-6">{group.items.map(item => <li key={item}>{item}</li>)}</ul>
        </div>)}
      </div>
      <p className={styles.noPrint}>Helpful pages: <Link href="/minnesota-communities">Minnesota Communities</Link> · <Link href="/community-outreach/organizations">Organization directory</Link> · <Link href="/learn/community-connections">Community engagement: from input to action</Link> · <Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link> · <Link href="/equity-review/analyze">Analyze a document</Link></p>
    </section>

    <section className={`${styles.section} ${styles.noPrint}`} aria-labelledby="practice-title">
      <h2 id="practice-title">Practice before you plan</h2>
      <p>Think through each situation, then compare your thinking with the reasoning.</p>
      <div className="community-editorial">{OUTREACH_PRACTICE.map(item => <CommunityPractice key={item.question} {...item} />)}</div>
    </section>

    <section className={styles.section} aria-labelledby="plan-title">
      <h2 id="plan-title">Your plan</h2>
      <EngagementPlan />
    </section>
  </div>;
}
