import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { StructuralReviewWorkspace } from "@/components/structural-review-workspace";

export const metadata: Metadata = {
  title: "Structural equity analysis",
  description: "Examine barriers in a DHS process, trace decision points, and develop an action with a responsible role and a review date.",
};

export default function StructuralReviewPage() {
  return <>
    <PageIntro tone="business" kicker="One DSD People, Access and Culture" title="Structural equity analysis" lede="Look closely at a process, identify where barriers arise, and connect evidence with a practical change.">
      <p className="mt-4 max-w-3xl">Use these eight steps for a policy, service, or workplace process anywhere in DHS. Work independently or with colleagues, and ask the Equity and Inclusion Operations Consultant for guidance when helpful.</p>
    </PageIntro>
    <div className="wrap py-8">
      <nav className="mb-6 flex flex-wrap gap-5" aria-label="Related equity resources">
        <Link href="/equity-review">Equity review tools</Link>
        <Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link>
        <Link href="/support/right-person">Support and guidance</Link>
      </nav>
      <StructuralReviewWorkspace />
    </div>
  </>;
}
