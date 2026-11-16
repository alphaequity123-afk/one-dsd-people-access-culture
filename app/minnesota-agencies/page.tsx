
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PARTNER_GROUP_LABEL, PUBLIC_PARTNERS, STATE_AGENCIES, STATE_AGENCY_SOURCE, agencyDisplayName, agencyPageHref, type PublicPartner, type StateAgency } from "@/lib/content/state-agencies";
import { catOneLine, catParam } from "@/lib/cat-paging";
import { CatRow } from "@/components/cat-list";
import { PrivateCatalogForm, PrivateCatalogProvider, PrivateCatalogResults, type CatalogRow } from "@/components/private-catalog";

export const metadata: Metadata = { title: "Minnesota agencies and partners" };

const base = "/minnesota-agencies";
type Query = { q?: string | string[]; view?: string | string[]; page?: string | string[] };

export default async function MinnesotaAgenciesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const q = catParam(params.q);
  const partnerView = catParam(params.view) === "partners";
  const directory: readonly (StateAgency & { group?: PublicPartner["group"] })[] = partnerView ? PUBLIC_PARTNERS : STATE_AGENCIES;
  const entries = directory.map(agency => ({
    ...agency, name: agencyDisplayName(agency.name),
    group: agency.group ? PARTNER_GROUP_LABEL[agency.group] : undefined,
  })).sort((a, b) => a.name.localeCompare(b.name));
  // Every entry is drawn once; the words typed narrow the list in the page and never go into the address.
  const rows: CatalogRow[] = entries.map(agency => ({
    key: agency.id,
    text: `${agency.name} ${agency.description}`,
    node: <CatRow key={agency.id}
      title={<Link href={agencyPageHref(agency.id)}>{agency.name}</Link>}
      line={catOneLine(agency.description)} meta={agency.group} />,
  }));
  const noun = partnerView ? "partner" : "agency";
  const nouns = partnerView ? "partners" : "agencies";
  return <div className="pilot-topic">
    <header><h1>{partnerView ? "Counties, the Legislature and federal partners" : "State of Minnesota agencies"}</h1>
      <p>{partnerView ? "Find county lead agencies, the Minnesota Legislature, and federal partners." : "Find state agencies, boards, and councils and read their directory entries in One DSD."}</p>
    </header>
    <section aria-label="Find an agency or partner">
      <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Agency directory">
        <Link href={base} aria-current={partnerView ? undefined : "page"}>State agencies</Link>
        <Link id="partners" href={base + "?view=partners"} aria-current={partnerView ? "page" : undefined}>Counties and partners</Link>
      </nav>
      <PrivateCatalogProvider key={partnerView ? "partners" : "agencies"} basePath={base} rows={rows} choices={{}} perPage={14} initial={{ q, page: catParam(params.page) }}>
        <PrivateCatalogForm className="pilot-topic-search" layout="bar" inputId="agency-q" searchLabel={`Find a ${noun === "agency" ? "state agency" : "partner"}`} buttonLabel="Search" clearLabel="Clear search" />
        <PrivateCatalogResults noun={noun} nouns={nouns} of={entries.length} listLabel={nouns} pagerLabel="Directory result pages" />
      </PrivateCatalogProvider>
    </section>
    <section aria-label="Related directories">
      {partnerView ? <p><Link href="/community-outreach/county-agencies">Find a county lead agency by county</Link></p> : <p>Directory source: <SourceLink href={STATE_AGENCY_SOURCE}>State of Minnesota agencies, boards and commissions</SourceLink>.</p>}
      <p><Link href={partnerView ? "/explore/community/county-lead-agencies" : "/explore/community/state-agencies"}>See connections to program work</Link></p>
    </section>
  </div>;
}
