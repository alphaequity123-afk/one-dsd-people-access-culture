
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import type { ReactNode } from "react";
import {
  LEADERSHIP_PATHWAY_HREF, LEADERSHIP_PATHWAY_PAGES, LEADERSHIP_PATHWAY_TITLE, LEADERSHIP_STYLE_LESSONS, PATHWAY_BOUNDARY,
  leadershipStyleHref, type ConduciveGroup,
} from "@/lib/content/leadership-styles-pathway";
import family from "@/app/learn/learning-family.module.css";
import styles from "@/app/learn/leadership-styles/leadership-styles.module.css";

/**
 * Shared layout pieces for the leadership-styles pathway. Server components only:
 * nothing here collects responses, tracks progress or scores people.
 */
export function PathwayShell({ eyebrow, title, intro, links, children }: { eyebrow: ReactNode; title: string; intro: ReactNode; links?: ReactNode; children: ReactNode }) {
  return <div className={family.page}>
    <header className={family.hero}><div className={family.heroInner}>
      <p className={family.eyebrow}>{eyebrow}</p>
      <h1>{title}</h1>
      <div className={family.intro}>{intro}</div>
      {links && <div className={family.heroLinks}>{links}</div>}
    </div></header>
    <div className={family.content}>{children}</div>
  </div>;
}

export function PathwayEyebrow({ children }: { children?: ReactNode }) {
  return <><Link href={LEADERSHIP_PATHWAY_HREF}>{LEADERSHIP_PATHWAY_TITLE}</Link>{children ? <>: {children}</> : null}</>;
}

export function SectionNav({ label, items }: { label: string; items: readonly { href: string; title: string }[] }) {
  return <nav aria-label={label} className={family.sectionNav}>{items.map(item => <SourceLink key={item.href} href={item.href}>{item.title}</SourceLink>)}</nav>;
}

export function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-title`} className={styles.block}>
    <h2 id={`${id}-title`}>{title}</h2>
    {children}
  </section>;
}

export function Bullets({ items }: { items: readonly string[] }) {
  return <ul className={styles.list}>{items.map(item => <li key={item}>{item}</li>)}</ul>;
}

export function Steps({ items }: { items: readonly string[] }) {
  return <ol className={styles.ordered}>{items.map(item => <li key={item}>{item}</li>)}</ol>;
}

export function QuoteCard({ kind, label, quote, why }: { kind: "stronger" | "harmful"; label: string; quote: string; why: string }) {
  return <div className={`${styles.quote} ${kind === "stronger" ? styles.stronger : styles.harmful}`}>
    <p className={styles.quoteLabel}>{label}</p>
    <p>{quote}</p>
    <p>{why}</p>
  </div>;
}

/** Cards for every style lesson, optionally limited to one curriculum group. */
export function StyleCards({ group }: { group?: ConduciveGroup }) {
  const lessons = LEADERSHIP_STYLE_LESSONS.filter(lesson => !group || lesson.group === group);
  return <ul className={styles.cards}>{lessons.map(lesson => <li key={lesson.slug}>
    <Link className={styles.card} href={leadershipStyleHref(lesson.slug)}>
      <span className={styles.cardTitle}>{lesson.name}</span>
      <span>{lesson.tagline}</span>
      <span className={styles.cardMeta}>{lesson.assessment.label}</span>
    </Link>
  </li>)}</ul>;
}

export function PathwayPages() {
  const pages = [
    { ...LEADERSHIP_PATHWAY_PAGES.scenarios, body: "Seven fictional situations, from accessible meetings to a leader's own mistake, with several styles responding to each." },
    { ...LEADERSHIP_PATHWAY_PAGES.race, body: "How race shapes the way leadership is recognized, limited and evaluated, without stereotyping anyone." },
    { ...LEADERSHIP_PATHWAY_PAGES.lifecycle, body: "A worked example that combines approaches from the first response to lasting change." },
    { ...LEADERSHIP_PATHWAY_PAGES.capstone, body: "Rewrite a weak response and check it against the eight-point practice rubric." },
  ];
  return <ul className={styles.cards}>{pages.map(page => <li key={page.href}>
    <Link className={styles.card} href={page.href}><span className={styles.cardTitle}>{page.title}</span><span>{page.body}</span></Link>
  </li>)}</ul>;
}

export function BoundaryNote() {
  return <p className={styles.callout}>{PATHWAY_BOUNDARY}</p>;
}
