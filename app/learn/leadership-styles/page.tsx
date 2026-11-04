import type { Metadata } from "next";
import Link from "next/link";
import { Block, BoundaryNote, Bullets, PathwayPages, PathwayShell, SectionNav, StyleCards } from "@/components/leadership-styles-pathway";
import {
  COMMON_SCENARIO, CONDUCIVE_GROUPS, CONDUCIVE_SUMMARY, FOUNDATIONS, LEADERSHIP_PATHWAY_PAGES, LEADERSHIP_PATHWAY_TITLE,
  LEADERSHIP_STYLE_LESSONS, PATHWAY_AUTHORITY, PATHWAY_INTRO, PATHWAY_SOURCES, leadershipStyleHref,
} from "@/lib/content/leadership-styles-pathway";
import styles from "./leadership-styles.module.css";

export const metadata: Metadata = {
  title: LEADERSHIP_PATHWAY_TITLE,
  description: "A deep learning pathway on sixteen leadership approaches: how each one handles conflict, how it can promote or undermine equity and inclusion, and how to combine them.",
};

export default function LeadershipStylesPathwayPage() {
  return <PathwayShell
    eyebrow={<><Link href="/learn">Learn</Link>: leadership development</>}
    title={LEADERSHIP_PATHWAY_TITLE}
    intro={<p>{PATHWAY_INTRO[0]}</p>}
    links={<><a href="#common-scenario">Start with the common scenario</a><Link href={LEADERSHIP_PATHWAY_PAGES.capstone.href}>Go to the capstone</Link><Link href="/leading">Lead equity in everyday work</Link></>}
  >
    <SectionNav label="Pathway sections" items={[
      { href: "#about", title: "About this pathway" },
      { href: "#foundations", title: "Foundations" },
      { href: "#common-scenario", title: "The common scenario" },
      { href: "#styles", title: "Sixteen approaches" },
      { href: "#conducive", title: "Which approaches support equity" },
      { href: "#go-deeper", title: "Go deeper" },
      { href: "#sources", title: "Sources" },
    ]} />

    <Block id="about" title="About this pathway">
      <div className={styles.prose}>{PATHWAY_INTRO.slice(1).map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <p className={styles.prose}>Each lesson gives a working definition and its limits, a stronger and a harmful response to the same scenario, a second conflict example, an analysis of how the approach can promote or undermine equity and inclusion, including racial equity, strengths, weaknesses, opportunities and threats, when to use it and when not to, approaches that complement it, a practice exercise and review questions.</p>
      <h3>Keep three kinds of guidance distinct</h3>
      <dl className={styles.prose}>{PATHWAY_AUTHORITY.map(item => <div key={item.label} className="mt-3"><dt className="font-semibold">{item.label}</dt><dd>{item.body}</dd></div>)}</dl>
      <BoundaryNote />
    </Block>

    <Block id="foundations" title="Foundations: what leadership development must distinguish">
      <h3>{FOUNDATIONS.styleVsConflict.title}</h3>
      <div className={styles.prose}>{FOUNDATIONS.styleVsConflict.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <p className={styles.prose}>So each lesson asks two questions:</p>
      <ol className={styles.ordered}>{FOUNDATIONS.styleVsConflict.questions.map(question => <li key={question}>{question}</li>)}</ol>
      <h3 id="situations">{FOUNDATIONS.situations.title}</h3>
      <p className={styles.prose}>{FOUNDATIONS.situations.intro}</p>
      <div className={styles.tableWrap}><table className={styles.table}>
        <caption>Kinds of situations and the leader&apos;s main responsibility in each</caption>
        <thead><tr><th scope="col">Situation</th><th scope="col">Main leadership responsibility</th></tr></thead>
        <tbody>{FOUNDATIONS.situations.rows.map(row => <tr key={row.situation}><th scope="row">{row.situation}</th><td>{row.responsibility}</td></tr>)}</tbody>
      </table></div>
      <p className={styles.prose}>{FOUNDATIONS.situations.closing}</p>
      <h3 id="equity-and-inclusion">{FOUNDATIONS.equityInclusion.title}</h3>
      <div className={styles.prose}>{FOUNDATIONS.equityInclusion.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
    </Block>

    <Block id="common-scenario" title={`The common scenario: “${COMMON_SCENARIO.title}”`}>
      <p className={styles.prose}>{COMMON_SCENARIO.intro} This situation is fictional.</p>
      <div className={styles.callout}>{COMMON_SCENARIO.situation.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <h3>What the leader must address</h3>
      <Bullets items={COMMON_SCENARIO.matters} />
      <p className={`${styles.prose} mt-4`}>{COMMON_SCENARIO.note}</p>
      <p className="mt-4"><Link className="font-semibold underline" href={leadershipStyleHref(LEADERSHIP_STYLE_LESSONS[0].slug)}>See how the first approach responds</Link></p>
    </Block>

    <Block id="styles" title="Sixteen leadership approaches">
      <p className={styles.prose}>The approaches are grouped by a curriculum judgment about equity. The groups describe patterns of behavior, not people. Anyone can use several approaches, and the same person may lead differently in different situations.</p>
      {CONDUCIVE_GROUPS.map(group => <div key={group.id} id={`group-${group.id}`}>
        <h3>{group.title}</h3>
        <p className={styles.prose}>{group.body}</p>
        <StyleCards group={group.id} />
      </div>)}
    </Block>

    <Block id="conducive" title="Which approaches are most conducive to equity?">
      <div className={styles.prose}>{CONDUCIVE_SUMMARY.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <ul className={styles.list}>{CONDUCIVE_GROUPS.map(group => <li key={group.id}><strong>{group.title}:</strong> {group.body}</li>)}</ul>
      <p className={`${styles.prose} mt-4`}>See how these combine in practice in <Link className="underline" href={LEADERSHIP_PATHWAY_PAGES.lifecycle.href}>{LEADERSHIP_PATHWAY_PAGES.lifecycle.title.toLowerCase()}</Link>.</p>
    </Block>

    <Block id="go-deeper" title="Go deeper">
      <PathwayPages />
      <p className={`${styles.prose} mt-6`}>Related learning: <Link className="underline" href="/learn/cultural-intelligence#leaders">leadership approaches in the Cultural Intelligence collection</Link>, the <Link className="underline" href="/learn/equity-toolkit">Equity Analysis Toolkit</Link>, and <Link className="underline" href="/support/right-person">finding the right person or area for a decision</Link>.</p>
    </Block>

    <details id="sources" className={`${styles.prose} rounded-xl border border-line p-5`}>
      <summary className="cursor-pointer font-semibold">Sources for this pathway</summary>
      <ul className="mt-3 space-y-2">{PATHWAY_SOURCES.map(source => <li key={source.href}><a className="underline" href={source.href} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
      <p className="mt-3">Research from one setting does not prove an outcome in another. Use these sources for reflection and discussion alongside applicable policies and responsibilities.</p>
    </details>
  </PathwayShell>;
}
