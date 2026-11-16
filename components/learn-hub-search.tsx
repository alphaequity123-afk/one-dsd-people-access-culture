"use client";
/**
 * Search the Learn catalog without putting the words in the address. Theme, level and format are fixed
 * choices and stay links (/learn?theme=…); the words typed go to the server in a request body and the
 * results are drawn here. Words typed on the short Learn page arrive through this tab's session storage.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/app-link";
import { AuthorityPill } from "@/components/ui";
import { CatResultStatus } from "@/components/cat-list";
import { Hub2More } from "@/components/hub2-choices";
import { LearningTile } from "@/components/learning-tile";
import { ResourceRemove } from "@/components/resource-tools";
import { WaterCollectionFeature } from "@/components/water-collection-feature";
import { ButtonPager, handOffSearch, postSearch, SEARCH_HANDOFF_KEYS, useHandOff } from "@/components/private-search";
import { catPaginate } from "@/lib/cat-paging";
import type { HubSearchResult } from "@/lib/learning/hub-search";
import styles from "@/app/learn/learning-family.module.css";
import preview from "@/app/learn/learning-preview.module.css";

type Choices = { theme: string; type: string; level: string };
type Found = HubSearchResult & { owner: boolean };
type State = { query: string; found: Found | null; busy: boolean; failed: boolean; run: (text: string) => void; clear: () => void };
const Context = createContext<State>({ query: "", found: null, busy: false, failed: false, run: () => undefined, clear: () => undefined });
const useLearnSearch = () => useContext(Context);

function learnHref(choices: Choices): string {
  const params = new URLSearchParams();
  for (const key of ["theme", "level", "type"] as const) if (choices[key]) params.set(key, choices[key]);
  params.set("browse", "all");
  return `/learn?${params.toString()}#catalog`;
}

/** Holds the words typed on this page and the results drawn for them. `linkedQuery` is a search that arrived in a link. */
export function LearnSearchProvider({ choices, linkedQuery, children }: { choices: Choices; linkedQuery: string; children: ReactNode }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function run(text: string) {
    const q = text.trim().slice(0, 200);
    setFailed(false);
    if (!q) { clear(); return; }
    setBusy(true);
    try {
      setFound(await postSearch<Found>("/api/learn/search", { q, ...choices }));
      setQuery(q);
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }
  function clear() {
    setQuery(""); setFound(null);
    // A search that arrived in a link is cleared by opening the catalog with the same fixed choices.
    if (linkedQuery) router.push(learnHref(choices));
  }

  useHandOff(SEARCH_HANDOFF_KEYS.learn, text => void run(text));
  return <Context.Provider value={{ query, found, busy, failed, run: text => void run(text), clear }}>{children}</Context.Provider>;
}

/** Page parts that a typed search replaces with its own results. */
export function HideWhileSearching({ children }: { children: ReactNode }) {
  return useLearnSearch().found ? null : <>{children}</>;
}

type FormCopy = { searchLabel: string; searchButton: string; clearLabel: string; formatLabel: string; allFormats: string };
type Option = { value: string; label: string };

/** The catalog search form: words stay in the page, fixed choices open as a link. */
export function LearnSearchForm({ copy, initial, themes, legacyTheme, formats }: { copy: FormCopy; initial: Choices & { q: string }; themes: Option[]; legacyTheme?: Option; formats: Option[] }) {
  const router = useRouter();
  const state = useLearnSearch();
  const [draft, setDraft] = useState(initial.q);
  const [picked, setPicked] = useState<Choices>({ theme: initial.theme, type: initial.type, level: initial.level });
  const choicesChanged = picked.theme !== initial.theme || picked.type !== initial.type || picked.level !== initial.level;
  const anything = Boolean(state.query || initial.q || initial.theme || initial.type || initial.level);
  const pick = (key: keyof Choices) => (value: string) => setPicked(current => ({ ...current, [key]: value }));
  return <form role="search" className={styles.search} onSubmit={event => {
    event.preventDefault();
    const text = draft.trim().slice(0, 200);
    if (choicesChanged) {
      // Fixed choices are links; the words follow through this tab's session storage, not the address.
      if (text) handOffSearch(SEARCH_HANDOFF_KEYS.learn, text);
      router.push(learnHref(picked));
    } else state.run(text);
  }}>
    <label htmlFor="hub-q">{copy.searchLabel}</label>
    <div className={styles.query}><input id="hub-q" type="search" value={draft} maxLength={200} autoComplete="off" onChange={event => setDraft(event.target.value)} /><button type="submit">{copy.searchButton}</button></div>
    <details className={preview.filterOptions} open={Boolean(initial.theme || initial.type || initial.level) || undefined}>
      <summary>Filter by theme, level, or format</summary>
      <div className={styles.filters}>
        <label>Theme<select value={picked.theme} onChange={event => pick("theme")(event.target.value)}><option value="">All themes</option>{legacyTheme ? <option value={legacyTheme.value}>{legacyTheme.label}</option> : null}{themes.map(theme => <option key={theme.value} value={theme.value}>{theme.label}</option>)}</select></label>
        <label>Learning level<select value={picked.level} onChange={event => pick("level")(event.target.value)}><option value="">All levels and practical resources</option><option value="foundation">Foundation</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
        <label>{copy.formatLabel}<select value={picked.type} onChange={event => pick("type")(event.target.value)}><option value="">{copy.allFormats}</option>{formats.map(format => <option key={format.value} value={format.value}>{format.label}</option>)}</select></label>
      </div>
    </details>
    {anything ? <Link className={preview.clearFilters} href="/learn" onClick={() => { setDraft(""); state.clear(); }}>{copy.clearLabel}</Link> : null}
    <p role="status" className="sr-only">{state.busy ? "Searching." : state.failed ? "Search is not available just now. Try again in a moment." : ""}</p>
    {state.failed ? <p>Search is not available just now. Try again in a moment.</p> : null}
  </form>;
}

type ResultsCopy = { countSingular: string; countLabel: string; emptyTitle: string; emptyBody: string; coursesTitle: string; resourcesTitle: string; resourcesAvailable: boolean };

/** Results for words typed on this page, drawn as the catalog draws a search. */
export function LearnSearchResults({ copy }: { copy: ResultsCopy }) {
  const { found } = useLearnSearch();
  const [page, setPage] = useState(1);
  const [shownFor, setShownFor] = useState<Found | null>(null);
  if (found !== shownFor) { setShownFor(found); setPage(1); }
  if (!found) return null;
  const all = [...found.learning.map(tile => ({ id: tile.item.id, tile })), ...found.resources.map(row => ({ id: row.id, row }))];
  const catalogPage = catPaginate(all, String(page), 12);
  const visibleIds = new Set(catalogPage.items.map(item => item.id));
  const learning = found.learning.filter(tile => visibleIds.has(tile.item.id));
  const resources = found.resources.filter(row => visibleIds.has(row.id));
  const show = (next: number) => { setPage(next); document.getElementById("catalog")?.scrollIntoView(); };
  return <>
    <p role="status" className={styles.resultCount}>{found.total} {found.total === 1 ? copy.countSingular : copy.countLabel}</p>
    {!found.total ? <div><h2>{copy.emptyTitle}</h2><p>{copy.emptyBody}</p></div> : null}
    {found.waterMatch ? <div className="mb-6"><WaterCollectionFeature /></div> : null}
    <CatResultStatus page={catalogPage} noun="resource" nouns="resources" />
    {learning.length ? <section className={styles.section} aria-labelledby="modules-title">
      <div className={styles.sectionHeading}><h2 id="modules-title">{copy.coursesTitle}</h2><span>{found.learning.length} to explore</span></div>
      <ul className={styles.courseGrid}>{learning.map(tile => <li key={tile.item.id}><LearningTile showLevel item={tile.item} owner={found.owner} href={tile.href} presentation={tile.presentation} studyAvailable={found.studyAvailable} /></li>)}</ul>
    </section> : null}
    {copy.resourcesAvailable && resources.length ? <section className={styles.section} aria-labelledby="hub-resources-title"><div className={styles.sectionHeading}><h2 id="hub-resources-title">{copy.resourcesTitle}</h2><span>{found.resources.length} resources</span></div><ul className={styles.resourceList}>{resources.map(item => <li key={item.id} data-hub-resource={item.id}><span className={styles.resourceKind}>{item.kind}</span><h3><Link href={`/library/${item.id}`}>{item.title}</Link></h3><p>{item.summary}</p><AuthorityPill authority={item.authority} />{found.owner ? <> <ResourceRemove contentItemId={item.id} title={item.title} compact /></> : null}</li>)}</ul></section> : null}
    <ButtonPager page={catalogPage} label="Learning result pages" onPage={show} />
    {found.podcasts.length ? <Hub2More headingId="podcasts-title" title="Podcasts" open><p>Listen in the audio library, where every episode comes with chapters and a full transcript.</p><ul className={styles.pathList}>{found.podcasts.map(podcast => <li key={podcast.id}><Link href={`/audio-library#podcast-${podcast.id}`}>{podcast.title}</Link></li>)}</ul></Hub2More> : null}
  </>;
}

/** The short Learn page's search: the words go to the full catalog through this tab's session storage. */
export function LearnLandingSearch() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  return <form className="pilot-topic-search" role="search" onSubmit={event => {
    event.preventDefault();
    const text = draft.trim().slice(0, 200);
    if (text) handOffSearch(SEARCH_HANDOFF_KEYS.learn, text);
    router.push("/learn?browse=all#catalog");
  }}>
    <label htmlFor="pilot-learning-search">Search learning and resources</label>
    <div><input id="pilot-learning-search" type="search" value={draft} maxLength={200} autoComplete="off" onChange={event => setDraft(event.target.value)} /><button type="submit">Search</button></div>
  </form>;
}
