import type { Metadata } from "next";
import Link from "next/link";
import { LEADING_LABEL, LEADING_PATHS, REQUIRED_COURSE_LABEL, pathHours } from "@/lib/content/collections";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";

export const metadata: Metadata = {
  title: `Suggested paths | ${LEADING_LABEL}`,
  description: "Four optional paths for leaders, supervisors, managers, and directors. Nobody is enrolled, and progress stays in your browser.",
};

export default function LeadingPathsPage() {
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/leading">{LEADING_LABEL}</Link></p>
    <header className={base.intro}>
      <p className={base.eyebrow}>Optional</p>
      <h1>Suggested paths</h1>
      <p className={base.lede}>Four suggested orders through the material. All of them are optional.</p>
      <p>Nobody is enrolled, and you can start anywhere or skip anything. If you keep your place, it stays in your browser and nobody else can see it. The one exception to voluntary use is the Equity Analysis Toolkit, marked &ldquo;{REQUIRED_COURSE_LABEL}&rdquo;, which appears on every path for that reason.</p>
    </header>
    <ul className={styles.doors}>
      {LEADING_PATHS.map(path => <li key={path.slug}><Link className={styles.door} href={`/leading/paths/${path.slug}`}>
        <span className={styles.doorTitle}>{path.title}</span>
        <span>{path.description}</span>
        <span className={styles.doorAction}>{path.courseIds.length} courses, about {pathHours(path)} hours</span>
      </Link></li>)}
    </ul>
    <p className={styles.plain}>Times come from each course&apos;s own stated length and have not been tested with readers. They count courses only, not optional practice or live sessions.</p>
  </div></div>;
}
