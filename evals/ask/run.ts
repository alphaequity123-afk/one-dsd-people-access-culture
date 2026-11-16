/**
 * A2 (unit cadence): the Ask golden set is sound, and Ask always answers in words.
 *   node scripts/evals/run.ts            (runs this with the other unit evals)
 *   EVALS_ASK_SKIP_FAULTS=1 node ...     (skip the fault matrix, about 3 minutes, when only the data changed)
 *
 * Offline. Checks:
 *   - golden.jsonl: schema, class mix (A1 targets), every expected source resolves to published content in this codebase;
 *   - family-pairs.json (A4) and private-prompts.jsonl (A13) match the golden set;
 *   - stock-replies.json compiles; stock text written into Ask's reply code (route, Ask agent, shared copy);
 *   - the A2 fault matrix: runs evals/ask/never-stock.test.ts under vitest and reports each fault.
 * The live measures (A1, A3, A4, A13) are in evals/ask/live.ts, run from evals/ask-live/run.ts.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { measure, result, type EvalMeasure, type EvalOptions, type EvalResult } from "../contract.ts";
import { CLASS_TARGETS, ROOT, loadFamilyPairs, loadGolden, loadPrivatePrompts, loadStockList, stockMatcher, validateCompanions, validateGolden } from "./golden.ts";

export const id = "A2";
export const cadence = "unit";

/** Files whose string literals become what a person reads when Ask cannot write an answer. */
const REPLY_CODE = ["app/api/ask/route.ts", "lib/intelligence/agents/ask.ts", "lib/constants.ts", "lib/intelligence/policy.ts"];

