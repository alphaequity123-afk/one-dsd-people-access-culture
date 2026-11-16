/**
 * Put a training together: the core file plus every job-family simulation draft that passes, into one checked file.
 *   node scripts/trainings/assemble.ts cultural-humility
 * Reads data/trainings/<id>.json and data/trainings/drafts/<id>.sim-*.json; writes data/trainings/built/<id>.json.
 * Also writes the generated captions, transcripts and decision maps to data/trainings/built/<id>/, and regenerates
 * lib/trainings/catalog.generated.ts, the module through which the app bundles every built training.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTraining, catalogModule } from "../../lib/trainings/build.ts";

const id = process.argv[2];
if (!id) throw new Error("usage: assemble.ts <training-id>");
const root = fileURLToPath(new URL("../../data/trainings/", import.meta.url));
const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8")) as unknown;
const drafts = existsSync(`${root}drafts`) ? readdirSync(`${root}drafts`).filter(f => f.startsWith(`${id}.sim-`) && f.endsWith(".json")) : [];
const build = buildTraining(readJson(`${root}${id}.json`), drafts.map(file => ({ file, raw: readJson(`${root}drafts/${file}`) })));
if (build.problems.length) throw new Error(`assembled training has problems:\n  ${build.problems.join("\n  ")}`);
for (const [path, content] of Object.entries(build.files)) {
  mkdirSync(dirname(`${root}built/${path}`), { recursive: true });
  writeFileSync(`${root}built/${path}`, content);
}
const built = readdirSync(`${root}built`).filter(f => f.endsWith(".json"));
writeFileSync(fileURLToPath(new URL("../../lib/trainings/catalog.generated.ts", import.meta.url)), catalogModule(built));
const core = build.training;
const narrationWords = core.segments.flatMap(s => s.scenes).reduce((n, s) => n + s.narration.split(/\s+/).length, 0);
console.log(JSON.stringify({ id, versions: core.simulations.map(s => s.version), skipped: build.skipped, narration_words: narrationWords, segments: core.segments.length }, null, 1));
