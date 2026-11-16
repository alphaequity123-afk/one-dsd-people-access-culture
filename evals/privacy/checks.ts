/**
 * Static privacy checks for A9 (docs/EVALS-STUDY.md section 6). Each check returns precise file:line conflicts.
 * The owner's rules: learning is never counted, stored or shown, not even as anonymous totals; your work stays
 * with you; 2026-11-16: no Ask records, no anonymous totals (monthly Ask run counts and retrieved-content traces must go).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { ROOT, chain, closure, rel, source } from "../links/imports.ts";
import { collectVisibleText } from "../wording/extract.ts";

export type PrivacyAllowlist = {
  ownerOrSystemEntries: Record<string, string>;
  writes: Record<string, string>;
  storedFunctions: Record<string, string>;
  cookies: Record<string, string>;
};

export function loadPrivacyAllowlist(): PrivacyAllowlist {
  return JSON.parse(readFileSync(new URL("./allowlist.json", import.meta.url), "utf8"));
}

export function walk(dir: string, test: (file: string) => boolean): string[] {
  const out: string[] = [];
  const visit = (full: string) => {
    if (!existsSync(full)) return;
    for (const entry of readdirSync(full, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const next = join(full, entry.name);
      if (entry.isDirectory()) visit(next);
      else { const r = rel(next); if (test(r)) out.push(r); }
    }
  };
  visit(join(ROOT, dir));
  return out.sort();
}

const ENTRY_FILE = /\/(?:page|layout|route|template|loading|error|not-found|default|global-error)\.tsx?$/;
const isTest = (file: string) => /\.test\.|\.vitest\.config\.|__fixtures__|\/testing\//.test(file);

/** Every file a staff request starts from: pages, layouts and route handlers outside owner screens, plus the request proxy. */
export function staffEntries(allow: PrivacyAllowlist): string[] {
  const owner = Object.keys(allow.ownerOrSystemEntries);
  const entries = walk("app", f => ENTRY_FILE.test(f) && !isTest(f)).filter(f => !owner.some(prefix => f.startsWith(prefix)));
  // The request proxy runs on staff requests; instrumentation.ts runs once at server start and is not a request path.
  if (existsSync(join(ROOT, "proxy.ts"))) entries.push("proxy.ts");
  return entries;
}

export type Hit = { file: string; line: number; what: string; via?: string; reason?: string };
const fmt = (h: Hit) => `${h.file}:${h.line} ${h.what}${h.via ? ` (reached from ${h.via})` : ""}`;
export { fmt as formatHit };

function linesOf(file: string): string[] { return source(file).split("\n"); }
const isComment = (line: string) => /^\s*(?:\/\/|\*|\/\*)/.test(line);

const MUTATING_FUNCTION = /^(?!read_|get_|list_|lookup_|find_|current_|is_|has_|can_|check_)\w+$/;

/** Data-changing statements and file writes in one file. */
export function writeSites(file: string): Hit[] {
  return writeSitesInText(file, source(file));
}

