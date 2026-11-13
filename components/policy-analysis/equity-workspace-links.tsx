import Link from "@/components/app-link";

/** A card that points signed-in consultant and One DSD Team visitors to the Equity workspace tools. */
export function EquityWorkspaceLinks({ intro }: { intro?: string }) {
  return (
    <section className="card mt-6" aria-labelledby="equity-workspace-links-title">
      <h2 id="equity-workspace-links-title" className="text-xl font-bold">Equity workspace</h2>
      <p>{intro ?? "Analyze documents and policies for equity, decide on recommended changes, and download the finished documents."}</p>
      <ul className="list-disc pl-6 m-0">
        <li><Link href="/equity-workspace">Equity workspace home</Link></li>
        <li><Link href="/equity-workspace/toolkit">Equity Analysis Toolkit</Link>: attach a document and get the report, worksheet, action plan, leadership brief and information request.</li>
        <li><Link href="/equity-workspace/policy-analyzer">Equity Policy Analyzer</Link>: analyze a policy, decide on changes and formalize the approved ones.</li>
      </ul>
    </section>
  );
}
