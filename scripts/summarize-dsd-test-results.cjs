const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const evidence = path.join(root, "evidence/dsd-full-smoke");
const read = name => JSON.parse(fs.readFileSync(path.join(evidence, name), "utf8"));
const files = new Map();
const phaseOne = read("test-phase-one.json");
for (const item of phaseOne.completed.filter(item => item.passed)) {
  const skipped = Number(item.line.match(/(\d+) skipped/)?.[1] ?? 0);
  files.set(item.file, {
    file: item.file, total: item.tests, passed: item.tests - skipped,
    failed: 0, skipped, status: "passed", evidence: "tests-initial.log",
  });
}
const currentReports = new Set(["tests-header-no-search.json", "tests-workflows-current.json", "tests-draft-workflows-after.json", "tests-workflows-extended.json", "tests-toolkit-interactions-typed.json", "tests-consultation-overview.json", "../dsd-spectrum-verification/inventory-test.json", "../dsd-spectrum-verification/tests-home-current.json"]);
const reports = ["tests-focused.json", "tests-repaired.json", "tests-notices.json", "tests-phase-two.json", "tests-final-repairs.json", "tests-new-workspace.json", "tests-enhancements.json", "tests-header-final.json", "tests-enhancements-typed.json", "tests-private-continuity-final.json", "tests-plain-language.json", "tests-hero-presentation.json", ...currentReports];
for (const report of reports) {
  if (!fs.existsSync(path.join(evidence, report))) continue;
  for (const result of read(report).testResults) {
    const file = path.relative(root, result.name).replaceAll("\\", "/");
    const assertions = result.assertionResults;
    files.set(file, {
      file, total: assertions.length,
      passed: assertions.filter(test => test.status === "passed").length,
      failed: assertions.filter(test => test.status === "failed").length,
      skipped: assertions.filter(test => ["pending", "skipped", "todo"].includes(test.status)).length,
      status: result.status, evidence: report,
    });
  }
}
const expected = fs.readdirSync(path.join(root, "tests"))
  .filter(name => /\.test\.(?:ts|tsx)$/.test(name)).map(name => `tests/${name}`);
const covered = [...files.values()].map(item => ({ ...item, verificationPass: currentReports.has(item.evidence) ? "current-pass" : "earlier-baseline" })).sort((a, b) => a.file.localeCompare(b.file));
const missing = expected.filter(file => !files.has(file));
const failures = covered.filter(file => file.failed > 0 || file.status === "failed");
const totalFor = items => items.reduce((total, item) => {
  for (const key of ["total", "passed", "failed", "skipped"]) total[key] += item[key];
  return total;
}, { total: 0, passed: 0, failed: 0, skipped: 0 });
const totals = totalFor(covered);
const passBreakdown = Object.fromEntries(["current-pass", "earlier-baseline"].map(name => {
  const selected = covered.filter(item => item.verificationPass === name);
  return [name, { files: selected.length, totals: totalFor(selected), reports: [...new Set(selected.map(item => item.evidence))] }];
}));
const result = {
  checkedAt: new Date().toISOString(),
  method: "Cumulative session coverage, not a claim that every suite ran again during the latest pass. First phase ran serially, including 18 disposable PostgreSQL suites; remaining files ran with two isolated workers. Current-pass workflow, header, consultation, and inventory receipts are separated from retained earlier baseline results. Each file uses its latest completed report, without double-counting reruns. Production HTTP verification is a separate build-specific receipt.",
  complete: missing.length === 0 && failures.length === 0,
  expectedFiles: expected.length, coveredFiles: covered.length, totals, missing, failures,
  passBreakdown,
  database: { files: 18, tests: 120, source: "tests-initial.log", verificationPass: "earlier-baseline", environment: "Disposable local PostgreSQL; no production database" },
  separateNodeTests: { tests: 9, passed: 9, source: "node-tests.log", verificationPass: "earlier-baseline" },
  skippedNote: "Skipped assertions are reported separately and are not counted as passing; inspect the listed suite for its fixture or environment condition.",
  skipReasons: [
    { assertions: 8, reason: "Optional owner-machine corpus import, frozen-stage, or source-object fixtures are absent from this separate source copy." },
    { assertions: 1, reason: "Pinned historical donor Git commits are absent; committed runtime source snapshots remain present." },
    { assertions: 1, reason: "Live external AI-provider execution is not enabled or configured in this local static application." },
  ],
  files: covered,
};
fs.writeFileSync(path.join(evidence, "test-summary.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ completeSessionCoverage: result.complete, expectedFiles: result.expectedFiles, coveredFiles: result.coveredFiles, cumulativeTotals: totals, currentPass: passBreakdown["current-pass"], missing: missing.length, failures: failures.map(item => item.file) }));
process.exitCode = result.complete ? 0 : 1;
