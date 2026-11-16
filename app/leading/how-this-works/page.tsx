import type { Metadata } from "next";
import Link from "@/components/app-link";
import { LEADING_LABEL, REQUIRED_COURSE_LABEL, TRIBAL_REFERRAL_HREF } from "@/lib/content/collections";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";

export const metadata: Metadata = {
  title: `How this works | ${LEADING_LABEL}`,
  description: "How to use the leadership space alongside required training, real decisions and Tribal referral.",
};

export default function LeadingHowThisWorksPage() {
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/leading">{LEADING_LABEL}</Link></p>
    <header className={base.intro}>
      <p className={base.eyebrow}>{LEADING_LABEL}</p>
      <h1>How this works</h1>
      <p className={base.lede}>How to use this space alongside required training and real decisions.</p>
    </header>
    <div className={styles.plain}>
      <h2>Questions in Ask</h2>
      <ul>
        <li>Ask general questions. Do not type anyone&apos;s name, case, health or personnel details.</li>
      </ul>
      <h2>Required training</h2>
      <ul>
        <li>The training Minn. Stat. 43A.21 requires of supervisors and managers is met through the state&apos;s own training.</li>
      </ul>
      <p>{TRAINING_CREDIT_NOTICE}</p>
      <p>The label &ldquo;{REQUIRED_COURSE_LABEL}&rdquo; refers to the agency responsibility associated with the Equity Analysis Toolkit. Follow the designated agency process for training and the applicable policy requirements for equity analysis. <Link href="/courses/dhs-equity-analysis-toolkit">Open the Equity Analysis Toolkit course</Link>.</p>
      <h2>Real situations</h2>
      <ul>
        <li>This is general information, not legal advice. For a real situation, ask Human Resources, labor relations or your ADA coordinator.</li>
        <li>Personnel, accommodation and complaint decisions stay with the people responsible for them.</li>
      </ul>
      <h2>Using the learning</h2>
      <p>Use these courses as guidance for your work, alongside current policy and the person or area responsible for a decision.</p>
      <h2>Tribal and Native American learning</h2>
      <p>This space does not offer Tribal curriculum. One DSD refers Native American and Tribal-specific learning, questions and engagement to ADSA and the responsible Tribal liaison. <Link href={TRIBAL_REFERRAL_HREF}>Native American and Tribal-specific guidance</Link>.</p>
    </div>
    <aside className={base.continue}>
      <h2>Keep exploring</h2>
      <p><Link href="/leading">What are you deciding?</Link><Link href="/about#participation-title">Privacy across the program</Link></p>
    </aside>
  </div></div>;
}
