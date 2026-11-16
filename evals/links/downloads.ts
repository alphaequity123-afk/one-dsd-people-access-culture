/**
 * Downloads (A10): run the application's own download adapters offline for samples of every download kind and
 * check that the document carries the item's title, its first heading and a source line, in the plain-text copy
 * and inside the Word file.
 */
import { loadAppModule } from "./load-app.ts";

type Doc = {
  title: string; kicker?: string; subtitle?: string; attribution: string;
  meta: { label: string; value: string }[];
  sections: { heading?: string; blocks: { kind: string; text?: string; runs?: { text: string }[]; label?: string }[] }[];
  sources?: { title: string; href?: string; note?: string }[];
};
type Entry = {
  resolveDownloadDocument: (kind: string, id: string, scope: string) => Promise<Doc | null>;
  DOWNLOAD_KINDS: readonly string[];
  SINGLETON_IDS: Record<string, string>;
  TOOLKIT_STUDIO_IDS: readonly string[];
  documentToPlainText: (doc: Doc) => string;
  renderDocx: (doc: Doc) => Promise<Buffer>;
  elearningDownloadIds: (scope: string) => Promise<{ kind: string; id: string }[]>;
  COMMUNITY_OUTREACH_IDS: readonly string[];
  extraPageIds: () => string[];
  EQUITY_REVIEW_IDS: readonly string[];
  AMPLIFY_PAGES: { id: string }[];
  DSD_PROGRAMS: { id: string }[];
  DSD_SCENARIOS: { id: string }[];
  BRIEFS: { id: string }[];
  DOMAINS: { id: string }[];
  GRADUATION_PATHS: { id: string }[];
  ORGANIZATIONS: { slug: string }[];
  getPolicies: () => { id: string }[];
  communityDesignEntries: () => { id: string }[];
  staffCorpus: () => { id: string }[];
};

export type DownloadCheck = { kind: string; id: string; ok: boolean; problems: string[] };

const spread = <T>(items: readonly T[], n: number): T[] => {
  if (items.length <= n) return [...items];
  return Array.from({ length: n }, (_, i) => items[Math.round((i * (items.length - 1)) / Math.max(1, n - 1))]);
};

/** Sample ids for every download kind, taken from the same catalogs the pages use. */
async function samples(m: Entry, perKind: number): Promise<{ kind: string; id: string }[]> {
  const out: { kind: string; id: string }[] = [];
  const add = (kind: string, ids: readonly string[]) => { for (const id of spread(ids, perKind)) out.push({ kind, id }); };
  const elearning = await m.elearningDownloadIds("one-dhs");
  for (const kind of new Set(elearning.map(e => e.kind))) add(kind, elearning.filter(e => e.kind === kind).map(e => e.id));
  for (const [kind, id] of Object.entries(m.SINGLETON_IDS)) add(kind, [id]);
  add("toolkit-studio", m.TOOLKIT_STUDIO_IDS);
  add("library", m.staffCorpus().map(item => item.id));
  add("scenario", m.DSD_SCENARIOS.map(s => s.id));
  add("program", m.DSD_PROGRAMS.map(p => p.id));
  add("amplify", m.AMPLIFY_PAGES.map(p => p.id));
  add("brief", m.BRIEFS.map(b => b.id));
  add("path", m.GRADUATION_PATHS.map(p => p.id));
  add("area", m.DOMAINS.map(d => d.id));
  add("organization", m.ORGANIZATIONS.map(o => o.slug));
  add("policy", m.getPolicies().map(p => p.id));
  add("community", m.communityDesignEntries().map(c => c.id));
  add("community-outreach", m.COMMUNITY_OUTREACH_IDS);
  add("equity-review", [...m.EQUITY_REVIEW_IDS, ...m.extraPageIds()]);
  add("self-directed-course", ["F07", "A01", "F01"]);
  return out;
}

const norm = (text: string) => text.normalize("NFKC").replace(/[“”]/g, "\"").replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();

function firstHeading(doc: Doc): string | undefined {
  for (const section of doc.sections) {
    if (section.heading?.trim()) return section.heading;
    const block = section.blocks.find(b => b.kind === "heading" && b.text?.trim());
    if (block?.text) return block.text;
  }
  return undefined;
}

/**
 * Where the item came from: a sources list, a source or publisher field, or the address of the program page the
 * copy was made from (program-authored items). The program's name alone ("One DHS People, Access and Culture")
 * does not tell a reader where to find the original.
 */
function hasSourceLine(doc: Doc, text: string): boolean {
  if (doc.sources?.some(s => s.title?.trim())) return /\nSOURCES\n/.test(text);
  if (doc.meta.some(m => (/source|publisher|from|page|address|link/i.test(m.label) || /program page \/|https?:\/\//.test(m.value)) && m.value.trim())) return true;
  return /^(?:sources?|source:|adapted from|based on|from:)\b/im.test(text) || /\bsource:|program page \/|https?:\/\//i.test(doc.attribution);
}

async function docxText(buffer: Buffer): Promise<string> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string") ?? "";
  return xml.replace(/<w:tab\/>/g, " ").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'");
}

/** Downloads served only to a signed-in audience; a staff request gets nothing by design. */
export const GATED: Record<string, string> = {
  "community-outreach/community-coverage": "leaders sign-in (lib/auth/leaders-access.ts)",
};

export async function checkDownloads(perKind = 2): Promise<{ checks: DownloadCheck[]; kinds: string[]; uncovered: string[]; gated: string[] }> {
  const m = await loadAppModule<Entry>("evals/links/download-entry.ts");
  const all = await samples(m, perKind);
  const list = all.filter(s => !(`${s.kind}/${s.id}` in GATED));
  const gated = all.filter(s => `${s.kind}/${s.id}` in GATED).map(s => `${s.kind}/${s.id}: ${GATED[`${s.kind}/${s.id}`]}`);
  const checks: DownloadCheck[] = [];
  for (const { kind, id } of list) {
    const problems: string[] = [];
    let doc: Doc | null = null;
    try { doc = await m.resolveDownloadDocument(kind, id, "one-dhs"); } catch (error) { problems.push(`adapter failed: ${error instanceof Error ? error.message.slice(0, 120) : String(error)}`); }
    if (!doc) { if (!problems.length) problems.push("no document (adapter returned nothing)"); checks.push({ kind, id, ok: false, problems }); continue; }
    const text = m.documentToPlainText(doc);
    const plain = norm(text);
    if (!doc.title?.trim()) problems.push("no title");
    else if (!plain.includes(norm(doc.title))) problems.push("title missing from text");
    const heading = firstHeading(doc);
    if (!heading) problems.push("no heading");
    else if (!plain.includes(norm(heading))) problems.push(`first heading "${heading.slice(0, 40)}" missing from text`);
    if (!hasSourceLine(doc, text)) problems.push("no source line");
    try {
      const word = norm(await docxText(await m.renderDocx(doc)));
      if (doc.title && !word.includes(norm(doc.title).slice(0, 60))) problems.push("title missing from Word file");
      if (heading && !word.includes(norm(heading).slice(0, 40))) problems.push("first heading missing from Word file");
    } catch (error) { problems.push(`Word file failed: ${error instanceof Error ? error.message.slice(0, 100) : String(error)}`); }
    checks.push({ kind, id, ok: problems.length === 0, problems });
  }
  const kinds = [...new Set(list.map(s => s.kind))];
  return { checks, kinds, uncovered: m.DOWNLOAD_KINDS.filter(kind => !kinds.includes(kind)), gated };
}
