import "server-only";
import { searchPolicies } from "@/lib/content/hub/dsd-policies";
import { searchReadings } from "@/lib/content/reading-collection";

/**
 * Word searches for catalogs too large to search in the browser. The words arrive in a request body
 * (app/api/catalog-search), are used once to match, and are never stored, logged or put in an address.
 * Only the ids of the matching entries go back; the page already holds the rows and narrows them.
 */
export const CATALOG_SEARCHES = {
  policies: (q: string) => searchPolicies(q).map(policy => policy.id),
  readings: (q: string) => searchReadings(q, "", "").map(book => book.id),
} as const;

export type CatalogSearchName = keyof typeof CATALOG_SEARCHES;

export function isCatalogSearchName(value: unknown): value is CatalogSearchName {
  return typeof value === "string" && Object.hasOwn(CATALOG_SEARCHES, value);
}

export function catalogSearch(name: CatalogSearchName, q: string): string[] {
  const words = q.trim().slice(0, 200);
  return words ? CATALOG_SEARCHES[name](words) : [];
}
