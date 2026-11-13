import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { annotationsFor, registerReading, SOURCE_REGISTER, normalizeSourceHref } from "@/lib/content/source-register";
import { stateReading } from "@/lib/search/state-pages";
import { externalReading, externalReadingForUrl, externalSourceHref } from "@/lib/content/external-readings";
import { loadExternalReading, readingSectionHtml } from "@/lib/content/external-reading-body";
import { SourceDocument } from "@/components/source-document";
import { ResourceContextPhoto } from "@/components/resource-context-photo";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ section?: string }> };
function entryFor(id: string) {
  const old = registerReading(id)?.href ?? stateReading(id)?.url;
  return externalReading(id) ?? (old ? externalReadingForUrl(old) : undefined);
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: entryFor((await params).id)?.title ?? "Research and sources" };
}
export default async function SourceReadingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const entry = entryFor(id);
  if (!entry) {
    const original = registerReading(id)?.href ?? stateReading(id)?.url;
    const destination = original && externalSourceHref(original);
    if (destination) redirect(destination);
    redirect("/learn/sources");
  }
  const reading = await loadExternalReading(entry.id);
  if (!reading) redirect(externalSourceHref(entry.original) ?? "/learn/sources");
  const originalHref = externalSourceHref(reading.url);
  const licenseHref = reading.licenseUrl && externalSourceHref(reading.licenseUrl);
  const source = registerReading(id) ?? SOURCE_REGISTER.sources.find(source => source.href && normalizeSourceHref(source.href) === normalizeSourceHref(reading.url));
  const notes = source ? annotationsFor(source) : [];
  const citations = source ? [...new Map(source.citations.filter(citation => citation.route.startsWith("/") && !citation.route.startsWith("//")).map(citation => [citation.route, citation])).values()] : [];
  const query = await searchParams;
  const requested = Number(query.section) || 1;
  const sections = reading.sections ?? [];
  const index = Math.max(0, Math.min(sections.length - 1, Math.floor(requested) - 1));
  const section = sections[index];
  const href = (number: number) => `/source-reading/${entry.id}?section=${number}#reading`;
  return <article className="pilot-topic pilot-reading-width source-reading-page">
    <header>
      <nav className="calm-crumbs" aria-label="Breadcrumb"><Link href="/learn/sources">Research and sources</Link></nav>
      <h1>{reading.title}</h1>
      <p className="source-reading-credit">{new URL(reading.original).hostname.replace(/^www\./, "")}</p>
      {originalHref ? <p><a href={originalHref} data-original="true">View original</a></p> : null}
    </header>
    <ResourceContextPhoto subject={`${reading.title} ${section?.title ?? ""}`} />
    {sections.length > 1 ? <details className="pilot-supporting source-reading-contents"><summary>In this reading</summary><nav className="pilot-supporting-body" aria-label="Reading sections"><ol>{sections.map((part, i) => <li key={part.id}><Link href={href(i + 1)} aria-current={i === index ? "page" : undefined}>{part.title === "Continued" ? `Part ${i + 1}` : part.title}</Link></li>)}</ol></nav></details> : null}
    {reading.format === "pdf" && reading.document ? <section aria-label="Document"><SourceDocument src={reading.document} title={reading.title} /></section> : section ? <section id="reading" className="source-reading-body" tabIndex={-1} dangerouslySetInnerHTML={{ __html: readingSectionHtml(section.html, reading.title, index === 0) }} /> : null}
    {sections.length > 1 ? <nav className="source-reading-pagination" aria-label="Continue reading">
      {index > 0 ? <Link href={href(index)}>Previous</Link> : <span />}
      <span>{index + 1} of {sections.length}</span>
      {index + 1 < sections.length ? <Link href={href(index + 2)}>Next</Link> : <Link href="/learn/sources">More readings</Link>}
    </nav> : null}
    {notes.length ? <details className="pilot-supporting"><summary>Notes from One DSD</summary><div className="pilot-supporting-body space-y-4">{notes.map(note => <p key={note}>{note}</p>)}</div></details> : null}
    {citations.length ? <details className="pilot-supporting"><summary>Where this source is used</summary><div className="pilot-supporting-body"><ul className="pilot-topic-rows">{citations.map(citation => <li key={citation.route}><Link href={citation.route}>{citation.resourceTitle}</Link></li>)}</ul></div></details> : null}
    <footer className="source-reading-footer">{reading.attribution ? <p>{reading.attribution}{licenseHref ? <> <a href={licenseHref}>Use and attribution</a></> : null}</p> : null}<p>Source accessed {new Intl.DateTimeFormat("en-US", {month:"long",day:"numeric",year:"numeric",timeZone:"America/Chicago"}).format(new Date(reading.checkedAt))}.</p></footer>
  </article>;
}
