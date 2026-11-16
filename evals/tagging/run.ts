/**
 * A7. Tagging quality: competency, job family (written_for) and area (docs/EVALS-STUDY.md, section 6). Offline.
 *   node scripts/evals/run.ts --only A7
 * Compares the shipped tags (data/workforce/tags.json and areas.json, which already carry overrides.json) with the
 * gold set in evals/tagging/gold.jsonl. The gold set is reviewer-coded by a single reviewer (seeded by
 * evals/tagging/seed.ts); two-reviewer coding, and with it the human-human kappa ceiling, is still to do.
 * Item kinds and titles come from data/blocks when this app has it, else from evals/tagging/items.json.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { measure, result, type EvalMeasure, type EvalResult } from "../contract.ts";
import { AREA_IDS } from "../../lib/workforce/areas.ts";
import { COMPETENCY_IDS, JOB_FAMILY_IDS, MATRIX, familyDepths, type CompetencyId, type JobFamilyId } from "../../lib/workforce/matrix.ts";

export const id = "A7";
export const cadence = "unit";

const root = fileURLToPath(new URL("../../", import.meta.url));
const here = fileURLToPath(new URL("./", import.meta.url));
const read = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;

type Tag = { competencies: CompetencyId[]; written_for: JobFamilyId[] };
type Gold = { id: string; title?: string; competencies?: string[]; written_for?: string[]; areas?: string[]; evidence: string[]; coding: string };
type Item = { id: string; title: string; kind: string; level: string; block: string; topic: string };

/** Tribal Nations, Tribal communities and American Indian people, in a title or topic. */
const TRIBAL = /\b(?:tribal|tribes?|ojibwe?|anishinaabe|ho-chunk|lakota|american indian|native american|indigenous|first nations|indian (?:policy|child welfare|affairs)|ICWA|MIFPA|red lake|leech lake|white earth|mille lacs|bois forte|fond du lac|grand portage|prairie island|shakopee mdewakanton|(?:lower|upper) sioux)\b|(?<!(?:north|south) )\bdakota\b/i;

const ratio = (n: number, d: number) => (d === 0 ? NaN : n / d);
const fmt = (x: number) => (Number.isNaN(x) ? "n/a" : x.toFixed(3));

function loadItems(): { items: Map<string, Item>; from: string } {
  if (existsSync(`${root}data/blocks`)) {
    type Block = { name: string; items: Array<{ id: string; title: string; kind: string; level: string; topic?: string }> };
    const rows = readdirSync(`${root}data/blocks`).filter(f => f.endsWith(".json") && !f.startsWith("_"))
      .flatMap(f => { const b = read<Block>(`${root}data/blocks/${f}`); return b.items.map(i => ({ id: i.id, title: i.title, kind: i.kind, level: i.level, block: b.name, topic: i.topic ?? "" })); });
    return { items: new Map(rows.map(r => [r.id, r])), from: "data/blocks" };
  }
  const index = read<{ rows: string[][] }>(`${here}items.json`);
  return { items: new Map(index.rows.map(([id, title, kind, level, block, topic]) => [id, { id, title, kind, level, block, topic }])), from: "evals/tagging/items.json" };
}

/** Micro precision and recall over (item, label) pairs. */
function pairs(rows: Array<{ id: string; predicted: string[]; gold: string[] }>) {
  let tp = 0, predicted = 0, actual = 0;
  const wrong: string[] = [], missed: string[] = [];
  for (const r of rows) {
    const g = new Set(r.gold);
    for (const p of new Set(r.predicted)) { predicted++; if (g.has(p)) tp++; else wrong.push(`${r.id}: ${p} not in gold [${r.gold.join(", ")}]`); }
    actual += g.size;
    for (const x of g) if (!r.predicted.includes(x)) missed.push(`${r.id}: missing ${x}`);
  }
  return { precision: ratio(tp, predicted), recall: ratio(tp, actual), tp, predicted, actual, wrong, missed };
}

