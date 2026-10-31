import Link from "next/link";
import { ResourceDownloads } from "@/components/resource-downloads";
import type { DownloadScope } from "@/lib/downloads/catalog";

const SHELF = [
  { href: "/equity-framework", title: "Equity Strategic Framework", kind: "equity-framework" as const, id: "framework", noun: "framework" },
  { href: "/operationalizing-equity", title: "Operationalizing equity", kind: "operationalizing-equity" as const, id: "program", noun: "page" },
  { href: "/practice/measurement", title: "Measurement worksheet", kind: "measurement" as const, id: "worksheet", noun: "worksheet" },
  { href: "/support/directory", title: "DHS offices and guidance", kind: "support-directory" as const, id: "dhs", noun: "directory" },
];

/** My Work under the staff lock: published downloads, not uploads or saved notes. */
export function StaffWorkBrowse({ scope }: { scope?: DownloadScope }) {
  return (
    <section className="space-y-4" aria-labelledby="published-tools-title">
      <h2 id="published-tools-title" className="text-xl font-extrabold">Tools for your work</h2>
      <p>Four pieces of guidance worth keeping close: the strategic framework, the page on operationalizing equity, the measurement worksheet, and the DHS directory. Read them here or download a copy.</p>
      <details className="rounded-xl border border-line bg-white px-5 py-2">
        <summary className="min-h-11 text-lg font-semibold">Guidance and worksheets</summary>
        <ul className="mt-4 list-none space-y-4 p-0">
          {SHELF.map((item) => (
            <li key={item.href} className="border-t border-line pt-3">
              <Link href={item.href} className="font-bold">{item.title}</Link>
              <ResourceDownloads kind={item.kind} id={item.id} noun={item.noun} scope={scope} />
            </li>
          ))}
        </ul>
      </details>
      <p>Looking for a checklist? Each of the thirteen guided practices on the <Link href="/practice">Practice page</Link> comes with its own.</p>
    </section>
  );
}
