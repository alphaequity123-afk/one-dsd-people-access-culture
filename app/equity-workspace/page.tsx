import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { analysisRoleFromCookies, ROLE_LABELS } from "@/lib/auth/consultant-or-team";

export const metadata: Metadata = { title: "Equity workspace" };
export const dynamic = "force-dynamic";

export default async function EquityWorkspaceHome() {
  const role = await analysisRoleFromCookies();
  if (!role) return null;
  return (
    <>
      <PageIntro
        kicker={`Decisions recorded as the ${ROLE_LABELS[role]}`}
        title="Equity workspace"
        lede="Two connected tools for the Equity and Inclusion Operations Consultant and the One DSD Team: one analyzes any document for equity, the other turns a policy analysis into approved, formal changes."
        tone="business"
      />
      <div className="wrap py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <section className="card" aria-labelledby="toolkit-card">
            <h2 id="toolkit-card" className="text-xl font-bold">Equity Analysis Toolkit</h2>
            <p>It works for any document: a plan, a proposal, a program change, a report or a set of meeting notes.</p>
            <ol className="list-decimal pl-6">
              <li>Attach a document or paste its text.</li>
              <li>The toolkit sets up the analysis and lists the information still needed.</li>
              <li>It runs the analysis and produces the report, the worksheet, the action plan, the leadership brief and the information request.</li>
            </ol>
            <p><Link href="/equity-workspace/toolkit" className="btn btn--primary">Open the Equity Analysis Toolkit</Link></p>
          </section>
          <section className="card" aria-labelledby="analyzer-card">
            <h2 id="analyzer-card" className="text-xl font-bold">Equity Policy Analyzer</h2>
            <p>Choose it when the subject is a policy and you want to change it.</p>
            <ol className="list-decimal pl-6">
              <li>Choose a policy from the catalog of policies that shape disability services, or attach one that is not in the catalog.</li>
              <li>Analyze it with equity principles, with every finding tied to quoted evidence.</li>
              <li>Draft named changes to protocol, process, procedure and wording.</li>
              <li>Approve, reject or defer each change. Decisions are recorded by role.</li>
              <li>Formalize the approved changes and download them as Word or PDF.</li>
            </ol>
            <p><Link href="/equity-workspace/policy-analyzer" className="btn btn--primary">Open the Equity Policy Analyzer</Link></p>
          </section>
        </div>
        <section className="panel mt-6" aria-labelledby="how-connected">
          <h2 id="how-connected" className="text-lg font-bold">How the two connect</h2>
          <p className="m-0">An analysis in the Equity Analysis Toolkit can be sent to the Equity Policy Analyzer, so the policy changes start from the evidence you already gathered. Policies in the <Link href="/community-outreach/policies">catalog of policies that shape disability services</Link> also offer a link to analyze them here.</p>
        </section>
      </div>
    </>
  );
}
