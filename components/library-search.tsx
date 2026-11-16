"use client";
/**
 * The Library search without the words in the address. Fixed choices (theme, level, role, type and the like)
 * stay links; the words typed go to the server in a request body and the results are drawn here. When a
 * fixed choice changes, the words follow through this tab's session storage.
 */
import { createContext, useContext, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/app-link";
import { AuthorityPill } from "@/components/ui";
import { ResourceMediaPreview } from "@/components/multimedia/resource-media-preview";
import { ResourceRemove } from "@/components/resource-tools";
import { handOffSearch, postSearch, SEARCH_HANDOFF_KEYS, useHandOff } from "@/components/private-search";
import type { LibraryHit, LibrarySearchResult } from "@/lib/content/library-search";
import styles from "@/app/resources/resource-design.module.css";
import layout from "@/app/resources/library-layout.module.css";

type Found = LibrarySearchResult & { owner: boolean };
type State = { query: string; found: Found | null; busy: boolean; failed: boolean; run: (text: string) => void; clear: () => void; choices: Record<string, string> };
const Context = createContext<State>({ query: "", found: null, busy: false, failed: false, run: () => undefined, clear: () => undefined, choices: {} });
const useLibrarySearch = () => useContext(Context);

/** `choices` are the page's fixed choices from its address; `clearHref` opens the same choices without a search from a link. */
export function LibrarySearchProvider({ choices, linkedQuery, clearHref, children }: { choices: Record<string, string>; linkedQuery: string; clearHref: string; children: ReactNode }) {
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
      setFound(await postSearch<Found>("/api/library-search", { q, choices }));
      setQuery(q);
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }
  function clear() {
    setQuery(""); setFound(null);
    if (linkedQuery) router.push(clearHref);
  }
  useHandOff(SEARCH_HANDOFF_KEYS.library, text => void run(text));
  return <Context.Provider value={{ query, found, busy, failed, run: text => void run(text), clear, choices }}>{children}</Context.Provider>;
}

export function LibraryHideWhileSearching({ children }: { children: ReactNode }) {
  return useLibrarySearch().found ? null : <>{children}</>;
}

/** Opens the Library with other fixed choices; the words typed follow through session storage. */
function openWithChoices(router: ReturnType<typeof useRouter>, params: URLSearchParams, text: string) {
  if (text) handOffSearch(SEARCH_HANDOFF_KEYS.library, text);
  const search = params.toString();
  router.push(search ? `/library?${search}` : "/library");
}

/**
 * The search form. Fixed-choice fields inside it (hidden fields and the theme, level and role lists) keep their
 * names; the text box has none, so its words are never part of a link.
 */
export function LibrarySearchForm({ label, help, placeholder, buttonLabel, initialQuery, clearSearchHref, hidden, children }: {
  label: ReactNode; help: ReactNode; placeholder: string; buttonLabel: ReactNode; initialQuery: string; clearSearchHref: string; hidden?: ReactNode; children?: ReactNode;
}) {
  const router = useRouter();
  const state = useLibrarySearch();
  const [draft, setDraft] = useState(initialQuery);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim().slice(0, 200);
    const params = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, key) => { if (typeof value === "string" && value) params.set(key, value); });
    // The page's choices are the same fixed fields this form carries, so equal maps mean only the words changed.
    const pageChoices = Object.entries(state.choices).filter(([, value]) => value);
    const same = pageChoices.length === [...params.keys()].length && pageChoices.every(([key, value]) => params.get(key) === value);
    if (same) state.run(text);
    else openWithChoices(router, params, text);
  }
  const searching = Boolean(state.query || initialQuery);
  return <form id="find-resource" className={`${styles.search} ${layout.search}`} role="search" aria-label="Find a resource" onSubmit={submit}>
    {hidden}
    <label htmlFor="q" className="block text-lg font-bold">{label}</label>
    <p id="resource-search-help" className={styles.searchHelp}>{help}</p>
    <div className={styles.searchBar}>
      <input id="q" type="search" value={draft} maxLength={200} autoComplete="off" aria-describedby="resource-search-help" placeholder={placeholder} onChange={event => setDraft(event.target.value)} />
      <button type="submit" className="btn btn--primary">{buttonLabel}</button>
      {searching ? <Link className={styles.clearSearch} href={clearSearchHref} aria-label="Clear search" onClick={event => { setDraft(""); if (!initialQuery) { event.preventDefault(); state.clear(); } }}>Clear search</Link> : null}
    </div>
    <p role="status" className="sr-only">{state.busy ? "Searching the Library." : state.failed ? "Search is not available just now. Try again in a moment." : ""}</p>
    {state.failed ? <p>Search is not available just now. Try again in a moment.</p> : null}
    {children}
  </form>;
}

type ResultsCopy = { resultSingular: string; resultPlural: string; noResultsTitle: string; noResultsBody: string };

