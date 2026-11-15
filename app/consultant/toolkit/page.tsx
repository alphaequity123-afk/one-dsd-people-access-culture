import type { Metadata } from "next";
import { PageIntro } from "@/components/ui";
import { ownerPageGuard } from "@/lib/auth/owner-page";
import { ConsultantToolkitWorkspace } from "@/components/consultant-toolkit-workspace";

export const metadata: Metadata = { title: "Department of Human Services Equity Analysis Toolkit" };
export const dynamic = "force-dynamic";

export default async function ConsultantToolkitPage() {
  if (!(await ownerPageGuard())) return null;
  return <>
    <PageIntro kicker="Equity workspace" title="Department of Human Services Equity Analysis Toolkit" lede="This workspace helps the consultant bring evidence to a decision. Prepare an equity scan or full analysis, examine the findings, and turn your reviewed recommendations into a clear plan." tone="business" />
    <div className="wrap py-8"><ConsultantToolkitWorkspace /></div>
  </>;
}
