import type { Metadata } from "next";
import Link from "@/components/app-link";
import { Notice, PageIntro } from "@/components/ui";

export const metadata: Metadata = { title: "Equity analysis record" };

/** F-01: staff record get/export is fail-closed. The page does not load a stored analysis. */
export default function AnalysisRecordPage() {
  return (
    <>
      <PageIntro kicker="Read and download" title="Analysis records are not shown here" />
      <div className="wrap max-w-3xl space-y-6 py-8">
        <Notice>
          <strong>Staff cannot open stored analysis records. </strong>
          Walk through a published example in the Equity Analysis Toolkit instead.
        </Notice>
        <p><Link href="/learn/equity-toolkit" className="btn btn--primary">Open the Equity Analysis Toolkit</Link></p>
      </div>
    </>
  );
}