export function stockLiterals(files = REPLY_CODE): string[] {
  const stock = stockMatcher(loadStockList());
  const found: string[] = [];
  for (const file of files) {
    const lines = readFileSync(ROOT + file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      const code = line.trim();
      // Comments, and instructions telling the writer what never to say, are not replies.
      if (code.startsWith("//") || code.startsWith("*") || /\b(?:Never|never|Do not|do not) (?:reply|say|answer)\b/.test(code)) return;
      for (const match of code.matchAll(/(["'`])((?:\\.|(?!\1).){12,}?)\1/g)) {
        // Regular-expression sources (for example the pattern that recognizes "are you a chatbot?") are not replies.
        if (/\(\?:|\\b|\[\^/.test(match[2])) continue;
        const phrases = stock(match[2]);
        if (phrases.length) found.push(`${file}:${index + 1} [${phrases.join(", ")}] ${match[2].slice(0, 110)}`);
      }
    });
  }
  return found;
}

type VitestJson = { numTotalTests: number; numPassedTests: number; testResults: Array<{ message?: string; assertionResults: Array<{ fullName: string; title: string; ancestorTitles: string[]; status: string; failureMessages: string[] }> }> };

/** Runs the fault matrix under vitest (offline: every provider, research call and network request is replaced). */
function faultMatrix(): { report?: VitestJson; error?: string } {
  const dir = mkdtempSync(join(tmpdir(), "ask-a2-"));
  const output = join(dir, "vitest.json");
  try {
    const run = spawnSync(process.execPath, [join(ROOT, "node_modules/vitest/vitest.mjs"), "run", "evals/ask/never-stock.test.ts", "--project", "node", "--reporter=json", `--outputFile=${output}`], {
      cwd: ROOT, encoding: "utf8", timeout: 15 * 60_000, maxBuffer: 64 * 1024 * 1024,
      // No provider or database credentials reach the matrix, whatever the shell holds.
      env: { ...process.env, OPENAI_API_KEY: "", ANTHROPIC_API_KEY: "", OPENROUTER_API_KEY: "", PAC_RUNTIME_DATABASE_URL: "", DATABASE_URL: "" },
    });
    try { return { report: JSON.parse(readFileSync(output, "utf8")) as VitestJson }; }
    catch { return { error: `vitest did not report (exit ${run.status ?? "timeout"}): ${(run.stderr || run.stdout || "").trim().split("\n").slice(-4).join(" ").slice(0, 400)}` }; }
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const firstLine = (message: string) => message.split("\n")[0].replace(/^AssertionError:\s*/, "").slice(0, 300);

export async function run(_options: EvalOptions = {}): Promise<EvalResult> {
  const measures: EvalMeasure[] = [];
  const skipped: string[] = [];
  const items = loadGolden();
  const golden = validateGolden(items);
  const mix = Object.entries(CLASS_TARGETS).map(([klass, target]) => `${klass} ${golden.counts[klass] ?? 0}/${target}`).join(", ");
  measures.push(measure("A1 golden set: items valid", golden.problems.filter(problem => !problem.startsWith("class ")).length, "0", golden.problems.every(problem => problem.startsWith("class ")), golden.problems.filter(problem => !problem.startsWith("class "))));
  measures.push(measure("A1 golden set: class mix", `${items.length} items (${mix})`, "150 in the A1 mix", items.length === 150 && Object.entries(CLASS_TARGETS).every(([klass, target]) => golden.counts[klass] === target), golden.problems.filter(problem => problem.startsWith("class "))));
  measures.push(measure("A1 golden set: expected sources resolve to published content", golden.unresolved.length, "0", golden.unresolved.length === 0, golden.unresolved));
  const companions = validateCompanions(items, loadPrivatePrompts(), loadFamilyPairs());
  measures.push(measure("A4 family pairs and A13 private prompts match the golden set", companions.length, "0", companions.length === 0, companions));

  const list = loadStockList();
  const broken = list.phrases.flatMap(phrase => { try { new RegExp(phrase.pattern, "i"); return []; } catch { return [phrase.id]; } });
  measures.push(measure("A2 stock-reply list compiles", broken.length, "0", broken.length === 0, broken));
  const literals = stockLiterals();
  measures.push(measure("A2 stock text written into Ask's reply code", literals.length, "0", literals.length === 0, literals));

  for (const fault of list.faults.filter(fault => fault.applicable === false)) skipped.push(`A2 fault "${fault.title}": ${fault.layer}`);
  if (process.env.EVALS_ASK_SKIP_FAULTS?.trim()) {
    skipped.push("A2 fault matrix: skipped because EVALS_ASK_SKIP_FAULTS is set");
  } else {
    const matrix = faultMatrix();
    if (!matrix.report) {
      measures.push(measure("A2 fault matrix ran", "no report", "a vitest report", false, [matrix.error ?? "unknown"]));
    } else {
      const cases = matrix.report.testResults.flatMap(file => file.assertionResults);
      const suiteError = matrix.report.testResults.map(file => file.message).filter(Boolean) as string[];
      const passed = cases.filter(test => test.status === "passed").length;
      // One line per failing fault, with each distinct reply the person would have read.
      const byFault = new Map<string, { passed: number; total: number; seen: Map<string, string[]> }>();
      for (const test of cases) {
        const faultId = test.ancestorTitles.at(-1)?.replace(/^A2 fault: /, "") ?? "?";
        const fault = `${faultId} (${list.faults.find(item => item.id === faultId)?.title ?? "?"})`;
        const entry = byFault.get(fault) ?? { passed: 0, total: 0, seen: new Map() };
        entry.total += 1;
        if (test.status === "passed") entry.passed += 1;
        else {
          const message = firstLine(test.failureMessages.join("\n"));
          entry.seen.set(message, [...(entry.seen.get(message) ?? []), test.title.match(/"([^"]+)"/)?.[1] ?? "?"]);
        }
        byFault.set(fault, entry);
      }
      const failing = [...byFault].filter(([, entry]) => entry.passed < entry.total);
      measures.push(measure("A2 answers in words (40+ words, no stock text) under every fault", `${passed}/${cases.length} questions; ${byFault.size - failing.length}/${byFault.size} faults`, `${cases.length}/${cases.length}`, cases.length > 0 && passed === cases.length && !suiteError.length,
        [...suiteError.map(message => message.slice(0, 300)), ...failing.map(([fault, entry]) => `${fault} (${entry.total - entry.passed}/${entry.total} failed): ${[...entry.seen].map(([message, questions]) => `[${questions.join(", ")}] ${message}`).join(" || ").slice(0, 700)}`)]));
    }
  }
  return result({
    id, title: "Ask: golden set sound; always answers in words (fault matrix)", layer: "A", cadence: "unit", measures, skipped,
    notes: "Delivery evidence only. Synthetic questions; no record of anyone's questions is read or kept. A failing fault case means the person would see stock text instead of the library answer.",
  });
}
