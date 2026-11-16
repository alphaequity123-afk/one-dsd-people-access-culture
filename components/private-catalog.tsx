"use client";
/**
 * Long catalog pages (counties, organizations, policies, readings, sources, agencies) whose search words stay in
 * the page (owner rule 2026-11-16: typed text never goes into a web address). The server draws every row once;
 * the words, the lists and the letter or group buttons narrow them here. Fixed choices from a link (for example
 * ?kind=statute or ?theme=disability) start the page; a list marked `navigates` reloads the page with that fixed
 * choice in the address and carries the words across in this tab's session storage. Catalogs too large to search
 * in the browser send the words in a request body to /api/catalog-search, which keeps nothing.
 */
import { createContext, useContext, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CatList, CatResultStatus, catStyles } from "@/components/cat-list";
import { ButtonPager, handOffSearch, postSearch, useHandOff } from "@/components/private-search";
import { catHref, catMatches, catPaginate, catWords, type CatPage } from "@/lib/cat-paging";
import { BROWSER_STORAGE_KEYS } from "@/lib/client/storage-keys";
import type { CatalogSearchName } from "@/lib/content/catalog-search";

export type CatalogRow = {
  /** Stable id: matched against the words endpoint and against ?find= from a link to one entry. */
  key: string;
  /** Words searched in the browser when the catalog has no endpoint. */
  text?: string;
  /** This row's value for each list and for the letter or group buttons. */
  values?: Record<string, string | readonly string[]>;
  node: ReactNode;
};

export type CatalogChoice = {
  name: string;
  label: ReactNode;
  allLabel: string;
  options: readonly { value: string; label: string }[];
  /** The server draws the page around this choice, so changing it reloads the page with the choice in the address. */
  navigates?: boolean;
};

export type CatalogJump = {
  name: string;
  /** Accessible name of the button row. */
  label: string;
  options: readonly { value: string; label: string }[];
  /** Label of the button that shows every row; leave out for no such button. */
  allLabel?: string;
  /** Show how many rows each button holds. */
  counts?: boolean;
  /** Draw buttons with no rows as plain letters instead of leaving them out. */
  keepEmpty?: boolean;
  /** Class of the nav; the letter-row style when left out. */
  className?: string;
  /** Class of the list inside the nav. */
  listClassName?: string;
  /** Each button's list item gets the id `${itemIdPrefix}${value}`, so older links to a group still land on it. */
  itemIdPrefix?: string;
};

type Config = {
  basePath: string;
  rows: CatalogRow[];
  /** Fixed choices the address carried, already checked by the server. */
  choices: Record<string, string>;
  lists?: CatalogChoice[];
  jump?: CatalogJump;
  endpoint?: CatalogSearchName;
  perPage: number;
  initial: { q: string; page: string; find?: string };
};

type Applied = { q: string; lists: Record<string, string>; jump: string; page: string; find: string };

type State = Config & {
  applied: Applied;
  matches: Set<string> | null;
  busy: boolean;
  failed: boolean;
  submit: (q: string, lists: Record<string, string>) => void;
  setJump: (value: string) => void;
  setPage: (page: number) => void;
  reset: () => void;
  shown: CatalogRow[];
  page: CatPage<CatalogRow>;
  jumpRows: CatalogRow[];
  filtered: boolean;
  /** Changes when words arrive from another page or everything is cleared, so the form redraws with them. */
  formVersion: number;
};

const Context = createContext<State | null>(null);
function useCatalog(): State {
  const state = useContext(Context);
  if (!state) throw new Error("PrivateCatalog parts must sit inside PrivateCatalogProvider.");
  return state;
}

const same = (a: string, b: string) => a.trim().toLocaleLowerCase("en-US") === b.trim().toLocaleLowerCase("en-US");
function holds(value: string | readonly string[] | undefined, wanted: string): boolean {
  if (!wanted) return true;
  if (value === undefined) return false;
  return typeof value === "string" ? same(value, wanted) : value.some(item => same(item, wanted));
}

/** Rows that match the words (in the page, or the ids the endpoint returned), the lists and the button row. */
export function matchingCatalogRows(rows: CatalogRow[], applied: Pick<Applied, "q" | "lists">, lists: CatalogChoice[] = [], matches: Set<string> | null = null): CatalogRow[] {
  const words = catWords(applied.q);
  return rows.filter(row =>
    (matches ? matches.has(row.key) : catMatches(words, row.text))
    && lists.every(list => list.navigates || holds(row.values?.[list.name], applied.lists[list.name] ?? "")));
}

const HANDOFF = BROWSER_STORAGE_KEYS.catalogSearchHandoff;

