import type { Metadata } from "next";
import Link from "next/link";
import { CollectionItemLink } from "@/components/collection-item-link";
import { ParticipationNotice } from "@/components/participation-notice";
import { LEADING_DOORS, LEADING_LABEL, LEADING_PATHS, LEADING_PRIVACY_SENTENCE, REQUIRED_COURSE_ID, TRIBAL_REFERRAL_HREF, pathHours } from "@/lib/content/collections";
import { publishedCourses } from "@/lib/content/courses/published";
import { requestedContentScope } from "@/lib/product/request-context";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { LEADERSHIP_PATHWAY_HREF } from "@/lib/content/leadership-styles-pathway";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";
import { Hub2More } from "@/components/hub2-choices";

export const metadata: Metadata = {
  title: LEADING_LABEL,
  description: "Start from the decision in front of you. Nine kinds of decision, each with plain questions and one course to start with.",
};
export const dynamic = "force-dynamic";

export default async function LeadingPage() {
  const scope = await requestedContentScope();
  const published = new Set((await publishedCourses(scope)).map(({ pack }) => pack.course.id));
  const culturalLearningAvailable = await culturalIntelligenceHubAvailable(scope);
  return <div className={base.page}><div className={base.content}>
    <header className={base.intro}>
      <p className={base.eyebrow}>{LEADING_LABEL}</p>
      <h1>Lead equity in everyday work</h1>
      <p className={base.lede}>Whether you are exploring leadership, leading a team or shaping direction across the division, find learning and practical tools for the decisions and responsibilities in front of you.</p>
      <p>Everything here is public, and anyone can use it. You can start anywhere and skip anything. {LEADING_PRIVACY_SENTENCE} <Link href="/leading/how-this-works">How this works</Link>.</p>
    </header>
    <section className={styles.section} aria-labelledby="leadership-start-title">
      <h2 id="leadership-start-title">Start where you are</h2>
      <p>Leadership can begin before a formal role. Choose a starting point that fits your work; these are invitations, not assignments or assessments.</p>
      <ul className={styles.doors}>
        <li><Link className={styles.door} href="/one-dsd/leadership#starting-points"><span className={styles.doorTitle}>Explore leadership</span><span>Connect an interest or aspiration with an accessible opportunity to practice, support and feedback.</span><span className={styles.doorAction}>Make a development map</span></Link></li>
        <li><Link className={styles.door} href="#decision-doors"><span className={styles.doorTitle}>Lead a team or a decision</span><span>Find questions and resources for hiring, access, feedback, team culture and policy.</span><span className={styles.doorAction}>Choose a decision</span></Link></li>
        <li><Link className={styles.door} href={LEADERSHIP_PATHWAY_HREF}><span className={styles.doorTitle}>Compare leadership approaches</span><span>See how sixteen leadership approaches handle conflict and affect equity and inclusion, with scenarios, a practice rubric and a capstone.</span><span className={styles.doorAction}>Leadership styles pathway</span></Link></li>
        <li><Link className={styles.door} href="/data/equity-baseline"><span className={styles.doorTitle}>See the equity baseline</span><span>For managers, supervisors and the consultant (access key required). Who gets each employment service, by race and ethnicity, fiscal years 2022 to 2024.</span><span className={styles.doorAction}>Open the baseline</span></Link></li>
        <li><Link className={styles.door} href="/leading/community-coverage"><span className={styles.doorTitle}>See community coverage</span><span>For managers, supervisors and the consultant (access key required). Which communities have organizations on record, figures, and a completed community review.</span><span className={styles.doorAction}>Open community coverage</span></Link></li>
        <li><Link className={styles.door} href="/leading/direction"><span className={styles.doorTitle}>Lead leaders and set direction</span><span>Support supervisors and managers, examine organizational practices, and connect decisions to accountability.</span><span className={styles.doorAction}>Explore direction</span></Link></li>
        <li><Link className={styles.door} href="/one-dsd/leadership#continuity-plan"><span className={styles.doorTitle}>Build future leadership</span><span>Plan for continuity, share knowledge and make development opportunities visible and accessible.</span><span className={styles.doorAction}>Practice succession planning</span></Link></li>
        <li><Link className={styles.door} href="/leading/journey"><span className={styles.doorTitle}>Follow your own journey</span><span>Learn, reflect, try it in your real work and note what changed, at your own pace and in any order.</span><span className={styles.doorAction}>See how it works</span></Link></li>
      </ul>
    </section>
    <section id="decision-doors" className={styles.section} aria-labelledby="decision-doors-title">
    <h2 id="decision-doors-title">What are you deciding?</h2>
    <p>Each decision opens with practical questions, a course, a job aid where available, and people or offices who may help.</p>
    <ul className={styles.doors} aria-label="Decisions">
      {LEADING_DOORS.map(door => <li key={door.slug}><Link className={styles.door} href={`/leading/${door.slug}`}>
        <span className={styles.doorTitle}>{door.title}</span>
        <span>{door.description}</span>
        <span className={styles.doorAction}>{door.questions.length} questions</span>
      </Link></li>)}
    </ul>
    </section>
    <aside className={styles.requiredNote} aria-labelledby="required-course-title">
      <h2 id="required-course-title">One course is required</h2>
      <p><CollectionItemLink id={REQUIRED_COURSE_ID} published={published} /></p>
      <p>The Equity Analysis Toolkit is required of all staff of the Minnesota Department of Human Services, regardless of status. Everything else here is voluntary.</p>
    </aside>
    <section className={styles.section} aria-labelledby="paths-title">
      <h2 id="paths-title">Suggested paths</h2>
      <p>These are suggestions. Nobody is enrolled, and nobody else can see where you are.</p>
      <ul className={styles.doors}>
        {LEADING_PATHS.map(path => <li key={path.slug}><Link className={styles.door} href={`/leading/paths/${path.slug}`}>
          <span className={styles.doorTitle}>{path.title}</span>
          <span>{path.description}</span>
          <span className={styles.doorAction}>{path.courseIds.length} courses, about {pathHours(path)} hours</span>
        </Link></li>)}
      </ul>
      <p><Link href="/leading/paths">All suggested paths</Link></p>
    </section>
    <section className={styles.section} aria-labelledby="leadership-tools-title">
      <h2 id="leadership-tools-title">Tools for the work</h2>
      <p>Use a tool to prepare for a real conversation or decision. Include the people affected, follow the applicable policy and work with the office responsible for the decision.</p>
      <ul className={styles.doors}>
        <li><Link className={styles.door} href="/learn/equity-toolkit"><span className={styles.doorTitle}>Examine a decision</span><span>Consider effects, evidence, alternatives and who needs to be involved.</span><span className={styles.doorAction}>Equity Analysis Toolkit</span></Link></li>
        <li><Link className={styles.door} href="/one-dsd/leadership#life-cycle"><span className={styles.doorTitle}>Practice across the employee life cycle</span><span>Explore role design, development, advancement, retention, succession and transitions.</span><span className={styles.doorAction}>Open the life-cycle explorer</span></Link></li>
        <li><Link className={styles.door} href="/one-dsd/amplify/mentoring#mentoring-tool"><span className={styles.doorTitle}>Prepare a mentoring conversation</span><span>Name a question, consider the support you need and choose a useful next step.</span><span className={styles.doorAction}>Prepare a conversation</span></Link></li>
        <li><Link className={styles.door} href="/one-dsd/leadership#continuity-plan"><span className={styles.doorTitle}>Plan for continuity</span><span>Connect critical work, a development opportunity, knowledge sharing and follow-up.</span><span className={styles.doorAction}>Create a succession draft</span></Link></li>
      </ul>
      <p>Development and continuity drafts stay on their page until you copy or download them. Do not enter names or private personnel details. They do not replace the applicable Human Resources or selection process.</p>
    </section>
    <Hub2More title="Keep exploring">
      {culturalLearningAvailable && <p><Link href="/learn/cultural-intelligence#leaders">Explore leadership approaches, power and inclusive practice</Link></p>}
      <p className="flex flex-wrap gap-x-6 gap-y-2"><Link href="/support/right-person">Find the right person or office</Link><Link href="/learn/collections">Collections for all staff</Link><Link href="/one-dsd/leadership">Equity leadership and growth</Link><Link href={TRIBAL_REFERRAL_HREF}>Native American and Tribal-specific guidance</Link></p>
    </Hub2More>
    <details className={base.credit}><summary>About participation and privacy</summary><p>Please do not type anyone&apos;s name or details into Ask. It answers general questions only. {LEADING_PRIVACY_SENTENCE}</p><ParticipationNotice surface="learning" /></details>
  </div></div>;
}
