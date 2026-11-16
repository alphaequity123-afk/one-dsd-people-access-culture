/**
 * B: program evaluation model (Layer B), unit cadence. Design: docs/EVALS-STUDY.md section 6.B; guide:
 * docs/PROGRAM-EVALUATION.md; definitions: lib/program/evaluation.ts.
 *
 * Checks the evaluation model itself, offline: every ADSA action and outcome has an indicator, every indicator uses
 * only allowed evidence, every logic-model level and goal-year is covered, references resolve against the live program
 * model, the measure validator refuses learning and use counts, the voluntary outcome record keeps no identity, and no
 * program page promises or shows usage counts as evidence of outcomes. Reads published source files only; never reads,
 * counts or stores anyone's activity.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { measure, result, type EvalCadence, type EvalOptions, type EvalResult } from "../contract.ts";

export const id = "B";
export const cadence: EvalCadence = "unit";

const root = fileURLToPath(new URL("../../", import.meta.url));
const load = async <T>(path: string): Promise<T> => (await import(pathToFileURL(join(root, path)).href)) as T;

type Evaluation = typeof import("../../lib/program/evaluation");
type Model = typeof import("../../lib/program/model");
type Links = typeof import("../../lib/program/adsa-work-links");
type Logic = typeof import("../../lib/program/dsd-logic-model");
type Framework = typeof import("../../lib/program/equity-framework");
type Implementation = typeof import("../../lib/program/adsa-implementation");

/** Measures a goal lead might be tempted to write. Each must be refused. */
const FORBIDDEN_SAMPLES: Record<string, string>[] = [
  { title: "Course completions by unit", calculation: "Number of staff who completed the Core 15 courses divided by all staff." },
  { title: "Podcast reach", calculation: "Podcast chapters played each month across the site." },
  { title: "Site use", calculation: "Page views and visits to the site per quarter.", population: "All visitors." },
  { title: "Time learning", calculation: "Average time spent on lessons per person." },
  { title: "Ask demand", calculation: "Ask counts per month, by topic." },
  { title: "Training attendance", calculation: "Attendance by unit at training sessions and webinars." },
  { title: "Check performance", calculation: "Share of right answers on lesson checks." },
  { title: "Readiness ranking", calculation: "Rank staff by readiness scores." },
  { title: "Anonymous learning totals", evidenceSource: "Usage counts kept as anonymous totals from the application." },
];
/** Measures drawn from allowed sources. Each must be accepted. */
const ALLOWED_SAMPLES: Record<string, string>[] = [
  { title: "Next-step questions about a notice", calculation: "Calls tagged \"what do I do next\" about this notice divided by notices sent, before and after.", evidenceSource: "The unit's call-reason tallies, kept by the unit lead; no caller details." },
  { title: "Decisions with a review", calculation: "Key decisions with a completed equity review and a recorded disposition, divided by key decisions in the quarter.", evidenceSource: "Shared decision records; rather than page views, the decision owners' own records." },
  { title: "Two-year retention gap", calculation: "Two-year retention by group compared with all staff.", evidenceSource: "HR aggregate data, small cells suppressed; never completions from this application." },
];

/** Program pages whose copy is scanned, plus the program components and copy files they import (one level). */
const PROGRAM_PAGE_DIRS = ["app/program", "app/one-dsd/planning", "app/data/equity-baseline", "app/support/share-result", "app/consultant/outcomes", "app/consultant/program", "app/learn/equity-toolkit/goals"];
const EXTRA_COPY = ["lib/program/dsd-logic-model.ts", "lib/program/equity-framework.ts", "lib/program/adsa-implementation.ts", "components/program-outcome-form.tsx"];

function pageFiles(dir: string): string[] {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full).flatMap(name => {
    const path = join(full, name);
    if (statSync(path).isDirectory()) return pageFiles(relative(root, path));
    return /^(?:page|layout)\.tsx$/.test(name) ? [relative(root, path)] : [];
  });
}

