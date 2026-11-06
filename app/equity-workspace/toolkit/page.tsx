import type { Metadata } from "next";
import { ConsultantToolkitWorkspace } from "@/components/consultant-toolkit-workspace";
import { PageIntro } from "@/components/ui";
import { analysisRoleFromCookies } from "@/lib/auth/consultant-or-team";

export const metadata: Metadata = { title: "Equity Analysis Toolkit" };
export const dynamic = "force-dynamic";

export default async function EquityWorkspaceToolkitPage() {
  if (!(await analysisRoleFromCookies())) return null;
  return (
    <>
      <PageIntro
        kicker="Equity workspace"
        title="Equity Analysis Toolkit"
        lede="Attach a document or paste its text. The toolkit sets up the analysis, shows what information is still needed, and then produces the report, worksheet, action plan, leadership brief and information request."
        tone="business"
      />
      <div className="wrap py-8"><ConsultantToolkitWorkspace /></div>
    </>
  );
}
