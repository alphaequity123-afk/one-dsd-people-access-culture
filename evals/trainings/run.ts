/**
 * A6. Trainings (docs/EVALS-STUDY.md, section 6). Offline: reads data/trainings (core files, drafts, built) and the
 * images they name. Nothing here reads, counts or stores anyone's activity in a training.
 *   node scripts/evals/run.ts --only A6
 * Not covered here: the keyboard-only browser run (A10) and the people's check of whether feedback fits a choice.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { measure, result, type EvalMeasure, type EvalResult } from "../contract.ts";
import { buildTraining, builtJson, fileProblems } from "../../lib/trainings/build.ts";
import { decisionOrder, stableShuffle } from "../../lib/trainings/order.ts";
import { PORTRAITS, TrainingSchema, type Simulation, type Training } from "../../lib/trainings/schema.ts";
import { wordingProblemsIn } from "../../lib/trainings/wording.ts";
import { JOB_FAMILY_IDS } from "../../lib/workforce/matrix.ts";

export const id = "A6";
export const cadence = "unit";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = `${root}data/trainings/`;
const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8")) as unknown;
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const hash = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");
const isStrong = (c: { measures: { learning: string } }) => c.measures.learning === "high";
/** Job-family versions the owner approved: every one of the ten families. */
const INTENDED_FAMILIES: readonly string[] = JOB_FAMILY_IDS;
const TARGET_HERO_WIDTH = 3840;

