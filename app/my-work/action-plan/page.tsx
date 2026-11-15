import Link from "@/components/app-link";
import type { Metadata } from "next";
import { RecordWorkbench } from "@/components/record-workbench";

export const metadata: Metadata = { title: "Your action plan" };

type Props = { searchParams: Promise<{ from?: string }> };

export default async function ActionPlanPage({ searchParams }: Props) {
  const { from } = await searchParams;
  const source = typeof from === "string" ? from.slice(0, 200) : "";
  return <div className="calm calm-narrow">
    <nav className="calm-crumbs" aria-label="Breadcrumb"><Link href="/my-work">My work</Link></nav>
    <p className="calm-kicker">Put it into practice</p>
    <h1>Your action plan</h1>
    <p className="calm-lede">Connect one learning insight with a next step within your responsibility. Identify what you need to retain, examine or revise, who should be involved, and when to review the result. The form starts with a thirty-day review date; adjust it to fit the work.</p>
    <details>
      <summary>Make the plan specific enough to review</summary>
      <p>A specific step gives you something to examine later: what you did, what happened, and what remains uncertain. Use the plan to prepare rather than to claim authority or predict success. Follow required review and approval processes before changing actual work, and use the review to decide whether to retain, adjust or stop an approach.</p>
    </details>
    <RecordWorkbench kind="action-plan" prefill={source ? { source, title: `Plan: ${source}`.slice(0, 160) } : {}} />
  </div>;
}
