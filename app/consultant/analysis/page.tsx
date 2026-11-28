import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { ownerPageGuard } from "@/lib/auth/owner-page";
import { ConsultantAnalysisWorkspace } from "@/components/consultant-analysis-workspace";

export const metadata: Metadata = { title: "Research and equity analysis" };
export const dynamic = "force-dynamic";

export default async function ConsultantAnalysisPage() {
  if (!(await ownerPageGuard())) return null;
  return <>
    <PageIntro title="Research and equity analysis" kicker="Consultant workspace" lede="Look closely at policies, programs and services anywhere in DHS. Connect the evidence to equity goals, compare options and turn what you find into action. Bring a real question from your work, or practice with a sample situation." tone="business" />
    <div className="wrap py-8"><p className="mb-6 max-w-3xl">For a closer look at a process, <Link href="/equity-review/structural">use structural equity analysis</Link>. To compare aggregate figures, <Link href="/consultant/data">explore data and differences</Link>. Download analysis notes from either workspace and add them here as supporting material, together with the evidence behind the review.</p><ConsultantAnalysisWorkspace /></div>
  </>;
}
