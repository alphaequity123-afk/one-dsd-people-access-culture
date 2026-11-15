import Link from "@/components/app-link";
import type { Metadata } from "next";
import { RecordWorkbench } from "@/components/record-workbench";

export const metadata: Metadata = { title: "Decision records" };

export default function DecisionRecordsPage() {
  return <div className="calm calm-narrow">
    <nav className="calm-crumbs" aria-label="Breadcrumb"><Link href="/my-work">My work</Link></nav>
    <p className="calm-kicker">Write down why</p>
    <h1>Decision records</h1>
    <p className="calm-lede">A short, plain record of a consequential decision: who it affects, what was heard, the options weighed and why one was chosen. Someone reading it next year should be able to follow the reasoning.</p>
    <details>
      <summary>When to keep a decision record</summary>
      <p>Use a decision record when others need to understand the reasons for a policy, form, notice, budget, hiring or service choice. Follow the applicable agency process for the official record. If equity analysis is required, identify where the authorized analysis is kept. This learning tool supports preparation; the person or area responsible still makes the decision.</p>
      <p><Link href="/team-space">See records saved to the team space</Link></p>
    </details>
    <RecordWorkbench kind="decision-record" teamSpace />
  </div>;
}
