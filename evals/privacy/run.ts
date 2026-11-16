/**
 * A9. Privacy: nothing records learning (docs/EVALS-STUDY.md section 6), static checks.
 * Reads source code only. Reachability is the static import graph from every staff page, layout and route handler
 * (owner screens and scheduled jobs are listed in evals/privacy/allowlist.json), so it can over-report a module that
 * a staff path imports for something else; every conflict names the path so a person can confirm it.
 */
import { measure, result, type EvalOptions, type EvalResult } from "../contract.ts";
import { analyticsCode, askRecords, consoleCalls, cookieInventory, countingClaims, counters, formatHit, loadPrivacyAllowlist, logLikeWrites, reachableWrites, typedTextInUrls } from "./checks.ts";

export const id = "A9";
export const cadence = "unit";

export async function run(_options: EvalOptions = {}): Promise<EvalResult> {
  const allow = loadPrivacyAllowlist();
  const writes = reachableWrites(allow);
  const logTables = logLikeWrites(writes.conflicts);
  const logs = consoleCalls(writes.reach);
  const analytics = analyticsCode();
  const urls = typedTextInUrls(allow);
  const cookies = cookieInventory(allow);
  const counter = counters();
  const claims = countingClaims();
  const records = askRecords(allow);

  const list = (hits: { file: string; line: number; what: string; via?: string }[], max = 12) => hits.slice(0, max).map(formatHit);
  const measures = [
    measure("data-changing statements reachable from staff request paths, outside the allowlist", writes.conflicts.length, "0", writes.conflicts.length === 0, list(writes.conflicts)),
    measure("log, event, view, audit, usage or counter tables and files written from staff paths", logTables.length, "0", logTables.length === 0, list(logTables)),
    measure("console calls on staff paths that log request text (questions, bodies, typed input)", logs.requestText.length, "0", logs.requestText.length === 0, list(logs.requestText)),
    measure("per-use log lines on staff paths (console.info/log/debug: use becomes countable from host logs)", logs.perUse.length, "0", logs.perUse.length === 0, list(logs.perUse)),
    measure("analytics or beacon code", analytics.length, "0", analytics.length === 0, list(analytics)),
    measure("typed text put in a URL (GET forms with text boxes, navigation with typed values)", urls.length, "0", urls.length === 0, list(urls)),
    measure(`cookies outside the allowlist (allowed: ${Object.values(allow.cookies).join(", ")})`, cookies.outside.length, "0", cookies.outside.length === 0,
      [`cookies set: ${cookies.names.join(", ")}`, ...list(cookies.outside, 11)]),
    measure("counters switched on (PRACTICE_COUNTERS_ENABLED and any other counting switch)", counter.enabled ? 1 + counter.otherSwitches.length : counter.otherSwitches.length, "0",
      !counter.enabled && counter.otherSwitches.length === 0, [...(counter.enabled ? [`${counter.flagAt} PRACTICE_COUNTERS_ENABLED = true`] : []), ...list(counter.otherSwitches)]),
    measure("visible text that claims counting", claims.length, "0", claims.length === 0, list(claims)),
    measure("Ask records, anonymous totals and retrieved-content traces (owner decision 2026-11-16: must go)", records.length, "0", records.length === 0, list(records, 16)),
  ];
  return result({
    id, title: "Privacy: nothing records learning (static checks)", layer: "A", cadence: "unit", measures,
    skipped: ["Dynamic checks (sentinel text through A8 journeys and 20 Ask questions against a test database with log_statement = 'mod'): integration cadence, needs a test database"],
    notes: [
      `${writes.entries.length} staff entry files; ${writes.reach.size} files reachable by static imports; ${writes.allowed.length} reachable writes accepted by evals/privacy/allowlist.json (owner or contributor authoring, records a person chooses to share, rate limits).`,
      counter.exists ? `Counter switch ${counter.flagAt} is ${counter.enabled ? "ON" : "off"}; dormant counter code still present in ${counter.dormant.join(", ") || "no files"} (owner: anonymous totals must go, so removal is the end state).` : "Counter switch not found (removed).",
      `Cookies set by the app: ${cookies.names.join(", ")}.`,
      `Kept by owner decision (evals/privacy/allowlist.json "kept"): ${Object.keys(allow.kept ?? {}).join(", ") || "none"}. A usage-like table that a later migration drops is not a finding.`,
    ].join(" "),
  });
}
