import type { Metadata } from "next";
import Link from "next/link";
import { CollectionItemLink } from "@/components/collection-item-link";
import { ParticipationNotice } from "@/components/participation-notice";
import { LEADING_DOORS, LEADING_LABEL, LEADING_PATHS, LEADING_PRIVACY_SENTENCE, REQUIRED_COURSE_ID, TRIBAL_REFERRAL_HREF, pathHours } from "@/lib/content/collections";
import { publishedCourses } from "@/lib/content/courses/published";
import { requestedContentScope } from "@/lib/product/request-context";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";

export const metadata: Metadata = {
  title: LEADING_LABEL,
  description: "Start from the decision in front of you. Nine kinds of decision, each with plain questions and one course to start with.",
};
export const dynamic = "force-dynamic";

export default async function LeadingPage() {
  const scope = await requestedContentScope();
  const published = new Set((await publishedCourses(scope)).map(({ pack }) => pack.course.id));
  return <div className={base.page}><div className={base.content}>
    <header className={base.intro}>
      <p className={base.eyebrow}>{LEADING_LABEL}</p>
      <h1>What are you deciding?</h1>
      <p className={base.lede}>Choose the decision in front of you. Each one opens with plain questions, one course to start with, its one-page job aid, and whom to ask.</p>
      <p>Everything here is public, and anyone can use it. You can start anywhere and skip anything. {LEADING_PRIVACY_SENTENCE} <Link href="/leading/how-this-works">How this works</Link>.</p>
    </header>
    <ul className={styles.doors} aria-label="Decisions">
      {LEADING_DOORS.map(door => <li key={door.slug}><Link className={styles.door} href={`/leading/${door.slug}`}>
        <span className={styles.doorTitle}>{door.title}</span>
        <span>{door.description}</span>
        <span className={styles.doorAction}>{door.questions.length} questions <span aria-hidden="true">→</span></span>
      </Link></li>)}
    </ul>
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
          <span className={styles.doorAction}>{path.courseIds.length} courses, about {pathHours(path)} hours <span aria-hidden="true">→</span></span>
        </Link></li>)}
      </ul>
      <p><Link href="/leading/paths">All suggested paths</Link></p>
    </section>
    <aside className={base.continue}>
      <h2>Keep exploring</h2>
      <p><Link href="/support/right-person">Find the right person or office</Link><Link href="/learn/collections">Collections for all staff</Link><Link href="/one-dsd/leadership">Equity leadership and growth</Link><Link href={TRIBAL_REFERRAL_HREF}>Native American and Tribal-specific guidance</Link></p>
    </aside>
    <details className={base.credit}><summary>About participation and privacy</summary><p>Please do not type anyone&apos;s name or details into Ask. It answers general questions only. {LEADING_PRIVACY_SENTENCE}</p><ParticipationNotice surface="learning" /></details>
  </div></div>;
}
