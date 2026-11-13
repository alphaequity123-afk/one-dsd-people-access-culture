import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { agencyPageHref } from "@/lib/content/state-agencies";
import { annotationsFor, registerReading } from "@/lib/content/source-register";
import { stateReading, stateReadingDate, stateReadingForUrl } from "@/lib/search/state-pages";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: stateReading(id)?.title || registerReading(id)?.title || "Source reading" };
}

export default async function SourceReadingPage({ params }: Props) {
  const { id } = await params;
  const source = registerReading(id);
  const reading = stateReading(id) ?? (source?.href ? stateReadingForUrl(source.href) : undefined);
  const original = source?.href ?? reading?.url;
  if (!original) notFound();
  const notes = source ? annotationsFor(source) : [];
  const citations = source ? [...new Map(source.citations.filter(citation => citation.route.startsWith("/") && !citation.route.startsWith("//")).map(citation => [citation.route, citation])).values()] : [];
  const parent = reading?.agencyId ? agencyPageHref(reading.agencyId) : "/learn/sources";
  return <article className="pilot-topic pilot-reading-width">
    <header>
      <nav className="calm-crumbs" aria-label="Breadcrumb">
        <Link href={parent}>{reading?.agencyId ? reading.agency : "Research and sources"}</Link>
      </nav>
      <h1>{source?.title || reading?.title || reading?.agency}</h1>
      <p>{reading?.agency ?? source?.host}</p>
      <p><a href={original}>View original</a></p>
    </header>
    {reading ? <section className="pilot-topic-themes" aria-labelledby="reading-title">
      <h2 id="reading-title">Saved text</h2>
      <p className="mb-6 text-sm text-muted">Collected on {stateReadingDate}. The original has the full page, links, and current information.</p>
      <div className="pilot-source-text space-y-4 break-words">{reading.text.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    </section> : <section aria-label="Availability"><p>The full resource is available from its publisher.</p></section>}
    {notes.length ? <details className="pilot-supporting"><summary>Notes from One DSD</summary><div className="pilot-supporting-body space-y-4">{notes.map(note => <p key={note}>{note}</p>)}</div></details> : null}
    {citations.length ? <details className="pilot-supporting"><summary>Where One DSD uses this source</summary><div className="pilot-supporting-body"><ul className="pilot-topic-rows">{citations.map(citation => <li key={citation.route}><Link href={citation.route}>{citation.resourceTitle}</Link></li>)}</ul></div></details> : null}
  </article>;
}
