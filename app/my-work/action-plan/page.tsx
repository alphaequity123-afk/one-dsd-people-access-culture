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
    <p className="calm-lede">Take one thing you learned and turn it into a next step that is yours to take. Note what you want to keep, look into or change, who should be involved, and when you will check the result. The form suggests a review in thirty days; change it to fit the work.</p>
    <details>
      <summary>Make the plan specific enough to review</summary>
      <p>A specific step gives you something to look back on: what you did, what happened and what is still uncertain. The plan is for preparing, not for claiming authority or predicting success. Before you change real work, go through any review and approval it requires, and use your review to decide whether to keep, adjust or stop an approach.</p>
    </details>
    <RecordWorkbench kind="action-plan" prefill={source ? { source, title: `Plan: ${source}`.slice(0, 160) } : {}} />
  </div>;
}
