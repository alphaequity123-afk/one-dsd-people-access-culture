import type { Metadata } from "next";
import Link from "next/link";
import presentation from "@/data/program-documents/policy-presentation.json";
import { PolicyPresentationReader } from "@/components/policy-presentation-reader";
import styles from "@/app/one-dsd/evidence/evidence.module.css";

export const metadata: Metadata = { title: "Equity analysis for policy review | One DSD" };

export default function PolicyReviewPresentationPage() {
  return <div className={styles.page}>
    <Link href="/learn/equity-toolkit">← Equity Analysis Toolkit</Link>
    <header className={styles.hero}><h1>Equity analysis for policy review</h1><p>Explore how equity analysis informs policy development, the questions a drafting group considers, and the relationship between analysis and leadership review.</p><div className={styles.actions}><a href="/documents/program-evidence/one-dsd-equity-analysis-policy.pptx" download>Download editable slides (PowerPoint)</a><a href="/documents/program-evidence/one-dsd-equity-analysis-policy.pdf" download>Download slides (PDF)</a></div></header>
    <aside className={styles.note} aria-label="About this presentation"><p>Adapted for One DSD from <cite>{presentation.sourceTitle}</cite>, dated {presentation.sourceDate}. The original training content, diagrams, and speaker notes are retained in the PowerPoint. Contacts and submission steps describe that training’s process; confirm current arrangements with the responsible office before acting.</p><div className={styles.actions}><Link href="/equity-policy">DHS policy source</Link><Link href="/support/right-person">Find the responsible office</Link></div></aside>
    <PolicyPresentationReader slides={presentation.slides} />
    <section className={styles.note}><h2>Bring the analysis into your work</h2><p>Identify the policy decision, the people affected, and which options remain open. Use the toolkit to examine those options and agree who will follow through.</p><div className={styles.actions}><Link href="/learn/equity-toolkit/practice">Practice with the toolkit</Link><Link href="/support/right-person">Find support for your work</Link></div></section>
  </div>;
}
