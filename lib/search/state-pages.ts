import "server-only";
import { createHash } from "node:crypto";
import type { Doc } from "@/lib/intelligence/retrieval/search";
import { STATE_AGENCIES } from "@/lib/content/state-agencies";
import { normalizeSourceHref } from "@/lib/content/source-register";
import catalog from "@/lib/content/state-pages.json";

type StatePage = typeof catalog.pages[number] & { id: string; agencyId?: string };
const directory = new Map(STATE_AGENCIES.map(agency => [agency.name, agency]));
const pages = new Map<string, StatePage>();
const agencyReadings = new Map<string, Set<string>>();

for (const page of catalog.pages) {
  const agency = directory.get(page.agency);
  if (agency?.linkOnly || !page.text.trim() || /captcha|access denied|just a moment/i.test(page.title)) continue;
  const url = URL.parse(page.url);
  if (!url || !["http:", "https:"].includes(url.protocol) || url.hostname.endsWith("perfdrive.com")) continue;
  const id = createHash("sha256").update(page.url).digest("hex").slice(0, 20);
  const existing = pages.get(id);
  if (!existing || page.text.length > existing.text.length) {
    pages.set(id, { ...page, id, agencyId: agency?.id });
  }
  const listed = agencyReadings.get(page.agency) ?? new Set<string>();
  listed.add(id);
  agencyReadings.set(page.agency, listed);
}

export const stateReadingDate = catalog.retrieved;
export const stateReadingHref = (id: string) => `/source-reading/${id}`;
export const stateReading = (id: string) => pages.get(id);
export const stateReadingsForAgency = (agency: string) => [...(agencyReadings.get(agency) ?? [])].map(id => pages.get(id)!);

const readingByUrl = new Map([...pages.values()].map(page => [normalizeSourceHref(page.url), page]));
export const stateReadingForUrl = (url: string) => readingByUrl.get(normalizeSourceHref(url));

const docs: Doc[] = [...pages.values()].map(page => ({
  kind: "content", id: `state-page:${page.id}`, title: page.title || page.agency, href: page.url,
  authority: "external_verify", type: "state_page", status: "published", reviewDate: "", scope: "public",
  summary: page.description, text: [page.agency, page.description, page.text].join(" "), tags: [], intents: [],
}));

/** Ask cites the publisher. Site Search can open the app's reading copy. */
export function statePageDocs(): Doc[] { return docs; }
