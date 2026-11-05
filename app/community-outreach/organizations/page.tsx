import type { Metadata } from "next";
import Link from "next/link";
import { communityDesignEntries } from "@/lib/content/community-design";
import { ORGANIZATIONS, ORGANIZATIONS_CHECKED, RELATIONSHIP_ORDER, hasDivisionRecord, isNativeCommunity, organizationHref } from "@/lib/content/hub/organizations";
import styles from "../hub.module.css";

export const metadata: Metadata = {
  title: "Organizations connected with the Disability Services Division",
  description: "Grantees, contractors, partners and advisory members of the Disability Services Division, each with the public records behind the connection.",
};

export default async function OrganizationDirectory({ searchParams }: { searchParams: Promise<{ community?: string; type?: string; q?: string }> }) {
  const { community = "", type = "", q = "" } = await searchParams;
  const titles = new Map(communityDesignEntries().map(entry => [entry.id, entry.title]));
  const linked = [...new Set(ORGANIZATIONS.flatMap(org => org.communities))].filter(id => !isNativeCommunity(id)).sort((a, b) => (titles.get(a) ?? a).localeCompare(titles.get(b) ?? b));
  const query = q.trim().toLowerCase();
  const shown = ORGANIZATIONS.filter(org =>
    (!community || org.communities.includes(community)) &&
    (!type || org.relationshipTypes.includes(type)) &&
    (!query || `${org.name} ${org.alsoKnownAs ?? ""} ${org.summary} ${org.whereItWorks}`.toLowerCase().includes(query)));
  return <div className={styles.page}>
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>Organizations connected with the Disability Services Division</h1>
    <p className={styles.lede}>Each organization here has a published record of working with the Disability Services Division as a grantee, contractor, partner or advisory member. Each page lists the records it rests on.</p>
    <p className={styles.note}>Being listed here does not mean the organization speaks for a whole community, and it is not a ranking. Some connections ended years ago. Confirm current details with the organization before you rely on them. Facts were checked on {ORGANIZATIONS_CHECKED}.</p>

    <form method="get" className={styles.filters} role="search" aria-label="Filter organizations">
      <label>Community<select name="community" defaultValue={community}><option value="">All communities</option>{linked.map(id => <option key={id} value={id}>{titles.get(id) ?? id}</option>)}</select></label>
      <label>Connection<select name="type" defaultValue={type}><option value="">All connections</option>{RELATIONSHIP_ORDER.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
      <label>Search<input name="q" type="search" defaultValue={q} /></label>
      <button className={styles.button} type="submit">Show organizations</button>
      {community || type || q ? <Link href="/community-outreach/organizations">Clear filters</Link> : null}
    </form>

    <p aria-live="polite">{shown.length} of {ORGANIZATIONS.length} organizations</p>
    {shown.length ? <ul className={styles.grid} style={{ listStyle: "none", padding: 0 }}>
      {shown.map(org => <li className={styles.card} key={org.slug}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}><Link href={organizationHref(org.slug)}>{org.name}</Link></h2>
        <p className={styles.meta}>{org.kind}{org.closed ? " · Closed" : ""}{!hasDivisionRecord(org) ? " · Record names the Department of Human Services" : ""}</p>
        <div>{org.relationshipTypes.map(t => <span className={styles.chip} key={t}>{t}</span>)}</div>
        <p>{org.summary}</p>
        {org.communities.length ? <p className={styles.small}>Communities named in its records: {org.communities.map(id => titles.get(id) ?? id).join(", ")}</p> : null}
      </li>)}
    </ul> : <p>No organization matches these filters. <Link href="/community-outreach/organizations">Show all organizations</Link>.</p>}

    <section className={styles.section}>
      <h2>Where the records come from</h2>
      <p>Most connections come from the Disability Services Division&apos;s 2023 report to the Legislature, the list of Innovation Grant awards, Department of Human Services news releases, and the Minnesota law that sets up the Waiver Reimagine advisory task force. Where a record names the Department of Human Services but not the Disability Services Division, the organization&apos;s page says so.</p>
    </section>
  </div>;
}
