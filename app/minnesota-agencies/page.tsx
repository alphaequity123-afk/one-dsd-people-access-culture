import type { Metadata } from "next";
import Link from "next/link";
import { PARTNER_GROUP_LABEL, PUBLIC_PARTNERS, STATE_AGENCIES, STATE_AGENCY_SOURCE, agencyDisplayName, agencyPageHref, type PublicPartner, type StateAgency } from "@/lib/content/state-agencies";
import { catMatches, catOneLine, catPaginate, catParam, catWords } from "@/lib/cat-paging";
import { CatList, CatPager, CatResultStatus, CatRow } from "@/components/cat-list";

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
  const words = catWords(q);
  const page = catPaginate(entries.filter(agency => catMatches(words, agency.name, agency.description)), catParam(params.page), 14);
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
      <form className="pilot-topic-search" action={base} role="search">
        {partnerView ? <input type="hidden" name="view" value="partners" /> : null}
        <label htmlFor="agency-q">Find a {noun === "agency" ? "state agency" : "partner"}</label>
        <div><input id="agency-q" name="q" type="search" defaultValue={q} /><button type="submit">Search</button></div>
      </form>
      <CatResultStatus page={page} noun={noun} nouns={nouns} of={entries.length} />
      {page.items.length ? <CatList label={nouns}>{page.items.map(agency => <CatRow key={agency.id}
        title={<Link href={agencyPageHref(agency.id)}>{agency.name}</Link>}
        line={catOneLine(agency.description)} meta={agency.group} />)}</CatList> : null}
      <CatPager page={page} basePath={base} params={{ q, view: partnerView ? "partners" : "" }} label="Directory result pages" />
    </section>
    <section aria-label="Related directories">
      {partnerView ? <p><Link href="/community-outreach/county-agencies">Find a county lead agency by county</Link></p> : <p>Directory source: <a href={STATE_AGENCY_SOURCE}>State of Minnesota agencies, boards and commissions</a>.</p>}
      <p><Link href={partnerView ? "/explore/community/county-lead-agencies" : "/explore/community/state-agencies"}>See connections to program work</Link></p>
    </section>
  </div>;
}
