import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { AnalyzeWorkspace } from "@/components/analysis/analyze-workspace";
import { communityDesignEntries } from "@/lib/content/community-design";
import { NATIVE_DEFERENCE_COMMUNITY_IDS } from "@/lib/content/community-presentation";

export const metadata: Metadata = {
  title: "Analyze a document",
  description: "Attach or paste a policy, program description, notice or plan and get each question answered as evidence, inference or gap, with next steps in this program.",
};

export default function AnalyzeDocumentPage() {
  const excluded = new Set<string>(NATIVE_DEFERENCE_COMMUNITY_IDS);
  const communities = communityDesignEntries().filter(community => !excluded.has(community.id));
  return <>
    <PageIntro tone="business" kicker="Equity in practice" title="Analyze a document" lede="Attach or paste a policy, program description, notice or plan and get each question answered as evidence, inference or gap, with next steps in this program." />
    <div className="wrap max-w-6xl space-y-10 py-10">
      <section aria-labelledby="how-this-works" className="card">
        <h2 id="how-this-works" className="text-2xl font-bold">How this works</h2>
        <p className="mt-3 max-w-3xl">Choose one of six analysis methods, bring in the material, add your question if you have one, and select Analyze. Each question in the method gets an answer typed as evidence (a quotation from your material), inference (a conclusion drawn from it) or gap (something the material does not settle). Gaps come with next steps that point to pages in this program. Nothing you upload or paste is stored, and the result goes back to your browser only.</p>
      </section>
      <AnalyzeWorkspace communities={communities} />
      <footer className="card">
        <p>Related pages: <Link href="/equity-review">Review a policy, process, or service change</Link> · <Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link> · <Link href="/community-outreach/plan">Plan an engagement</Link> · <Link href="/equity-review/working-group-plan">Plan a legislatively required working group</Link></p>
      </footer>
    </div>
  </>;
}
