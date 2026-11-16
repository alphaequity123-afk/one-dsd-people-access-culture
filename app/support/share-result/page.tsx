import type { Metadata } from "next";
import Link from "@/components/app-link";
import { Notice, PageIntro } from "@/components/ui";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Share a result" };

const ALTERNATIVES = [
  { href: ROUTES.ask.href, label: ROUTES.ask.label, note: "Ask a question in your own words and get a considered answer with its sources." },
  { href: ROUTES.support.href, label: ROUTES.support.label, note: "See every kind of support in one place." },
  { href: ROUTES.rightPerson.href, label: ROUTES.rightPerson.label, note: "Find the role or office that decides." },
  { href: "/support/directory", label: "DHS offices and guidance", note: "Find the office or guidance that applies to your work." },
];

export default function ShareResultPage() {
  return (
    <>
      <PageIntro kicker="Read and download" title="Share a result" />
      <div className="wrap max-w-3xl space-y-6 py-8">
        <Notice>
          <strong>Sharing results is closed. </strong>
          There is no form on this page.
        </Notice>
        <section aria-labelledby="share-result-alternatives">
          <h2 id="share-result-alternatives" className="text-xl font-bold">Where to go now</h2>
          <ul className="mt-2 list-disc pl-6">
            {ALTERNATIVES.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link> <span>{item.note}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
