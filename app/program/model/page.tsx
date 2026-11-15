import Link from "@/components/app-link";
import { WorkExamples } from "@/components/work-examples";
import { ProgramCommitments } from "@/components/program-commitments";
import { ProgramRelationshipMap } from "@/components/multimedia/worked-practice-examples";
import { EquityPractice } from "@/components/equity-practice";
import { requestedContentScope } from "@/lib/product/request-context";
import { logicStages } from "@/lib/program/dsd-logic-model";
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
  return <article className="pilot-topic">
    <header>
      <h1>How the program works</h1>
      <p>This page explains how One DSD, the equity program of the Disability Services Division (DSD), is organized. Start with a question, a decision, or something you want to understand more fully. Then choose the part of the program that can help you now.</p>
    </header>
    <section className="pilot-topic-themes" aria-labelledby="work-start">
      <h2 id="work-start">What are you working on?</h2>
      <ul className="pilot-topic-rows">
        <li><Link href="/learn">Build your understanding<span>Find learning, perspectives, and examples.</span></Link></li>
        <li><Link href="/learn/equity-toolkit">Work through a decision<span>Examine who is affected, compare options, and prepare a recommendation.</span></Link></li>
        <li><Link href="/practice/measurement">Understand what helped<span>Look at what changed for people.</span></Link></li>
      </ul>
    </section>
    <section className="pilot-topic-themes" aria-labelledby="choose-a-start">
      <h2 id="choose-a-start">Explore the five connected areas</h2>
      <ul className="pilot-topic-rows">
        {logicStages.map(stage => <li key={stage.slug}>
          <Link href={`/program/${stage.slug}`}>{stage.label}<span>{stageSummaries[stage.slug]}</span></Link>
        </li>)}
      </ul>
    </section>
    <section aria-label="Examples and program guidance">
      <ExplainerVideo id="how-program-works" />
      <details className="pilot-supporting"><summary>Examples and program guidance</summary>
        <div className="pilot-supporting-body space-y-6">
          <WorkExamples dsd={true} />
          <details className="pilot-supporting">
            <summary>How the five areas support your work</summary>
            <div className="pilot-supporting-body space-y-3">
              <p>These resources support equity in Disability Services Division services, policies, workplace culture, and everyday decisions. Begin with your actual responsibility and the people affected by the work. <Link href="/one-dsd">Explore DSD programs and services</Link> for context.</p>
              <p>A prepared document does not establish approval or implementation. Identify the people affected by the work and the office responsible for the decision.</p>
            </div>
          </details>
          <details className="pilot-supporting">
            <summary>Explore the five areas in more depth</summary>
            <div className="pilot-supporting-body space-y-3">
              <ul className="space-y-4">{logicStages.map(stage => <li key={stage.slug}>
                <h3><Link href={`/program/${stage.slug}`}>{stage.label}</Link></h3>
                <p>{stage.introduction}</p>
              </li>)}</ul>
            </div>
          </details>
          <details className="pilot-supporting">
            <summary>Use related resources together</summary>
            <div className="pilot-supporting-body space-y-3">
              <p>For a policy or service question, begin with the applicable requirements and available evidence. <Link href="/equity-policy">DHS equity policy</Link> provides policy context; the responsible office clarifies which requirements apply to the work.</p>
              <p><Link href="/minnesota-communities">Community knowledge</Link> can help you prepare thoughtful questions and identify perspectives to seek. Use the <Link href="/equity-review">equity review tools</Link> to examine effects, compare alternatives and prepare a recommendation that makes uncertainties and needed decisions visible.</p>
              <p>After the appropriate decision and implementation, <Link href="/practice/measurement">measurement guidance</Link> and <Link href="/program/reflection">practice reflection</Link> help you distinguish what was done from what changed. Return what you learn to the people who contributed and to the next analysis. No tool substitutes for their participation or for authorized review.</p>
            </div>
          </details>
          <section className="space-y-3" aria-labelledby="operational-spine">
            <h3 id="operational-spine">How this program operates</h3>
            <p>The <Link href="/program-foundation">Program charter</Link> connects the purpose, operating principles, consultant responsibilities, authority boundaries and evidence needed to carry work forward. It guides the whole program, including equity work beyond the ADSA implementation plan.</p>
            <p>Use the <Link href="/practice/requirements">requirements and review evidence workspace</Link> to identify applicable requirements, connect them with sources and prepare evidence for the person responsible. A prepared document does not establish approval or implementation.</p>
            <p>Where an ADSA action step applies, the <Link href="/program/implementation">six-goal implementation map</Link> connects it with practical work products, participation, tools and questions about results. Divisions can adapt their approach to their responsibilities; these twenty-eight steps do not limit the program’s broader equity work.</p>
          </section>
          <section className="space-y-3">
            <h3>Keep learning from experience</h3>
            <p>Completing a course or preparing a document is a starting point. Notice how you use it, whose experience informs your decisions, and what becomes different in practice. What you learn may lead to a new question or a different approach.</p>
            <p>Explore these areas in any order. Choose what is useful now and return as your work develops.</p>
          </section>
        </div>
      </details>
      <details className="pilot-supporting"><summary>Program commitments and equity practice</summary>
        <div className="pilot-supporting-body space-y-6">
          <ProgramRelationshipMap />
          <EquityPractice scope={scope} />
          <ProgramCommitments />
        </div>
      </details>
    </section>
  </article>;
}
