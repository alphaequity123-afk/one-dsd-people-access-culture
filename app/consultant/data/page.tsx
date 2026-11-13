import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { ownerPageGuard } from "@/lib/auth/owner-page";
import { DataExplorationWorkspace } from "@/components/data-exploration-workspace";

export const metadata: Metadata = { title: "Explore data and differences" };
export const dynamic = "force-dynamic";

export default async function ConsultantDataPage() {
  if (!(await ownerPageGuard())) return null;
  return <>
    <PageIntro tone="business" kicker="Consultant toolkit" title="Explore data and differences" lede="Compare aggregate figures, examine their sources, and connect the findings with research and equity analysis.">
      <p className="mt-4 max-w-3xl">Explore the six ADSA equity goals or data from any DHS program or service line. Begin with a practice example, or open a file prepared for this purpose.</p>
    </PageIntro>
    <div className="wrap py-8">
      <nav className="mb-6 flex flex-wrap gap-5" aria-label="Consultant toolkit">
        <Link href="/consultant/analysis">Research and policy analysis</Link>
        <Link href="/equity-review/structural">Structural equity analysis</Link>
      </nav>
      <DataExplorationWorkspace />
    </div>
  </>;
}
