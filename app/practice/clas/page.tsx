
import { SourceLink } from "@/components/app-link";
import { EngagementResourceLinks } from "@/components/engagement-resource-links";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { PageContents } from "@/components/page-contents";
import { ClasPlanningWorksheet } from "@/components/clas-planning-worksheet";
import { CLAS_SOURCE } from "@/lib/content/clas-planning";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { ToolDecisionQuestions } from "@/components/tool-decision-questions";

export const metadata: Metadata = { title: "Cultural and language access planning" };

export default async function ClasPlanningPage() {
  const culturalIntelligenceAvailable = await culturalIntelligenceHubAvailable();
  return <>
    <PageIntro title="Cultural and language access planning" lede="Bring the National Culturally and Linguistically Appropriate Services Standards to a real service question, with the actions you're considering and the reviews a change needs." />
    <div className="wrap" style={{ paddingBlock: "2rem 4rem" }}>
      <PageContents items={[
        { href: "#standards-reference", label: "Use the standards" },
        { href: "#clas-notes-title", label: "Prepare working notes" },
        { href: "#related-planning", label: "Related planning resources" },
      ]}>
        <section id="standards-reference" className="space-y-4">
          <h2 className="text-2xl font-semibold">Use the standards with your service</h2>
          <p>CLAS means culturally and linguistically appropriate services. Use the standards as a reference for examining communication, workforce preparation, community participation and service improvement. Confirm which standards are relevant to your work and which separate legal, policy or contract requirements apply; this worksheet does not make every standard binding for every service.</p>
          <p><SourceLink href={CLAS_SOURCE.href}>{CLAS_SOURCE.title}</SourceLink> · <Link href="/resources/ja-language-cultural-access-planning">Language and cultural access planning aid</Link></p>
        </section>
        <p><Link href="/learn/clas">Explore CLAS courses, checklists and related learning</Link></p>
        <EngagementResourceLinks kind="clas" />
        <ToolDecisionQuestions tool="clas-plan" />
        <ClasPlanningWorksheet />
        <section id="related-planning" className="border-t border-line pt-6">
          <h2 className="text-xl font-semibold">Continue your planning</h2>
          <nav aria-label="Related planning resources"><ul className="mt-4 space-y-3">
            <li><Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link></li>
            {culturalIntelligenceAvailable && <li><Link href="/learn/cultural-intelligence">Explore cultural context for your planning</Link></li>}
            <li><Link href="/practice/measurement">Plan how to learn from results</Link></li>
            <li><Link href="/support/right-person">Find the person or area responsible</Link></li>
          </ul></nav>
        </section>
      </PageContents>
    </div>
  </>;
}
