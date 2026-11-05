import type { Metadata } from "next";
import Link from "next/link";
import { getCountyAgencies, sharedAgencies } from "@/lib/content/hub/county-agencies";
import styles from "../hub.module.css";

export const metadata: Metadata = {
  title: "County agencies",
  description: "The agency that serves people in each Minnesota county for Department of Human Services disability programs, including counties that share one agency.",
};

export default async function CountyAgenciesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const data = getCountyAgencies();
  const query = q.trim().toLowerCase();
  const counties = data.counties.filter(c => !query || `${c.county} ${c.agencyName}`.toLowerCase().includes(query));
  const shared = sharedAgencies();
  return <div className={styles.page}>
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>County agencies</h1>
    <p className={styles.lede}>{data.description}</p>
    <p className={styles.note}>Counties are where most people meet the disability services system: assessments, waivers and case management happen there. Most counties publish one human services line rather than a separate disability line. Details were checked on {data.checked}; confirm them before you share them.</p>
    {data.tribalNations.map(link => <p key={link.url}>{link.note} <a href={link.url}>{link.title}</a>.</p>)}

    <section className={styles.section} aria-labelledby="shared-title">
      <h2 id="shared-title">Counties that share one agency</h2>
      <ul className="list-disc pl-6">{shared.map(agency => <li key={agency.agencyId}>{agency.website ? <a href={agency.website}>{agency.agencyName}</a> : agency.agencyName}: {agency.counties.join(", ")}</li>)}</ul>
    </section>

    <section className={styles.section} aria-labelledby="counties-title">
      <h2 id="counties-title">All 87 counties</h2>
      <form method="get" className={styles.filters} role="search" aria-label="Find a county">
        <label>County or agency<input name="q" type="search" defaultValue={q} /></label>
        <button className={styles.button} type="submit">Find</button>
        {q ? <Link href="/community-outreach/county-agencies">Show all counties</Link> : null}
      </form>
      <div role="region" aria-label="County agencies table" tabIndex={0} style={{ overflowX: "auto" }}>
        <table className={styles.table}>
          <thead><tr><th scope="col">County</th><th scope="col">Agency</th><th scope="col">Phone</th><th scope="col">Notes</th></tr></thead>
          <tbody>{counties.map(c => <tr key={c.fips} id={`county-${c.fips}`}>
            <th scope="row">{c.county}</th>
            <td>{c.website ? <a href={c.website}>{c.agencyName}</a> : c.agencyName}{c.shared ? <span className={styles.small}> (shared with {c.sharedCounties.filter(n => n !== c.county).join(", ")})</span> : null}</td>
            <td>{c.phone ? <><a href={`tel:${c.phone.replace(/[^0-9]/g, "")}`}>{c.phone}</a><br /><span className={styles.small}>{c.phoneLabel}</span></> : <span className={styles.small}>Not published</span>}</td>
            <td className={styles.small}>{c.status === "partial" ? "Partly confirmed. " : ""}{c.notes} <a href={c.sourceUrl}>Source</a></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!counties.length ? <p>No county matches that search.</p> : null}
    </section>

    <section className={styles.section}>
      <h2>Sources</h2>
      <ul className="list-disc pl-6">{data.sources.map(s => <li key={s.id}>{s.url ? <a href={s.url}>{s.title}</a> : s.title}: {s.usedFor}</li>)}</ul>
      <p><Link href="/community-outreach/how-the-system-connects">How the system connects</Link> · <Link href="/community-outreach/providers">Providers and designated agencies</Link> · <Link href="/community-outreach/county-map">Minnesota county map</Link></p>
    </section>
  </div>;
}
