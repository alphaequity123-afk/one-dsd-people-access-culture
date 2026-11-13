import type { Metadata } from "next";
import Link from "@/components/app-link";
import { EquityAnalysisLadder } from "@/components/equity-analysis-ladder";
import { reviewResources, structuralReviewResource } from "@/lib/program/review-resources";
export const metadata: Metadata = { title: "Review a policy, process, or service change" };
export default function EquityReviewPage() {
  return <div className="pilot-topic">
    <header>
      <h1>Review a policy, process, or service change</h1>
      <p>Understand who is affected, bring missing perspectives into the discussion, and compare practical options before deciding.</p>
    </header>
    <section className="pilot-topic-themes" aria-labelledby="review-options">
      <h2 id="review-options">Choose a review</h2>
      <ul className="pilot-topic-rows">
        {[...reviewResources.slice(0, 2), structuralReviewResource].map(resource => <li key={resource.id}>
          <Link href={resource.href}>{resource.title}<span>{resource.summary}</span></Link>
        </li>)}
      </ul>
    </section>
    <section className="pilot-topic-themes" aria-labelledby="review-tools">
      <h2 id="review-tools">Tools for your review</h2>
      <ul className="pilot-topic-rows">
        <li id="analyze-document"><Link href="/equity-review/analyze">Analyze a document<span>Use one of six methods to identify evidence, inferences, and gaps.</span></Link></li>
        <li id="working-group-plan"><Link href="/equity-review/working-group-plan">Plan a legislatively required working group<span>Turn a statutory charge into a work plan.</span></Link></li>
        <li id="director-toolkit"><Link href="/equity-review/director-toolkit">Equity Director toolkit<span>Find guidance and templates for leading equity work across DHS.</span></Link></li>
      </ul>
    </section>
    <section aria-label="Guidance and support">
      <details className="pilot-supporting"><summary>How much analysis is enough?</summary><div className="pilot-supporting-body"><EquityAnalysisLadder /></div></details>
      <details className="pilot-supporting" id="review-preparation"><summary>Prepare for a review</summary>
        <div className="pilot-supporting-body space-y-3">
          <p>Start with the decision, what can change, and who is affected. Record what people have shared, what remains uncertain, and how alternatives would distribute benefits and burdens. A completed form is a starting point for sound judgment, not proof that a decision is equitable.</p>
          <p>When inviting community perspectives, ask about experience, barriers, priorities, and possible improvements. Staff remain responsible for connecting those contributions with policy and service evidence.</p>
          <p>Keep names, case details, personnel information, and other confidential material out of your notes. Drafts are saved on this device and are not submitted to the consultant. Download a copy when you need to keep or share your work.</p>
        </div>
      </details>
      <details className="pilot-supporting" id="consultant-analysis"><summary>Guidance and related resources</summary>
        <div className="pilot-supporting-body space-y-4">
          <p>Staff anywhere in DHS can use the reviews independently. The Equity and Inclusion Operations Consultant offers guidance and feedback.</p>
          <p>The consultant workspace brings supplied evidence, affected perspectives, alternatives, and practical actions together. Explore a practice situation, examine gaps, and connect the work to ADSA equity goals when relevant.</p>
          <ul className="pilot-topic-rows">
            <li><Link href="/consultant/analysis">Research and policy analysis<span>Consultant sign-in required</span></Link></li>
            <li><Link href="/equity-review/director-toolkit/templates">Printable templates</Link></li>
            <li><Link href="/equity-policy">DHS equity policy</Link></li>
            <li><Link href="/one-dsd/planning">Planning and reviewing progress</Link></li>
            <li><Link href="/support/right-person">Support and guidance</Link></li>
          </ul>
        </div>
      </details>
    </section>
  </div>;
}
