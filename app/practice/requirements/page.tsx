import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { PageContents } from "@/components/page-contents";
import { RequirementsCrosswalkWorksheet } from "@/components/requirements-crosswalk";

export const metadata: Metadata = { title: "Requirements and review evidence" };

export default function RequirementsPage() {
  return <>
    <PageIntro title="Requirements and review evidence" lede="Keep a requirement, its governing source, the work it affects and the evidence for review together." />
    <div className="wrap" style={{ paddingBlock: "2rem 4rem" }}>
      <PageContents items={[
        { href: "#requirements-start", label: "Before you begin" },
        { href: "#requirements-working-title", label: "Prepare the crosswalk" },
        { href: "#requirements-next", label: "Use your crosswalk" },
      ]}>
        <section id="requirements-start" className="space-y-4">
          <h2 className="text-2xl font-semibold">Begin with the governing source</h2>
          <p>When a policy, service or practice is changing, the people responsible need to see both what is required and how the proposed work addresses it. Use this crosswalk to make those connections visible, including missing evidence and questions about authority.</p>
          <p>Begin with applicable law and binding requirements, then current approved agency policy and delegated procedures. Keep guidance, examples and proposed commitments clearly identified. If sources conflict or applicability is uncertain, record the question and seek the responsible review before relying on an interpretation.</p>
        </section>
        <RequirementsCrosswalkWorksheet />
        <section id="requirements-next" className="border-t border-line pt-6">
          <h2 className="text-xl font-semibold">Use the crosswalk with the work it supports</h2>
          <p className="my-3">Download the summary and keep it with the draft analysis or recommendation through the appropriate review channel. Carry unresolved requirements, responsible roles and next actions into implementation planning. When the work changes, reopen the editable file and revise the affected entries.</p>
          <nav aria-label="Related work"><ul className="mt-4 space-y-3">
            <li><Link href="/practice/gp-2">Policy, form or notice change</Link></li>
            <li><Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link></li>
            <li><Link href="/practice/measurement">Plan evidence of results</Link></li>
            <li><Link href="/support/right-person">Find the responsible person or office</Link></li>
          </ul></nav>
        </section>
      </PageContents>
    </div>
  </>;
}
