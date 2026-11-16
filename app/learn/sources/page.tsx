import type { Metadata } from "next";
import Link from "@/components/app-link";
import styles from "./sources.module.css";
import { PageIntro } from "@/components/ui";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { requestedContentScope } from "@/lib/product/request-context";
import { ProgramContextNote } from "@/components/program-context";
import { AUTHORITY_GROUP_LABEL, registerReadingHref, registerSourcesForStaff, sourceAnchor, type AuthorityGroup, type RegisterSource } from "@/lib/content/source-register";
import { ResourceDownloads } from "@/components/resource-downloads";
import { ResourceFormatLinks } from "@/components/resource-format-links";
import { ResourceThemeNav } from "@/components/resource-theme-nav";
import { RESOURCE_THEMES } from "@/lib/content/resource-organization";
import { matchesSourceTheme } from "@/lib/content/source-organization";
import { catParam } from "@/lib/cat-paging";
import { CatRow } from "@/components/cat-list";
import { PrivateCatalogForm, PrivateCatalogJump, PrivateCatalogProvider, PrivateCatalogResults, type CatalogRow } from "@/components/private-catalog";
import { CatHashLocator } from "@/components/cat-hash-locator";
import { unavailableExternalUrl } from "@/lib/content/external-readings";

export const metadata: Metadata = { title: "Research and sources" };
export const dynamic = "force-dynamic";

const PER_PAGE = 12;
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
  const allGroups = registerSourcesForStaff().map(({ group, sources }) => ({ group, sources: sources.filter(source => source.kind === "external" && source.href && !unavailableExternalUrl(source.href)) })).filter(({ sources }) => sources.length);
  const allCount = allGroups.reduce((count, group) => count + group.sources.length, 0);
  // The subject is a fixed choice in the address (the page is drawn around it). Every source for that subject is
  // drawn once; the words typed and the kind-of-source buttons narrow the rows in the page.
  const rows: CatalogRow[] = allGroups.flatMap(({ group, sources }) => sources.filter(source => matchesSourceTheme(source, theme)).map((source: RegisterSource) => ({
    key: sourceAnchor(source),
    text: `${source.title} ${source.host ?? ""}`,
    values: { group },
    node: <CatRow key={source.sourceId} id={sourceAnchor(source)}
      title={<Link href={registerReadingHref(source)}>{source.title}</Link>}
      meta={[source.host?.replace(/^www\./, ""), AUTHORITY_GROUP_LABEL[group]].filter(Boolean).join(" · ")} />,
  })));
  const groupParam = catParam(params.group);
  const selectedGroup = allGroups.some(g => g.group === groupParam) ? groupParam as AuthorityGroup : "";
  const choices = { theme, group: selectedGroup };
  return (
    <EditableSurfaceRegion surface={surface} className={styles.page}>
      <div className="wrap"><Link href="/learn" className={styles.back}>Learn</Link></div>
      <PageIntro kicker={text("introKicker")} title={text("introTitle")} lede="Explore books, research, guidance and media used across the program. Choose a subject to find reading and references that connect with your work." />
      <div className="wrap">
        <CatHashLocator prefix="source-" />
        <ResourceFormatLinks theme={selectedTheme?.id} current="reading" />
        <section className={styles.selection} aria-labelledby="reading-collection-title">
          <h2 id="reading-collection-title">Books and ideas for your work</h2>
          <p>Explore more than 270 books through summaries, key ideas and questions for reflection, including two suggested books for every Minnesota community brief. Connect a reading with a decision, a conversation or a change you want to make in your work.</p>
          <Link href={selectedTheme ? `/learn/readings?theme=${selectedTheme.id}` : "/learn/readings"}>Explore the reading collection</Link>
        </section>
        {!theme ? <details className="course-more-item"><summary>Explore by theme</summary><ResourceThemeNav basePath="/learn/sources" className={styles.themes} gridClassName={styles.themeGrid} /></details> : null}
        <PrivateCatalogProvider key={`${theme}|${selectedGroup}`} basePath={BASE} rows={rows} choices={choices} perPage={PER_PAGE} initial={{ q, page: catParam(params.page), find }}
          lists={[{ name: "theme", label: "Subject", allLabel: "All subjects", options: RESOURCE_THEMES.map(item => ({ value: item.id, label: item.title })), navigates: true }]}
          jump={{ name: "group", label: "Source groups", allLabel: "All kinds of source", options: allGroups.map(({ group }) => ({ value: group, label: AUTHORITY_GROUP_LABEL[group] })), counts: true, listClassName: styles.groupNav, itemIdPrefix: "group-" }}>
          <section className={styles.selection} aria-labelledby="source-selection-title">
            <h2 id="source-selection-title">{selectedTheme?.title ?? (theme ? "Choose a subject" : "All reading and references")}</h2>
            {selectedTheme ? <p>{selectedTheme.description}</p> : null}
            <PrivateCatalogForm className={styles.filters} ariaLabel="Find a source" searchLabel="Search" inputId="source-q" placeholder="Title or website" inputClassName={styles.search} buttonLabel="Show sources" clearLabel="View all sources" />
            {theme && !selectedTheme ? <p>This subject is not available. Choose a subject above or view all sources.</p> : null}
          </section>
          {surface.available ? <details className="max-w-4xl border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download the source register</summary><ResourceDownloads kind="sources" id="register" noun="source register" scope={scope} /></details> : null}
          <PrivateCatalogJump />
          <PrivateCatalogResults noun="source" nouns="sources" of={allCount} listLabel="Sources" pagerLabel="Source result pages" />
        </PrivateCatalogProvider>
        <ProgramContextNote />
      </div>
    </EditableSurfaceRegion>
  );
}
