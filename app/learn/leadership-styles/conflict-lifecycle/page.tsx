import type { Metadata } from "next";
import Link from "next/link";
import { Block, BoundaryNote, PathwayEyebrow, PathwayShell } from "@/components/leadership-styles-pathway";
import { COMMON_SCENARIO, LEADERSHIP_PATHWAY_PAGES, LEADERSHIP_PATHWAY_TITLE, LIFECYCLE, leadershipStyle, leadershipStyleHref } from "@/lib/content/leadership-styles-pathway";
import styles from "../leadership-styles.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

const page = LEADERSHIP_PATHWAY_PAGES.lifecycle;

export const metadata: Metadata = {
  title: `${page.title} (${LEADERSHIP_PATHWAY_TITLE})`,
  description: "A worked example that combines leadership approaches in sequence, from the first response to lasting change.",
};

export default function ConflictLifecyclePage() {
  return <PathwayShell
    eyebrow={<PathwayEyebrow>conflict lifecycle</PathwayEyebrow>}
    title={page.title}
    intro={<p>{LIFECYCLE.intro}</p>}
  >
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this lesson</summary><ResourceDownloads kind="leadership-styles" id="conflict-lifecycle" noun="lesson" /></details>
    <Block id="lifecycle-table" title="The eight stages">
      <div className={styles.tableWrap}><table className={styles.table}>
        <caption>Each stage needs a different behavior. The useful contribution names approaches that help at that stage.</caption>
        <thead><tr><th scope="col">Stage</th><th scope="col">Needed behavior</th><th scope="col">Useful contribution</th></tr></thead>
        <tbody>{LIFECYCLE.stages.map(stage => <tr key={stage.id}><th scope="row"><a href={`#stage-${stage.id}`}>{stage.stage}</a></th><td>{stage.behavior}</td><td>{stage.contribution}</td></tr>)}</tbody>
      </table></div>
    </Block>
    <Block id="worked-example" title={`Worked example: “${COMMON_SCENARIO.title}”`}>
      <details className={styles.callout}>
        <summary className="cursor-pointer font-semibold">Read the fictional scenario</summary>
        {COMMON_SCENARIO.situation.map(paragraph => <p key={paragraph} className="mt-3">{paragraph}</p>)}
      </details>
      <ol className="space-y-6">{LIFECYCLE.stages.map((stage, index) => <li key={stage.id} id={`stage-${stage.id}`} className={styles.scenario}>
        <p className={styles.family}>Stage {index + 1}</p>
        <h3 className="mt-0">{stage.stage}</h3>
        <p className={styles.prose}><strong>Needed behavior:</strong> {stage.behavior}</p>
        <p className={styles.prose}><strong>What the supervisor does:</strong> {stage.example}</p>
        <p className={styles.prose}><strong>Approaches that help:</strong> {stage.styles.map((slug, n) => {
          const lesson = leadershipStyle(slug)!;
          return <span key={slug}>{n > 0 ? ", " : ""}<Link className="underline" href={leadershipStyleHref(slug)}>{lesson.name}</Link></span>;
        })}</p>
      </li>)}</ol>
      <p className={`${styles.prose} mt-6`}>Notice what stays the same at every stage: the employee is treated with dignity, access is protected, the process is fair, and someone is accountable for each step.</p>
    </Block>
    <BoundaryNote />
    <nav className={styles.pager} aria-label="Pathway pages">
      <Link href={LEADERSHIP_PATHWAY_PAGES.race.href}>Previous: {LEADERSHIP_PATHWAY_PAGES.race.title}</Link>
      <Link href={LEADERSHIP_PATHWAY_PAGES.capstone.href}>Next: {LEADERSHIP_PATHWAY_PAGES.capstone.title}</Link>
    </nav>
  </PathwayShell>;
}
