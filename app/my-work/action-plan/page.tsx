import Link from "next/link";
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
    <p className="calm-lede">Turn one idea into one change you can see at work. Name a small first step, a real moment to try it, and a date thirty days out to look back.</p>
    <details>
      <summary>Why a plan this small works</summary>
      <p>Change sticks when it is specific, tied to a moment you already face and reviewed soon after. A single behavior you try three times teaches more than a long list you never start. The review questions help you separate what you observed from what you hoped, and decide whether to keep, adjust or stop.</p>
    </details>
    <RecordWorkbench kind="action-plan" prefill={source ? { source, title: `Plan: ${source}`.slice(0, 160) } : {}} />
  </div>;
}
