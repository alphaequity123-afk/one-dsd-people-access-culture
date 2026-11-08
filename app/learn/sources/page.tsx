import { courseLink } from "@/lib/content/courses/published";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./sources.module.css";
import { PageIntro } from "@/components/ui";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { requestedContentScope } from "@/lib/product/request-context";
import { ProgramContextNote } from "@/components/program-context";
import { AUTHORITY_GROUP_LABEL, registerSourcesForStaff, sourceAnchor, type AuthorityGroup, type RegisterSource } from "@/lib/content/source-register";
import { ResourceDownloads } from "@/components/resource-downloads";
import { ResourceFormatLinks } from "@/components/resource-format-links";
import { ResourceThemeNav } from "@/components/resource-theme-nav";
import { RESOURCE_THEMES } from "@/lib/content/resource-organization";
import { matchesSourceTheme } from "@/lib/content/source-organization";
import { catHref, catMatches, catPaginate, catParam, catWords } from "@/lib/cat-paging";
import { CatList, CatPager, CatResultStatus, CatRow } from "@/components/cat-list";
import { CatHashLocator } from "@/components/cat-hash-locator";

export const metadata: Metadata = { title: "Research and sources" };
export const dynamic = "force-dynamic";

const PER_PAGE = 25;
const BASE = "/learn/sources";

type Query = { theme?: string | string[]; group?: string | string[]; q?: string | string[]; page?: string | string[]; find?: string | string[] };

export default async function SourcesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const theme = catParam(params.theme);
  const q = catParam(params.q);
  const find = catParam(params.find);
  const selectedTheme = RESOURCE_THEMES.find(item => item.id === theme);
  const scope = await requestedContentScope();
  const surface = await prepareEditableSurface("sources.page", { scope });
  const copy = surface.values;
  const text = (key: string) => stringValue(copy, key);
  const allGroups = registerSourcesForStaff().map(({ group, sources }) => ({ group, sources: sources.filter(source => source.kind === "external" && source.href) })).filter(({ sources }) => sources.length);
  const allCount = allGroups.reduce((count, group) => count + group.sources.length, 0);
  const words = catWords(q);
  const groups = allGroups.map(({ group, sources }) => ({ group, sources: sources.filter(source => matchesSourceTheme(source, theme) && catMatches(words, source.title, source.host)) })).filter(({ sources }) => sources.length);
  const groupParam = catParam(params.group);
  const selectedGroup = groups.some(g => g.group === groupParam) ? groupParam as AuthorityGroup : "";
  const rows: { group: AuthorityGroup; source: RegisterSource }[] = groups
    .filter(({ group }) => !selectedGroup || group === selectedGroup)
    .flatMap(({ group, sources }) => sources.map(source => ({ group, source })));
  const page = catPaginate(rows, catParam(params.page), PER_PAGE, find ? row => sourceAnchor(row.source) === find : undefined);
  const choices = { theme, q, group: selectedGroup };
  const filtered = Boolean(theme || q || selectedGroup);
  return (
    <EditableSurfaceRegion surface={surface} className={styles.page}>
      <div className="wrap"><Link href="/learn" className={styles.back}>← Learn</Link></div>
      <PageIntro kicker={text("introKicker")} title={text("introTitle")} lede="Explore books, research, guidance and media used across the program. Choose a subject to find reading and references that connect with your work." />
      <div className="wrap">
        <CatHashLocator prefix="source-" />
        <ResourceFormatLinks theme={selectedTheme?.id} current="reading" />
        <section className={styles.selection} aria-labelledby="reading-collection-title">
          <h2 id="reading-collection-title">Books and ideas for your work</h2>
          <p>Explore more than 270 books through summaries, key ideas and questions for reflection, including two suggested books for every Minnesota community brief. Connect a reading with a decision, a conversation or a change you want to make in your work.</p>
          <Link href={selectedTheme ? `/learn/readings?theme=${selectedTheme.id}` : "/learn/readings"}>Explore the reading collection →</Link>
        </section>
        {!theme ? <details className="course-more-item"><summary>Explore by theme</summary><ResourceThemeNav basePath="/learn/sources" className={styles.themes} gridClassName={styles.themeGrid} /></details> : null}
        <section className={styles.selection} aria-labelledby="source-selection-title">
          <h2 id="source-selection-title">{selectedTheme?.title ?? (theme ? "Choose a subject" : "All reading and references")}</h2>
          {selectedTheme ? <p>{selectedTheme.description}</p> : null}
          <form action={BASE} method="get" className={styles.filters} role="search" aria-label="Find a source">
            <label htmlFor="source-q">Search
              <input id="source-q" type="search" name="q" defaultValue={q} placeholder="Title or website" className={styles.search} />
            </label>
            <label htmlFor="source-theme">Subject
              <select key={theme} id="source-theme" name="theme" defaultValue={selectedTheme?.id ?? ""}>
                <option value="">All subjects</option>
                {RESOURCE_THEMES.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            <label htmlFor="source-group">Kind of source
              <select id="source-group" name="group" defaultValue={selectedGroup}>
                <option value="">All kinds of source</option>
                {allGroups.map(({ group }) => <option key={group} value={group}>{AUTHORITY_GROUP_LABEL[group]}</option>)}
              </select>
            </label>
            <button type="submit">Show sources</button>
            {filtered ? <Link href={BASE}>View all sources</Link> : null}
          </form>
          {theme && !selectedTheme ? <p>This subject is not available. Choose a subject above or view all sources.</p> : null}
        </section>
        {surface.available ? <details className="max-w-4xl border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download the source register</summary><ResourceDownloads kind="sources" id="register" noun="source register" scope={scope} /></details> : null}
        <nav aria-label="Source groups"><ul className={styles.groupNav}>{groups.map(({ group, sources }) => <li key={group} id={`group-${group}`}><Link href={catHref(BASE, choices, { group })} aria-current={group === selectedGroup ? "page" : undefined}>{AUTHORITY_GROUP_LABEL[group]} ({sources.length})</Link></li>)}</ul></nav>
        <CatResultStatus page={page} noun="source" nouns="sources" of={allCount} />
        {page.items.length ? <CatList label="Sources">
          {page.items.map(({ group, source }) => <CatRow key={source.sourceId} id={sourceAnchor(source)}
            title={<a href={courseLink(source.href!)} rel="noreferrer">{source.title}</a>}
            meta={[source.host?.replace(/^www\./, ""), AUTHORITY_GROUP_LABEL[group]].filter(Boolean).join(" · ")} />)}
        </CatList> : null}
        <CatPager page={page} basePath={BASE} params={choices} label="Source result pages" />
        <ProgramContextNote />
      </div>
    </EditableSurfaceRegion>
  );
}
