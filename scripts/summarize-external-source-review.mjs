import fs from 'node:fs';
import { normalizeUrl } from './source-reading-format.mjs';

const root = '.data/source-coverage-completion';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const ledger = read(`${root}/external-availability.json`);
const unavailable = new Set(read('data/source-readings/unavailable.json').map(normalizeUrl));
const temporary = new Map(read('data/source-readings/temporary-unavailable.json').records.map(row => [normalizeUrl(row.url), row]));
const moves = new Map(read('data/source-readings/source-redirects.json').map(row => [normalizeUrl(row.from), row]));
const readings = read('data/source-readings/manifest.json');
const local = new Map(readings.flatMap(row => [row.url, row.original].map(url => [normalizeUrl(url), `/source-reading/${row.id}`])));
const live = read(`${root}/featured-links/external-links.json`);
const featured = new Map(live.map(row => [normalizeUrl(row.url), row]));
const reviewedUrls = new Set(ledger.records.map(row => normalizeUrl(row.url)));
const unaccountedRendered = [...featured.values()].filter(row => !reviewedUrls.has(normalizeUrl(row.url)));
const counts = {}; const renderedCounts = {}; const blockedHosts = {};
const records = ledger.records.map(row => {
  const key = normalizeUrl(row.url);
  const redirect = moves.get(key);
  const knownMissing = unavailable.has(key);
  const reading = local.get(key);
  const rendered = featured.get(key);
  const effectiveClassification = reading ? 'complete-in-app-reading' : redirect ? 'verified-replacement' : knownMissing ? (temporary.has(key) ? 'temporarily-unavailable-excluded' : 'confirmed-missing-excluded') : row.classification;
  counts[effectiveClassification] = (counts[effectiveClassification] || 0) + 1;
  if (rendered) renderedCounts[effectiveClassification] = (renderedCounts[effectiveClassification] || 0) + 1;
  if (!/^(?:available-|complete-in-app|verified-replacement|confirmed-missing|temporarily-unavailable-excluded)/.test(effectiveClassification)) {
    const host = new URL(row.url).hostname;
    blockedHosts[host] = (blockedHosts[host] || 0) + 1;
  }
  return { ...row, effectiveClassification, ...(temporary.has(key) ? { temporaryExclusion: temporary.get(key) } : {}), ...(redirect ? { verifiedReplacement: redirect } : {}), ...(reading ? { inAppReading: reading } : {}), ...(rendered ? { renderedPages: rendered.pages, linkText: rendered.titles, renderedKinds: rendered.kinds } : {}) };
});
const result = {
  checkedAt: new Date().toISOString(),
  methodology: 'Availability is separate from extraction or republication permission. Current successful source receipts are retained; previous extraction failures were checked for real content, downloads, data responses, missing pages and access challenges. Missing pages received a second request. Exact browser reviews and documented URL replacements are recorded individually. Open Library bulk HTML checks were stopped in accordance with its API policy after batch API and browser timeouts. Unverified publisher access remains unverified, not missing.',
  totalDestinations: records.length,
  latestRenderedExternalDestinations: live.length,
  latestRenderedNormalizedDestinations: featured.size,
  unaccountedRendered,
  originalUnavailableUrlCount: unavailable.size,
  temporaryExclusionCount: temporary.size,
  verifiedReplacementCount: moves.size,
  effectiveClassificationCounts: counts,
  renderedClassificationCounts: renderedCounts,
  unresolvedHosts: Object.entries(blockedHosts).sort((a, b) => b[1] - a[1]).map(([host, count]) => ({ host, count })),
  records,
};
fs.writeFileSync(`${root}/external-source-review.json`, JSON.stringify(result, null, 2));
const summary = { ...result, records: undefined };
fs.writeFileSync(`${root}/external-source-review-summary.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ total: records.length, rendered: featured.size, unaccountedRendered: unaccountedRendered.length, counts, renderedCounts }));