function HitRow({ hit, owner }: { hit: LibraryHit; owner: boolean }) {
  return <li className={styles.resultRow}>
    <p className={styles.rowMeta}>{hit.meta}</p>
    <div className={styles.rowTitle}><h3><Link href={hit.href}>{hit.title}</Link></h3><AuthorityPill authority={hit.authority} />{owner && hit.removable ? <ResourceRemove contentItemId={hit.id} title={hit.title} compact /> : null}</div>
    <p className={styles.rowSummary}>{hit.excerpt}</p>{hit.expandedNote ? <p className={styles.orderNote}>Includes the program name or its abbreviation.</p> : null}
    {hit.studyHref ? <Link href={hit.studyHref} prefetch={false} className="text-sm font-semibold underline underline-offset-4" aria-label={`Study ${hit.title}`}>Study this course</Link> : null}
    {hit.media ? <details className={styles.mediaDisclosure}><summary>Related example or recording</summary><ResourceMediaPreview resourceId={hit.id} /></details> : null}
  </li>;
}

/** Results for words typed on this page, drawn as the Library draws a search. */
export function LibrarySearchResults({ copy, hasActiveFilters, withoutFiltersHref, fullCatalogHref }: { copy: ResultsCopy; hasActiveFilters: boolean; withoutFiltersHref: string; fullCatalogHref: string }) {
  const router = useRouter();
  const { found, query, clear } = useLibrarySearch();
  const [page, setPage] = useState(1);
  const [shownFor, setShownFor] = useState<Found | null>(null);
  if (found !== shownFor) { setShownFor(found); setPage(1); }
  if (!found) return null;
  const size = 12;
  const pages = Math.max(1, Math.ceil(found.hits.length / size));
  const current = Math.min(pages, Math.max(1, page));
  const start = (current - 1) * size;
  const end = Math.min(found.hits.length, current * size);
  const visible = found.hits.slice(start, end);
  const show = (next: number) => { setPage(next); document.getElementById("results-title")?.scrollIntoView(); };
  const pagination = pages > 1 ? <nav aria-label="Resource result pages" className={styles.recoveryActions}>
    {current > 1 ? <button type="button" className="text-button" onClick={() => show(current - 1)}>Previous resources</button> : null}
    <span>Page {current} of {pages}</span>
    {current < pages ? <button type="button" className="text-button" onClick={() => show(current + 1)}>Next resources</button> : null}
  </nav> : null;
  const recovery = <div className={styles.emptyState}>
    <p>{copy.noResultsBody}</p>
    <p>Try a shorter phrase or a resource title.{hasActiveFilters ? " You can also remove a filter while keeping your search." : ""}</p>
    <div className={styles.recoveryActions}>
      {hasActiveFilters ? <button type="button" className="text-button" onClick={() => { handOffSearch(SEARCH_HANDOFF_KEYS.library, query); router.push(withoutFiltersHref); }}>Search without filters</button> : null}
      <button type="button" className="text-button" aria-label="Clear search and keep selected filters" onClick={clear}>Clear search</button>
      <Link href={fullCatalogHref}>Browse all resources</Link>
    </div>
  </div>;
  return <>
    {found.destinations.length ? <section className={styles.startingPoints} aria-labelledby="suggested-destinations"><h2 id="suggested-destinations">Go straight to the work</h2><p>These program pages may help alongside the Library results below.</p><ul>{found.destinations.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link><p>{link.reason}</p></li>)}</ul></section> : null}
    <section className={styles.collection} aria-labelledby="results-title">
      <div className={styles.collectionHeading}><div>
        <p className={styles.resultContext}>Search results for “{query}”</p>
        <h2 id="results-title" className="text-xl font-extrabold">
          {found.hits.length ? `${found.hits.length} ${found.hits.length === 1 ? copy.resultSingular : copy.resultPlural}` : found.guides.length ? "No matching library resources" : copy.noResultsTitle}
        </h2>
      </div>{found.hits.length ? <p className={styles.orderNote}>Most relevant first</p> : null}</div>
      <p role="status" className="sr-only">{found.hits.length} {found.hits.length === 1 ? "result" : "results"} found.</p>
      {!found.hits.length ? recovery : null}
      {found.hits.length > visible.length ? <p className={styles.moreResults}>Showing {start + 1}–{end} of {found.hits.length} results.</p> : null}
      <ul className={styles.results}>{visible.map(hit => <HitRow key={hit.id} hit={hit} owner={found.owner} />)}</ul>
      {pagination}
    </section>
    {found.guides.length ? <details id="practical-guides" className={`${styles.programGuides} ${layout.guides}`} open>
      <summary>Practical guides <span>({found.guides.length})</span></summary>
      <p>Connect existing guidance with a practical task, then prepare a next step for your work.</p>
      <ul className={styles.guideList}>{found.guides.map(guide => <li key={guide.slug}>
        <p className={styles.guidePurpose}>{guide.purpose}</p>
        <h3><Link href={`/practice-guides/${guide.slug}`}>{guide.title}</Link></h3>
        <p>{guide.summary}</p>
      </li>)}</ul>
    </details> : null}
  </>;
}
