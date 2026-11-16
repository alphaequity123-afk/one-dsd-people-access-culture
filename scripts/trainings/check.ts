/**
 * Check training files.
 *   node scripts/trainings/check.ts data/trainings/cultural-humility.json
 *   node scripts/trainings/check.ts --simulation data/trainings/drafts/cultural-humility.sim-supervisors.json
 * Exits 1 with a list of problems; prints "ok" otherwise. The trainings eval (evals/trainings/run.ts) runs the same
 * check on every training and draft.
 */
import { readFileSync } from "node:fs";
import { fileProblems } from "../../lib/trainings/build.ts";

const args = process.argv.slice(2);
const kind = args.includes("--simulation") ? "simulation" : "training";
const files = args.filter(a => !a.startsWith("--"));
let failed = false;

for (const file of files) {
  const problems = fileProblems(JSON.parse(readFileSync(file, "utf8")), kind);
  if (problems.length) { failed = true; console.log(`${file}: ${problems.length} problems\n  ${problems.slice(0, 40).join("\n  ")}`); }
  else console.log(`${file}: ok`);
}
process.exit(failed ? 1 : 0);
