import type { Metadata } from "next";
import Link from "@/components/app-link";
import { EngagementPlan } from "@/components/hub/engagement-plan";
import { BEFORE_YOU_REACH_OUT, OUTREACH_PRACTICE } from "@/lib/content/hub/before-you-reach-out";
import { CommunityPractice } from "@/components/community-experience-controls";
import { PracticeVideo } from "@/components/practice-video";
import "@/components/community-editorial.css";
import styles from "../hub.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "Plan an engagement",
  description: "Questions to answer before you reach out to a community, and a fill-in engagement and report-back plan that saves nothing.",
};


export default function PlanPage() {
  return <div className={`${styles.page} pilot-reading-width`}>
    <p className={`${styles.kicker} ${styles.noPrint}`}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>Plan an engagement</h1>
    <p className={styles.lede}>This page helps staff of the Disability Services Division prepare for a conversation with a community. You can draft an engagement and report-back plan.</p>
    <p className={styles.note}>This page saves nothing. Your plan stays on this page until you print it or copy it. Nothing about what you plan is recorded or shared.</p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="community-outreach" id="plan" noun="blank plan" /></details>

    <details className="pilot-supporting print:hidden">
      <summary>Before you reach out</summary>
      <div className="pilot-supporting-body space-y-5">
        {BEFORE_YOU_REACH_OUT.map(group => <div key={group.title}>
          <h2 className="text-lg">{group.title}</h2>
          <ul className="list-disc pl-6">{group.items.map(item => <li key={item}>{item}</li>)}</ul>
        </div>)}
        <ul className="pilot-topic-rows">
          <li><Link href="/minnesota-communities">Minnesota Communities</Link></li>
          <li><Link href="/community-outreach/organizations">Organization directory</Link></li>
          <li><Link href="/learn/community-connections">Community engagement: from input to action</Link></li>
          <li><Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link></li>
          <li><Link href="/equity-review/analyze">Analyze a document</Link></li>
        </ul>
      </div>
    </details>
    <PracticeVideo clip="community-follow-up" />
    <details id="practice-title" className="pilot-supporting print:hidden">
      <summary>Practice before you plan</summary>
      <div className="pilot-supporting-body community-editorial">
        <p>Think through each situation, then compare your thinking with the reasoning.</p>
        {OUTREACH_PRACTICE.map(item => <CommunityPractice key={item.question} {...item} />)}
      </div>
    </details>

    <section className={styles.section} aria-labelledby="plan-title">
      <h2 id="plan-title">Your plan</h2>
      <EngagementPlan />
    </section>
  </div>;
}
