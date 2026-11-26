import type { Metadata } from "next";
import { PageIntro } from "@/components/ui";
import { ownerPageGuard } from "@/lib/auth/owner-page";
import { ConsultantToolkitWorkspace } from "@/components/consultant-toolkit-workspace";

export const metadata: Metadata = { title: "Department of Human Services Equity Analysis Toolkit" };
export const dynamic = "force-dynamic";

export default async function ConsultantToolkitPage() {
  if (!(await ownerPageGuard())) return null;
  return <>
    <PageIntro kicker="Equity workspace" title="Department of Human Services Equity Analysis Toolkit" lede="Bring evidence to a decision. Start with a quick equity scan or a full analysis, look at what you find, and turn your recommendations into a clear plan." tone="business" />
    <div className="wrap py-8"><ConsultantToolkitWorkspace /></div>
  </>;
}
