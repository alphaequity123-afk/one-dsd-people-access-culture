import type { Metadata } from "next";
import Link from "next/link";
import { Block, BoundaryNote, Bullets, PathwayEyebrow, PathwayShell, SectionNav, Steps } from "@/components/leadership-styles-pathway";
import {
  LEADERSHIP_PATHWAY_PAGES, LEADERSHIP_PATHWAY_TITLE, LEADERSHIP_SCENARIO_FAMILIES, leadershipStyle, leadershipStyleHref,
} from "@/lib/content/leadership-styles-pathway";
import styles from "../leadership-styles.module.css";

const page = LEADERSHIP_PATHWAY_PAGES.scenarios;

export const metadata: Metadata = {
  title: `${page.title} (${LEADERSHIP_PATHWAY_TITLE})`,
  description: "Fictional leadership scenarios about advancement, accessible meetings, community input, service access, scarce resources, organizational change and repairing a leader's own mistake.",
};

export default function LeadershipScenariosPage() {
  return <PathwayShell
    eyebrow={<PathwayEyebrow>scenarios</PathwayEyebrow>}
    title={page.title}
    intro={<p>Each situation below is fictional, and every line of dialogue is original. For each one, several leadership approaches respond, some in a stronger way and some in a harmful way. Then comes a combined response and questions to discuss.</p>}
  >
    <SectionNav label="Scenarios" items={[...LEADERSHIP_SCENARIO_FAMILIES.map(family => ({ href: `#scenario-${family.id}`, title: family.title })), { href: "#practice-on-your-own", title: "Practice on your own" }]} />
    <p className={styles.prose}>Responses illustrate tendencies and choices. They are not scripts that predict how anyone who uses a style would act, and no response is a judgment about a real person. Check your own response against the <Link className="underline" href={`${LEADERSHIP_PATHWAY_PAGES.capstone.href}#rubric`}>eight-point practice rubric</Link>.</p>
    {LEADERSHIP_SCENARIO_FAMILIES.map(family => <section key={family.id} id={`scenario-${family.id}`} aria-labelledby={`scenario-${family.id}-title`} className={styles.scenario}>
      <p className={styles.family}>{family.family}</p>
      <h2 id={`scenario-${family.id}-title`}>{family.title}</h2>
      <div className={styles.prose}>{family.situation.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <h3>Separate matters the leader must address</h3>
      <Bullets items={family.matters} />
      <h3>What goes through an authorized process</h3>
      <p className={styles.prose}>{family.formal}</p>
      <h3>How different approaches might respond</h3>
      <ul className={styles.responses}>{family.responses.map(response => {
        const lesson = leadershipStyle(response.slug)!;
        return <li key={`${response.slug}-${response.kind}`} className={`${styles.quote} ${response.kind === "stronger" ? styles.stronger : styles.harmful}`}>
          <p className={styles.quoteLabel}>{response.kind === "stronger" ? "A stronger response" : "A harmful response"}: <Link href={leadershipStyleHref(lesson.slug)}>{lesson.name}</Link></p>
          <p>{response.quote}</p>
          <p>{response.analysis}</p>
        </li>;
      })}</ul>
      <h3>A combined response</h3>
      <Steps items={family.combination} />
      <h3>To discuss</h3>
      <Bullets items={family.discuss} />
    </section>)}
    <Block id="practice-on-your-own" title="Practice on your own">
      <p className={styles.prose}>For each situation, choose the response you think is strongest and write one or two sentences on why. Then check your reasoning against the <Link className="underline" href={`${LEADERSHIP_PATHWAY_PAGES.capstone.href}#rubric`}>practice rubric</Link>. The rubric looks at responses, not at you. Write in your own notes. This page does not collect or save anything.</p>
    </Block>
    <BoundaryNote />
    <nav className={styles.pager} aria-label="Pathway pages">
      <Link href={LEADERSHIP_PATHWAY_PAGES.race.href}>Next: {LEADERSHIP_PATHWAY_PAGES.race.title}</Link>
      <Link href={LEADERSHIP_PATHWAY_PAGES.capstone.href}>Go to the capstone</Link>
    </nav>
  </PathwayShell>;
}
