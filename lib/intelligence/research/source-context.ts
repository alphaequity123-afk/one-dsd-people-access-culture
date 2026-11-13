import { externalSourceHref } from "@/lib/content/external-readings";
import type { Doc } from "../retrieval/search";

/** Public source metadata, never an internal passage, upload or conversation. */
export type PublicResearchSource = { title: string; url: string; topics?: string[]; aliases?: string[] };
export type ResearchSourceContext = ReadonlyArray<Pick<PublicResearchSource, "title" | "url">>;

function publicUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || !url.hostname.includes(".") ||
      /^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(url.hostname) ||
      /\.(?:local|internal)$/i.test(url.hostname) || [...url.searchParams.keys()].some(key => /^(?:token|access_token|api_key|key|password|secret|signature)$/i.test(key))) return;
    return externalSourceHref(url.href) ?? undefined;
  } catch { return; }
}

/** Called only on the values of an already published public surface. Keep named
 * source links and their field/topic labels; never copy body or summary fields. */
export function publicSourceMetadata(values: unknown): PublicResearchSource[] {
  const found: PublicResearchSource[] = [];
  const visit = (value: unknown, fields: string[], depth: number) => {
    if (depth > 12 || found.length >= 128 || !value || typeof value !== "object") return;
    if (Array.isArray(value)) { for (const child of value) visit(child, fields, depth + 1); return; }
    const row = value as Record<string, unknown>;
    const title = row.label ?? row.title ?? row.name;
    const url = publicUrl(row.href ?? row.url ?? row.sourceHref);
    if (typeof title === "string" && title.trim() && url) found.push({
      title: title.replace(/\s+/g, " ").trim().slice(0, 240), url,
      topics: fields.map(field => field.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ")),
    });
    for (const [key, child] of Object.entries(row)) if (child && typeof child === "object") visit(child, [...fields, key], depth + 1);
  };
  visit(values, [], 0);
  return [...new Map(found.map(source => [source.url + "|" + source.title, source])).values()];
}

const STOP = new Set("a an and are as at be by can could for from has have how in into is it may of on or our should that the their them these this to use using was were what when where which who why will with would your ask cite current department division dsd dhs minnesota public staff member information resource resources source sources work working official relevant program agency center centre organization records links".split(" "));
const words = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
const topical = (text: string) => words(text).filter(word => word.length > 2 && !STOP.has(word));
const hasPhrase = (question: string, phrase: string) => (` ${words(question).join(" ")} `).includes(` ${words(phrase).join(" ")} `);

/** Match names and contextual acronyms against current public source identities.
 * An acronym alone is not enough to override a question about another subject. */
export function researchSourceContext(question: string, docs: readonly Doc[]): ResearchSourceContext {
  const queryWords = new Set(topical(question));
  const candidates: PublicResearchSource[] = [];
  for (const doc of docs) {
    if (!["approved", "published", "refresh_due"].includes(doc.status) || !["public", "all", "dsd", "agencywide"].includes(doc.scope)) continue;
    candidates.push(...(doc.publicResearchSources ?? []));
    // These directory projections are public identities. Other external document
    // bodies and internal resource titles are not sent to the research provider.
    if (["agency", "organization_reference"].includes(doc.type)) {
      const url = publicUrl(doc.href) ?? doc.graphLinks?.map(publicUrl).find(Boolean);
      if (url) candidates.push({ title: doc.title, url, aliases: doc.tags.filter(tag => /^[A-Z][A-Z0-9&-]{1,9}$/.test(tag)), topics: [doc.summary, ...doc.tags] });
    }
  }
  const matches = candidates.flatMap(source => {
    const url = publicUrl(source.url);
    if (!url) return [];
    const name = source.title.split(/:\s|\s[—–]\s/, 1)[0].trim();
    const aliases = [name, ...(source.aliases ?? [])];
    const fullName = aliases.some(alias => words(alias).length > 1 && hasPhrase(question, alias));
    const acronym = aliases.find(alias => /^[A-Z][A-Z0-9&-]{1,9}$/.test(alias) && hasPhrase(question, alias));
    const subjectWords = topical([source.title, ...(source.topics ?? [])].join(" ")).filter(word => word !== acronym?.toLowerCase());
    const overlap = new Set(subjectWords.filter(word => queryWords.has(word))).size;
    // A directly supplied public URL also resolves identity, without imposing
    // a fixed domain list on any subsequent research.
    const namedUrl = question.includes(url) || question.includes(new URL(url).hostname);
    if (!fullName && !namedUrl && !(acronym && overlap)) return [];
    return [{ title: source.title.slice(0, 240), url, score: Number(fullName || namedUrl) * 20 + overlap }];
  }).sort((a, b) => b.score - a.score);
  return [...new Map(matches.map(({ title, url }) => [url, { title, url }])).values()].slice(0, 8);
}

export function researchIdentityInstruction(context: ResearchSourceContext = []): string {
  if (!context.length) return "";
  return "\nPublic source identities found in the application's published resources, selected for names and topic overlap: " +
    JSON.stringify(context.slice(0, 8).map(({ title, url }) => ({ title, url }))) +
    "\nUse these names and original source URLs to disambiguate organizations and acronyms in this question. They are search leads, not verified evidence of current services, jurisdiction, contracts or partnerships. Follow the user's explicit subject, full name or website over a possible acronym match; do not substitute an unrelated organization just because it has the same acronym. Verify responsibilities on the original publisher's current sources. Research remains open to other relevant public sources.";
}
