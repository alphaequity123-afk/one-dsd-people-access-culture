import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { ProgramOutcomeForm } from "@/components/program-outcome-form";

export const metadata: Metadata = { title: "Share a result" };

export default function ShareResultPage() {
  return (
    <>
      <PageIntro kicker="Support" title="Share a result" lede="Tried something in your work? Describe what changed and what you noticed. Accounts like yours show what makes a difference." />
      <div className="wrap max-w-3xl space-y-6 py-8">
        <ProgramOutcomeForm />
        <p className="text-sm">To think through a change before you try it, use <Link href="/practice-guides/review-a-change">find out what changed in practice</Link>.</p>
      </div>
    </>
  );
}
