import Link from "next/link";
import { WorkExamples } from "@/components/work-examples";
import { ProgramCommitments } from "@/components/program-commitments";
import { ProgramRelationshipMap } from "@/components/multimedia/worked-practice-examples";
import { EquityPractice } from "@/components/equity-practice";
import { requestedContentScope } from "@/lib/product/request-context";
import { logicStages } from "@/lib/program/dsd-logic-model";
import styles from "./model.module.css";
import { ExplainerVideo } from "@/components/explainer-video";

export const metadata = { title: "How the program works" };

const stageSummaries: Record<string, string> = {
  "what-informs": "Bring together policy, evidence, staff knowledge and community perspectives.",
  practice: "Choose an activity that fits a real question or decision.",
  resources: "Find a tool or prepare a useful piece of work.",
  progress: "Consider what changed and how people experienced it.",
  impact: "Learn what helps equitable practices last.",
};

export default async function ProgramModel() {
  const scope = await requestedContentScope();
  return <article className={`dsd-shell ${styles.page}`}>
    <header className={styles.heading}>
      <p className="dsd-eyebrow">Learning, reflection, and everyday practice</p>
      <h1>How the program works</h1>
      <p className={styles.lede}>Start with a question, a decision, or something you want to understand more fully. Choose the part of the program that can help you now.</p>
    </header>
    <ExplainerVideo id="how-program-works" />
    <section className={styles.entry} aria-labelledby="work-start">
      <h2 id="work-start">What are you working on?</h2>
      <nav aria-label="Choose a starting point" className={styles.intents}>
        <div>
          <p className={styles.intentLabel}>Understand</p>
          <h3>Build your understanding</h3>
          <p>Explore the knowledge, perspectives and examples that can inform your work.</p>
          <Link href="/learn">Find learning and examples <span aria-hidden="true">→</span></Link>
        </div>
        <div>
          <p className={styles.intentLabel}>Apply</p>
          <h3>Work through a decision</h3>
          <p>Examine who is affected, compare options and prepare a recommendation.</p>
          <Link href="/learn/equity-toolkit">Use the Equity Analysis Toolkit <span aria-hidden="true">→</span></Link>
        </div>
        <div>
          <p className={styles.intentLabel}>Learn from change</p>
          <h3>Understand what helped</h3>
          <p>Look beyond what was completed to what changed for people.</p>
          <Link href="/practice/measurement">Explore measurement guidance <span aria-hidden="true">→</span></Link>
        </div>
      </nav>
    </section>
    <WorkExamples dsd={true} />
    <section className={styles.overview} aria-labelledby="choose-a-start">
      <div className={styles.sectionHeading}>
        <h2 id="choose-a-start">Explore the five connected areas</h2>
        <p>These five areas connect with one another. Explore them in any order and return as your work develops.</p>
      </div>
      <ul className={styles.stages}>
        {logicStages.map(stage => <li key={stage.slug}>
          <h3><Link href={`/program/${stage.slug}`}>{stage.label}</Link></h3>
          <p className={styles.question}>{stage.question}</p>
          <p>{stageSummaries[stage.slug]}</p>
        </li>)}
      </ul>
      <p className={styles.boundary}>A prepared document does not establish approval or implementation. Identify the people affected by the work and the office responsible for the decision.</p>
    </section>
    <section className={styles.context} aria-labelledby="connections-heading">
      <h2 id="connections-heading">See how the parts connect.</h2>
      <p>Explore the purpose of each area, or open the guidance that connects the program to your responsibilities.</p>
      <div className={styles.detailColumns}>
        <div>
          <details className={styles.detail}>
            <summary>Start with your work</summary>
            <p>Start with a question, a decision, or something you want to understand more fully. Explore the knowledge and experience available, choose a useful tool, and consider what you might try. Return to what happened so that each experience can inform your next step.</p>
            <p>These connected resources support equity in Disability Services Division services, policies, workplace culture and everyday decisions. Begin with your actual responsibility and the people affected by the work. <Link href="/one-dsd">Explore DSD programs and services</Link> for context.</p>
          </details>
          <details className={styles.detail}>
            <summary>Explore the five areas in more depth</summary>
            <ul className={styles.stageDetails}>{logicStages.map(stage => <li key={stage.slug}>
              <h3><Link href={`/program/${stage.slug}`}>{stage.label} <span aria-hidden="true">→</span></Link></h3>
              <p>{stage.introduction}</p>
            </li>)}</ul>
          </details>
          <details className={styles.detail}>
            <summary>Use related resources together</summary>
            <p>For a policy or service question, begin with the applicable requirements and available evidence. <Link href="/equity-policy">DHS equity policy</Link> provides policy context; the responsible office clarifies which requirements apply to the work.</p>
            <p><Link href="/minnesota-communities">Community knowledge</Link> can help you prepare thoughtful questions and identify perspectives to seek. Use the <Link href="/equity-review">equity review tools</Link> to examine effects, compare alternatives and prepare a recommendation that makes uncertainties and needed decisions visible.</p>
            <p>After the appropriate decision and implementation, <Link href="/practice/measurement">measurement guidance</Link> and <Link href="/program/reflection">practice reflection</Link> help you distinguish what was done from what changed. Return what you learn to the people who contributed and to the next analysis. No tool substitutes for their participation or for authorized review.</p>
          </details>
        </div>
        <div>
          <section className={styles.operating} aria-labelledby="operational-spine">
            <h3 id="operational-spine">How this program operates</h3>
            <p>The <Link href="/program-foundation">Program charter</Link> connects the purpose, operating principles, consultant responsibilities, authority boundaries and evidence needed to carry work forward. It guides the whole program, including equity work beyond the ADSA implementation plan.</p>
            <p>Use the <Link href="/practice/requirements">requirements and review evidence workspace</Link> to identify applicable requirements, connect them with sources and prepare evidence for the person responsible. A prepared document does not establish approval or implementation.</p>
            <p>Where an ADSA action step applies, the <Link href="/program/implementation">six-goal implementation map</Link> connects it with practical work products, participation, tools and questions about results. Divisions can adapt their approach to their responsibilities; these twenty-eight steps do not limit the program’s broader equity work.</p>
          </section>
          <section className={styles.reflection}>
            <h3>Keep learning from experience</h3>
            <p>Completing a course or preparing a document is a starting point. Notice how you use it, whose experience informs your decisions, and what becomes different in practice. What you learn may lead to a new question or a different approach.</p>
            <p>Explore these areas in any order. Choose what is useful now and return as your work develops.</p>
          </section>
        </div>
      </div>
    </section>
    {/* Moved from About: how the parts relate, the three pillars, and the program commitments. */}
    <ProgramRelationshipMap />
    <EquityPractice scope={scope} />
    <ProgramCommitments />
  </article>;
}