export function writeSitesInText(file: string, text: string): Hit[] {
  const hits: Hit[] = [];
  text.split("\n").forEach((line, index) => {
    if (isComment(line)) return;
    for (const m of line.matchAll(/\b(insert\s+(?:or\s+\w+\s+)?into|update|delete\s+from|copy|merge\s+into)\s+([\w."]+)(\s+set\b)?/gi)) {
      const verb = m[1].toLowerCase().replace(/\s+/g, " ");
      const after = line.slice((m.index ?? 0) + m[0].length);
      // SQL, not prose: a table followed by a column list, VALUES, SET, WHERE, a parameter or the end of the string.
      if (verb === "update" && !m[3]) continue;
      if (verb === "copy" && !/^\s+from\s+(?:stdin|'|\$)/i.test(after)) continue;
      if (/^(?:the|a|an|it|this|that|one|your|their|its)$/i.test(m[2])) continue;
      if (/^insert/.test(verb) && !/^\s*(?:\(|values\b|select\b|default\b|$|`)/i.test(after)) continue;
      if (/^delete/.test(verb) && !/^\s*(?:where\b|returning\b|$|`|")/i.test(after)) continue;
      if (/^merge/.test(verb) && !/^\s*(?:using\b|as\b)/i.test(after)) continue;
      if (!/[`"']/.test(line) && !/^\s*(?:insert|update|delete|on conflict|do update)/i.test(line)) continue;
      hits.push({ file, line: index + 1, what: `${verb} ${m[2]}` });
    }
    // A stored function called from SQL (select/perform/call/from pac_dsd.fn(...)); "into pac_dsd.table (" is a column list.
    for (const m of line.matchAll(/\b(?:select|perform|call|from)\s+(?:\*\s+from\s+)?pac(?:_dsd)?\.(\w+)\s*\(/gi)) {
      if (MUTATING_FUNCTION.test(m[1])) hits.push({ file, line: index + 1, what: `stored function ${m[1]}()` });
    }
    for (const m of line.matchAll(/\b(writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream)\s*\(/g)) {
      hits.push({ file, line: index + 1, what: `file ${m[1]}(${line.slice((m.index ?? 0) + m[0].length).split(/[,)]/)[0].trim().slice(0, 60)})` });
    }
  });
  return hits;
}

function inProgram(file: string): boolean { return /^(?:app|components|lib)\//.test(file) && !isTest(file) && !/\.json$/.test(file) && !/^lib\/content\/courses\//.test(file); }

/** Writes a staff request can reach (static import graph), split into allowlisted and conflicts. */
export function reachableWrites(allow: PrivacyAllowlist) {
  const entries = staffEntries(allow);
  const reach = closure(entries);
  const conflicts: Hit[] = [];
  const allowed: Hit[] = [];
  for (const file of reach.keys()) {
    if (!inProgram(file)) continue;
    for (const hit of writeSites(file)) {
      const via = chain(reach, file, 4);
      const fn = /stored function (\w+)/.exec(hit.what)?.[1];
      const reason = allow.writes[file] ?? (fn ? allow.storedFunctions[fn] : undefined);
      (reason ? allowed : conflicts).push({ ...hit, via, reason });
    }
  }
  return { entries, reach, conflicts, allowed };
}

/** Tables or files named like logs, events, views, audits, usage, counters or ledgers, written on staff paths (no allowlist). */
export function logLikeWrites(hits: Hit[]): Hit[] {
  return hits.filter(h => /(?:^|[\s._"(])(?:\w*(?:log|logs|event|events|view|views|audit|usage|counter|counters|ledger|runs|records?|trace|traces|history)\w*)(?=[\s"().,]|$)/i.test(h.what) && !/ask_response_record|record_surface_review|record_resource_review|record_page_block_review/.test(h.what) || /audit\.jsonl|counters\.json|ask-response-records/.test(h.what));
}

/** console.* calls on staff paths: ones that log request text, and per-use lines (info/log/debug) that make use countable. */
export function consoleCalls(reach: Map<string, string | null>) {
  const requestText: Hit[] = [];
  const perUse: Hit[] = [];
  for (const file of reach.keys()) {
    if (!inProgram(file) || file.startsWith("components/")) continue;
    const lines = linesOf(file);
    lines.forEach((line, index) => {
      if (isComment(line)) return;
      for (const m of line.matchAll(/\bconsole\.(log|info|warn|error|debug|trace)\s*\(/g)) {
        const args = [line.slice((m.index ?? 0) + m[0].length), lines[index + 1] ?? "", lines[index + 2] ?? ""].join(" ").slice(0, 400);
        const head = args.split(/\);/)[0];
        const code = head.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, "\"\"");
        const via = chain(reach, file, 4);
        if (/(?<![.\w])(?:body|question|prompt|query|userText|typedText|input|payload|formData|searchParams|transcript|answer|draft|reflection|notes?|text|messages)\b(?!\s*[:?]?\s*\()|request\.(?:json|text|formData)\(|\$\{\s*(?:body|question|prompt|query|input|text)\b/.test(code)) {
          requestText.push({ file, line: index + 1, what: `console.${m[1]}(${head.slice(0, 90).trim()}`, via });
        } else if (/^(?:log|info|debug|trace)$/.test(m[1]) && /^app\/api\/|^lib\//.test(file)) {
          perUse.push({ file, line: index + 1, what: `console.${m[1]}(${head.slice(0, 90).trim()}`, via });
        }
      }
    });
  }
  return { requestText, perUse };
}

const ANALYTICS = /navigator\.sendBeacon|\bgtag\s*\(|googletagmanager|google-analytics|\bga\s*\(\s*['"]send|plausible\.io|next-plausible|usePlausible|posthog|@sentry\/|Sentry\.init|clarity\.ms|hotjar|mixpanel|amplitude\.|segment\.(?:com|io)|analytics\.track|@vercel\/analytics|@vercel\/speed-insights|useReportWebVitals|web-vitals|fullstory|heap\.load|matomo|newrelic|datadog-rum|logrocket/i;

/** Analytics or beacon code anywhere the app or its public files load. */
export function analyticsCode(): Hit[] {
  const files = [
    ...walk("app", f => /\.(?:tsx?|jsx?|mjs)$/.test(f) && !isTest(f)),
    ...walk("components", f => /\.(?:tsx?|jsx?|mjs)$/.test(f) && !isTest(f)),
    ...walk("lib", f => /\.(?:tsx?|jsx?|mjs)$/.test(f) && !isTest(f) && !f.startsWith("lib/content/")),
    ...walk("public", f => /\.(?:html|js|mjs)$/.test(f)),
    ...["next.config.ts", "instrumentation.ts", "proxy.ts"].filter(f => existsSync(join(ROOT, f))),
  ];
  const hits: Hit[] = [];
  for (const file of files) linesOf(file).forEach((line, index) => {
    if (isComment(line)) return;
    const m = ANALYTICS.exec(line);
    if (m && !/forbid|never|no analytics|not use|absent|blocked|deny|refuse/i.test(line)) hits.push({ file, line: index + 1, what: m[0] });
  });
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) if (ANALYTICS.test(name)) hits.push({ file: "package.json", line: 0, what: `dependency ${name}` });
  return hits;
}

const TYPED = /\b(?:q|query|question|text|term|search|searchText|input|value|draft|keyword|keywords|prompt|message|typed|ask)\b/i;

/** Typed text put into a URL: GET forms with text inputs, and navigation that writes typed values into the query string. */
export function typedTextInUrls(allow: PrivacyAllowlist): Hit[] {
  const owner = Object.keys(allow.ownerOrSystemEntries);
  const files = [...walk("app", f => /\.tsx?$/.test(f) && !isTest(f)), ...walk("components", f => /\.tsx?$/.test(f) && !isTest(f))]
    .filter(f => !owner.some(prefix => f.startsWith(prefix)) && !/consultant|owner|-editor\.tsx$/.test(f));
  const hits: Hit[] = [];
  for (const file of files) {
    const text = source(file);
    if (file.endsWith(".tsx") && /<form\b/i.test(text)) hits.push(...getForms(file, text));
    text.split("\n").forEach((line, index) => {
      if (isComment(line)) return;
      const nav = /(router\.(?:push|replace|prefetch)|location\.(?:href\s*=|assign|replace)|window\.open|\bredirect|\bhref\s*=\s*\{?)\s*\(?\s*`([^`]*\?[^`]*)`/.exec(line);
      if (nav) {
        const vars = [...nav[2].matchAll(/\$\{\s*(?:encodeURIComponent\(\s*)?([\w.]+)/g)].map(v => v[1]);
        const typed = vars.filter(v => TYPED.test(v.split(".").pop() ?? ""));
        if (typed.length) hits.push({ file, line: index + 1, what: `${nav[1].trim()} puts ${typed.join(", ")} in the address: \`${nav[2].slice(0, 80)}\`` });
      }
      const set = /\b(?:searchParams|params|query|url\.searchParams|next)\.(?:set|append)\(\s*["'](q|query|question|search|text|term|prompt|ask)["']\s*,\s*([^)]+)\)/.exec(line);
      if (set && /use client/.test(text)) hits.push({ file, line: index + 1, what: `query parameter "${set[1]}" set from ${set[2].trim().slice(0, 40)}` });
    });
  }
  return hits;
}

/** GET forms (no method="post", no server action, no submit handler) that send text boxes in the address. */
export function getForms(file: string, text: string): Hit[] {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits: Hit[] = [];
  const attrs = (el: ts.JsxOpeningLikeElement) => new Map(el.attributes.properties.filter(ts.isJsxAttribute).map(a => [a.name.getText(sf), a.initializer ? a.initializer.getText(sf) : "true"]));
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(sf) === "form") {
      const a = attrs(node.openingElement);
      const method = (a.get("method") ?? "").replace(/["'{}]/g, "").toLowerCase();
      const action = a.get("action") ?? "";
      const serverAction = /^\{/.test(action) && !/^\{\s*["'`]/.test(action);
      // A form with its own submit handler does not navigate; any navigation it does is checked line by line.
      if (method !== "post" && !serverAction && !a.has("onSubmit")) {
        const inputs: string[] = [];
        const find = (n: ts.Node) => {
          if (ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) {
            const tag = n.tagName.getText(sf);
            const at = attrs(n);
            const type = (at.get("type") ?? "\"text\"").replace(/["'{}]/g, "");
            if (tag === "textarea" || tag === "input" && /^(?:text|search|email|tel|url)$/.test(type)) inputs.push(`${tag}${at.get("name") ? ` name=${at.get("name")}` : ""}`);
          }
          ts.forEachChild(n, find);
        };
        find(node);
        if (inputs.length) {
          const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
          hits.push({ file, line, what: `GET form${action ? ` action=${action}` : ""} sends typed text (${inputs.join(", ")}) in the address` });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

/** Cookie names the app sets, resolved from constants, compared with the allowlist. */
export function cookieInventory(allow: PrivacyAllowlist) {
  const files = [...walk("app", f => /\.tsx?$/.test(f) && !isTest(f)), ...walk("components", f => /\.tsx?$/.test(f) && !isTest(f)), ...walk("lib", f => /\.tsx?$/.test(f) && !isTest(f)), "proxy.ts"];
  const constants = new Map<string, string>();
  for (const file of files) for (const m of source(file).matchAll(/export\s+const\s+(\w*COOKIE\w*)\s*=\s*["']([^"']+)["']/g)) constants.set(m[1], m[2]);
  const set: Array<Hit & { name: string }> = [];
  for (const file of files) source(file).split("\n").forEach((line, index) => {
    if (isComment(line)) return;
    const patterns = [
      /\bcookies\.set\(\s*(?:\{\s*name:\s*)?([A-Z_]+|["'][^"']+["'])/g,
      /\bcookieStore\.set\(\s*(?:\{\s*name:\s*)?([A-Z_]+|["'][^"']+["'])/g,
      /document\.cookie\s*=\s*`\$\{([A-Z_]+)\}=/g,
      /document\.cookie\s*=\s*["'`]([\w-]+)=/g,
      /\bname:\s*([A-Z_]*COOKIE[A-Z_]*)\s*,/g,
    ];
    for (const re of patterns) for (const m of line.matchAll(re)) {
      const raw = m[1].replace(/["']/g, "");
      const name = constants.get(raw) ?? raw;
      if (!set.some(s => s.file === file && s.line === index + 1)) set.push({ file, line: index + 1, what: `sets cookie "${name}"`, name });
    }
  });
  const names = [...new Set(set.map(s => s.name))].sort();
  const outside = set.filter(s => !(s.name in allow.cookies));
  return { names, set, outside, constants };
}

/** The counter switch and the dormant counter code. */
export function counters() {
  const flagFile = "lib/practice/equity-review-count.ts";
  const flag = /PRACTICE_COUNTERS_ENABLED\s*=\s*(true|false)/.exec(source(flagFile));
  const enabled = flag ? flag[1] === "true" : false;
  const flagLine = flag ? source(flagFile).slice(0, flag.index).split("\n").length : 0;
  const dormant = [
    "lib/practice/equity-review-count-store.ts", "lib/tutor/counter-store.ts", "app/api/practice/equity-review-completed/route.ts",
    "app/data/equity-baseline/review-count-section.tsx",
  ].filter(f => existsSync(join(ROOT, f)));
  const otherSwitches: Hit[] = [];
  for (const file of walk("lib", f => /\.ts$/.test(f) && !isTest(f))) source(file).split("\n").forEach((line, index) => {
    const m = /\b(\w*(?:COUNTER|COUNT|TELEMETRY|ANALYTICS|TRACKING)\w*ENABLED\w*)\s*=\s*true\b/.exec(line);
    if (m) otherSwitches.push({ file, line: index + 1, what: `${m[1]} = true` });
  });
  return { exists: Boolean(flag), enabled, flagAt: `${flagFile}:${flagLine}`, dormant, otherSwitches };
}

const COUNTING_CLAIM = /\banonymous (?:counts?|totals?|tall(?:y|ies))\b|\bmonthly (?:counts?|totals?)\b|\b(?:is|are|gets?|get|will be|were|was|be) (?:counted|tallied)\b|\bcounts? (?:each|every|how many|completed|completions|uses|visits|views|reviews|questions|rounds|answers)\b|\b(?:completions|visits|views|uses|reviews|plays|questions|rounds) (?:are|is|get|gets) (?:counted|tracked|recorded|tallied)\b|\bnot counted yet\b|\bkeeps? (?:a |an )?(?:anonymous )?(?:count|total|tally)\b|\b(?:reviews|rounds|questions) completed\b|\bnumber of (?:times|visits|completions|people who)\b/i;

/** Counting people in a census or a measure's numerator is not a claim about this program counting its users. */
const ABOUT_USE = /\b(?:reviews?|completed|completions?|visits?|lessons?|courses?|questions?|answers?|anonymous|this site|on this site|the program|this program|staff add|per person|guidance|rounds?|practice|use|uses|listening|plays?)\b/i;
const NOT_ABOUT_USE = /\b(?:census|numerator|denominator|population|statewide figures|in their own groups|survey respondents)\b/i;

/** Does this visible string tell staff that their use is counted? */
export function claimsCounting(text: string): boolean {
  // A statement of the rule ("not even anonymous totals") is not a claim that counting happens.
  return COUNTING_CLAIM.test(text) && ABOUT_USE.test(text) && !NOT_ABOUT_USE.test(text) && !/\bnot even\b|\bnever (?:count|kept|stored)|\bno (?:count|counting|totals)\b|\bmust not\b|\bruled out\b/i.test(text);
}

/** Visible text that tells staff something is counted. */
export function countingClaims(): Hit[] {
  // Program pages, components and program data; course and reference data teach counting as a method and are left out.
  const { texts } = collectVisibleText({ skipFiles: f => /^public\/|^lib\/content\/.*\.json$|^lib\/content\/courses\//.test(f) });
  return texts.filter(t => claimsCounting(t.text)).map(t => {
    const i = t.text.search(COUNTING_CLAIM);
    return { file: t.file, line: t.line, what: `"${t.text.slice(Math.max(0, i - 40), i + 70)}"` };
  });
}

type RecordCheck = { label: string; files: string[]; pattern: RegExp };

/** Owner decision 2026-11-16: no Ask records, no anonymous totals, no retrieved-content traces. Found by content, so removal passes. */
const ASK_RECORD_CHECKS: RecordCheck[] = [
  { label: "Ask response records store", files: ["lib/intelligence/observability/ask-records.ts"], pattern: /append_ask_response_record|ask-response-records|saveAskResponseRecord\s*\(|export async function saveAskResponseRecord/ },
  { label: "Ask response records owner screen", files: ["app/consultant/ask-records/page.tsx", "app/api/consultant/ask-records/route.ts"], pattern: /ask[-_ ]?response[-_ ]?record|AskResponseRecord|listAskResponseRecords|ask-records/i },
  { label: "Ask run ledger (monthly Ask run counts)", files: ["lib/intelligence/clone/ledger.ts", "app/consultant/orchestrator/page.tsx"], pattern: /INSERT INTO runs|UPDATE runs SET|ledgerSummary\(/ },
  { label: "Voice usage totals", files: ["lib/intelligence/clone/voice.ts"], pattern: /INSERT INTO voice_usage/ },
  { label: "Retrieved-content trace per question (content_ids_touched)", files: ["lib/intelligence/tools/runtime.ts", "lib/intelligence/memory/postgres-store.ts"], pattern: /content_ids_touched:\s*(?:auditableContentIds|durableAuditContentIds)/ },
  { label: "Audit event store", files: ["lib/intelligence/memory/postgres-store.ts", "lib/intelligence/memory/store.ts"], pattern: /insert into pac_dsd\.runtime_audit_events|appendFile\([^)]*audit\.jsonl/ },
  { label: "Anonymous counter store", files: ["lib/intelligence/memory/postgres-store.ts", "lib/intelligence/memory/store.ts"], pattern: /insert into pac_dsd\.runtime_counters|counters\.json/ },
  { label: "Question hash kept for research usage", files: ["lib/intelligence/research/index.ts", "lib/intelligence/research/governance.ts"], pattern: /const query_hash = await hashQuery\(question\)|^\s*query_hash: string;/ },
];

export function askRecords(): Hit[] {
  const hits: Hit[] = [];
  for (const check of ASK_RECORD_CHECKS) for (const file of check.files) {
    if (!existsSync(join(ROOT, file))) continue;
    // One finding per file and kind, listing every line.
    const lines: number[] = [];
    source(file).split("\n").forEach((line, index) => { if (check.pattern.test(line) && !isComment(line)) lines.push(index + 1); });
    if (lines.length) hits.push({ file, line: lines[0], what: `${check.label}${lines.length > 1 ? ` (also lines ${lines.slice(1, 9).join(", ")}${lines.length > 9 ? ", …" : ""})` : ""}` });
  }
  // Tables that keep questions, answers, traces or totals, created and never dropped.
  const sql = [...walk("db", f => f.endsWith(".sql"))];
  const created = new Map<string, Hit>();
  const dropped = new Set<string>();
  for (const file of sql) source(file).split("\n").forEach((line, index) => {
    const c = /create table (?:if not exists )?([\w.]*(?:ask_log|ask_response_records|runtime_counters|runtime_audit_events|ask_records|question_log|usage_events|page_views))\b/i.exec(line);
    if (c) created.set(c[1].toLowerCase(), { file, line: index + 1, what: `table ${c[1]} (questions, answers, traces or totals)` });
    const d = /drop table (?:if exists )?([\w.]+)/i.exec(line);
    if (d) dropped.add(d[1].toLowerCase());
  });
  for (const [name, hit] of created) if (!dropped.has(name)) hits.push(hit);
  return hits;
}
