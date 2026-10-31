const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const directory = path.join(root, "evidence/dsd-spectrum-verification");
const read = name => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8").replace(/^\uFEFF/, ""));
const content = read("content-routes.json");
const downloads = read("all-downloads.json");
const services = read("services.json");
const inventory = read("published-route-inventory.json");
const delta = read("css-hit-area-delta.json");
const unit = JSON.parse(fs.readFileSync(path.join(root, "evidence/dsd-full-smoke/test-summary.json"), "utf8"));
const finalBuild = fs.readFileSync(path.join(root, ".next/BUILD_ID"), "utf8").trim();
const cssHash = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "app/dsd-calm.css"))).digest("hex").toUpperCase();
const onlyCssChanged = delta.ChangedSourceFilesAfterBuildStart.length === 1
  && delta.ChangedSourceFilesAfterBuildStart[0].File.replaceAll("\\", "/") === "app/dsd-calm.css"
  && delta.ChangedSourceFilesAfterBuildStart[0].SHA256 === cssHash;
const negativeFailures = content.negativeResults.filter(item => !item.ok);
const finalRoutesPass = content.buildId === finalBuild && content.buildUnchanged
  && !content.pageFailures.length && !content.assetFailures.length && !content.missingFragments.length && !negativeFailures.length;
const functionalChecksRetained = onlyCssChanged
  && downloads.buildId === delta.PriorBuildId && services.buildId === delta.PriorBuildId
  && downloads.buildUnchanged && services.buildUnchanged
  && downloads.checks.length > 0 && services.checks.length > 0
  && !downloads.failures.length && !services.failures.length;
const downloadsByFormat = {};
for (const item of downloads.checks) {
  const format = new URL(item.url, downloads.base).searchParams.get("format");
  downloadsByFormat[format] = (downloadsByFormat[format] || 0) + 1;
}
const report = {
  checkedAt: new Date().toISOString(),
  passed: Boolean(finalRoutesPass && functionalChecksRetained),
  base: content.base,
  finalBuildId: finalBuild,
  finalBuildLog: "build-hit-area.log",
  finalRouteAndAssetAudit: {
    buildId: content.buildId, buildUnchanged: content.buildUnchanged,
    pageAndQueryUrls: content.pageCount, pageFailures: content.pageFailures.length,
    assets: content.assetCount, assetFailures: content.assetFailures.length,
    runtimeAssets: content.assets.filter(item => item.route.startsWith("/_next/static/")).length,
    brokenFragments: content.missingFragments.length,
    unknownRouteCases: content.negativeResults.length, unknownRouteFailures: negativeFailures.length,
    receipt: "content-routes.json",
  },
  retainedFunctionalVerification: {
    verifiedBuildId: delta.PriorBuildId,
    retainedAfterCssOnlyChange: functionalChecksRetained,
    exactChange: delta.Delta,
    changeReceipt: "css-hit-area-delta.json",
    downloadRequests: downloads.checks.length, downloadFailures: downloads.failures.length,
    downloadKinds: [...new Set(downloads.checks.map(item => item.url.split("/")[3]))].sort(),
    downloadsByFormat,
    downloadValidation: "HTTP status, attachment disposition, MIME, nonempty body, no substituted renderer; PDF signature/end marker; Office ZIP CRC and required document parts; HTML document marker.",
    serviceChecks: services.checks.length, serviceFailures: services.failures.length,
    receipts: ["all-downloads.json", "services.json"],
  },
  currentPassAutomatedTests: unit.passBreakdown["current-pass"],
  retainedEarlierTestBaseline: unit.passBreakdown["earlier-baseline"],
  testScope: "Current-pass tests and retained earlier baseline are separate, deduplicated sets. The cumulative session count is not a claim that every test ran in this pass.",
  publishedInventory: {
    source: inventory.source, scope: inventory.scope,
    courses: inventory.courseCount, lessons: inventory.lessonCount,
    libraryResources: inventory.resourceCount, communityEntries: inventory.communityCount,
    practiceGuides: inventory.programGuideCount, workAreas: inventory.workAreaCount,
  },
  exclusionsAndLimits: [
    `${content.externalReferences.length} external destinations were inventoried but not fetched.`,
    "Public content pages and their local assets were crawled. Protected owner/contributor pages were excluded from the page crawl; service checks cover selected access boundaries, not authenticated publication or live agent execution.",
    "The local runtime database is not configured. Saved server page edits and database-backed workflows were not verified end to end; the unavailable state was checked.",
    "Client-side interaction and visual acceptance are separate browser/workflow receipts; successful page HTTP responses alone do not establish every interactive behavior.",
    "The verification is local. No production deployment, domain repair, external message, or external AI-provider execution was performed.",
    "Earlier retained baseline includes ten explicit skips and separate disposable-database/Node tests; these were not rerun during this pass.",
  ],
};
fs.writeFileSync(path.join(directory, "verification-summary.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, finalBuildId: finalBuild, routes: report.finalRouteAndAssetAudit, downloadChecksRetained: functionalChecksRetained, currentPassTests: report.currentPassAutomatedTests.totals }));
process.exitCode = report.passed ? 0 : 1;
