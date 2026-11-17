import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { AnalyzeWorkspace } from "@/components/analysis/analyze-workspace";
import { communityDesignEntries } from "@/lib/content/community-design";
import { NATIVE_DEFERENCE_COMMUNITY_IDS } from "@/lib/content/community-presentation";

export const metadata: Metadata = { title: "DHS Equity Analysis Toolkit" };

export default function EquityToolkitPage() {
  const excluded = new Set<string>(NATIVE_DEFERENCE_COMMUNITY_IDS);
  const communities = communityDesignEntries().filter(community => !excluded.has(community.id));
  return <>
    <PageIntro tone="business" kicker="Equity in practice" title="DHS Equity Analysis Toolkit" lede="Explore a decision, bring together the information and perspectives that matter, and identify practical next steps." />
    <div className="wrap max-w-6xl space-y-10 py-10">
      <p><Link href="/equity-review">Back to equity review</Link> · <Link href="/learn/equity-toolkit">Learn about the toolkit</Link></p>
      <AnalyzeWorkspace communities={communities} toolkit />
    </div>
  </>;
}
