#!/usr/bin/env node
/**
 * Route smoke check for a running One DSD / One DHS People, Access and Culture server.
 *
 * Usage:
 *   node scripts/smoke/smoke-routes.mjs <base-url> [--out report.json] [--label dsd]
 *        [--log server.log] [--catalog catalog.json] [--sample 120]
 *        [--concurrency 2] [--timeout 240000] [--only /home,/ask] [--start 0 --count 25]
 *   node scripts/smoke/smoke-routes.mjs --merge part1.json part2.json ... --out report.json [--label dsd]
 *
 * For every route it records the HTTP status (following same-origin redirects), whether the page has a
 * non-empty <h1>, any <svg> that is not a chart or the paperclip upload icon, whether the header menu reads
 * Home, Practice, Leadership, Communities, Knowledge, and, when --log names the server's log file, the error
 * lines the server wrote while that route was requested. It only reads pages; it never posts or signs in.
 *
 * Routes: the fixed list below, plus internal hrefs sampled from the program catalog. By default the sample is
 * scripts/smoke/catalog-sample.json (120 hrefs taken at even intervals from programCatalog()). Pass --catalog with
 * a fresh JSON dump of programCatalog() (an array of { href }) to resample; see scripts/smoke/README.md.
 */
import { readFileSync, writeFileSync, statSync, openSync, readSync, closeSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const FIXED_ROUTES = [
  "/home", "/practice", "/leadership", "/communities", "/knowledge", "/about", "/people-and-growth",
  "/program/inventory", "/ask", "/courses", "/library", "/learn", "/minnesota-communities",
  "/minnesota-communities/calendar", "/start", "/support", "/charter", "/user-guide", "/growth",
];
export const EXPECTED_MENU = ["Home", "Practice", "Leadership", "Communities", "Knowledge"];
const PAPERCLIP_PATH = "m8 12 7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3a2 2 0 0 1 3 3L5 17";

function parseArgs(argv) {
  const options = { base: undefined, out: undefined, label: undefined, log: undefined, catalog: undefined, sample: 120, concurrency: 2, timeout: 240000, only: undefined, start: 0, count: Infinity, merge: undefined, list: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => { const next = argv[++i]; if (next === undefined) throw new Error(`${arg} needs a value`); return next; };
    if (arg === "--out") options.out = value();
    else if (arg === "--label") options.label = value();
    else if (arg === "--log") options.log = value();
    else if (arg === "--catalog") options.catalog = value();
    else if (arg === "--sample") options.sample = Number(value());
    else if (arg === "--concurrency") options.concurrency = Math.max(1, Number(value()));
    else if (arg === "--timeout") options.timeout = Number(value());
    else if (arg === "--only") options.only = value().split(",").map(s => s.trim()).filter(Boolean);
    else if (arg === "--start") options.start = Number(value());
    else if (arg === "--count") options.count = Number(value());
    else if (arg === "--list") options.list = true;
    else if (arg === "--merge") { options.merge = []; while (argv[i + 1] && !argv[i + 1].startsWith("--")) options.merge.push(argv[++i]); }
    else if (arg === "--help" || arg === "-h") { options.help = true; }
    else if (!arg.startsWith("--") && !options.base) options.base = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

/** Even sample over a catalog dump: index floor(i * size / n), moving on to the next distinct href if already covered. */
export function sampleCatalog(items, n, exclude = new Set()) {
  const seen = new Set(exclude);
  const out = [];
  const step = items.length / n;
  for (let i = 0; i < n; i++) {
    for (let j = Math.floor(i * step); j < items.length; j++) {
      const href = String(items[j].href || "").split("#")[0];
      if (href.startsWith("/") && !href.startsWith("//") && !seen.has(href)) { seen.add(href); out.push(href); break; }
    }
  }
  return out;
}

function routeList(options) {
  return allRoutes(options).slice(options.start, options.start + options.count);
}

function allRoutes(options) {
  if (options.only) return options.only.map(path => ({ path, origin: "only" }));
  const fixed = FIXED_ROUTES.map(path => ({ path, origin: "fixed" }));
  let sampled;
  if (options.catalog) {
    const raw = JSON.parse(readFileSync(options.catalog, "utf8"));
    sampled = sampleCatalog(Array.isArray(raw) ? raw : raw.items, options.sample, new Set(FIXED_ROUTES));
  } else {
    const file = resolve(here, "catalog-sample.json");
    sampled = JSON.parse(readFileSync(file, "utf8")).items.map(item => item.href).slice(0, options.sample);
  }
  return [...fixed, ...sampled.map(path => ({ path, origin: "catalog" }))];
}

function stripNonMarkup(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, "");
}

function text(fragment) {
  return fragment.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=("([^"]*)"|'([^']*)')`, "i"));
  return match ? (match[2] ?? match[3]) : undefined;
}

/** Classify every <svg> in the markup: charts and maps (role img/group, or a legend swatch), the paperclip, or other. */
export function classifySvgs(markup) {
  const found = [];
  const pattern = /<svg\b[^>]*>[\s\S]*?<\/svg>/gi;
  for (const match of markup.matchAll(pattern)) {
    const whole = match[0];
    const open = whole.match(/^<svg\b[^>]*>/i)[0];
    const role = attr(open, "role");
    const label = attr(open, "aria-label") || attr(open, "aria-labelledby");
    const cls = attr(open, "class") || "";
    let kind = "other";
    if (whole.includes(`d="${PAPERCLIP_PATH}"`)) kind = "paperclip";
    else if (role === "img" || role === "group" || /chart|map|swatch/i.test(cls) || (attr(open, "width") === "18" && attr(open, "height") === "14")) kind = "chart";
    found.push({ kind, role, label, class: cls || undefined, snippet: kind === "other" ? whole.slice(0, 240) : undefined });
  }
  return found;
}

/**
 * Labels of the header's program menu (<nav aria-label="Program">). Links marked as mobile-only utilities
 * (class "dsd-mobile-utility", e.g. "My work", hidden on wide screens by CSS) are reported apart from the menu.
 */
export function menuLabels(markup) {
  const nav = markup.match(/<nav\b[^>]*aria-label="Program"[^>]*>([\s\S]*?)<\/nav>/i);
  if (!nav) return { labels: null, utility: [] };
  const labels = [], utility = [];
  for (const m of nav[1].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) (/dsd-mobile-utility/.test(m[1]) ? utility : labels).push(text(m[2]));
  return { labels, utility };
}

export function inspectHtml(html) {
  const markup = stripNonMarkup(html);
  const headings = [...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => text(m[1])).filter(Boolean);
  const svgs = classifySvgs(markup);
  const { labels: menu, utility: menuUtility } = menuLabels(markup);
  const title = (markup.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  const notFound = /This page could not be found|<meta name="robots" content="noindex"\/?>\s*<title>404/i.test(html) || /\b404\b/.test(text(title || ""));
  const nextError = /id="__next_error__"/.test(html);
  return {
    title: title ? text(title) : undefined,
    h1: headings,
    hasMainHeading: headings.length > 0,
    svgCount: svgs.length,
    svgAllowed: svgs.filter(s => s.kind !== "other").map(s => s.kind),
    svgDisallowed: svgs.filter(s => s.kind === "other"),
    menu,
    menuUtility,
    menuOk: Array.isArray(menu) && EXPECTED_MENU.every((label, i) => menu[i] === label) && menu.length === EXPECTED_MENU.length,
    notFoundMarkers: notFound,
    nextErrorMarkup: nextError,
  };
}

/** Bytes appended to a log file since `from`. */
function readLogSince(path, from) {
  if (!path || !existsSync(path)) return { text: "", end: from };
  const end = statSync(path).size;
  if (end <= from) return { text: "", end };
  const fd = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(end - from);
    readSync(fd, buffer, 0, buffer.length, from);
    return { text: buffer.toString("utf8"), end };
  } finally { closeSync(fd); }
}

const ERROR_LINE = /⨯|\bError\b|\bUnhandled\b|\bTypeError\b|\bReferenceError\b|ECONNREFUSED|digest:/;
export function errorLines(logText) {
  return logText.replace(/\x1b\[[0-9;]*m/g, "").split(/\r?\n/).filter(line => ERROR_LINE.test(line) && !/^\s*(GET|HEAD) \//.test(line)).slice(0, 40);
}

async function request(base, path, timeout) {
  const hops = [];
  let url = new URL(path, base);
  const started = Date.now();
  for (let hop = 0; hop < 6; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    let response;
    try {
      response = await fetch(url, { redirect: "manual", signal: controller.signal, headers: { accept: "text/html", "user-agent": "pac-smoke-routes/1" } });
    } finally { clearTimeout(timer); }
    hops.push({ url: url.pathname + url.search, status: response.status });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      const next = new URL(location, url);
      await response.arrayBuffer().catch(() => {});
      if (next.origin !== new URL(base).origin) return { hops, status: response.status, external: next.href, html: "", ms: Date.now() - started, contentType: undefined };
      url = next;
      continue;
    }
    const contentType = response.headers.get("content-type") || "";
    const html = await response.text();
    return { hops, status: response.status, html, ms: Date.now() - started, contentType, finalPath: url.pathname + url.search };
  }
  return { hops, status: 0, html: "", ms: Date.now() - started, error: "too many redirects" };
}

async function checkRoute(base, route, options, logState) {
  const result = { path: route.path, origin: route.origin };
  try {
    const response = await request(base, route.path, options.timeout);
    Object.assign(result, { status: response.status, ms: response.ms, redirects: response.hops.length > 1 ? response.hops : undefined, finalPath: response.finalPath, external: response.external, contentType: response.contentType });
    if (response.error) result.requestError = response.error;
    if (response.html && /text\/html/.test(response.contentType || "")) Object.assign(result, inspectHtml(response.html));
  } catch (error) {
    result.status = 0;
    result.requestError = error?.name === "AbortError" ? `timed out after ${options.timeout} ms` : String(error?.message || error);
  }
  if (options.log && options.concurrency === 1) {
    const slice = readLogSince(options.log, logState.offset);
    logState.offset = slice.end;
    result.serverErrors = errorLines(slice.text);
  }
  const problems = [];
  if (result.requestError) problems.push(result.requestError);
  if (result.status !== 200) problems.push(`HTTP ${result.status}`);
  if (result.external) problems.push(`redirects off-site to ${result.external}`);
  if (result.status === 200 && !result.contentType?.includes("text/html")) problems.push(`content-type ${result.contentType}`);
  if (result.status === 200 && result.hasMainHeading === false) problems.push("no <h1>");
  if (result.svgDisallowed?.length) problems.push(`${result.svgDisallowed.length} non-chart <svg>`);
  if (result.status === 200 && result.menu === null) problems.push("header menu missing");
  else if (result.status === 200 && result.menuOk === false) problems.push(`header menu reads ${JSON.stringify(result.menu)}`);
  if (result.nextErrorMarkup) problems.push("Next.js error page markup");
  if (result.serverErrors?.length) problems.push(`${result.serverErrors.length} server error line(s) in log`);
  result.problems = problems;
  result.pass = problems.length === 0;
  return result;
}

function summarize(label, base, startedAt, results) {
  return {
    label,
    base,
    startedAt,
    finishedAt: new Date().toISOString(),
    expectedMenu: EXPECTED_MENU,
    totals: { routes: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length },
    results,
  };
}

/** Join reports from several runs (for example one per server restart) into one, in the order given. */
function merge(options) {
  const parts = options.merge.map(file => JSON.parse(readFileSync(file, "utf8")));
  const report = summarize(options.label ?? parts[0]?.label, parts[0]?.base, parts[0]?.startedAt, parts.flatMap(part => part.results));
  const out = options.out || `smoke-report${report.label ? "-" + report.label : ""}.json`;
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  console.log(`${report.totals.passed} passed, ${report.totals.failed} failed of ${report.totals.routes}. Report: ${out}`);
  process.exitCode = report.totals.failed ? 1 : 0;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.merge) return merge(options);
  if (options.list) { console.log(routeList(options).map(r => r.path).join("\n")); return; }
  if (options.help || !options.base) {
    console.log("Usage: node scripts/smoke/smoke-routes.mjs <base-url> [--out report.json] [--label name] [--log server.log] [--catalog catalog.json] [--sample 120] [--concurrency 2] [--timeout 240000] [--only /a,/b]");
    process.exit(options.help ? 0 : 2);
  }
  if (options.log && options.concurrency !== 1) {
    console.error("Note: --log attributes log lines to routes only with --concurrency 1; using 1.");
    options.concurrency = 1;
  }
  const routes = routeList(options);
  const logState = { offset: options.log && existsSync(options.log) ? statSync(options.log).size : 0 };
  const results = new Array(routes.length);
  let next = 0, done = 0;
  const started = new Date();
  async function worker() {
    while (next < routes.length) {
      const index = next++;
      results[index] = await checkRoute(options.base, routes[index], options, logState);
      done++;
      const r = results[index];
      console.log(`[${done}/${routes.length}] ${r.pass ? "ok  " : "FAIL"} ${String(r.status).padStart(3)} ${r.path}${r.problems.length ? "  - " + r.problems.join("; ") : ""}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(options.concurrency, routes.length) }, worker));
  const report = summarize(options.label, options.base, started.toISOString(), results);
  const out = options.out || `smoke-report${options.label ? "-" + options.label : ""}.json`;
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  console.log(`\n${report.totals.passed} passed, ${report.totals.failed} failed of ${report.totals.routes}. Report: ${out}`);
  process.exitCode = report.totals.failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exit(2); });
}
