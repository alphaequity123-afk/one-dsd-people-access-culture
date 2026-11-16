"use client";
/**
 * Search inside the CLAS collection. The words stay in this page: the server is asked which items contain
 * them through a request body, and the page shows only those items. Nothing goes into the address.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { postSearch } from "@/components/private-search";

type ClasSearchState = { query: string; matches: Set<string> | null; search: (text: string) => void; busy: boolean; failed: boolean; clears: number };
const Context = createContext<ClasSearchState>({ query: "", matches: null, search: () => undefined, busy: false, failed: false, clears: 0 });

export function ClasSearchProvider({ initialQuery = "", initialMatches = null, openPanels, children }: { initialQuery?: string; initialMatches?: string[] | null; openPanels: string[]; children: ReactNode }) {
  const [query, setQuery] = useState(initialQuery);
  const [matches, setMatches] = useState<Set<string> | null>(initialMatches ? new Set(initialMatches) : null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [clears, setClears] = useState(0);

  async function search(text: string) {
    const q = text.trim().slice(0, 200);
    setFailed(false);
    if (!q) { setQuery(""); setMatches(null); setClears(n => n + 1); return; }
    setBusy(true);
    try {
      const payload = await postSearch<{ matches?: string[] }>("/api/learn/clas-search", { q });
      setMatches(new Set(payload.matches ?? []));
      setQuery(q);
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }

  // A search opens the panels that hold results, as the page did when it was searched from the address.
  useEffect(() => {
    if (!query) return;
    for (const id of openPanels) (document.getElementById(id) as HTMLDetailsElement | null)?.setAttribute("open", "");
  }, [query, openPanels]);

  return <Context.Provider value={{ query, matches, search: text => void search(text), busy, failed, clears }}>{children}</Context.Provider>;
}

const useClasSearch = () => useContext(Context);
const shows = (state: ClasSearchState, key: string) => !state.query || !state.matches || state.matches.has(key);

export function ClasSearchForm() {
  // Clearing the search empties the box.
  return <ClasSearchBox key={useClasSearch().clears} />;
}

function ClasSearchBox() {
  const state = useClasSearch();
  const [draft, setDraft] = useState(state.query);
  return <form className="clas-search" role="search" onSubmit={event => { event.preventDefault(); state.search(draft); }}>
    <label htmlFor="q">Find something in this collection</label>
    <div>
      <input id="q" type="search" value={draft} maxLength={200} autoComplete="off" onChange={event => setDraft(event.target.value)} placeholder="Try interpretation, leadership or language access" />
      <button>Search</button>
      {state.query ? <button type="button" className="text-button" onClick={() => state.search("")}>Clear</button> : null}
    </div>
    <p role="status" className="sr-only">{state.busy ? "Searching the collection." : state.failed ? "Search is not available just now. Try again in a moment." : ""}</p>
    {state.failed ? <p>Search is not available just now. Try again in a moment.</p> : null}
  </form>;
}

/** Shows its children unless a search is active and this item does not contain the words. */
export function ClasItem({ itemKey, children }: { itemKey: string; children: ReactNode }) {
  return shows(useClasSearch(), itemKey) ? <>{children}</> : null;
}

/** How many of these items are shown. */
export function ClasCount({ keys }: { keys: string[] }) {
  const state = useClasSearch();
  return <>{keys.filter(key => shows(state, key)).length}</>;
}

/** The collection's results, or a note when nothing in the collection contains the words. */
export function ClasResults({ keys, children }: { keys: string[]; children: ReactNode }) {
  const state = useClasSearch();
  if (state.query && state.matches && !keys.some(key => state.matches!.has(key))) {
    return <p role="status" className="clas-note">Nothing in this collection matches “{state.query}”. Try a different word, or <button type="button" className="text-button" onClick={() => state.search("")}>see the whole collection</button>.</p>;
  }
  return <>{children}</>;
}