function resolveImport(spec: string): string | null {
  const base = spec.replace(/^@\//, "");
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`]) {
    const path = join(root, candidate);
    if (existsSync(path) && statSync(path).isFile()) return candidate;
  }
  return null;
}

function copyFiles(): string[] {
  const pages = PROGRAM_PAGE_DIRS.flatMap(pageFiles);
  const files = new Set<string>([...pages, ...EXTRA_COPY].map(f => f.replaceAll("\\", "/")));
  for (const page of pages) {
    const text = readFileSync(join(root, page), "utf8");
    for (const match of text.matchAll(/from\s+"(@\/(?:components\/program[^"]*|components\/equity[^"]*|lib\/program\/[^"]*|lib\/content\/data\/[^"]*))"/g)) {
      const resolved = resolveImport(match[1]);
      if (resolved) files.add(resolved.replaceAll("\\", "/"));
    }
    for (const match of text.matchAll(/from\s+"(\.{1,2}\/[^"]+)"/g)) {
      const resolved = resolveImport(relative(root, join(root, page, "..", match[1])));
      if (resolved && /\.tsx$/.test(resolved)) files.add(resolved.replaceAll("\\", "/"));
    }
  }
  return [...files].filter(f => existsSync(join(root, f)) && !/\.test\.tsx?$/.test(f) && !f.endsWith("lib/program/evaluation.ts")).sort();
}

/** Visible copy: string literals and JSX text, with comments removed. */
function visibleCopy(source: string): string {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1 ");
  const strings = [...withoutComments.matchAll(/"((?:[^"\\\n]|\\.){12,})"|`((?:[^`\\]|\\.){12,})`|'((?:[^'\\\n]|\\.){12,})'/g)].map(m => m[1] ?? m[2] ?? m[3]);
  const jsxText = [...withoutComments.matchAll(/>([^<>{}]{12,})</g)].map(m => m[1]);
  return [...strings, ...jsxText].join("\n");
}

/** Static privacy check of the outcome route and record: nothing about who shared is read or kept. */
function outcomeRecordFindings(stored: readonly string[]): string[] {
  const findings: string[] = [];
  const route = readFileSync(join(root, "app/api/program/outcomes/route.ts"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [label, pattern] of [
    ["reads a network address", /x-forwarded-for|x-real-ip|request\.ip\b|remoteAddress/i],
    ["reads browser details", /user-agent|sec-ch-ua/i],
    ["reads cookies or referrer", /cookies\(|\.cookies\b|referer|referrer/i],
    ["uses the per-address request limiter", /consumeRequestLimit|requestLimitSubjectHash/],
    ["writes logs", /console\./],
  ] as const) if (pattern.test(route)) findings.push(`route ${label}`);
  const save = readFileSync(join(root, "lib/program/outcomes.ts"), "utf8");
  const saveCode = save.replace(/\/\*[\s\S]*?\*\//g, "");
  if (/createdAt|toISOString\(\)(?!\.slice\(0, 7\))/.test(saveCode)) findings.push("save writes a timestamp, not only a month");
  if (/program-outcome:\$\{/.test(saveCode)) findings.push("save writes an idempotency receipt, which carries its own timestamp");
  const identity = /^(?:name|email|phone|role|unit|ip|userAgent|createdAt|updatedAt|submittedAt|timestamp|sourceRoute|sessionId|userId|employeeId)$/i;
  for (const field of stored) if (identity.test(field)) findings.push(`stored record allows "${field}"`);
  if (!stored.includes("month")) findings.push("stored record has no month");
  return findings;
}

export async function run(_options: EvalOptions): Promise<EvalResult> {
  void _options;
  const evaluation = await load<Evaluation>("lib/program/evaluation.ts");
  const model = await load<Model>("lib/program/model.ts");
  const links = await load<Links>("lib/program/adsa-work-links.ts");
  const logic = await load<Logic>("lib/program/dsd-logic-model.ts");
  const framework = await load<Framework>("lib/program/equity-framework.ts");
  const implementation = await load<Implementation>("lib/program/adsa-implementation.ts");

  const refs = {
    outcomeIds: model.programOutcomes.map(o => o.id),
    goals: links.ADSA_WORK_GOALS.map(goal => ({ number: goal.number, actionIds: goal.actions.map(action => action.id) })),
    logicStageSlugs: logic.logicStages.map(stage => stage.slug),
    frameworkStages: framework.EQUITY_FRAMEWORK.cycle.map(stage => stage.stage),
  };
  const coverage = evaluation.evaluationCoverage(refs);
  const problems = evaluation.validateEvaluationModel(refs);
  const indicatorProblems = problems.filter(p => p.startsWith("indicator ") && /forbidden|unknown evidence|names no evidence|supports the|source type|limits|year \d|goal and a year|reviewer/.test(p));
  const referenceProblems = problems.filter(p => !indicatorProblems.includes(p));

  // The implementation plan and the work links must describe the same 28 actions.
  const implementationIds = implementation.adsaImplementationActions.map(action => action.id).sort();
  const linkIds = refs.goals.flatMap(goal => goal.actionIds).sort();
  if (implementationIds.join() !== linkIds.join()) referenceProblems.push("adsa-implementation.ts and adsa-work-links.ts list different actions");
  if (implementation.adsaImplementation.source.exactStepCount !== linkIds.length) referenceProblems.push(`the plan names ${implementation.adsaImplementation.source.exactStepCount} actions; ${linkIds.length} are linked`);

  const refusedMisses = FORBIDDEN_SAMPLES.filter(sample => evaluation.measureDefinitionProblems(sample).length === 0).map(sample => `not refused: ${sample.title}`);
  const allowedMisses = ALLOWED_SAMPLES.flatMap(sample => evaluation.measureDefinitionProblems(sample).map(problem => `${sample.title}: ${problem}`));
  const exampleProblems = evaluation.measureDefinitionProblems(evaluation.goal6WorkedExample.plan.measure);

  const files = copyFiles();
  const copyFindings = files.flatMap(file => evaluation.forbiddenEvidenceIn(visibleCopy(readFileSync(join(root, file), "utf8"))).map(f => `${file}: ${f.id} "${f.match}"`));

  const schemaSource = readFileSync(join(root, "lib/program/outcome-schema.ts"), "utf8");
  const storedFields = [...(schemaSource.match(/PROGRAM_OUTCOME_STORED_FIELDS = \[([^\]]+)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const privacyFindings = storedFields.length ? outcomeRecordFindings(storedFields) : ["PROGRAM_OUTCOME_STORED_FIELDS not found in lib/program/outcome-schema.ts"];

  const goalYears = refs.goals.length * 3;
  return result({
    id,
    title: "Program evaluation model: indicators, allowed evidence and no usage counts",
    layer: "B",
    cadence,
    measures: [
      measure("ADSA actions with at least one indicator", `${coverage.actionCount - coverage.actionsWithout.length}/${coverage.actionCount}`, "28/28", coverage.actionCount === 28 && coverage.actionsWithout.length === 0, coverage.actionsWithout),
      measure("Outcomes with at least one indicator", `${coverage.outcomeCount - coverage.outcomesWithout.length}/${coverage.outcomeCount}`, "7/7", coverage.outcomeCount === 7 && coverage.outcomesWithout.length === 0, coverage.outcomesWithout),
      measure("Logic-model levels with indicators", `${evaluation.logicLevels.length - coverage.levelsWithout.length}/${evaluation.logicLevels.length}`, "6/6", coverage.levelsWithout.length === 0, coverage.levelsWithout),
      measure("ADSA goal-years (delivery, application, benefit) with indicators", `${goalYears - coverage.goalYearsWithout.length}/${goalYears}`, "18/18", goalYears === 18 && coverage.goalYearsWithout.length === 0, coverage.goalYearsWithout),
      measure("Indicators using forbidden or unsupported evidence", indicatorProblems.length, "0", indicatorProblems.length === 0, indicatorProblems),
      measure("Unresolved references (outcomes, actions, goals, logic stages, cycle stages)", referenceProblems.length, "0", referenceProblems.length === 0, referenceProblems),
      measure("Learning or use measures refused by the validator", `${FORBIDDEN_SAMPLES.length - refusedMisses.length}/${FORBIDDEN_SAMPLES.length}`, "all", refusedMisses.length === 0, refusedMisses),
      measure("Allowed measures accepted (including the Goal 6 worked example)", allowedMisses.length + exampleProblems.length, "0 refused", allowedMisses.length + exampleProblems.length === 0, [...allowedMisses, ...exampleProblems]),
      measure("Voluntary outcome record: identity, address, browser or timestamp kept", privacyFindings.length, "0", privacyFindings.length === 0, privacyFindings),
      measure(`Program page copy promising or showing usage counts (${files.length} files)`, copyFindings.length, "0", files.length > 0 && copyFindings.length === 0, copyFindings),
    ],
    notes: `Evaluation model ${evaluation.EVALUATION_MODEL_VERSION}; ${evaluation.allIndicators.length} indicators. Checks the model and published copy only; program outcomes come from records people choose to keep or share, reviewed by people (docs/PROGRAM-EVALUATION.md).`,
  });
}