/** Holds the words, choices and page for one catalog. Give it `key` from the address's fixed choices so a reload starts fresh. */
export function PrivateCatalogProvider({ children, ...config }: Config & { children: ReactNode }) {
  const router = useRouter();
  const startLists = Object.fromEntries((config.lists ?? []).map(list => [list.name, config.choices[list.name] ?? ""]));
  const [applied, setApplied] = useState<Applied>({ q: config.initial.q.slice(0, 200), lists: startLists, jump: config.jump ? config.choices[config.jump.name] ?? "" : "", page: config.initial.page, find: config.initial.find ?? "" });
  const [matches, setMatches] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(Boolean(config.endpoint && config.initial.q.trim()));
  const [failed, setFailed] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const request = useRef(0);

  /** Sends the words to the server for catalogs searched there; only the newest answer is used. */
  async function fetchMatches(q: string, mine: number) {
    try {
      const found = await postSearch<{ ids: string[] }>("/api/catalog-search", { catalog: config.endpoint, q });
      if (mine === request.current) { setMatches(new Set(found.ids)); setBusy(false); }
    } catch { if (mine === request.current) { setFailed(true); setMatches(new Set()); setBusy(false); } }
  }
  function lookUp(q: string) {
    if (!config.endpoint) return;
    const mine = ++request.current;
    setMatches(null); setFailed(false); setBusy(Boolean(q));
    if (q) void fetchMatches(q, mine);
  }
  // Words from a link (?q=) start a server search once.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (config.endpoint && applied.q) void fetchMatches(applied.q, ++request.current);
  });

  function submit(text: string, lists: Record<string, string>) {
    const q = text.trim().slice(0, 200);
    const navigating = (config.lists ?? []).filter(list => list.navigates);
    if (navigating.some(list => (lists[list.name] ?? "") !== (config.choices[list.name] ?? ""))) {
      if (q) handOffSearch(HANDOFF, JSON.stringify({ path: config.basePath, q }));
      router.push(catHref(config.basePath, lists));
      return;
    }
    setApplied({ q, lists, jump: applied.jump, page: "1", find: "" });
    if (config.endpoint && (q !== applied.q || failed)) void lookUp(q);
  }
  function reset() {
    setApplied({ q: "", lists: Object.fromEntries(Object.keys(startLists).map(name => [name, ""])), jump: "", page: "1", find: "" });
    request.current++; setMatches(null); setFailed(false); setBusy(false); setFormVersion(n => n + 1);
    if (Object.values(config.choices).some(Boolean)) router.push(config.basePath);
  }
  useHandOff(HANDOFF, raw => {
    try {
      const carried = JSON.parse(raw) as { path?: unknown; q?: unknown };
      if (carried.path === config.basePath && typeof carried.q === "string") { submit(carried.q, applied.lists); setFormVersion(n => n + 1); }
    } catch { /* not ours */ }
  });

  const lists = config.lists ?? [];
  const pending = Boolean(config.endpoint && applied.q && !matches && !failed);
  const jumpRows = pending ? [] : matchingCatalogRows(config.rows, applied, lists, config.endpoint && applied.q ? matches : null);
  const jumpName = config.jump?.name;
  const jumpValue = jumpName && jumpRows.some(row => holds(row.values?.[jumpName], applied.jump)) ? applied.jump : "";
  const shown = jumpName && jumpValue ? jumpRows.filter(row => holds(row.values?.[jumpName], jumpValue)) : jumpRows;
  const page = catPaginate(shown, applied.page, config.perPage, applied.find ? row => row.key === applied.find : undefined);
  const filtered = Boolean(applied.q || jumpValue || Object.values(applied.lists).some(Boolean) || Object.values(config.choices).some(Boolean));
  const state: State = {
    ...config, applied: { ...applied, jump: jumpValue }, matches, busy, failed, shown, page, jumpRows, filtered, formVersion,
    submit,
    setJump: value => setApplied(current => ({ ...current, jump: value, page: "1", find: "" })),
    setPage: next => { setApplied(current => ({ ...current, page: String(next), find: "" })); },
    reset,
  };
  return <Context.Provider value={state}>{children}</Context.Provider>;
}

type FormProps = {
  ariaLabel?: string;
  searchLabel: ReactNode;
  placeholder?: string;
  buttonLabel: ReactNode;
  clearLabel: string;
  alwaysShowClear?: boolean;
  className?: string;
  buttonClassName?: string;
  inputClassName?: string;
  /** "labels": each box sits inside its label; "bar": the label above a row with the box and the button. */
  layout?: "labels" | "bar";
  inputId?: string;
};

/** The search box and lists. The box has no name, so its words are never part of an address. */
export function PrivateCatalogForm(props: FormProps) {
  return <CatalogForm key={useCatalog().formVersion} {...props} />;
}

