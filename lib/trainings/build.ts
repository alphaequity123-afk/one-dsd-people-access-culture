/**
 * Assemble a training in memory: the core file plus every job-family simulation draft that passes, and the files
 * generated from it (captions, transcripts, decision maps). No file access, so the assemble script writes the result
 * and the trainings eval (evals/trainings/run.ts) can compare data/trainings/built/ with a fresh build.
 */
import { SimulationSchema, TrainingSchema, trainingProblems, type Training } from "./schema.ts";
import { wordingProblems, wordingProblemsIn } from "./wording.ts";
import { decisionMap, toVtt, transcript } from "./media.ts";

export type TrainingBuild = {
  training: Training;
  /** Drafts left out, with the first reason. */
  skipped: string[];
  /** Problems in the assembled training; the assemble script refuses to write when there are any. */
  problems: string[];
  /** Generated files by path under data/trainings/built/, contents exactly as written. */
  files: Record<string, string>;
};

/** The JSON text of an assembled training as it is written to data/trainings/built/<id>.json. */
export const builtJson = (t: Training) => JSON.stringify(t, null, 1) + "\n";

export function buildTraining(coreRaw: unknown, drafts: Array<{ file: string; raw: unknown }>): TrainingBuild {
  const core = TrainingSchema.parse(coreRaw);
  const skipped: string[] = [];
  for (const { file, raw } of [...drafts].sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))) {
    const parsed = SimulationSchema.safeParse(raw);
    if (!parsed.success) { skipped.push(`${file}: does not match the format`); continue; }
    const words: string[] = [];
    JSON.stringify(parsed.data, (key, value) => { if (typeof value === "string" && !["id", "next", "start", "version"].includes(key)) words.push(...wordingProblems(value, file)); return value; });
    if (words.length) { skipped.push(`${file}: ${words[0]}`); continue; }
    core.simulations = core.simulations.filter(s => s.version !== parsed.data.version).concat(parsed.data);
  }
  const files: Record<string, string> = { [`${core.id}.json`]: builtJson(core) };
  for (const seg of core.segments) files[`${core.id}/${seg.id}.vtt`] = toVtt(seg.scenes) + "\n";
  for (const sim of core.simulations) {
    files[`${core.id}/transcript-${sim.version}.txt`] = transcript(core, sim.version) + "\n";
    files[`${core.id}/decision-map-${sim.version}.mmd`] = decisionMap(sim) + "\n";
  }
  return { training: core, skipped, problems: trainingProblems(core), files };
}

/** Every problem in one file: format, branching and wording. A job-family draft is checked as a simulation. */
export function fileProblems(raw: unknown, kind: "training" | "simulation"): string[] {
  const problems: string[] = [];
  if (kind === "simulation") {
    const parsed = SimulationSchema.safeParse(raw);
    if (!parsed.success) problems.push(...parsed.error.issues.slice(0, 20).map(i => `${i.path.join(".")}: ${i.message}`));
    else problems.push(...trainingProblems({ simulations: [parsed.data, { ...parsed.data, version: "all-staff" }] } as unknown as Training).filter(p => !p.includes("appears twice")));
  } else {
    const parsed = TrainingSchema.safeParse(raw);
    if (!parsed.success) problems.push(...parsed.error.issues.slice(0, 20).map(i => `${i.path.join(".")}: ${i.message}`));
    else problems.push(...trainingProblems(parsed.data));
  }
  return [...problems, ...wordingProblemsIn(raw)];
}

/** The generated module through which the app bundles every built training. */
export function catalogModule(builtFiles: string[]): string {
  const built = [...builtFiles].sort();
  return [
    "// Written by scripts/trainings/assemble.ts. Do not edit.",
    'import type { Training } from "./schema.ts";',
    ...built.map((f, i) => `import t${i} from "../../data/trainings/built/${f}" with { type: "json" };`),
    `export const TRAININGS: Training[] = [${built.map((_, i) => `t${i} as unknown as Training`).join(", ")}];`, "",
  ].join("\n");
}
