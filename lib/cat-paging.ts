// Shared helpers for long catalog pages: one value per query parameter, a page of results,
// links that keep the other choices, and a one-line preview of longer text.
// Plain functions, safe for server and client code.

export type CatParams = Record<string, string>;

export type CatPage<T> = {
  items: T[];
  /** One-based page number actually shown (clamped to the available pages). */
  page: number;
  pageCount: number;
  total: number;
  /** One-based position of the first and last item shown; 0 when nothing matches. */
  first: number;
  last: number;
  perPage: number;
};

/** The first value of a query parameter, trimmed; "" when absent. */
export function catParam(value: string | string[] | undefined): string {
  const one = Array.isArray(value) ? value[0] : value;
  return typeof one === "string" ? one.trim() : "";
}

/**
 * One page of `all`. When `locate` is given and an item matches it, the page holding that item is
 * shown instead of `pageParam`, so links to a single entry still land on it.
 */
export function catPaginate<T>(all: T[], pageParam: string, perPage: number, locate?: (item: T) => boolean): CatPage<T> {
  const total = all.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  let page = Number.parseInt(pageParam, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (locate) {
    const index = all.findIndex(locate);
    if (index >= 0) page = Math.floor(index / perPage) + 1;
  }
  page = Math.min(page, pageCount);
  const start = (page - 1) * perPage;
  const items = all.slice(start, start + perPage);
  return { items, page, pageCount, total, first: items.length ? start + 1 : 0, last: start + items.length, perPage };
}

/** A link to `basePath` with the given choices; empty values and page 1 are left out. */
export function catHref(basePath: string, params: CatParams, overrides: CatParams = {}): string {
  const merged: CatParams = { ...params, ...overrides };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue;
    if (key === "page" && value === "1") continue;
    search.set(key, value);
  }
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** The page numbers to offer: always the first and last, and a window around the current page. `0` marks a gap. */
export function catPageNumbers(page: number, pageCount: number, around = 2): number[] {
  const numbers: number[] = [];
  for (let n = 1; n <= pageCount; n += 1) {
    if (n === 1 || n === pageCount || Math.abs(n - page) <= around) numbers.push(n);
    else if (numbers[numbers.length - 1] !== 0) numbers.push(0);
  }
  return numbers;
}

/** The first sentence of `text`, or its first words up to `max` characters, for a one-line preview. */
export function catOneLine(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentence = /^(.+?[.!?])(\s|$)/.exec(clean)?.[1] ?? clean;
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:\s]+$/, "")}…`;
}

/** Lower-case words of a search phrase. */
export function catWords(query: string): string[] {
  return query.toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
}

/** True when every word appears somewhere in the text. */
export function catMatches(words: string[], ...text: (string | undefined | null)[]): boolean {
  if (!words.length) return true;
  const haystack = text.filter(Boolean).join(" ").toLocaleLowerCase("en-US");
  return words.every(word => haystack.includes(word));
}
