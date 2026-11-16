"use client";
/**
 * Searches that keep typed text in the page. What someone types is held in the page's state and, only to carry
 * it to another page, in this tab's session storage; it never goes into the address, so it does not reach
 * browser history, shared links or server address logs (owner rule 2026-11-16). Fixed choices such as a theme
 * or a level may still be links. Searches that need the server send the text in a request body.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { catPageNumbers, type CatPage } from "@/lib/cat-paging";
import { catStyles } from "@/components/cat-list";

/** Session-storage keys that carry typed text from one page to the next and are removed once read. */
export const SEARCH_HANDOFF_KEYS = {
  /** The search box at the top of every page, to the full search page. */
  siteSearch: "site-search-pending",
  /** The short Learn page, to the full learning catalog. */
  learn: "learn-search-pending",
  /** Any page, to Ask (the same key the live One DHS app uses). */
  ask: "ask-pending-question",
} as const;

export function handOffSearch(key: string, text: string): void {
  try { window.sessionStorage.setItem(key, text.slice(0, 4000)); } catch { /* storage blocked: the next page opens without the text */ }
}

/** Reads and removes a handed-over text. Accepts a plain string or a JSON-encoded string. */
export function takeHandOff(key: string): string {
  try {
    const raw = window.sessionStorage.getItem(key);
    window.sessionStorage.removeItem(key);
    if (!raw) return "";
    if (raw.startsWith("\"")) {
      const parsed: unknown = JSON.parse(raw);
      return typeof parsed === "string" ? parsed : "";
    }
    return raw;
  } catch { return ""; }
}

/** Runs once after the page opens with the text handed over from another page, if any. */
export function useHandOff(key: string, receive: (text: string) => void): void {
  const taken = useRef(false);
  const latest = useRef(receive);
  useEffect(() => { latest.current = receive; });
  useEffect(() => {
    if (taken.current) return;
    taken.current = true;
    const text = takeHandOff(key).trim();
    if (text) latest.current(text);
  }, [key]);
}

type SearchBoxProps = {
  label: ReactNode;
  /** Shown under the label and linked to the box. */
  help?: ReactNode;
  labelClassName?: string;
  helpClassName?: string;
  buttonLabel: ReactNode;
  value: string;
  onChange: (value: string) => void;
  onSearch: (text: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  /** Wraps the box and its button, for pages that style them together. */
  rowClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  type?: "search" | "text";
  maxLength?: number;
  ariaLabel?: string;
  role?: "search";
  /** Anything else in the form: fixed-choice filters, a clear link. */
  children?: ReactNode;
  after?: ReactNode;
};

/** A search form that never navigates: pressing Search hands the text to the page. */
export function PrivateSearchBox({ label, help, labelClassName, helpClassName, buttonLabel, value, onChange, onSearch, placeholder, id, className, rowClassName, inputClassName, buttonClassName, type = "search", maxLength = 200, ariaLabel, role = "search", children, after }: SearchBoxProps) {
  const generated = useId();
  const inputId = id ?? `${generated}-q`;
  const helpId = help ? `${inputId}-help` : undefined;
  const submit = (event: FormEvent) => { event.preventDefault(); onSearch(value.trim().slice(0, maxLength)); };
  const box = <>
    <input id={inputId} type={type} value={value} maxLength={maxLength} placeholder={placeholder} aria-describedby={helpId} className={inputClassName}
      autoComplete="off" onChange={event => onChange(event.target.value)} />
    <button type="submit" className={buttonClassName}>{buttonLabel}</button>
    {after}
  </>;
  return <form className={className} role={role} aria-label={ariaLabel} onSubmit={submit}>
    <label htmlFor={inputId} className={labelClassName}>{label}</label>
    {help ? <p id={helpId} className={helpClassName}>{help}</p> : null}
    {rowClassName ? <div className={rowClassName}>{box}</div> : box}
    {children}
  </form>;
}

/** Previous, numbered and next page buttons, matching the catalog page links. */
export function ButtonPager({ page, label, onPage }: { page: CatPage<unknown>; label: string; onPage: (page: number) => void }) {
  if (page.pageCount <= 1) return null;
  return <nav className={catStyles.pager} aria-label={label}>
    <ul>
      {page.page > 1 ? <li><button type="button" onClick={() => onPage(page.page - 1)}>Previous<span className="sr-only"> page</span></button></li> : null}
      {catPageNumbers(page.page, page.pageCount).map((n, i) => n === 0
        ? <li key={`gap-${i}`} className={catStyles.gap} aria-hidden="true">…</li>
        : <li key={n}><button type="button" aria-current={n === page.page ? "page" : undefined} onClick={() => onPage(n)}><span className="sr-only">Page </span>{n}</button></li>)}
      {page.page < page.pageCount ? <li><button type="button" onClick={() => onPage(page.page + 1)}>Next<span className="sr-only"> page</span></button></li> : null}
    </ul>
  </nav>;
}

/** Text the person typed, held in this page only. */
export function usePageSearch(initial = "") {
  const [draft, setDraft] = useState(initial);
  const [query, setQuery] = useState(initial.trim());
  return { draft, setDraft, query, search: (text: string) => { setDraft(text); setQuery(text.trim()); }, clear: () => { setDraft(""); setQuery(""); } };
}

/** Sends typed text to a search endpoint in the request body. */
export async function postSearch<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store", signal });
  if (!response.ok) throw new Error("search_failed");
  return await response.json() as T;
}
