/**
 * Seed the A7 tagging gold set and item index from the One DHS build's review files.
 *   node evals/tagging/seed.ts "<path to the One DHS repository>"
 * Reads (never writes) <repo>/data/workforce/work/sample-for-review*.json and sample-review-*.json,
 * <repo>/data/workforce/overrides.json and <repo>/data/blocks/*.json. Writes evals/tagging/gold.jsonl and
 * evals/tagging/items.json.
 *
 * Gold labels: for each sampled item, the reviewer's suggestion where the reviewer marked an error in that field,
 * otherwise the labels the reviewer saw and accepted. Review 4's sample file was later overwritten, so only its error
 * rows are known (one field each). overrides.json (reviewer-confirmed corrections) is applied last. Every row is
 * reviewer-coded by a single reviewer: the two-reviewer coding in docs/EVALS-STUDY.md is still to do.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type Field = "competencies" | "written_for" | "areas";
type Sample = { id: string; title: string; kind: string; collection: string; competencies?: string[]; written_for?: string[]; areas?: string[] };
type OldError = { id: string; suggested_competencies: string[]; suggested_written_for: string[] };
type FieldError = { id: string; field: Field; suggested: string[] };
type Gold = { id: string; title?: string; kind?: string; collection?: string; competencies?: string[]; written_for?: string[]; areas?: string[]; evidence: string[]; coding: string };

const repo = process.argv[2];
if (!repo) throw new Error('usage: node evals/tagging/seed.ts "<path to the One DHS repository>"');
const work = `${repo}/data/workforce/work/`;
const out = fileURLToPath(new URL("./", import.meta.url));
const read = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;
const CODING = "reviewer-coded, single reviewer";

const gold = new Map<string, Gold>();
const row = (id: string, sample?: Sample): Gold => {
  const g = gold.get(id) ?? { id, evidence: [], coding: CODING };
  if (sample) Object.assign(g, { title: sample.title, kind: sample.kind, collection: sample.collection });
  gold.set(id, g);
  return g;
};
const set = (g: Gold, field: Field, value: string[] | undefined, evidence: string) => {
  if (!value) return;
  g[field] = [...value];
  if (!g.evidence.includes(evidence)) g.evidence.push(evidence);
};

// Reviews 1 to 3: each error row suggests both competencies and written_for.
for (const [sampleFile, reviewFile] of [["sample-for-review-v1.json", "sample-review-v1.json"], ["sample-for-review-2.json", "sample-review-2.json"], ["sample-for-review-3.json", "sample-review-3.json"]]) {
  const samples = read<Sample[]>(`${work}${sampleFile}`);
  const errors = new Map(read<{ errors: OldError[] }>(`${work}${reviewFile}`).errors.map(e => [e.id, e]));
  for (const s of samples) {
    const g = row(s.id, s);
    const e = errors.get(s.id);
    set(g, "competencies", e ? e.suggested_competencies : s.competencies?.length ? s.competencies : undefined, reviewFile);
    set(g, "written_for", e ? e.suggested_written_for : s.written_for, reviewFile);
  }
  for (const [id, e] of errors) if (!samples.some(s => s.id === id)) { const g = row(id); set(g, "competencies", e.suggested_competencies, reviewFile); set(g, "written_for", e.suggested_written_for, reviewFile); }
}

// Review 4: its sample was overwritten; only the error rows remain, one field each.
for (const e of read<{ errors: FieldError[] }>(`${work}sample-review-4.json`).errors) set(row(e.id), e.field, e.suggested, "sample-review-4.json");

// Review 5 against the current sample file, which also carries areas.
{
  const samples = read<Sample[]>(`${work}sample-for-review.json`);
  const errors = read<{ errors: FieldError[] }>(`${work}sample-review-5.json`).errors;
  for (const s of samples) {
    const g = row(s.id, s);
    for (const field of ["competencies", "written_for", "areas"] as const) {
      const e = errors.find(x => x.id === s.id && x.field === field);
      const accepted = s[field] && (field !== "competencies" || s[field]!.length) ? s[field] : undefined;
      set(g, field, e ? e.suggested : accepted, "sample-review-5.json");
    }
  }
  for (const e of errors) if (!samples.some(s => s.id === e.id)) set(row(e.id), e.field, e.suggested, "sample-review-5.json");
}

// Reviewer-confirmed corrections, applied last.
const overrides = read<Record<Field, Record<string, string[]>>>(`${repo}/data/workforce/overrides.json`);
for (const field of ["competencies", "written_for", "areas"] as const) for (const [id, value] of Object.entries(overrides[field] ?? {})) set(row(id), field, value, "overrides.json");

const rows = [...gold.values()].filter(g => g.competencies || g.written_for || g.areas).sort((a, b) => (a.id < b.id ? -1 : 1));
writeFileSync(`${out}gold.jsonl`, rows.map(g => JSON.stringify(g)).join("\n") + "\n");

// Item index: what the tagging eval needs to know about every tagged item (kind and level mark lookup entries;
// the title finds Tribal items).
type Block = { name: string; items: Array<{ id: string; title: string; kind: string; level: string; topic?: string }> };
const items = readdirSync(`${repo}/data/blocks`).filter(f => f.endsWith(".json") && !f.startsWith("_")).sort()
  .flatMap(f => { const b = read<Block>(`${repo}/data/blocks/${f}`); return b.items.map(i => [i.id, i.title, i.kind, i.level, b.name, i.topic ?? ""]); });
writeFileSync(`${out}items.json`, JSON.stringify({
  source: "One DHS build data/blocks, seeded by evals/tagging/seed.ts",
  columns: ["id", "title", "kind", "level", "block", "topic"],
  rows: items,
}) + "\n");
console.log(JSON.stringify({ gold: rows.length, with_competencies: rows.filter(g => g.competencies).length, with_written_for: rows.filter(g => g.written_for).length, with_areas: rows.filter(g => g.areas).length, items: items.length }));
