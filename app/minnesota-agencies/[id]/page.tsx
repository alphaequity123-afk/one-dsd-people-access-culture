
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { notFound } from "next/navigation";
import { PUBLIC_BODIES, STATE_AGENCY_SOURCE, agencyDisplayName } from "@/lib/content/state-agencies";
import { facetValue } from "@/lib/graph/facets";
import { stateReadingsForAgency, stateReadingHref } from "@/lib/search/state-pages";
import { ResourceContextPhoto } from "@/components/resource-context-photo";
import { externalSourceHref } from "@/lib/content/external-readings";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const agency = PUBLIC_BODIES.find(entry => entry.id === id);
  return { title: agency ? agencyDisplayName(agency.name) : "Agency" };
}

export default async function AgencyPage({ params }: Props) {
  const { id } = await params;
  const agency = PUBLIC_BODIES.find(entry => entry.id === id);
  if (!agency) notFound();
  const readings = agency.linkOnly ? [] : stateReadingsForAgency(agency.name);
  const connected = !agency.linkOnly && agency.topics && facetValue("community", `agency-${id}`);
  const officialHref = externalSourceHref(agency.href);
  return <article className="pilot-topic pilot-reading-width">
    <header>
      <nav className="calm-crumbs" aria-label="Breadcrumb"><Link href={agency.group ? "/minnesota-agencies?view=partners" : "/minnesota-agencies"}>Minnesota agencies and partners</Link></nav>
      <h1>{agencyDisplayName(agency.name)}</h1>
      <p>{agency.description}</p>
      {officialHref ? <p><SourceLink href={officialHref}>Visit the official website</SourceLink></p> : null}
    </header>
    <ResourceContextPhoto subject={`${agency.name} ${agency.topics}`} />
    {readings.length ? <section className="pilot-topic-themes" aria-labelledby="agency-readings">
      <h2 id="agency-readings">Read in One DSD</h2>
      <ul className="pilot-topic-rows">{readings.map(page => <li key={page.id}><Link href={stateReadingHref(page.id)}>{page.title}</Link></li>)}</ul>
    </section> : null}
    {connected ? <section className="pilot-topic-themes" aria-labelledby="agency-connections">
      <h2 id="agency-connections">Connected program work</h2>
      <ul className="pilot-topic-rows"><li><Link href={`/explore/community/agency-${id}`}>Explore related learning, tools, and policies</Link></li></ul>
    </section> : null}
    {!agency.group ? <p className="mt-8 text-sm">Directory source: <SourceLink href={STATE_AGENCY_SOURCE}>State of Minnesota agencies, boards and commissions</SourceLink>.</p> : null}
  </article>;
}
