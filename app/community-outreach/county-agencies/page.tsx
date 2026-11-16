
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { getCountyAgencies, sharedAgencies } from "@/lib/content/hub/county-agencies";
import { catParam } from "@/lib/cat-paging";
import { CatExpandRow } from "@/components/cat-list";
import { PrivateCatalogForm, PrivateCatalogJump, PrivateCatalogProvider, PrivateCatalogResults, type CatalogRow } from "@/components/private-catalog";
import { CatHashLocator } from "@/components/cat-hash-locator";
import styles from "../hub.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "County agencies",
  description: "The agency that serves people in each Minnesota county for Department of Human Services disability programs, including counties that share one agency.",
};

const PER_PAGE = 12;
const BASE = "/community-outreach/county-agencies";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Query = { q?: string | string[]; letter?: string | string[]; page?: string | string[]; find?: string | string[] };

export default async function CountyAgenciesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const q = catParam(params.q);
  const letterParam = catParam(params.letter).toUpperCase();
  const find = catParam(params.find);
  const data = getCountyAgencies();
  const all = data.counties.slice().sort((a, b) => a.county.localeCompare(b.county, "en-US"));
  const letter = LETTERS.includes(letterParam) ? letterParam : "";
  // Every county is drawn once; the words typed and the letter buttons narrow the list in the page.
  const rows: CatalogRow[] = all.map(c => ({
    key: `county-${c.fips}`,
    text: `${c.county} ${c.agencyName}`,
    values: { letter: c.county.charAt(0).toUpperCase() },
    node: <CatExpandRow key={c.fips} id={`county-${c.fips}`}
      title={c.county}
      line={c.agencyName}>
      <p>Agency: {c.website ? <SourceLink href={c.website}>{c.agencyName}</SourceLink> : c.agencyName}{c.shared ? <span className={styles.small}> (shared with {c.sharedCounties.filter(n => n !== c.county).join(", ")})</span> : null}</p>
      <p>Phone: {c.phone ? <><SourceLink href={`tel:${c.phone.replace(/[^0-9]/g, "")}`}>{c.phone}</SourceLink> <span className={styles.small}>{c.phoneLabel}</span></> : <span className={styles.small}>Not published</span>}</p>
      <p className={styles.small}>{c.status === "partial" ? "Partly confirmed. " : ""}{c.notes} <SourceLink href={c.sourceUrl}>Source</SourceLink></p>
    </CatExpandRow>,
  }));
  const shared = sharedAgencies();
  return <div className={styles.page}>
    <CatHashLocator prefix="county-" />
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>County agencies</h1>
    <p className={styles.lede}>{data.description}</p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="community-outreach" id="county-agencies" noun="county agency directory" /></details>
    <p className={styles.note}>Counties are where most people meet the disability services system: assessments, waivers and case management happen there. Most counties publish one human services line rather than a separate disability line. Details were checked on {data.checked}; confirm them before you share them.</p>
    {data.tribalNations.map(link => <p key={link.url}>{link.note} <SourceLink href={link.url}>{link.title}</SourceLink>.</p>)}

    <details className="course-more-item">
      <summary><h2 id="shared-title">Counties that share one agency ({shared.length})</h2></summary>
      <ul className="list-disc pl-6">{shared.map(agency => <li key={agency.agencyId}>{agency.website ? <SourceLink href={agency.website}>{agency.agencyName}</SourceLink> : agency.agencyName}: {agency.counties.join(", ")}</li>)}</ul>
    </details>

    <section className={styles.section} aria-labelledby="counties-title">
      <h2 id="counties-title">All {all.length} counties</h2>
      <PrivateCatalogProvider key={letter} basePath={BASE} rows={rows} choices={{ letter }} perPage={PER_PAGE} initial={{ q, page: catParam(params.page), find }}
        jump={{ name: "letter", label: "Counties by first letter", allLabel: "All", options: LETTERS.map(l => ({ value: l, label: l })), keepEmpty: true }}>
        <PrivateCatalogForm className={styles.filters} ariaLabel="Find a county" searchLabel="County or agency" inputId="county-q" buttonLabel="Find" buttonClassName={styles.button} clearLabel="Show all counties" />
        <PrivateCatalogJump />
        <PrivateCatalogResults noun="county" nouns="counties" of={all.length} empty="No county matches that search." listLabel="Counties" pagerLabel="County result pages" />
      </PrivateCatalogProvider>
    </section>

    <details className="course-more-item">
      <summary><h2>Sources</h2></summary>
      <ul className="list-disc pl-6">{data.sources.map(s => <li key={s.id}>{s.url ? <SourceLink href={s.url}>{s.title}</SourceLink> : s.title}: {s.usedFor}</li>)}</ul>
    </details>
    <p><Link href="/community-outreach/how-the-system-connects">How the system connects</Link> · <Link href="/community-outreach/providers">Providers and designated agencies</Link> · <Link href="/community-outreach/county-map">Minnesota county map</Link></p>
  </div>;
}
