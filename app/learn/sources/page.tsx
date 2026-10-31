import { courseLink } from "@/lib/content/courses/published";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./sources.module.css";
import { PageIntro } from "@/components/ui";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { requestedContentScope } from "@/lib/product/request-context";
import { ProgramContextNote } from "@/components/program-context";
import { AUTHORITY_GROUP_LABEL, registerSourcesForStaff, sourceAnchor } from "@/lib/content/source-register";
import { SourceFragmentReveal } from "@/components/source-fragment-reveal";
import { ResourceDownloads } from "@/components/resource-downloads";
import { ResourceFormatLinks } from "@/components/resource-format-links";
import { ResourceThemeNav } from "@/components/resource-theme-nav";
import { RESOURCE_THEMES } from "@/lib/content/resource-organization";
import { matchesSourceTheme } from "@/lib/content/source-organization";

export const metadata: Metadata = { title: "Research and sources" };
export const dynamic = "force-dynamic";

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ theme?: string | string[] }> }) {
  const params = await searchParams;
  const theme = typeof params.theme === "string" ? params.theme : "";
  const selectedTheme = RESOURCE_THEMES.find(item => item.id === theme);
  const scope = await requestedContentScope();
  const surface = await prepareEditableSurface("sources.page", { scope });
  const copy = surface.values;
  const text = (key: string) => stringValue(copy, key);
  const allGroups = registerSourcesForStaff().map(({ group, sources }) => ({ group, sources: sources.filter(source => source.kind === "external" && source.href) })).filter(({ sources }) => sources.length);
  const groups = allGroups.map(({ group, sources }) => ({ group, sources: sources.filter(source => matchesSourceTheme(source, theme)) })).filter(({ sources }) => sources.length);
  const resultCount = groups.reduce((count, group) => count + group.sources.length, 0);
  return (
    <EditableSurfaceRegion surface={surface} className={styles.page}>
      <div className="wrap"><Link href="/learn" className={styles.back}>← Learn</Link></div>
      <PageIntro kicker={text("introKicker")} title={text("introTitle")} lede="Explore books, research, guidance and media used across the program. Choose a subject to find reading and references that connect with your work." />
      <div className="wrap">
        <SourceFragmentReveal />
        <ResourceFormatLinks theme={selectedTheme?.id} current="reading" />
        <section className={styles.selection} aria-labelledby="reading-collection-title">
          <h2 id="reading-collection-title">Books and ideas for your work</h2>
          <p>Explore more than 270 books through summaries, key ideas and questions for reflection, including two suggested books for every Minnesota community brief. Connect a reading with a decision, a conversation or a change you want to make in your work.</p>
          <Link href={selectedTheme ? `/learn/readings?theme=${selectedTheme.id}` : '/learn/readings'}>Explore the reading collection →</Link>
        </section>
        {!theme ? <ResourceThemeNav basePath="/learn/sources" className={styles.themes} gridClassName={styles.themeGrid} /> : null}
        <section className={styles.selection} aria-labelledby="source-selection-title">
          <h2 id="source-selection-title">{selectedTheme?.title ?? (theme ? "Choose a subject" : "All reading and references")}</h2>
          {selectedTheme ? <p>{selectedTheme.description}</p> : null}
          <form action="/learn/sources" method="get" className={styles.filters}>
            <label htmlFor="source-theme">Subject
              <select key={theme} id="source-theme" name="theme" defaultValue={selectedTheme?.id ?? ""}>
                <option value="">All subjects</option>
                {RESOURCE_THEMES.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            <button type="submit">Show sources</button>
            {theme ? <Link href="/learn/sources">View all sources</Link> : null}
          </form>
          <p className={styles.resultCount}>{resultCount} sources{selectedTheme ? " connected with this subject" : ""}. Browse the source groups below.</p>
          {theme && !selectedTheme ? <p>This subject is not available. Choose a subject above or view all sources.</p> : null}
        </section>
        {surface.available ? <details className="max-w-4xl border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download the source register</summary><ResourceDownloads kind="sources" id="register" noun="source register" scope={scope} /></details> : null}
        <nav aria-label="Source groups"><ul className={styles.groupNav}>{groups.map(({ group, sources }) => <li key={group}><a href={`#group-${group}`}>{AUTHORITY_GROUP_LABEL[group]} ({sources.length})</a></li>)}</ul></nav>
        {groups.map(({ group, sources }) => (
          <details key={group} id={`group-${group}`} className={styles.group} open={Boolean(selectedTheme)}>
            <summary id={`group-${group}-title`}>{AUTHORITY_GROUP_LABEL[group]} ({sources.length})</summary>
            <ul className={styles.list}>
              {sources.map(source => {
                return (
                  <li key={source.sourceId} id={sourceAnchor(source)} className={styles.entry}>
                    <h3><a href={courseLink(source.href!)} rel="noreferrer">{source.title}</a></h3>
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
        <ProgramContextNote />
      </div>
    </EditableSurfaceRegion>
  );
}
