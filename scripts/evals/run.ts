/**
 * Run the evals.
 *   node scripts/evals/run.ts [--cadence unit|integration|live] [--only A5,A9] [--base-url http://localhost:3000]
 * Each eval lives in evals/<folder>/run.ts and exports run(options) -> EvalResult (evals/contract.ts).
 * Writes evals/results/<date>-<cadence>.json (eval findings only; nothing about any person) and prints a table.
 * Exits 1 when any eval in the run fails.
 */
import { mkdirSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { EvalCadence, EvalModule, EvalResult } from "../../evals/contract.ts";

const args = process.argv.slice(2);
const option = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const cadence = (option("cadence") ?? "unit") as EvalCadence;
const only = option("only")?.split(",").map(s => s.trim().toUpperCase());
const root = fileURLToPath(new URL("../../evals/", import.meta.url));

const folders = readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(`${root}${d.name}/run.ts`)).map(d => d.name).sort();
const results: EvalResult[] = [];
for (const folder of folders) {
  const mod = await import(pathToFileURL(`${root}${folder}/run.ts`).href) as EvalModule & { id?: string; cadence?: EvalCadence };
  if (mod.cadence && mod.cadence !== cadence) continue;
  if (only && mod.id && !only.includes(mod.id.toUpperCase())) continue;
  try {
    const r = await mod.run({ baseUrl: option("base-url"), maxModelCalls: Number(option("max-model-calls") ?? 200) });
    if (r.cadence !== cadence) continue;
    if (only && !only.includes(r.id.toUpperCase())) continue;
    results.push(r);
  } catch (error) {
    results.push({ id: mod.id ?? folder, title: folder, layer: "A", cadence, passed: false, measures: [], notes: `eval crashed: ${error instanceof Error ? error.message : String(error)}` });
  }
}

const day = new Date().toISOString().slice(0, 10);
mkdirSync(`${root}results`, { recursive: true });
writeFileSync(`${root}results/${day}-${cadence}.json`, JSON.stringify({ date: day, cadence, results }, null, 1) + "\n");
for (const r of results) {
  console.log(`${r.passed ? "PASS" : "FAIL"}  ${r.id.padEnd(4)} ${r.title}`);
  for (const m of r.measures) console.log(`        ${m.pass ? "ok  " : "FAIL"} ${m.name}: ${m.value} (needs ${m.threshold})${m.failures?.length ? `\n              ${m.failures.join("\n              ")}` : ""}`);
  for (const s of r.skipped ?? []) console.log(`        skip ${s}`);
  if (r.notes) console.log(`        note ${r.notes}`);
}
console.log(`\n${results.filter(r => r.passed).length}/${results.length} evals passed (${cadence}).`);
process.exit(results.every(r => r.passed) ? 0 : 1);
