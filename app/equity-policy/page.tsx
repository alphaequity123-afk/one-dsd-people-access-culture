
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { EQUITY_POLICY } from "@/lib/equity-analysis/policy";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = { title: "DHS Equity Policy", description: "The DHS equity policy, what it asks of staff, and how it is being used across the department." };
export const dynamic = "force-dynamic";


/** F-01: staff do not load stored analysis records on this page. */
export default function EquityPolicyPage() {
  return (
    <>
      <PageIntro tone="business" kicker="People, Access and Culture" title={EQUITY_POLICY.title} lede={EQUITY_POLICY.lede}>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div><dt className="text-muted">Official text</dt><dd className="ml-0"><SourceLink href={EQUITY_POLICY.href} target="_blank" rel="noreferrer">Read the policy (PDF)</SourceLink></dd></div>
          <div><dt className="text-muted">Method</dt><dd className="ml-0"><SourceLink href={EQUITY_POLICY.toolkitHref} target="_blank" rel="noreferrer">Minnesota Equity Analysis Tool</SourceLink></dd></div>
        </dl>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link href="/equity-review" className="btn btn--primary">Review a policy or service change</Link>
          <Link href="/equity-review/structural">Examine barriers in a process</Link>
          <Link href="/learn/equity-toolkit">Toolkit companion</Link>
          <Link href="/learn/equity-toolkit/policy-review">Equity analysis for policy review</Link>
        </div>
        <details className="border-b border-line pb-3 print:hidden mt-4"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="equity-review" id="equity-policy" noun="page" /></details>
      </PageIntro>

      <div className="wrap max-w-6xl space-y-12 py-10">
        <section aria-labelledby="names-title">
          <h2 id="names-title" className="mt-0 text-2xl font-bold">What the policy names</h2>
          <ul className="m-0 mt-4 grid list-none gap-4 p-0 md:grid-cols-3">
            {EQUITY_POLICY.commitments.map((c) => (
              <li key={c.name} className="card"><h3 className="m-0 text-xl font-bold">{c.name}</h3><p className="m-0 mt-2">{c.body}</p></li>
            ))}
          </ul>
          <h2 className="mt-10 text-2xl font-bold">What it asks of staff</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            {EQUITY_POLICY.asks.map((a) => <li key={a}>{a}</li>)}
          </ol>
        </section>

        <section aria-labelledby="loop-title">
          <h2 id="loop-title" className="mt-0 text-2xl font-bold">Learn it, use it, see it</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">The <Link href="/equity-framework">Equity Strategic Framework</Link> connects this policy to everyday decisions and follow-through.</p>
          <ol className="m-0 mt-4 grid list-none gap-4 p-0 md:grid-cols-3">
            <li className="card">
              <p className="kicker m-0">1. Learn</p>
              <h3 className="m-0 mt-1 text-xl font-bold">The toolkit companion</h3>
              <p className="mt-2 text-sm">Build your understanding step by step with a worked example, the official toolkit, and resources for your work.</p>
              <Link href="/learn/equity-toolkit">Open the companion</Link>
            </li>
            <li className="card">
              <p className="kicker m-0">2. Use</p>
              <h3 className="m-0 mt-1 text-xl font-bold">Equity Analysis Toolkit</h3>
              <p className="mt-2 text-sm">Try the eight practice questions with a published example, then download a copy for your own work.</p>
              <Link href="/learn/equity-toolkit">Open the Equity Analysis Toolkit</Link>
            </li>
            <li className="card">
              <p className="kicker m-0">3. See</p>
              <h3 className="m-0 mt-1 text-xl font-bold">Return to the policy</h3>
              <p className="mt-2 text-sm">Use the official policy and Equity Analysis Tool when you need to check the requirements or method.</p>
              <SourceLink href={EQUITY_POLICY.href} target="_blank" rel="noreferrer">Read the policy (PDF)</SourceLink>
            </li>
          </ol>
        </section>

      </div>
    </>
  );
}
