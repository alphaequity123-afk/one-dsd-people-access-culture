import type { Metadata } from "next";
import Link from "next/link";
import { Block, BoundaryNote, PathwayEyebrow, PathwayShell, SectionNav, Steps } from "@/components/leadership-styles-pathway";
import { CAPSTONE, LEADERSHIP_PATHWAY_HREF, LEADERSHIP_PATHWAY_PAGES, LEADERSHIP_PATHWAY_TITLE, RUBRIC } from "@/lib/content/leadership-styles-pathway";
import styles from "../leadership-styles.module.css";

const page = LEADERSHIP_PATHWAY_PAGES.capstone;

export const metadata: Metadata = {
  title: `${page.title} (${LEADERSHIP_PATHWAY_TITLE})`,
  description: "Rewrite a weak leadership response and check it against an eight-point rubric. Responses are reviewed, never people.",
};

export default function LeadershipCapstonePage() {
  return <PathwayShell
    eyebrow={<PathwayEyebrow>capstone</PathwayEyebrow>}
    title={page.title}
    intro={<p>Bring the pathway together by rewriting one weak response into a strong one. Then check your rewrite against the practice rubric.</p>}
  >
    <SectionNav label="Capstone sections" items={[
      { href: "#capstone", title: "The statement" },
      { href: "#worked-analysis", title: "Worked analysis" },
      { href: "#stronger-response", title: "A stronger response" },
      { href: "#rubric", title: "Practice rubric" },
      { href: "#more-practice", title: "More practice" },
    ]} />
    <Block id="capstone" title="The statement to rewrite">
      <p className={styles.prose}>A supervisor says this to the employee in the common scenario, <Link className="underline" href={`${LEADERSHIP_PATHWAY_HREF}#common-scenario`}>“Who gets the visible work?”</Link></p>
      <p className={styles.callout}><strong>{CAPSTONE.statement}</strong></p>
      <h3>Your tasks</h3>
      <Steps items={CAPSTONE.tasks} />
      <p className={`${styles.prose} mt-4`}>Write your answers in your own notes. This page does not collect or save what you write.</p>
    </Block>
    <Block id="worked-analysis" title="Worked analysis">
      <p className={styles.prose}>Try the tasks first. Then compare your thinking with this analysis.</p>
      <details className="mt-4 rounded-xl border border-line p-5">
        <summary className="cursor-pointer font-semibold">Show the worked analysis</summary>
        <dl className={styles.prose}>{CAPSTONE.analysis.map(item => <div key={item.title} className="mt-4"><dt className="font-semibold">{item.title}</dt><dd>{item.body}</dd></div>)}</dl>
      </details>
    </Block>
    <Block id="stronger-response" title="A stronger response">
      <p className={styles.callout}>{CAPSTONE.stronger}</p>
      <p className={styles.prose}>It uses ethical behavior (a fair response and protected reporting), inclusive behavior (naming both concerns and access), directive behavior (the supervisor commits to act), and participative behavior (clarifying requirements and support together). {CAPSTONE.outcome}</p>
    </Block>
    <Block id="rubric" title="The eight-point practice rubric">
      <p className={styles.prose}>{RUBRIC.intro}</p>
      <div className={styles.tableWrap}><table className={styles.table}>
        <caption>Does the response do each of these things?</caption>
        <thead><tr><th scope="col">The response</th><th scope="col">Ask</th><th scope="col">Stronger sign</th><th scope="col">Weaker sign</th></tr></thead>
        <tbody>{RUBRIC.criteria.map((criterion, index) => <tr key={criterion.id} id={`rubric-${criterion.id}`}><th scope="row">{index + 1}. {criterion.title}</th><td>{criterion.question}</td><td>{criterion.strong}</td><td>{criterion.weak}</td></tr>)}</tbody>
      </table></div>
      <p className={`${styles.callout} mt-6`}>{RUBRIC.limits}</p>
    </Block>
    <Block id="more-practice" title="More practice">
      <p className={styles.prose}>Work through the seven tasks one at a time. Then go back over your rewrite with each rubric question in turn. Use the rubric to look at your written response, not at yourself or anyone else.</p>
      <p className={`${styles.prose} mt-4`}>For more practice, try the <Link className="underline" href={`${LEADERSHIP_PATHWAY_PAGES.scenarios.href}#practice-on-your-own`}>seven scenarios</Link> and compare the responses each approach gives.</p>
    </Block>
    <BoundaryNote />
    <nav className={styles.pager} aria-label="Pathway pages">
      <Link href={LEADERSHIP_PATHWAY_PAGES.lifecycle.href}>Previous: {LEADERSHIP_PATHWAY_PAGES.lifecycle.title}</Link>
      <Link href={LEADERSHIP_PATHWAY_HREF}>Pathway overview</Link>
    </nav>
  </PathwayShell>;
}