/** Width and height from a PNG's IHDR chunk, or null when the file is not a PNG. */
function pngSize(path: string): { width: number; height: number } | null {
  const b = readFileSync(path);
  if (b.length < 24 || b.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

/** Every path through a simulation, from its start to "end". Loops and dead ends are problems. */
function walk(sim: Simulation): { paths: number; reached: Set<string>; problems: string[] } {
  const byId = new Map(sim.decisions.map(d => [d.id, d]));
  const reached = new Set<string>();
  const problems: string[] = [];
  let paths = 0;
  const visit = (decisionId: string, onPath: string[]) => {
    if (paths > 1_000_000) return;
    const d = byId.get(decisionId);
    if (!d) { problems.push(`${sim.version}: ${onPath.join(" > ")} leads to missing "${decisionId}"`); return; }
    reached.add(d.id);
    for (const c of d.choices) {
      if (c.next === "end") { paths++; continue; }
      if (onPath.includes(c.next) || c.next === d.id) { problems.push(`${sim.version}: ${[...onPath, d.id].join(" > ")} loops back to "${c.next}" and never ends`); continue; }
      visit(c.next, [...onPath, d.id]);
    }
  };
  visit(sim.start, []);
  for (const d of sim.decisions) if (!reached.has(d.id)) problems.push(`${sim.version}: decision "${d.id}" cannot be reached`);
  // A recovery decision is a second chance: only a weaker choice may lead to it, and it never opens the scenario.
  if (byId.get(sim.start)?.recovery) problems.push(`${sim.version}: the scenario opens on a recovery decision`);
  for (const d of sim.decisions) for (const c of d.choices) {
    const target = c.next === "end" ? undefined : byId.get(c.next);
    if (target?.recovery && isStrong(c)) problems.push(`${sim.version}/${d.id}/${c.id}: the strong choice leads to recovery decision "${target.id}"`);
  }
  for (const d of sim.decisions.filter(x => x.recovery)) {
    const incoming = sim.decisions.flatMap(x => x.choices.filter(c => c.next === d.id));
    if (!incoming.some(c => !isStrong(c))) problems.push(`${sim.version}: recovery decision "${d.id}" is not reached from any weaker choice`);
  }
  return { paths, reached, problems };
}

export async function run(): Promise<EvalResult> {
  const measures: EvalMeasure[] = [];
  const notes: string[] = [];
  const coreFiles = readdirSync(dir).filter(f => f.endsWith(".json")).sort();
  const draftFiles = existsSync(`${dir}drafts`) ? readdirSync(`${dir}drafts`).filter(f => f.endsWith(".json")).sort() : [];
  const builtFiles = existsSync(`${dir}built`) ? readdirSync(`${dir}built`).filter(f => f.endsWith(".json")).sort() : [];

  // 1. Format, branching and wording in every file.
  const fileIssues: string[] = [];
  for (const f of coreFiles) fileIssues.push(...fileProblems(readJson(`${dir}${f}`), "training").map(p => `${f}: ${p}`));
  for (const f of draftFiles) fileIssues.push(...fileProblems(readJson(`${dir}drafts/${f}`), "simulation").map(p => `drafts/${f}: ${p}`));
  for (const f of builtFiles) fileIssues.push(...fileProblems(readJson(`${dir}built/${f}`), "training").map(p => `built/${f}: ${p}`));
  measures.push(measure(`schema, trainingProblems and wordingProblems (${coreFiles.length} trainings, ${draftFiles.length} drafts, ${builtFiles.length} built)`, fileIssues.length, "0", fileIssues.length === 0, fileIssues));

  const built: Training[] = [];
  for (const f of builtFiles) {
    const parsed = TrainingSchema.safeParse(readJson(`${dir}built/${f}`));
    if (parsed.success) built.push(parsed.data);
  }
  const missingCore = coreFiles.map(f => f.replace(/\.json$/, "")).filter(t => !builtFiles.includes(`${t}.json`));
  measures.push(measure("every training is built", missingCore.length, "0", missingCore.length === 0 && built.length === builtFiles.length, missingCore.map(t => `${t} has no data/trainings/built/${t}.json`)));

  // 2. Versions.
  const noAllStaff = built.filter(t => !t.simulations.some(s => s.version === "all-staff")).map(t => t.id);
  measures.push(measure("all-staff version present", built.length - noAllStaff.length, `${built.length} of ${built.length}`, noAllStaff.length === 0 && built.length > 0, noAllStaff.map(t => `${t}: no all-staff version`)));
  const familyCounts = built.map(t => ({ id: t.id, have: t.simulations.filter(s => INTENDED_FAMILIES.includes(s.version)).map(s => s.version) }));
  const familyMissing = familyCounts.flatMap(c => INTENDED_FAMILIES.filter(f => !c.have.includes(f)).map(f => `${c.id}: no ${f} version`));
  measures.push(measure("job-family versions against the intended list (all ten families, owner-approved)", familyCounts.map(c => `${c.id} ${c.have.length}/${INTENDED_FAMILIES.length}`).join(", "), `${INTENDED_FAMILIES.length}/${INTENDED_FAMILIES.length} each`, familyMissing.length === 0 && built.length > 0, familyMissing));

  // 3. Exhaustive path walk.
  let totalPaths = 0;
  const walkIssues: string[] = [];
  for (const t of built) for (const sim of t.simulations) {
    const w = walk(sim);
    totalPaths += w.paths;
    walkIssues.push(...w.problems.map(p => `${t.id}/${p}`));
    if (w.paths === 0) walkIssues.push(`${t.id}/${sim.version}: no path ends`);
  }
  const simCount = built.reduce((n, t) => n + t.simulations.length, 0);
  measures.push(measure(`every path ends, every decision reachable, recovery only after a weaker choice (${totalPaths} paths in ${simCount} simulations)`, walkIssues.length, "0", walkIssues.length === 0 && totalPaths > 0, walkIssues));

  // 4. Strong choice with Affirm and Extend on every main decision.
  const noAffirm = built.flatMap(t => t.simulations.flatMap(s => s.decisions.filter(d => !d.recovery && !d.choices.some(c => isStrong(c) && c.feedback.some(f => f.style === "affirm-extend"))).map(d => `${t.id}/${s.version}/${d.id}`)));
  const mainCount = built.reduce((n, t) => n + t.simulations.reduce((m, s) => m + s.decisions.filter(d => !d.recovery).length, 0), 0);
  measures.push(measure(`main decisions with a strong choice and affirm-extend feedback (of ${mainCount})`, mainCount - noAffirm.length, `${mainCount}`, noAffirm.length === 0, noAffirm));

  // 5. Option length and where the strong option sits by length.
  const lengthIssues: string[] = [];
  const longestIssues: string[] = [];
  const alwaysShortest: string[] = [];
  let options = 0;
  for (const t of built) for (const s of t.simulations) {
    let strongShortest = 0, withStrong = 0;
    for (const d of s.decisions) {
      const n = d.choices.map(c => words(c.text));
      options += n.length;
      d.choices.forEach((c, i) => { if (n[i] < 20 || n[i] > 35) lengthIssues.push(`${t.id}/${s.version}/${d.id}/${c.id}: ${n[i]} words`); });
      const max = Math.max(...n), min = Math.min(...n);
      d.choices.forEach((c, i) => { if (isStrong(c) && n[i] === max && n.filter(x => x === max).length === 1) longestIssues.push(`${t.id}/${s.version}/${d.id}: the strong option is the only longest`); });
      const strong = d.choices.findIndex(isStrong);
      if (strong >= 0) { withStrong++; if (n[strong] === min) strongShortest++; }
    }
    if (withStrong > 0 && strongShortest === withStrong) alwaysShortest.push(`${t.id}/${s.version}: the strong option is the shortest in all ${withStrong} decisions`);
  }
  measures.push(measure(`options of 20 to 35 words (of ${options})`, lengthIssues.length, "0 outside", lengthIssues.length === 0, lengthIssues));
  measures.push(measure("strong option never the only longest", longestIssues.length, "0", longestIssues.length === 0, longestIssues));
  measures.push(measure("strong option not always the shortest in a simulation", alwaysShortest.length, "0 simulations", alwaysShortest.length === 0, alwaysShortest));

  // 6. Stable shuffle: the same order on every call (server render and page), strong rarely first.
  const unstable: string[] = [];
  const strongFirstMany: string[] = [];
  let firstTotal = 0, decisionsTotal = 0;
  for (const t of built) {
    for (const s of t.simulations) {
      let first = 0, counted = 0;
      for (const d of s.decisions) {
        const a = decisionOrder(d).map(c => c.id);
        const b = decisionOrder(structuredClone(d)).map(c => c.id);
        if (a.join() !== b.join()) unstable.push(`${t.id}/${s.version}/${d.id}`);
        const strong = d.choices.find(isStrong);
        if (strong) { counted++; if (a[0] === strong.id) first++; }
      }
      firstTotal += first; decisionsTotal += counted;
      if (counted > 0 && first * 2 > counted) strongFirstMany.push(`${t.id}/${s.version}: strong option first in ${first} of ${counted} decisions`);
    }
    for (const seg of t.segments) if (seg.check) {
      const a = stableShuffle(seg.check.options, seg.check.prompt).map(o => o.id);
      const b = stableShuffle(structuredClone(seg.check.options), seg.check.prompt).map(o => o.id);
      if (a.join() !== b.join()) unstable.push(`${t.id}/${seg.id}/check`);
    }
  }
  measures.push(measure("shuffle gives the same order twice", unstable.length, "0 differences", unstable.length === 0, unstable));
  measures.push(measure("strong option shown first, across all decisions", `${firstTotal} of ${decisionsTotal} decisions`, "at most half", decisionsTotal > 0 && firstTotal * 2 <= decisionsTotal, strongFirstMany));
  // Within one version a learner sees only that version's decisions: first every time gives the strong option away.
  const strongAlwaysFirst = strongFirstMany.filter(s => { const m = s.match(/first in (\d+) of (\d+)/); return m && m[1] === m[2]; });
  measures.push(measure("no simulation shows the strong option first in every decision", strongAlwaysFirst.length, "0 simulations", strongAlwaysFirst.length === 0, strongAlwaysFirst));

  // 7. Built files equal a fresh build from the core file and the drafts (hash compare).
  const stale: string[] = [];
  let compared = 0;
  for (const core of coreFiles) {
    const tid = core.replace(/\.json$/, "");
    const drafts = draftFiles.filter(f => f.startsWith(`${tid}.sim-`)).map(file => ({ file, raw: readJson(`${dir}drafts/${file}`) }));
    let fresh;
    try { fresh = buildTraining(readJson(`${dir}${core}`), drafts); } catch (error) { stale.push(`${tid}: cannot be built (${error instanceof Error ? error.message.slice(0, 120) : String(error)})`); continue; }
    for (const [path, content] of Object.entries(fresh.files)) {
      compared++;
      const onDisk = `${dir}built/${path}`;
      if (!existsSync(onDisk)) stale.push(`built/${path} is missing`);
      else if (hash(readFileSync(onDisk)) !== hash(content)) stale.push(`built/${path} differs from a fresh build (run node scripts/trainings/assemble.ts ${tid})`);
    }
    const expected = new Set(Object.keys(fresh.files).filter(p => p.startsWith(`${tid}/`)));
    if (existsSync(`${dir}built/${tid}`)) for (const f of readdirSync(`${dir}built/${tid}`)) if (!expected.has(`${tid}/${f}`)) stale.push(`built/${tid}/${f} is left over from an earlier build`);
    if (fresh.skipped.length) notes.push(`${tid}: drafts left out of the build: ${fresh.skipped.join("; ")}`);
  }
  for (const t of built) if (builtJson(t) !== readFileSync(`${dir}built/${t.id}.json`, "utf8") && !stale.some(s => s.includes(`built/${t.id}.json`))) stale.push(`built/${t.id}.json is not in the assembled form`);
  measures.push(measure(`captions, transcripts, decision maps and built JSON equal a fresh build (${compared} files)`, stale.length, "0 differences", stale.length === 0 && compared > 0, stale));

  // 8. Hero image.
  const heroMissing: string[] = [];
  const heroSizes: string[] = [];
  const heroNarrow: string[] = [];
  for (const t of built) {
    const path = `${root}public${t.hero.src}`;
    if (!existsSync(path)) { heroMissing.push(`${t.id}: ${t.hero.src} is missing`); continue; }
    const size = pngSize(path);
    if (!size) { heroMissing.push(`${t.id}: ${t.hero.src} is not a PNG`); continue; }
    if (size.width !== t.hero.width || size.height !== t.hero.height) heroMissing.push(`${t.id}: file is ${size.width}x${size.height}, the training says ${t.hero.width}x${t.hero.height}`);
    heroSizes.push(`${t.id} ${size.width}x${size.height}`);
    if (size.width < TARGET_HERO_WIDTH) heroNarrow.push(`${t.id}: ${size.width} px wide (known gap: the 4K upgrade has not run on training heroes)`);
  }
  measures.push(measure("hero image exists and matches its stated size", built.length - heroMissing.length, `${built.length} of ${built.length}`, heroMissing.length === 0 && built.length > 0, heroMissing));
  measures.push(measure("hero image width", heroSizes.join(", "), `>= ${TARGET_HERO_WIDTH} px`, heroNarrow.length === 0 && heroSizes.length > 0, heroNarrow));

  // 9. Cast: only the recurring figures C1 to C8, each with its portrait, and no character names.
  const castIssues: string[] = [];
  const portraits = new Set<string>(PORTRAITS);
  for (const t of built) {
    const used = [...t.hosts, t.closing.figure, ...t.segments.flatMap(s => s.scenes.map(x => x.figure)), ...t.simulations.flatMap(s => [s.intro_by, ...s.cast.map(c => c.portrait)])];
    for (const p of new Set(used)) {
      if (!portraits.has(p)) castIssues.push(`${t.id}: "${p}" is not one of C1 to C8`);
      else if (!existsSync(`${root}public/images/learning-guides/${p}.png`)) castIssues.push(`${t.id}: public/images/learning-guides/${p}.png is missing`);
    }
    castIssues.push(...wordingProblemsIn(t).filter(p => p.includes("character name")).map(p => `${t.id}: ${p}`));
  }
  measures.push(measure("cast only C1 to C8, portraits present, no names", castIssues.length, "0", castIssues.length === 0, castIssues));

  // 10. Sources: each slug has its reading text, and opens a resource in this app where the app has it.
  const collectionItems = existsSync(`${root}lib/content/collections-data.json`) ? (JSON.parse(readFileSync(`${root}lib/content/collections-data.json`, "utf8")) as { items: Record<string, unknown> }).items : {};
  const sourceTextMissing: string[] = [];
  const unresolved: string[] = [];
  let slugCount = 0, opened = 0;
  for (const t of built) {
    const texts = existsSync(`${dir}sources/${t.id}.json`) ? new Set((readJson(`${dir}sources/${t.id}.json`) as Array<{ slug: string }>).map(s => s.slug)) : new Set<string>();
    const slugs = [...new Set([...t.sources.map(s => s.slug), ...t.segments.flatMap(s => s.sources), ...t.simulations.flatMap(s => s.sources)])];
    for (const slug of slugs) {
      slugCount++;
      if (!texts.has(slug)) sourceTextMissing.push(`${t.id}: ${slug} has no text in data/trainings/sources/${t.id}.json`);
      if (collectionItems[slug] || collectionItems[slug.split("--")[0]]) opened++;
      else if (!slug.includes("--")) unresolved.push(`${t.id}: ${slug}`);
      else unresolved.push(`${t.id}: ${slug} (lesson; its course is not in this app either)`);
    }
  }
  measures.push(measure(`source slugs with their reading text (of ${slugCount})`, slugCount - sourceTextMissing.length, `${slugCount}`, sourceTextMissing.length === 0 && slugCount > 0, sourceTextMissing));
  measures.push(measure("source slugs that open a resource in this app (a lesson opens its course)", `${opened} of ${slugCount}`, "all", unresolved.length === 0, unresolved));

  // 11. The path stays on the open page: no storage and no network calls in the training components.
  const leaks: string[] = [];
  for (const file of ["components/branching-simulation.tsx", "components/training-check.tsx"]) {
    if (!existsSync(`${root}${file}`)) { leaks.push(`${file} is missing`); continue; }
    const code = readFileSync(`${root}${file}`, "utf8");
    for (const pattern of [/localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/, /\bfetch\s*\(/, /sendBeacon/, /XMLHttpRequest/, /navigator\.serviceWorker/]) if (pattern.test(code)) leaks.push(`${file}: ${pattern.source}`);
    if (/score/i.test(code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""))) leaks.push(`${file}: shows a score`);
  }
  measures.push(measure("no storage, network calls or score in the simulation and check components", leaks.length, "0", leaks.length === 0, leaks));

  return result({
    id, title: "Trainings", layer: "A", cadence,
    measures,
    skipped: [
      "keyboard-only browser run of a full path with console and network watched (A10, needs a running app)",
      "people's check that feedback fits the choice (two reviewers, 20 sampled choices per training)",
    ],
    notes: notes.length ? notes.join(" | ") : undefined,
  });
}
