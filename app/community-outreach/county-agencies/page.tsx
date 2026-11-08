import type { Metadata } from "next";
import Link from "next/link";
import { getCountyAgencies, sharedAgencies } from "@/lib/content/hub/county-agencies";
import { catHref, catPaginate, catParam } from "@/lib/cat-paging";
import { CatExpandRow, CatList, CatPager, CatResultStatus, catStyles } from "@/components/cat-list";
import { CatHashLocator } from "@/components/cat-hash-locator";
import styles from "../hub.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "County agencies",
  description: "The agency that serves people in each Minnesota county for Department of Human Services disability programs, including counties that share one agency.",
};

const PER_PAGE = 20;
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
  const query = q.toLowerCase();
  const searched = all.filter(c => !query || `${c.county} ${c.agencyName}`.toLowerCase().includes(query));
  const present = new Set(searched.map(c => c.county.charAt(0).toUpperCase()));
  const letter = LETTERS.includes(letterParam) && present.has(letterParam) ? letterParam : "";
  const counties = searched.filter(c => !letter || c.county.toUpperCase().startsWith(letter));
  const page = catPaginate(counties, catParam(params.page), PER_PAGE, find ? c => `county-${c.fips}` === find : undefined);
  const choices = { q, letter };
  const shared = sharedAgencies();
  return <div className={styles.page}>
    <CatHashLocator prefix="county-" />
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>County agencies</h1>
    <p className={styles.lede}>{data.description}</p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="community-outreach" id="county-agencies" noun="county agency directory" /></details>
    <p className={styles.note}>Counties are where most people meet the disability services system: assessments, waivers and case management happen there. Most counties publish one human services line rather than a separate disability line. Details were checked on {data.checked}; confirm them before you share them.</p>
    {data.tribalNations.map(link => <p key={link.url}>{link.note} <a href={link.url}>{link.title}</a>.</p>)}

    <details className="course-more-item">
      <summary><h2 id="shared-title">Counties that share one agency ({shared.length})</h2></summary>
      <ul className="list-disc pl-6">{shared.map(agency => <li key={agency.agencyId}>{agency.website ? <a href={agency.website}>{agency.agencyName}</a> : agency.agencyName}: {agency.counties.join(", ")}</li>)}</ul>
    </details>

    <section className={styles.section} aria-labelledby="counties-title">
      <h2 id="counties-title">All {all.length} counties</h2>
      <form method="get" action={BASE} className={styles.filters} role="search" aria-label="Find a county">
        <label htmlFor="county-q">County or agency<input id="county-q" name="q" type="search" defaultValue={q} /></label>
        {letter ? <input type="hidden" name="letter" value={letter} /> : null}
        <button className={styles.button} type="submit">Find</button>
        {q || letter ? <Link href={BASE}>Show all counties</Link> : null}
      </form>
      <nav className={catStyles.jump} aria-label="Counties by first letter">
        <ul>
          <li><Link href={catHref(BASE, { q })} aria-current={!letter ? "page" : undefined}>All</Link></li>
          {LETTERS.map(l => <li key={l}>{present.has(l)
            ? <Link href={catHref(BASE, { q, letter: l })} aria-current={l === letter ? "page" : undefined}>{l}</Link>
            : <span className={catStyles.none} aria-hidden="true">{l}</span>}</li>)}
        </ul>
      </nav>
      <CatResultStatus page={page} noun="county" nouns="counties" of={all.length} empty="No county matches that search." />
      {page.items.length ? <CatList label="Counties">
        {page.items.map(c => <CatExpandRow key={c.fips} id={`county-${c.fips}`}
          title={c.county}
          line={c.agencyName}>
          <p>Agency: {c.website ? <a href={c.website}>{c.agencyName}</a> : c.agencyName}{c.shared ? <span className={styles.small}> (shared with {c.sharedCounties.filter(n => n !== c.county).join(", ")})</span> : null}</p>
          <p>Phone: {c.phone ? <><a href={`tel:${c.phone.replace(/[^0-9]/g, "")}`}>{c.phone}</a> <span className={styles.small}>{c.phoneLabel}</span></> : <span className={styles.small}>Not published</span>}</p>
          <p className={styles.small}>{c.status === "partial" ? "Partly confirmed. " : ""}{c.notes} <a href={c.sourceUrl}>Source</a></p>
        </CatExpandRow>)}
      </CatList> : null}
      <CatPager page={page} basePath={BASE} params={choices} label="County result pages" />
    </section>

    <details className="course-more-item">
      <summary><h2>Sources</h2></summary>
      <ul className="list-disc pl-6">{data.sources.map(s => <li key={s.id}>{s.url ? <a href={s.url}>{s.title}</a> : s.title}: {s.usedFor}</li>)}</ul>
    </details>
    <p><Link href="/community-outreach/how-the-system-connects">How the system connects</Link> · <Link href="/community-outreach/providers">Providers and designated agencies</Link> · <Link href="/community-outreach/county-map">Minnesota county map</Link></p>
  </div>;
}
