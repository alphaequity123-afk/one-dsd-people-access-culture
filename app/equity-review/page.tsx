import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { EquityAnalysisLadder } from "@/components/equity-analysis-ladder";
import { reviewResources, structuralReviewResource } from "@/lib/program/review-resources";
export const metadata: Metadata = { title: "Review a policy, process, or service change" };
export default function EquityReviewPage() {
  return <>
    <PageIntro tone="business" kicker="Equity in practice" title="Review a policy, process, or service change" lede="Understand who is affected, bring missing perspectives into the discussion, and compare practical options before deciding.">
      <p className="mt-4 max-w-3xl">Staff anywhere in DHS can use these resources independently. The Equity and Inclusion Operations Consultant leads the program and offers guidance, knowledge, and feedback when helpful.</p>
    </PageIntro>
    <div className="wrap max-w-6xl space-y-10 py-10">
      <EquityAnalysisLadder />
      <section aria-labelledby="review-options"><h2 id="review-options" className="text-2xl font-bold">Choose the review that fits your work</h2><div className="mt-5 grid gap-6 md:grid-cols-2">{[...reviewResources.slice(0, 2), structuralReviewResource].map(resource => <article key={resource.id} className="card"><h3 className="text-xl font-bold"><Link href={resource.href}>{resource.title}</Link></h3><p className="mt-3">{resource.summary}</p><p className="mt-5"><Link href={resource.href}>Begin or continue a review →</Link></p></article>)}</div></section>
      <section aria-labelledby="review-preparation" className="card"><h2 id="review-preparation" className="text-2xl font-bold">Bring evidence and perspectives together</h2><p className="mt-3">Start with the decision, what can change, and who is affected. Record what people have shared, what remains uncertain, and how alternatives would distribute benefits and burdens. A completed form is a starting point for sound judgment, not proof that a decision is equitable.</p><p className="mt-3">When inviting community perspectives, ask about experience, barriers, priorities, and possible improvements. Staff remain responsible for connecting those contributions with policy and service evidence.</p><p className="mt-3">Keep names, case details, personnel information, and other confidential material out of your notes. Drafts are saved on this device and are not submitted to the consultant. Download a copy when you need to keep or share your work.</p></section>
      <section aria-labelledby="consultant-analysis" className="card"><h2 id="consultant-analysis" className="text-2xl font-bold">Research and policy analysis</h2><p className="mt-3">The consultant workspace brings supplied evidence, affected perspectives, alternatives, and practical actions together. Explore a practice situation, examine gaps, and connect the work to ADSA equity goals when relevant.</p><p className="mt-4"><Link href="/consultant/analysis">Open the consultant workspace →</Link></p><p className="mt-2 text-sm">Consultant sign-in is required. Staff can use the reviews above independently.</p></section>
      <nav aria-label="Related resources" className="flex flex-wrap gap-6"><Link href="/equity-policy">DHS equity policy</Link><Link href="/one-dsd/planning">Planning and reviewing progress</Link><Link href="/support/right-person">Support and guidance</Link></nav>
    </div>
  </>;
}
