/**
 * A5. Content accuracy and wording rules (docs/EVALS-STUDY.md section 6).
 * Runs the shared linter (evals/wording/linter.ts) over every staff-visible string in the repository
 * (evals/wording/extract.ts) and reports, per rule, how many hits there are with concrete file:line examples.
 * Offline; reads only published content and source code.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { measure, result, type EvalOptions, type EvalResult } from "../contract.ts";
import { collectVisibleText, type VisibleText } from "./extract.ts";
import { AcronymTracker, RULES, discoverScenarioNames, lintText, loadAllowlist, type RuleId } from "./linter.ts";

export const id = "A5";
export const cadence = "unit";

/** Courses, trainings and scenarios: people there are described by role, so the names rule applies. */
export const NAMED_PEOPLE_FILES = /(?:^|\/)(?:courses|trainings)\/|scenario|curriculum|lesson|journey|self-directed|water-|practice|leadership-styles|multimedia\//i;
/** Keys that hold a line someone speaks. */
const SPEECH_KEYS = /^(?:dialogue|dialog|line|lines|speech|says|said|utterance|spoken|voiceLine|reply|replies)$/i;

export type WordingFinding = { rule: RuleId; file: string; line: number; match: string; text: string };

export function lintRepository(): { findings: WordingFinding[]; strings: number; files: number; skippedStrings: number; names: string[]; texts: VisibleText[] } {
  const allowlist = loadAllowlist();
  const quoted = new Set(Object.keys(allowlist.quotedSourceFiles));
  const { texts: all, files } = collectVisibleText();
  const texts = all.filter(t => !quoted.has(t.file));
  const names = discoverScenarioNames(texts.filter(t => NAMED_PEOPLE_FILES.test(t.file)).map(t => t.text));
  const findings: WordingFinding[] = [];
  let unit = "";
  let tracker = new AcronymTracker(allowlist.knownAcronyms);
  for (const t of texts) {
    if (t.unit !== unit) { unit = t.unit; tracker = new AcronymTracker(allowlist.knownAcronyms); }
    const hits = lintText(t.text, { allowlist, acronyms: tracker, checkNames: NAMED_PEOPLE_FILES.test(t.file), names, speech: Boolean(t.key && SPEECH_KEYS.test(t.key)) });
    for (const hit of hits) findings.push({ rule: hit.rule, file: t.file, line: t.line, match: hit.match, text: snippet(t.text, hit.index) });
  }
  return { findings, strings: texts.length, files, skippedStrings: all.length - texts.length, names, texts };
}

function snippet(text: string, index: number): string {
  const start = Math.max(0, index - 50);
  return `${start > 0 ? "…" : ""}${text.slice(start, index + 70)}${index + 70 < text.length ? "…" : ""}`;
}

/** Examples spread over different files, so one large file does not hide the rest. */
export function examples(findings: WordingFinding[], limit = 12): string[] {
  const byFile = new Map<string, WordingFinding[]>();
  for (const f of findings) byFile.set(f.file, [...(byFile.get(f.file) ?? []), f]);
  const files = [...byFile].sort((a, b) => b[1].length - a[1].length);
  const picked: WordingFinding[] = [];
  for (let round = 0; picked.length < limit && round < 3; round++) for (const [, list] of files) if (list[round] && picked.length < limit) picked.push(list[round]);
  return picked.map(f => `${f.file}:${f.line} "${f.match}" — ${f.text}`);
}

function topFiles(findings: WordingFinding[], n = 6): string {
  const counts = new Map<string, number>();
  for (const f of findings) counts.set(f.file, (counts.get(f.file) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, n).map(([file, count]) => `${file} (${count})`).join("; ");
}

export async function run(_options: EvalOptions = {}): Promise<EvalResult> {
  const { findings, strings, files, skippedStrings, names } = lintRepository();
  const measures = (Object.keys(RULES) as RuleId[]).map(rule => {
    const hits = findings.filter(f => f.rule === rule);
    const failures = hits.length ? [`most hits in: ${topFiles(hits)}`, ...examples(hits, 11)] : [];
    return measure(`${rule}: ${RULES[rule]}`, hits.length, "0", hits.length === 0, failures);
  });
  let written = "";
  try {
    const dir = join(tmpdir(), "one-dhs-evals");
    mkdirSync(dir, { recursive: true });
    written = join(dir, "A5-wording-findings.json");
    writeFileSync(written, JSON.stringify({ date: new Date().toISOString(), strings, files, names, findings }, null, 1));
  } catch { written = ""; }
  return result({
    id, title: "Content accuracy and wording rules (one shared linter)", layer: "A", cadence: "unit", measures,
    skipped: [
      `${skippedStrings} strings in files that reproduce someone else's words (evals/wording/allowlist.json quotedSourceFiles)`,
      "Ask answers (A1 data; run lintStandalone from evals/wording/linter.ts on them), Brief/Working verbatim and per-resource source checks (not part of this run)",
      "Strings under source, citation, quote, transcript and caption keys (someone else's words or recorded audio)",
    ],
    notes: [
      `${strings} staff-visible strings from ${files} files (lib/content, lib/program, data/trainings, data/workforce/areas.json, app/ and components/ outside owner screens, public/*.html).`,
      "Hits are counted in source. Where text reaches staff through withProfessionalLanguage (publications, page copy, editable surfaces) responsibleWording() rewrites some \"office\" phrases at display; the source still carries them.",
      "Acronyms are checked per unit: one course or record for JSON, one file for TypeScript and HTML.",
      names.length ? `Names found in this repository's scenarios and added to the names rule: ${names.join(", ")}.` : "",
      written ? `Every finding with file and line: ${written}` : "",
    ].filter(Boolean).join(" "),
  });
}