export async function run(): Promise<EvalResult> {
  const measures: EvalMeasure[] = [];
  const notes: string[] = [];
  const tags = read<{ items: Record<string, Tag> }>(`${root}data/workforce/tags.json`).items;
  const areas = read<{ items: Record<string, string[]> }>(`${root}data/workforce/areas.json`).items;
  const overrides = read<{ competencies?: Record<string, string[]>; written_for?: Record<string, string[]>; areas?: Record<string, string[]> }>(`${root}data/workforce/overrides.json`);
  const gold = readFileSync(`${here}gold.jsonl`, "utf8").trim().split("\n").map(line => JSON.parse(line) as Gold);
  const { items, from } = loadItems();
  const singleReviewer = gold.filter(g => g.coding === "reviewer-coded, single reviewer").length;
  notes.push(`gold: ${gold.length} items, ${singleReviewer} reviewer-coded by a single reviewer (two-reviewer coding still to do); item index from ${from}`);
  const fromOverridesOnly = (g: Gold) => g.evidence.length === 1 && g.evidence[0] === "overrides.json";

  // Competency: top-1 accuracy and top-3 precision and recall.
  const comp = gold.filter(g => g.competencies?.length && tags[g.id]);
  const top1Wrong = comp.filter(g => tags[g.id].competencies[0] !== g.competencies![0]);
  const top1 = ratio(comp.length - top1Wrong.length, comp.length);
  const compSample = comp.filter(g => !fromOverridesOnly(g));
  const top1Sample = ratio(compSample.filter(g => tags[g.id].competencies[0] === g.competencies![0]).length, compSample.length);
  measures.push(measure(`competency top-1 accuracy (${comp.length} gold items)`, fmt(top1), ">= 0.85", top1 >= 0.85,
    top1Wrong.map(g => `${g.id}: tagged ${tags[g.id].competencies[0]}, gold ${g.competencies![0]}`)));
  const top3 = pairs(comp.map(g => ({ id: g.id, predicted: tags[g.id].competencies.slice(0, 3), gold: g.competencies! })));
  measures.push(measure("competency top-3 precision / recall", `${fmt(top3.precision)} / ${fmt(top3.recall)}`, "reported (no bar in the study)", true));
  notes.push(`competency top-1 without override-only items: ${fmt(top1Sample)} over ${compSample.length}`);

  // written_for.
  const wf = gold.filter(g => g.written_for && tags[g.id]);
  const wfp = pairs(wf.map(g => ({ id: g.id, predicted: tags[g.id].written_for ?? [], gold: g.written_for! })));
  measures.push(measure(`written_for precision (${wfp.predicted} families tagged on ${wf.length} gold items)`, wfp.predicted ? fmt(wfp.precision) : "n/a", ">= 0.90", wfp.predicted === 0 || wfp.precision >= 0.9, wfp.wrong));
  const wfSample = wf.filter(g => !overrides.written_for?.[g.id]);
  const wfpSample = pairs(wfSample.map(g => ({ id: g.id, predicted: tags[g.id].written_for ?? [], gold: g.written_for! })));
  notes.push(`written_for precision without hand-corrected items: ${wfpSample.predicted ? fmt(wfpSample.precision) : "n/a"} over ${wfpSample.predicted} tagged families; gold codes changed after review: ${gold.filter(g => (g as Gold & { adjudicated?: string }).adjudicated).length}`);
  measures.push(measure(`written_for recall (${wfp.actual} gold families)`, wfp.actual ? fmt(wfp.recall) : "n/a", "reported (no bar in the study)", true, wfp.missed));

  // Areas.
  const ar = gold.filter(g => g.areas && areas[g.id] !== undefined);
  const arp = pairs(ar.map(g => ({ id: g.id, predicted: areas[g.id] ?? [], gold: g.areas! })));
  measures.push(measure(`area precision (${arp.predicted} areas tagged on ${ar.length} gold items)`, arp.predicted ? fmt(arp.precision) : "n/a", ">= 0.90", arp.predicted === 0 || arp.precision >= 0.9, arp.wrong));
  measures.push(measure(`area recall (${arp.actual} gold areas)`, arp.actual ? fmt(arp.recall) : "n/a", "reported (no bar in the study)", true, arp.missed));
  const exactAgency = ar.filter(g => g.areas!.length === 0);
  notes.push(`area gold: ${ar.length} items, ${exactAgency.length} of them agency-wide (no area), where any area tagged counts against precision`);

  // Gold items the shipped tags do not cover at all.
  const absent = gold.filter(g => !tags[g.id]).map(g => `${g.id}: in gold, not in tags.json`);
  measures.push(measure("gold items present in the shipped tags", gold.length - absent.length, `${gold.length}`, absent.length === 0, absent));

  // Reviewer-confirmed corrections are in the shipped files.
  const notApplied: string[] = [];
  for (const [rid, value] of Object.entries(overrides.competencies ?? {})) if (tags[rid] && tags[rid].competencies.join() !== value.join()) notApplied.push(`${rid}: competencies`);
  for (const [rid, value] of Object.entries(overrides.written_for ?? {})) if (tags[rid] && (tags[rid].written_for ?? []).join() !== value.join()) notApplied.push(`${rid}: written_for`);
  for (const [rid, value] of Object.entries(overrides.areas ?? {})) if (areas[rid] && areas[rid].join() !== value.join()) notApplied.push(`${rid}: areas`);
  measures.push(measure("overrides.json applied in tags.json and areas.json", notApplied.length, "0", notApplied.length === 0, notApplied));

  // Labels and orphans.
  const badLabels: string[] = [];
  const comps = new Set<string>(COMPETENCY_IDS), fams = new Set<string>(JOB_FAMILY_IDS), areaIds = new Set<string>(AREA_IDS);
  for (const [tid, t] of Object.entries(tags)) {
    if (!t.competencies?.length) badLabels.push(`${tid}: no competency`);
    for (const c of t.competencies ?? []) if (!comps.has(c)) badLabels.push(`${tid}: unknown competency ${c}`);
    for (const f of t.written_for ?? []) if (!fams.has(f)) badLabels.push(`${tid}: unknown family ${f}`);
  }
  for (const [aid, list] of Object.entries(areas)) for (const a of list) if (!areaIds.has(a)) badLabels.push(`${aid}: unknown area ${a}`);
  measures.push(measure(`every tag uses the fixed label lists (${Object.keys(tags).length} items)`, badLabels.length, "0", badLabels.length === 0, badLabels));
  const orphans = [
    ...[...items.keys()].filter(i => !tags[i]).map(i => `${i}: item without tags`),
    ...Object.keys(tags).filter(i => !items.has(i)).map(i => `${i}: tags for no item`),
    ...[...items.keys()].filter(i => areas[i] === undefined).map(i => `${i}: item without an area entry`),
  ];
  measures.push(measure("orphans between items, tags and areas", orphans.length, "0", orphans.length === 0, orphans));

  // Coverage: every family has a deep resource for each competency the matrix marks deep for it.
  const deepCount = new Map<string, number>();
  for (const [tid, t] of Object.entries(tags)) {
    if (!t.competencies?.length || !comps.has(t.competencies[0])) continue;
    const item = items.get(tid);
    const depths = familyDepths(t.competencies.filter(c => comps.has(c)), (t.written_for ?? []).filter(f => fams.has(f)), { lookup: item?.kind === "reference" && item.level === "reference" });
    for (const f of JOB_FAMILY_IDS) if (depths[f] === "deep") deepCount.set(`${f}/${t.competencies[0]}`, (deepCount.get(`${f}/${t.competencies[0]}`) ?? 0) + 1);
  }
  const cells = JOB_FAMILY_IDS.flatMap(f => COMPETENCY_IDS.filter(c => MATRIX[f][c] === "deep").map(c => `${f}/${c}`));
  const uncovered = cells.filter(cell => !deepCount.get(cell));
  const thinnest = cells.map(cell => [cell, deepCount.get(cell) ?? 0] as const).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([cell, n]) => `${cell} ${n}`).join(", ");
  measures.push(measure(`coverage: deep matrix cells with a deep resource (of ${cells.length})`, cells.length - uncovered.length, `${cells.length}`, uncovered.length === 0, uncovered));
  notes.push(`thinnest deep cells: ${thinnest}`);

  // Tribal items carry tribes-community.
  // A county named for a place (Dakota, Mille Lacs, Red Lake County) is not a Tribal Nation.
  const tribal = [...items.values()].filter(i => TRIBAL.test(`${i.title} ${i.topic}`.replace(/\b(?:[A-Z][a-z]+ ){1,2}County\b/g, " ")) && tags[i.id]);
  const notTribal = tribal.filter(i => !tags[i.id].competencies.includes("tribes-community"));
  const tribalFirst = tribal.filter(i => tags[i.id].competencies[0] === "tribes-community").length;
  measures.push(measure(`Tribal items tagged tribes-community (${tribal.length} found by title or topic)`, `${tribal.length - notTribal.length} of ${tribal.length}`, "all", notTribal.length === 0 && tribal.length > 0,
    notTribal.map(i => `${i.id} "${i.title.slice(0, 70)}": ${tags[i.id].competencies.join(", ")}`)));
  notes.push(`Tribal items with tribes-community first: ${tribalFirst} of ${tribal.length}`);

  return result({
    id, title: "Tagging quality (competency, job family, area)", layer: "A", cadence,
    measures,
    skipped: [
      "human-human Cohen's kappa and model-human agreement (needs a second reviewer on the gold set)",
      "stability: re-tag 100 items with the same model (live cadence, needs model calls)",
      "Tribal items do not offer program training on Tribal relations (content check, not in the tags)",
      `gold set is ${gold.length} items; the study asks for 250 stratified by block and kind`,
    ].filter(s => !s.startsWith("gold set") || gold.length < 250),
    notes: notes.join(" | "),
  });
}
