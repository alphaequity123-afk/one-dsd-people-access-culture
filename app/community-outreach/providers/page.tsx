import { FocusedSections } from "@/components/focused-sections";

import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { getOfficialProviders } from "@/lib/content/hub/official-providers";
import { ORGANIZATIONS, organizationHref } from "@/lib/content/hub/organizations";
import { getCountyAgencies } from "@/lib/content/hub/county-agencies";
import styles from "../hub.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "Providers and designated agencies",
  description: "Centers for Independent Living, Area Agencies on Aging, contracted health plans, Disability Hub MN, licensed providers and other state-designated agencies, by county.",
};

export default async function ProvidersPage({ searchParams }: { searchParams: Promise<{ county?: string }> }) {
  const { county = "" } = await searchParams;
  const data = getOfficialProviders();
  const counties = getCountyAgencies().counties.map(c => c.county);
  const matches = (entryCounties: string[]) => !county || entryCounties.includes("Statewide") || entryCounties.includes(county);
  const licensed = data.licensedProviderCounts;
  const orgSlug = (name?: string) => name ? ORGANIZATIONS.find(org => org.name === name)?.slug : undefined;
  return <div className={styles.page}><FocusedSections>
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>Providers and designated agencies</h1>
    <p className={styles.lede}>Organizations that the State of Minnesota designates, contracts, licenses or certifies to serve people with disabilities, and which counties each one serves. Each entry names the public record of its designation.</p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="community-outreach" id="providers" noun="provider directory" /></details>
    <p className={styles.note}>Designation is a matter of public record; it is not a judgment of quality, and it is not a referral. Confirm current details with the organization. Facts checked on {data.checked}.</p>
    <p>{data.tribalNote} <Link href="/learn/tribal-referral">Native American and Tribal-specific guidance</Link>.</p>

    <form method="get" className={styles.filters} aria-label="Choose a county">
      <label>County<select name="county" defaultValue={county}><option value="">All counties</option>{counties.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
      <button className={styles.button} type="submit">Show</button>
      {county ? <Link href="/community-outreach/providers">Show all counties</Link> : null}
    </form>

    {data.categories.map(category => {
      const entries = category.entries.filter(entry => matches(entry.counties));
      return <section className={styles.section} key={category.id} aria-labelledby={`cat-${category.id}`}>
        <h2 id={`cat-${category.id}`}>{category.title}</h2>
        <p>{category.intro}</p>
        {category.id === "licensed-providers" ? <p className={styles.small}>{data.licensedProviderCountsNote}</p> : null}
        <p className={styles.small}>Designated by: {category.designatedBy}</p>
        {entries.length ? <ul className={styles.grid} style={{ listStyle: "none", padding: 0 }}>{entries.map(entry => <li className={styles.card} key={entry.name}>
          <h3>{entry.website ? <SourceLink href={entry.website}>{entry.name}</SourceLink> : entry.name}</h3>
          {entry.alsoKnownAs?.length ? <p className={styles.meta}>Also known as {entry.alsoKnownAs.join(", ")}</p> : null}
          <p>{entry.what}</p>
          <p className={styles.small}>Counties: {entry.counties.length ? (entry.counties.length > 20 && !county ? `${entry.counties.length} counties` : entry.counties.join(", ")) : "No published county list"}</p>
          {entry.programCounties && county ? <p className={styles.small}>In {county}: {[entry.programCounties.specialNeedsBasicCare.includes(county) ? "Special Needs BasicCare" : "", entry.programCounties.seniorHealthOptions.includes(county) ? "Minnesota Senior Health Options or Senior Care Plus" : ""].filter(Boolean).join("; ") || "not offered"}</p> : null}
          {orgSlug(entry.organizationsName) ? <p className={styles.small}><Link href={organizationHref(orgSlug(entry.organizationsName)!)}>Its record with the Disability Services Division</Link></p> : null}
          {entry.phone ? <p className={styles.small}>Phone: <SourceLink href={`tel:${entry.phone.replace(/[^0-9]/g, "")}`}>{entry.phone}</SourceLink></p> : null}
          <p className={styles.small}>Record: <SourceLink href={entry.source.url}>{entry.source.title}</SourceLink>{entry.source.date ? `, ${entry.source.date}` : ""}</p>
        </li>)}</ul> : <p>None listed for {county}.</p>}
      </section>;
    })}

    <section className={styles.section} aria-labelledby="licensed-title">
      <h2 id="licensed-title">Finding licensed providers</h2>
      <p>Providers of home and community-based services are licensed under Minnesota Statutes chapter 245D by the Department of Human Services. There are too many to list here; use the official lookups below to find current licensed providers by county and service.</p>
      {licensed ? <>
        <p>Active licenses by county, from <SourceLink href={licensed.source.url}>{licensed.source.title}</SourceLink>{licensed.date ? ` (${licensed.date})` : ""}:</p>
        <div role="region" aria-label="Licensed providers by county" tabIndex={0} style={{ overflowX: "auto" }}>
          <table className={styles.table}><thead><tr><th scope="col">County</th><th scope="col">Active licenses</th></tr></thead>
            <tbody>{Object.entries(licensed.byCounty).filter(([name]) => !county || name === county).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => <tr key={name}><th scope="row">{name}</th><td>{count.toLocaleString("en-US")}</td></tr>)}</tbody></table>
        </div>
      </> : null}
      <h3 className="mt-4 font-bold">Official lookups</h3>
      <ul className="list-disc pl-6">{data.lookups.map(lookup => <li key={lookup.url}><SourceLink href={lookup.url}>{lookup.name}</SourceLink>: {lookup.what}</li>)}</ul>
    </section>

    <p><Link href="/community-outreach/how-the-system-connects">How the system connects</Link> · <Link href="/community-outreach/county-agencies">County agencies</Link> · <Link href="/community-outreach/county-map">Minnesota county map</Link></p>
  </FocusedSections></div>;
}
