import type { Metadata } from "next";
import Link from "@/components/app-link";
import { Block, BoundaryNote, Bullets, PathwayEyebrow, PathwayShell, SectionNav } from "@/components/leadership-styles-pathway";
import { LEADERSHIP_PATHWAY_PAGES, LEADERSHIP_PATHWAY_TITLE, RACE_SECTION } from "@/lib/content/leadership-styles-pathway";
import styles from "../leadership-styles.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

const page = LEADERSHIP_PATHWAY_PAGES.race;

export const metadata: Metadata = {
  title: `${page.title} (${LEADERSHIP_PATHWAY_TITLE})`,
  description: "How race shapes the way leadership is recognized, limited, evaluated and experienced, without using race to predict anyone's style or competence.",
};

export default function RaceAndLeadershipPage() {
  return <PathwayShell
    eyebrow={<PathwayEyebrow>race and leadership</PathwayEyebrow>}
    title={`${page.title}, not a leadership stereotype`}
    intro={<p>{RACE_SECTION.intro[0]}</p>}
  >
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this lesson</summary><ResourceDownloads kind="leadership-styles" id="race-and-leadership" noun="lesson" /></details>
    <SectionNav label="Parts" items={RACE_SECTION.parts.map(part => ({ href: `#${part.id}`, title: part.title }))} />
    <p className={styles.prose}>{RACE_SECTION.intro[1]} The examples are fictional.</p>
    {RACE_SECTION.parts.map((part, index) => <Block key={part.id} id={part.id} title={`${String.fromCharCode(65 + index)}. ${part.title}`}>
      <p className={`${styles.prose} font-semibold`}>{part.question}</p>
      <Bullets items={part.checks} />
      <h3>What it can look like</h3>
      <p className={styles.callout}>{part.example}</p>
      <h3>What an institution can do</h3>
      <p className={styles.prose}>{part.institution}</p>
    </Block>)}
    <BoundaryNote />
    <nav className={styles.pager} aria-label="Pathway pages">
      <Link href={LEADERSHIP_PATHWAY_PAGES.scenarios.href}>Previous: {LEADERSHIP_PATHWAY_PAGES.scenarios.title}</Link>
      <Link href={LEADERSHIP_PATHWAY_PAGES.lifecycle.href}>Next: {LEADERSHIP_PATHWAY_PAGES.lifecycle.title}</Link>
    </nav>
  </PathwayShell>;
}
