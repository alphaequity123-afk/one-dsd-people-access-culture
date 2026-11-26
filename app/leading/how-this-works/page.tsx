import type { Metadata } from "next";
import Link from "@/components/app-link";
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
      <p className={base.lede}>Here is what we record, what we don&apos;t, and what this space is not meant to do.</p>
    </header>
    <div className={styles.plain}>
      <h2>There is no team view</h2>
      <p>{LEADING_PRIVACY_SENTENCE}</p>
      <ul>
        <li>There is no sign-in for this space. All of it is public, and staff can read every page.</li>
        <li>Nothing here gives supervisors a scoreboard of learners, and these optional courses are never assigned to you.</li>
        <li>Supervisors can&apos;t see which courses you visit, how far you have gone or what you answer. Anyone who uses the same browser profile as you may still see what is saved there.</li>
      </ul>
      <h2>What stays in your browser</h2>
      <ul>
        <li>When you save your place on a suggested path, your lesson progress or your practice answers, they stay in this browser profile, as long as the browser allows saving.</li>
        <li>We never send those saved items to supervisors or program staff. A copy leaves your browser only if you choose to export or share it.</li>
        <li>Anyone using the same browser profile may see saved items. You can clear them where you saved them. Copies you download, print or share are separate and stay as they are.</li>
      </ul>
      <h2>What happens to a question in Ask</h2>
      <ul>
        <li>When you type a question into Ask, it goes to outside services so that Ask can answer.</li>
        <li>The current version of Ask does not set out to keep a copy of your questions and answers in the owner workspace. Some operational activity may be recorded, and earlier versions may have kept separate records. Your supervisor never receives your Ask conversation from your browser.</li>
        <li>Please do not type anyone&apos;s name, case, health or personnel details. Ask general questions.</li>
      </ul>
      <h2>What this does not replace</h2>
      <ul>
        <li>This site doesn&apos;t replace the training the state requires, and it doesn&apos;t count as the training Minn. Stat. 43A.21 requires of supervisors and managers. The state&apos;s own training does that.</li>
        <li>It is general information, not legal advice. For a real situation, ask Human Resources, labor relations or your ADA coordinator.</li>
        <li>It does not make or record any personnel, accommodation or complaint decision.</li>
      </ul>
      <h2>Required responsibilities and optional learning</h2>
      <p>{TRAINING_CREDIT_NOTICE}</p>
      <p>The label &ldquo;{REQUIRED_COURSE_LABEL}&rdquo; points to the agency responsibility that comes with the Equity Analysis Toolkit. This companion course doesn&apos;t assign or certify required agency training. For that, follow the agency&apos;s own training process and the policy requirements for equity analysis. <Link href="/courses/dhs-equity-analysis-toolkit">Open the Equity Analysis Toolkit course</Link>.</p>
      <h2>Using the learning</h2>
      <p>Let these courses guide your work, alongside current policy and the person or area responsible for each decision.</p>
      <h2>Tribal and Native American learning</h2>
      <p>We don&apos;t offer Tribal curriculum here. For Native American and Tribal-specific learning, questions and engagement, One DSD connects you with ADSA and the responsible Tribal liaison. <Link href={TRIBAL_REFERRAL_HREF}>Native American and Tribal-specific guidance</Link>.</p>
    </div>
    <aside className={base.continue}>
      <h2>Keep exploring</h2>
      <p><Link href="/leading">What are you deciding?</Link><Link href="/about#participation-title">How participation and privacy work across the program</Link></p>
    </aside>
  </div></div>;
}