function CatalogForm({ ariaLabel, searchLabel, placeholder, buttonLabel, clearLabel, alwaysShowClear, className, buttonClassName, inputClassName, layout = "labels", inputId }: FormProps) {
  const state = useCatalog();
  const generated = useId();
  const id = inputId ?? `${generated}-q`;
  const [draft, setDraft] = useState(state.applied.q);
  const [lists, setLists] = useState<Record<string, string>>(state.applied.lists);
  function onSubmit(event: FormEvent) { event.preventDefault(); state.submit(draft, lists); }
  function clear() { setDraft(""); setLists(Object.fromEntries(Object.keys(lists).map(name => [name, ""]))); state.reset(); }
  const input = <input id={id} type="search" value={draft} maxLength={200} autoComplete="off" placeholder={placeholder} className={inputClassName} onChange={event => setDraft(event.target.value)} />;
  const clearButton = state.filtered || alwaysShowClear ? <button type="button" className="text-button" onClick={clear}>{clearLabel}</button> : null;
  return <form className={className} role="search" aria-label={ariaLabel} onSubmit={onSubmit}>
    {layout === "bar"
      ? <><label htmlFor={id}>{searchLabel}</label><div>{input}<button type="submit" className={buttonClassName}>{buttonLabel}</button></div></>
      : <label htmlFor={id}>{searchLabel}{input}</label>}
    {(state.lists ?? []).map(list => <label key={list.name} htmlFor={`${generated}-${list.name}`}>{list.label}
      <select id={`${generated}-${list.name}`} value={lists[list.name] ?? ""} onChange={event => setLists(current => ({ ...current, [list.name]: event.target.value }))}>
        <option value="">{list.allLabel}</option>
        {list.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>)}
    {layout === "labels" ? <button type="submit" className={buttonClassName}>{buttonLabel}</button> : null}
    {clearButton}
    {state.failed ? <p role="status">Search is not available just now. Try again in a moment.</p> : null}
  </form>;
}

/** Letter or group buttons that narrow the rows in the page. */
export function PrivateCatalogJump() {
  const state = useCatalog();
  const jump = state.jump;
  if (!jump) return null;
  const count = (value: string) => state.jumpRows.filter(row => holds(row.values?.[jump.name], value)).length;
  const current = state.applied.jump;
  return <nav className={jump.className ?? (jump.listClassName ? undefined : catStyles.jump)} aria-label={jump.label}>
    <ul className={jump.listClassName}>
      {jump.allLabel ? <li><button type="button" className="text-button" aria-current={!current ? "page" : undefined} onClick={() => state.setJump("")}>{jump.allLabel}</button></li> : null}
      {jump.options.map(option => {
        const n = count(option.value);
        if (!n && !jump.keepEmpty) return null;
        return <li key={option.value} id={jump.itemIdPrefix ? `${jump.itemIdPrefix}${option.value}` : undefined}>{n
          ? <button type="button" className="text-button" aria-current={option.value === current ? "page" : undefined} onClick={() => state.setJump(option.value)}>{option.label}{jump.counts ? ` (${n})` : ""}</button>
          : <span className={catStyles.none} aria-hidden="true">{option.label}</span>}</li>;
      })}
    </ul>
  </nav>;
}

/** The status line, the rows of this page and the page buttons. */
export function PrivateCatalogResults({ noun, nouns, of, empty, emptyWithWords, listLabel, pagerLabel, emptyBlock }: {
  noun: string;
  nouns: string;
  of?: number;
  empty?: string;
  /** Used when words were searched; {words} is replaced by them. */
  emptyWithWords?: string;
  listLabel: string;
  pagerLabel: string;
  /** Shown under the status when nothing matches, with a button that clears the search and choices. */
  emptyBlock?: { className?: string; title?: string; body?: string; resetLabel: string };
}) {
  const state = useCatalog();
  const resultsId = useId();
  if (state.busy || (state.endpoint && state.applied.q && !state.matches && !state.failed)) return <p role="status" className={catStyles.status}>Searching.</p>;
  const page = state.page;
  const message = state.applied.q && emptyWithWords ? emptyWithWords.replace("{words}", state.applied.q) : empty;
  const show = (next: number) => { state.setPage(next); document.getElementById(resultsId)?.scrollIntoView({ block: "nearest" }); };
  return <div id={resultsId}>
    <CatResultStatus page={page} noun={noun} nouns={nouns} of={of} empty={message} />
    {page.items.length
      ? <CatList label={listLabel}>{page.items.map(row => <CatalogRowNode key={row.key} node={row.node} />)}</CatList>
      : emptyBlock ? <div className={emptyBlock.className}>{emptyBlock.title ? <h2>{emptyBlock.title}</h2> : null}{emptyBlock.body ? <p>{emptyBlock.body}</p> : null}<p><button type="button" className="text-button" onClick={state.reset}>{emptyBlock.resetLabel}</button></p></div> : null}
    <ButtonPager page={page} label={pagerLabel} onPage={show} />
  </div>;
}

function CatalogRowNode({ node }: { node: ReactNode }) { return <>{node}</>; }
