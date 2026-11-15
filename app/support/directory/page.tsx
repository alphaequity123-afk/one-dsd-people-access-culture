import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { ResourceDownloads } from "@/components/resource-downloads";
import { SUPPORT_SOURCES } from "@/lib/product/support-directory";

export const metadata: Metadata = { title: "DHS offices and guidance" };

export default function SupportDirectoryPage() {
  return <>
    <PageIntro kicker="Find support" title="DHS offices and guidance" lede="This page helps staff of the Disability Services Division (DSD) find the right Minnesota Department of Human Services (DHS) office or guidance for a question. It has separate guidance for workplace needs, public services, and program responsibilities." />
    <div className="pilot-topic pilot-reading-width">
      <p><Link href="/support/right-person">Find the right person for your work</Link></p>
      <p>These DHS pages can help you find an office or understand a process. Your team may have a specific contact for the next step.</p>
      <details className="border-t border-line pt-4"><summary className="cursor-pointer font-semibold text-[#123f60]">Download this directory</summary><ResourceDownloads kind="support-directory" id="dhs" noun="directory" /></details>
      <ul className="pilot-topic-rows mt-6">{SUPPORT_SOURCES.map(source => <li key={source.id} id={source.id}>
        <Link href={`/support/directory/${source.id}`}>{source.label}<span>{source.audience}</span></Link>
      </li>)}</ul>
    </div>
  </>;
}
