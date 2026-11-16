
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { communityDesignEntries } from "@/lib/content/community-design";
import { ORGANIZATIONS, ORGANIZATIONS_CHECKED, RELATIONSHIP_ORDER, hasDivisionRecord, isNativeCommunity, organizationHref } from "@/lib/content/hub/organizations";
import { DEPARTMENT_WIDE_GRANTS } from "@/lib/content/hub/record-findings";
import { catOneLine, catParam } from "@/lib/cat-paging";
import { CatRow } from "@/components/cat-list";
import { PrivateCatalogForm, PrivateCatalogProvider, PrivateCatalogResults, type CatalogRow } from "@/components/private-catalog";
import styles from "../hub.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "Organizations connected with the Disability Services Division",
  description: "Grantees, contractors, partners and advisory members of the Disability Services Division, each with the public records behind the connection.",
};

const PER_PAGE = 12;
const BASE = "/community-outreach/organizations";

type Query = { community?: string | string[]; type?: string | string[]; q?: string | string[]; page?: string | string[] };

export default async function OrganizationDirectory({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const community = catParam(params.community);
  const type = catParam(params.type);
  const q = catParam(params.q);
  const titles = new Map(communityDesignEntries().map(entry => [entry.id, entry.title]));
  const linked = [...new Set(ORGANIZATIONS.flatMap(org => org.communities))].filter(id => !isNativeCommunity(id)).sort((a, b) => (titles.get(a) ?? a).localeCompare(titles.get(b) ?? b));
  // Every organization is drawn once; the words typed and the two lists narrow the list in the page.
  const rows: CatalogRow[] = ORGANIZATIONS.map(org => ({
    key: org.slug,
    text: `${org.name} ${org.alsoKnownAs ?? ""} ${org.summary} ${org.whereItWorks}`,
    values: { community: org.communities, type: org.relationshipTypes },
    node: <CatRow key={org.slug}
      title={<Link href={organizationHref(org.slug)}>{org.name}</Link>}
      line={catOneLine(org.summary)}
      meta={[org.kind, org.relationshipTypes.join(", "), org.closed ? "Closed" : "", !hasDivisionRecord(org) ? "Record names the Department of Human Services" : ""].filter(Boolean).join(" · ")} />,
  }));
  const choices = { community: linked.includes(community) ? community : "", type: (RELATIONSHIP_ORDER as readonly string[]).includes(type) ? type : "" };
  return <div className={styles.page}>
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>Organizations connected with the Disability Services Division</h1>
    <p className={styles.lede}>Each organization here has a published record of working with the Disability Services Division as a grantee, contractor, partner or advisory member. Each page lists the records it rests on.</p>
    <p className={styles.note}>Being listed here does not mean the organization speaks for a whole community, and it is not a ranking. Some connections ended years ago. Confirm current details with the organization before you rely on them. Facts were checked on {ORGANIZATIONS_CHECKED}.</p>

    <p><SourceLink href="/documents/community-outreach/organizations-connected-with-the-disability-services-division.pdf" download>Download all organization pages as one PDF</SourceLink> (45 pages, 1 MB)</p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="community-outreach" id="organizations" noun="directory" /></details>

    <PrivateCatalogProvider key={`${choices.community}|${choices.type}`} basePath={BASE} rows={rows} choices={choices} perPage={PER_PAGE} initial={{ q, page: catParam(params.page) }}
      lists={[
        { name: "community", label: "Community", allLabel: "All communities", options: linked.map(id => ({ value: id, label: titles.get(id) ?? id })) },
        { name: "type", label: "Connection", allLabel: "All connections", options: RELATIONSHIP_ORDER.map(t => ({ value: t, label: t })) },
      ]}>
      <PrivateCatalogForm className={styles.filters} ariaLabel="Filter organizations" searchLabel="Search" inputId="org-q" buttonLabel="Show organizations" buttonClassName={styles.button} clearLabel="Clear filters" />
      <PrivateCatalogResults noun="organization" nouns="organizations" of={ORGANIZATIONS.length} empty="No organization matches these filters." listLabel="Organizations" pagerLabel="Organization result pages"
        emptyBlock={{ resetLabel: "Show all organizations" }} />
    </PrivateCatalogProvider>

    <details className="course-more-item">
      <summary><h2 id="department-title">Also on record with the Department of Human Services ({DEPARTMENT_WIDE_GRANTS.length})</h2></summary>
      <p>These grants are recorded with the Department of Human Services, but the records do not name the Disability Services Division. They are listed so the record is complete.</p>
      <ul className="list-disc space-y-3 pl-6">{DEPARTMENT_WIDE_GRANTS.map(grant => <li key={grant.organizations}>
        <strong>{grant.organizations}</strong>. {grant.program}, {grant.years}{grant.amounts ? `, ${grant.amounts}` : ""}. {grant.focus}{" "}
        <SourceLink href={grant.record.url}>{grant.record.title}, {grant.record.date}</SourceLink>.
      </li>)}</ul>
    </details>

    <details className="course-more-item">
      <summary><h2>Where the records come from</h2></summary>
      <p>Most connections come from the Disability Services Division&apos;s 2023 report to the Legislature, the list of Innovation Grant awards, Department of Human Services news releases, and the Minnesota law that sets up the Waiver Reimagine advisory task force. Where a record names the Department of Human Services but not the Disability Services Division, the organization&apos;s page says so.</p>
    </details>
  </div>;
}
