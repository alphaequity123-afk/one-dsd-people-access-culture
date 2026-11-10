import type { Metadata } from "next";
import Link from "next/link";
import { LEADING_LABEL, LEADING_PRIVACY_SENTENCE, REQUIRED_COURSE_LABEL, TRIBAL_REFERRAL_HREF } from "@/lib/content/collections";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";

export const metadata: Metadata = {
  title: `How this works | ${LEADING_LABEL}`,
  description: "What is and is not recorded in the leadership space, and where your progress and questions go.",
};

export default function LeadingHowThisWorksPage() {
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/leading">{LEADING_LABEL}</Link></p>
    <header className={base.intro}>
      <p className={base.eyebrow}>{LEADING_LABEL}</p>
      <h1>How this works</h1>
      <p className={base.lede}>What is recorded, what is not, and what this space does not do.</p>
    </header>
    <div className={styles.plain}>
      <h2>There is no team view</h2>
      <p>{LEADING_PRIVACY_SENTENCE}</p>
      <ul>
        <li>There is no sign-in for this space. All of it is public, and staff can read every page.</li>
        <li>There is no team view, no assignments and no scores.</li>
        <li>A supervisor cannot see who opened a course, how far they got or what they answered. Neither can you.</li>
      </ul>
      <h2>What stays in your browser</h2>
      <ul>
        <li>Your progress stays in your browser. That includes your place on a suggested path, your lesson progress and your practice answers.</li>
        <li>Nothing is sent to a supervisor or employer.</li>
        <li>Anyone using the same computer and browser could see it. You can clear it at any time.</li>
      </ul>
      <h2>What happens to a question in Ask</h2>
      <ul>
        <li>Questions typed into Ask go to outside services so that it can answer.</li>
        <li>The current service does not intentionally save a question-and-answer copy in the owner workspace. Operational activity may be recorded, and earlier versions may have retained separate records. Supervisors do not receive your browser conversation from Ask.</li>
        <li>Please do not type anyone&apos;s name, case, health or personnel details. Ask general questions.</li>
      </ul>
      <h2>What this does not replace</h2>
      <ul>
        <li>This app does not replace training the state requires. It does not count as the training Minn. Stat. 43A.21 requires of supervisors and managers. The state&apos;s own training does that.</li>
        <li>It is general information, not legal advice. For a real situation, ask Human Resources, labor relations or your ADA coordinator.</li>
        <li>It does not make or record any personnel, accommodation or complaint decision.</li>
      </ul>
      <h2>The one exception to voluntary use</h2>
      <p>{TRAINING_CREDIT_NOTICE}</p>
      <p>The Equity Analysis Toolkit is required of all staff of the Minnesota Department of Human Services, regardless of status, so it is marked &ldquo;{REQUIRED_COURSE_LABEL}&rdquo; wherever it is listed here. This app does not assign it or report on who has taken it. <Link href="/courses/dhs-equity-analysis-toolkit">Open the Equity Analysis Toolkit course</Link>.</p>
      <h2>Using the learning</h2>
      <p>Use these courses as guidance for your work, alongside current policy and the people and offices responsible for a decision.</p>
      <h2>Tribal and Native American learning</h2>
      <p>This space does not offer Tribal curriculum. One DSD refers Native American and Tribal-specific learning, questions and engagement to ADSA and the responsible Tribal liaison. <Link href={TRIBAL_REFERRAL_HREF}>Native American and Tribal-specific guidance</Link>.</p>
    </div>
    <aside className={base.continue}>
      <h2>Keep exploring</h2>
      <p><Link href="/leading">What are you deciding?</Link><Link href="/about#participation-title">How participation and privacy work across the program</Link></p>
    </aside>
  </div></div>;
}
