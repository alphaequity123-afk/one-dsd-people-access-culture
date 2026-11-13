import type { Metadata } from "next";
import Link from "@/components/app-link";
import { CollectionItemLink } from "@/components/collection-item-link";
import { ParticipationNotice } from "@/components/participation-notice";
import { LEADING_HREF, LEADING_LABEL, REQUIRED_COURSE_ID, STAFF_COLLECTIONS, TRIBAL_REFERRAL_HREF } from "@/lib/content/collections";
import { publishedCourses } from "@/lib/content/courses/published";
import { requestedContentScope } from "@/lib/product/request-context";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";

export const metadata: Metadata = {
  title: "Collections",
  description: "All the learning, on eight shelves named by subject. Each one opens with where to start.",
};
export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const scope = await requestedContentScope();
  const published = new Set((await publishedCourses(scope)).map(({ pack }) => pack.course.id));
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/learn">Learn</Link></p>
    <header className={base.intro}>
      <p className={base.eyebrow}>Learn</p>
      <h1>Collections</h1>
      <p className={base.lede}>All the learning, on eight shelves named by subject. Each one opens with where to start.</p>
    </header>
    <aside className={styles.requiredNote} aria-labelledby="all-format-collections-title">
      <h2 id="all-format-collections-title">Explore all formats by theme</h2>
      <p>Find related learning, tools, sources, readings and available listening together, then return to the course shelves below whenever you need them.</p>
      <p><Link href="/collections">Explore themes across the program</Link></p>
    </aside>
    <aside className={styles.requiredNote} aria-labelledby="clas-collection-title">
      <h2 id="clas-collection-title">CLAS curriculum collection</h2>
      <p>Nine connected lessons with videos, discussion audio, practice and planning resources. Share one link to the collection.</p>
      <p><Link href="/learn/clas/collection">Open or share the CLAS collection</Link></p>
    </aside>
    <aside className={styles.requiredNote} aria-labelledby="required-course-title">
      <h2 id="required-course-title">One course is required</h2>
      <p><CollectionItemLink id={REQUIRED_COURSE_ID} published={published} /></p>
      <p>The Equity Analysis Toolkit is required of all staff of the Minnesota Department of Human Services, regardless of status. Everything else here is voluntary.</p>
    </aside>
    <ul className={styles.doors} aria-label="Collections">
      {STAFF_COLLECTIONS.map(collection => <li key={collection.id}><Link className={styles.door} href={`/learn/collections/${collection.id}`}>
        <span className={styles.doorTitle}>{collection.title}</span>
        <span>{collection.description}</span>
        <span className={styles.doorAction}>{collection.itemCount} courses</span>
      </Link></li>)}
    </ul>
    <aside className={base.continue}>
      <h2>Keep exploring</h2>
      <p><Link href={LEADING_HREF}>{LEADING_LABEL}</Link><Link href="/courses">All courses</Link><Link href="/learn/paths">Paths</Link><Link href={TRIBAL_REFERRAL_HREF}>Native American and Tribal-specific guidance</Link></p>
    </aside>
    <ParticipationNotice surface="learning" />
  </div></div>;
}
