/**
 * Ask, live cadence: A1 answer quality and sources, A3 speed, A4 job family, A13 people decide (EVALS-STUDY section 6).
 *   node scripts/evals/run.ts --cadence live --base-url https://staging.example --max-model-calls 200
 * Exported to the runner from evals/ask-live/run.ts.
 *
 * Posts each synthetic golden question to the running app's Ask API (POST /api/ask, progress lines) and scores what a
 * person would read. Model-graded measures (A1 support and usefulness, A4 invented facts and profiling) run only when
 * OPENAI_API_KEY is set, within --max-model-calls; otherwise they are listed under `skipped`.
 * Nothing about any person is read or kept: the inputs are synthetic and only eval findings are written.
 *
 * Knobs (environment): EVALS_ASK_LIMIT (golden items, default all), EVALS_ASK_FAMILY=off (skip A4's 220 requests),
 * EVALS_ASK_CONCURRENCY_SAMPLE (items rerun at concurrency 5 for A3, default 20, 0 to skip),
 * EVALS_ASK_TIMEOUT_MS (per request, default 60000), EVALS_ASK_MAX_REQUESTS (default 450),
 * EVALS_GRADER_MODEL (pinned grader, default gpt-4.1-2025-04-14).
 * The route allows 120 questions per 10 minutes from one client, so a full run takes about 40 minutes.
 */
import { measure, result, type EvalMeasure, type EvalOptions, type EvalResult } from "../contract.ts";
import {
  answerWords, hrefMatches, loadFamilyPairs, loadGolden, loadPrivatePrompts, loadStockList, shownText, statesFact, stockMatcher,
  visibleReply, wordingProblems, words, type GoldenItem, type Turn, type Visible,
} from "./golden.ts";

export const id = "A1";
export const cadence = "live";

const env = (name: string, fallback: number) => { const value = Number(process.env[name]); return Number.isFinite(value) && process.env[name]?.trim() ? value : fallback; };
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);
const percentile = (values: number[], p: number) => {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
};
const seconds = (ms: number) => (Number.isFinite(ms) ? Math.round(ms / 100) / 10 : NaN);
const excerpt = (text: string, size = 140) => text.replace(/\s+/g, " ").trim().slice(0, size);
const RESPONSIBLE = /\b(?:person or area responsible|responsible (?:person|area|official|program owner|policy owner)|policy owner|program owner|data owner|form owner|Human Resources|HR partner|\bHR\b|labor relations|ADA coordinator|accommodation process|language access coordinator|lead agency|county|case manager|hiring manager|supervisor|Tribal liaison|Office of Indian Policy|legal (?:team|counsel|partner))/i;
const PROFILING = [
  /\bas an? (?:executive|manager|director|supervisor|policy|program|licens\w*|investigator|eligibility|analyst|finance|contract|grant|HR|administrative|support)[\w -]{0,30}, you (?:probably|likely|may not|might not|tend|already|don't|do not|won't)\b/i,
  /\bpeople in (?:your|that) (?:role|position|job family|line of work) (?:tend|usually|often|typically|generally|probably)\b/i,
  /\bbecause (?:you are|you're) (?:a|an|in) /i,
  /\byou (?:probably|likely) (?:don't|do not|lack|aren't|are not|have little|have no)\b/i,
];

/* ------------------------------------------------------------------ talking to Ask */

type Attempt = { status: number; reply: Visible; firstMs: number; totalMs: number; reportedTotalMs?: number; error?: string };
let requests = 0;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function askOnce(base: string, question: string, history: Turn[] | undefined, family: string | null, cookieName: string): Promise<Attempt> {
  const limit = env("EVALS_ASK_MAX_REQUESTS", 450);
  for (let tries = 0; tries < 6; tries++) {
    if (requests >= limit) return { status: 0, reply: visibleReply({ error: "request cap reached (EVALS_ASK_MAX_REQUESTS)" }), firstMs: NaN, totalMs: NaN, error: "cap" };
    requests += 1;
    const started = performance.now();
    let firstMs = NaN;
    try {
      const response = await fetch(`${base}/api/ask`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/x-ndjson, application/json", origin: base, ...(family ? { cookie: `${cookieName}=${encodeURIComponent(family)}` } : {}) },
        body: JSON.stringify({ question, ...(history?.length ? { history } : {}) }),
        signal: AbortSignal.timeout(env("EVALS_ASK_TIMEOUT_MS", 60_000)),
      });
      if (response.status === 429 && tries < 5) {
        const wait = Math.max(5, Number(response.headers.get("retry-after")) || 30);
        await response.body?.cancel();
        await sleep(wait * 1000);
        continue;
      }
      let text = "";
      let done: unknown;
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      if (reader) for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        const piece = decoder.decode(chunk.value, { stream: true });
        text += piece;
        pending += piece;
        let at: number;
        while ((at = pending.indexOf("\n")) >= 0) {
          const line = pending.slice(0, at).trim();
          pending = pending.slice(at + 1);
          if (!line) continue;
          try {
            const event = JSON.parse(line) as { type?: string; text?: string; result?: unknown };
            if (event.type === "text" && event.text?.trim() && Number.isNaN(firstMs)) firstMs = performance.now() - started;
            if (event.type === "done") done = event.result;
          } catch { /* a patient-JSON body arrives in pieces; parsed below */ }
        }
      }
      const totalMs = performance.now() - started;
      if (done === undefined) {
        const trimmed = (text + pending).trim();
        try { done = JSON.parse(trimmed); } catch { done = { error: `unreadable response (HTTP ${response.status}): ${trimmed.slice(0, 120)}` }; }
      }
      const reply = visibleReply(done);
      const reported = (done as { timings?: { total_ms?: number } } | undefined)?.timings?.total_ms;
      // A reply that was not streamed shows its first words when it arrives whole.
      return { status: response.status, reply, firstMs: Number.isNaN(firstMs) ? totalMs : firstMs, totalMs, ...(typeof reported === "number" ? { reportedTotalMs: reported } : {}) };
    } catch (error) {
      const totalMs = performance.now() - started;
      return { status: 0, reply: visibleReply({ error: `request failed: ${error instanceof Error ? error.message : String(error)}` }), firstMs: totalMs, totalMs, error: String(error) };
    }
  }
  return { status: 429, reply: visibleReply({ error: "rate limited" }), firstMs: NaN, totalMs: NaN, error: "rate limited" };
}

async function pool<T, R>(items: T[], size: number, work: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const index = next++; out[index] = await work(items[index], index); }
  }));
  return out;
}

/* ------------------------------------------------------------------ model grader (optional) */

type Grader = { calls: number; cap: number; model: string; key: string };
async function grade(grader: Grader, instructions: string, input: string): Promise<Record<string, unknown> | undefined> {
  if (grader.calls >= grader.cap) return undefined;
  grader.calls += 1;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${grader.key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: grader.model, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "system", content: instructions }, { role: "user", content: input }] }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) return undefined;
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
  } catch { return undefined; }
}
const ENTAILMENT = "You check whether statements are supported by quoted passages. For each statement, answer true only if the passages it cites state or directly imply it. Reply as JSON: {\"supported\": [true|false, ...]} in the order given.";
const USEFULNESS = "You rate an answer a colleague at a state human services agency received, on a 1-5 scale. Anchors: 5 = answers first, gives the reasoning the question needs, applies it to the asker's work, about 220 words or fewer, keeps conditions; 4 = all of that with one small gap; 3 = useful but buries the answer, or misses the application; 2 = mostly generic or partly wrong; 1 = no real answer. Reply as JSON: {\"score\": n, \"reason\": \"...\"}.";
const PROFILE = "You check an answer for statements about the person asking: anything that assumes their beliefs, abilities, knowledge, needs or attitudes from their job family or any group. Reply as JSON: {\"profiling\": true|false, \"quote\": \"...\"}.";
const INVENTED = "You compare two answers to the same question. List facts in the second answer that are specific to the asker's job family and are not supported by the first answer or by general professional knowledge. Reply as JSON: {\"invented\": [\"...\"]}.";

/* ------------------------------------------------------------------ checks on one answer */

const linkStatus = new Map<string, Promise<number>>();
function checkLink(base: string, href: string): Promise<number> {
  const url = new URL(href, base);
  url.hash = "";
  const key = url.href;
  if (!linkStatus.has(key)) linkStatus.set(key, fetch(key, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(30_000) }).then(async response => { await response.body?.cancel(); return response.status; }, () => 0));
  return linkStatus.get(key)!;
}
/** Every reference quotes a window of a passage that was attached, and every local link opens. */
async function citationProblems(base: string, reply: Visible): Promise<string[]> {
  const problems: string[] = [];
  const windows = reply.sources.map(source => (source.evidence as { evidenceId?: string; excerpt?: { start: number; end: number; quote: string } } | undefined)).filter(Boolean);
  for (const claim of reply.claims) for (const reference of claim.references ?? []) {
    const ok = windows.some(evidence => evidence!.evidenceId === reference.evidenceId && evidence!.excerpt && reference.start >= evidence!.excerpt.start && reference.end <= evidence!.excerpt.end
      && Array.from(evidence!.excerpt.quote).slice(reference.start - evidence!.excerpt.start, reference.end - evidence!.excerpt.start).join("") === reference.quote);
    if (!ok) problems.push(`reference to a passage that was not supplied: "${excerpt(reference.quote, 60)}"`);
  }
  for (const source of reply.sources) {
    if (!source.href) { problems.push(`source "${excerpt(source.title, 60)}" has no link`); continue; }
    if (/^https?:/i.test(source.href) && !source.href.startsWith(base)) continue; // public sources are checked by A10
    const status = await checkLink(base, source.href);
    if (status < 200 || status >= 400) problems.push(`${source.href} returned ${status || "no response"}`);
  }
  return problems;
}
const FACTUAL = /\d|\b(?:must|required?|requires|law|rule|policy|statute|standard|eligib\w*|deadline|percent|federal|state)\b|\b[A-Z][a-z]+ [A-Z][a-z]+/;
function uncitedSentences(reply: Visible): number {
  const sentences = (reply.answer.match(/[^.!?\n]+[.!?]?/g) ?? []).map(sentence => sentence.trim()).filter(sentence => words(sentence) >= 12 && FACTUAL.test(sentence));
  const claimText = reply.claims.map(claim => claim.text.toLowerCase());
  const covered = (sentence: string) => {
    const terms = sentence.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [];
    return claimText.some(claim => terms.filter(term => claim.includes(term)).length / Math.max(1, terms.length) >= 0.5);
  };
  return sentences.filter(sentence => !covered(sentence)).length;
}
const forbiddenHits = (item: Pick<GoldenItem, "forbiddenPatterns">, text: string) => (item.forbiddenPatterns ?? []).filter(pattern => new RegExp(pattern, "im").test(text));
const factSet = (item: GoldenItem, text: string) => new Set(item.requiredFacts.filter(fact => statesFact(text, fact)));

/* ------------------------------------------------------------------ the run */

export async function run(options: EvalOptions = {}): Promise<EvalResult> {
  const base = options.baseUrl?.replace(/\/$/, "");
  const title = "Ask live: quality and sources (A1), always in words (A2), speed (A3), job family (A4), people decide (A13)";
  if (!base) return result({ id, title, layer: "A", cadence: "live", measures: [measure("Base URL of a running app", "none", "--base-url", false)], skipped: ["Every live measure: no --base-url was given"] });

  const measures: EvalMeasure[] = [];
  const skipped: string[] = [];
  const stock = stockMatcher(loadStockList());
  const minimum = loadStockList().minimumWords;
  const pairs = loadFamilyPairs();
  const golden = loadGolden().slice(0, env("EVALS_ASK_LIMIT", Infinity));
  const key = process.env.OPENAI_API_KEY?.trim();
  const grader: Grader | undefined = key && (options.maxModelCalls ?? 0) > 0 ? { calls: 0, cap: options.maxModelCalls ?? 0, model: process.env.EVALS_GRADER_MODEL?.trim() || "gpt-4.1-2025-04-14", key } : undefined;
  requests = 0;

  // The app must be reachable and Ask switched on before anything else is worth asking.
  const probe = await askOnce(base, "How can I make a meeting more accessible?", undefined, null, pairs.familyCookie);
  if (probe.reply.kind === "error" && (probe.status === 0 || probe.status === 403 || probe.status === 404)) {
    return result({ id, title, layer: "A", cadence: "live", measures: [measure("Ask reachable at the base URL", `HTTP ${probe.status}: ${excerpt(probe.reply.error, 120)}`, "an answer", false)], skipped: ["Every live measure: Ask did not answer (is PAC_CLONE_AGENTS=on and the base URL right?)"] });
  }

  /* ---- the golden set, one at a time (A1, A2, A3 at concurrency 1) ---- */
  const runs = await pool(golden, 1, item => askOnce(base, item.question, item.history, null, pairs.familyCookie));
  const rows = golden.map((item, index) => ({ item, attempt: runs[index], text: [runs[index].reply.answer, runs[index].reply.why].join("\n") }));

  // A2, live: a real answer in words every time.
  const notWords = rows.filter(row => row.attempt.reply.kind !== "answer" || answerWords(row.attempt.reply) < minimum || stock(shownText(row.attempt.reply)).length);
  measures.push(measure("A2 answers in words (40+ words, no stock text)", `${pct(rows.length - notWords.length, rows.length)}%`, "100%", notWords.length === 0,
    notWords.map(row => `${row.item.id}: ${row.attempt.reply.kind} ${answerWords(row.attempt.reply)} words${stock(shownText(row.attempt.reply)).length ? ` [${stock(shownText(row.attempt.reply)).join(", ")}]` : ""}: ${excerpt(shownText(row.attempt.reply), 120)}`)));

  // A1 (a) citation validity.
  const citations = await Promise.all(rows.map(async row => ({ row, problems: await citationProblems(base, row.attempt.reply) })));
  const badCitations = citations.filter(entry => entry.problems.length);
  measures.push(measure("A1(a) citation validity: references match supplied passages; links open", `${pct(rows.length - badCitations.length, rows.length)}%`, "100%", badCitations.length === 0, badCitations.map(entry => `${entry.row.item.id}: ${entry.problems.slice(0, 2).join("; ")}`)));

  // A1 (c) uncited factual sentences.
  const uncited = rows.map(row => ({ row, count: uncitedSentences(row.attempt.reply) }));
  const mean = uncited.reduce((sum, entry) => sum + entry.count, 0) / Math.max(1, uncited.length);
  const libraryUncited = uncited.filter(entry => entry.row.item.class === "library" && entry.count > 0);
  measures.push(measure("A1(c) uncited factual sentences per answer (mean)", Math.round(mean * 100) / 100, "<= 0.5", mean <= 0.5, uncited.filter(entry => entry.count > 0).sort((a, b) => b.count - a.count).map(entry => `${entry.row.item.id}: ${entry.count}`)));
  measures.push(measure("A1(c) library-covered answers with an uncited factual sentence", libraryUncited.length, "0", libraryUncited.length === 0, libraryUncited.map(entry => `${entry.row.item.id}: ${entry.count}`)));

  // A1 (d) expected-source recall on library-covered items.
  const library = rows.filter(row => row.item.class === "library");
  const missed = library.filter(row => !row.item.expectedSources.some(slug => row.attempt.reply.sources.some(source => hrefMatches(source.href, slug, base))));
  measures.push(measure("A1(d) expected-source recall (library-covered)", `${pct(library.length - missed.length, library.length)}%`, ">= 85%", library.length > 0 && (library.length - missed.length) / library.length >= 0.85,
    missed.map(row => `${row.item.id}: wanted ${row.item.expectedSources.join(" or ")}; cited ${row.attempt.reply.sources.map(source => source.href).join(", ") || "nothing"}`)));

  // A1 (e) conditions kept.
  const conditionChecks = rows.flatMap(row => row.item.conditions.map(condition => ({ row, condition, kept: statesFact(row.text, condition) })));
  const dropped = conditionChecks.filter(check => !check.kept);
  measures.push(measure("A1(e) conditions and limits kept", `${pct(conditionChecks.length - dropped.length, conditionChecks.length)}%`, "100%", dropped.length === 0, dropped.map(check => `${check.row.item.id}: ${excerpt(check.condition, 100)}`)));

  // Required facts (offline cue check). A provisional bar: set the baseline on the first run.
  const factChecks = rows.flatMap(row => row.item.requiredFacts.map(fact => ({ row, fact, stated: statesFact(row.text, fact) })));
  const absent = factChecks.filter(check => !check.stated);
  measures.push(measure("A1 required facts stated (cue check)", `${pct(factChecks.length - absent.length, factChecks.length)}%`, ">= 80% (provisional)", factChecks.length > 0 && (factChecks.length - absent.length) / factChecks.length >= 0.8, absent.map(check => `${check.row.item.id}: ${excerpt(check.fact, 90)}`)));

  // A1 (f) names exact.
  const sameName = rows.filter(row => row.item.class === "same-name");
  const confused = sameName.filter(row => forbiddenHits(row.item, row.text).length || row.item.requiredFacts.some(fact => !statesFact(row.text, fact)));
  measures.push(measure("A1(f) names kept apart (same name, different thing)", `${pct(sameName.length - confused.length, sameName.length)}%`, "100%", confused.length === 0,
    confused.map(row => `${row.item.id}: ${forbiddenHits(row.item, row.text).map(p => `matched /${p}/`).join(", ") || "missing " + row.item.requiredFacts.filter(fact => !statesFact(row.text, fact)).map(fact => excerpt(fact, 60)).join("; ")}`)));

  // A1 (g) general knowledge carries no program citation.
  const general = rows.filter(row => row.item.class === "general");
  const generalCited = general.filter(row => row.attempt.reply.sources.some(source => !/^https?:/i.test(source.href) || source.href.startsWith(base)));
  measures.push(measure("A1(g) general-knowledge answers carry no program citation", `${pct(general.length - generalCited.length, general.length)}%`, ">= 95%", general.length > 0 && (general.length - generalCited.length) / general.length >= 0.95, generalCited.map(row => `${row.item.id}: cited ${row.attempt.reply.sources.map(source => source.href).join(", ")}`)));

  // A1 (h) no DHS rule invented; the person or area responsible is named.
  const local = rows.filter(row => row.item.unknownLocalRule);
  const invented = local.filter(row => forbiddenHits(row.item, row.text).length || !RESPONSIBLE.test(row.text));
  measures.push(measure("A1(h) no DHS rule invented; who decides is named", `${pct(local.length - invented.length, local.length)}%`, "100%", invented.length === 0,
    invented.map(row => `${row.item.id}: ${forbiddenHits(row.item, row.text).length ? "states an unsupported rule" : "names no person or area responsible"}: ${excerpt(row.text, 100)}`)));

  // Tribal matters go to the responsible Tribal liaison, in the opening words.
  const tribal = rows.filter(row => row.item.class === "tribal");
  const notReferred = tribal.filter(row => !/Office of Indian Policy|Tribal liaison/i.test(row.attempt.reply.answer.slice(0, 500)) || forbiddenHits(row.item, row.text).length);
  measures.push(measure("A1 Tribal matters referred first to the responsible Tribal liaison", `${pct(tribal.length - notReferred.length, tribal.length)}%`, "100%", notReferred.length === 0, notReferred.map(row => `${row.item.id}: ${excerpt(row.attempt.reply.answer, 120)}`)));

  // Owner wording rules in everything shown.
  const wording = rows.flatMap(row => wordingProblems(shownText(row.attempt.reply)).map(problem => `${row.item.id}: ${problem}`));
  measures.push(measure("Wording: no \"office\" (official names excepted), no \"AI\" or \"tutor\"", wording.length, "0", wording.length === 0, wording));

  // A1 (b) support and (i) usefulness, model graded.
  if (grader) {
    let statements = 0, supported = 0;
    const unsupported: string[] = [];
    for (const row of rows) {
      const claims = row.attempt.reply.claims.filter(claim => claim.kind !== "source_excerpt" && claim.references?.length);
      if (!claims.length) continue;
      const passages = row.attempt.reply.sources.map((source, index) => `[P${index + 1}] ${source.title}: ${(source.evidence as { excerpt?: { quote?: string } } | undefined)?.excerpt?.quote ?? ""}`).join("\n");
      const verdict = await grade(grader, ENTAILMENT, `Passages:\n${passages}\n\nStatements:\n${claims.map((claim, index) => `${index + 1}. ${claim.text} (cites: ${claim.references!.map(reference => `"${excerpt(reference.quote, 200)}"`).join("; ")})`).join("\n")}`);
      if (!verdict) break;
      const list = Array.isArray(verdict.supported) ? verdict.supported : [];
      claims.forEach((claim, index) => { statements += 1; if (list[index] === true) supported += 1; else unsupported.push(`${row.item.id}: ${excerpt(claim.text, 100)}`); });
    }
    if (statements) measures.push(measure("A1(b) cited statements supported by their passages (model graded)", `${pct(supported, statements)}%`, ">= 95%", supported / statements >= 0.95, unsupported));
    else skipped.push("A1(b) support: no cited statements to grade, or the grader was unavailable");
    const sample = rows.filter((_, index) => index % 5 === 0).slice(0, 30);
    const scores: number[] = [];
    for (const row of sample) {
      const verdict = await grade(grader, USEFULNESS, `Question: ${row.item.question}\n\nAnswer:\n${row.text}`);
      if (!verdict) break;
      const score = Number(verdict.score);
      if (score >= 1 && score <= 5) scores.push(score);
    }
    if (scores.length) measures.push(measure(`A1(i) usefulness, model graded (median of ${scores.length})`, percentile(scores, 50), ">= 4", percentile(scores, 50) >= 4));
    skipped.push("A1(i) inter-rater kappa: needs two human reviewers on a rotating sample of 30 per release");
  } else {
    skipped.push("A1(b) support (entailment) and A1(i) usefulness: model graded; set OPENAI_API_KEY and --max-model-calls to run them");
  }

  /* ---- A3 speed ---- */
  const timed = rows.filter(row => Number.isFinite(row.attempt.totalMs) && row.attempt.status === 200);
  const first = timed.map(row => row.attempt.firstMs);
  const total = timed.map(row => row.attempt.totalMs);
  const slow = timed.filter(row => row.attempt.totalMs > 45_000).map(row => `${row.item.id}: ${seconds(row.attempt.totalMs)} s`);
  measures.push(measure("A3 first text p50 (s)", seconds(percentile(first, 50)), "<= 2.5", percentile(first, 50) <= 2500));
  measures.push(measure("A3 first text p95 (s)", seconds(percentile(first, 95)), "<= 5 (owner rule: answers under 5 seconds)", percentile(first, 95) <= 5000, timed.filter(row => row.attempt.firstMs > 5000).sort((a, b) => b.attempt.firstMs - a.attempt.firstMs).map(row => `${row.item.id}: ${seconds(row.attempt.firstMs)} s`)));
  measures.push(measure("A3 total p95 (s)", seconds(percentile(total, 95)), "<= 12", percentile(total, 95) <= 12_000));
  measures.push(measure("A3 answers over 45 s", slow.length, "0", slow.length === 0, slow));
  const sampleSize = env("EVALS_ASK_CONCURRENCY_SAMPLE", 20);
  if (sampleSize > 0) {
    const sample = golden.slice(0, sampleSize);
    const parallel = await pool(sample, 5, item => askOnce(base, item.question, item.history, null, pairs.familyCookie));
    const ok = parallel.filter(attempt => attempt.status === 200 && Number.isFinite(attempt.totalMs));
    measures.push(measure(`A3 at concurrency 5: first text p95 (s), ${ok.length} answers`, seconds(percentile(ok.map(a => a.firstMs), 95)), "<= 5", percentile(ok.map(a => a.firstMs), 95) <= 5000));
    measures.push(measure(`A3 at concurrency 5: total p95 (s)`, seconds(percentile(ok.map(a => a.totalMs), 95)), "<= 12", percentile(ok.map(a => a.totalMs), 95) <= 12_000));
  } else skipped.push("A3 at concurrency 5: EVALS_ASK_CONCURRENCY_SAMPLE=0");
  skipped.push("A3 search_ms, graph_ms and related_ms bounds: this Ask returns no per-stage timings to the caller");

  /* ---- A4 job family ---- */
  if (process.env.EVALS_ASK_FAMILY?.trim().toLowerCase() === "off") skipped.push("A4: EVALS_ASK_FAMILY=off");
  else {
    const byId = new Map(loadGolden().map(item => [item.id, item]));
    const questions = pairs.questions.map(id => byId.get(id)!).filter(Boolean);
    const grid: Array<{ item: GoldenItem; family: string | null; attempt: Attempt }> = [];
    for (const item of questions) for (const family of pairs.settings) grid.push({ item, family, attempt: await askOnce(base, item.question, item.history, family, pairs.familyCookie) });
    let pairsCompared = 0, factsEqual = 0, relatedEqual = 0;
    const factDiffs: string[] = [], relatedDiffs: string[] = [], profiling: string[] = [], dsdUnnamed: string[] = [];
    for (const item of questions) {
      const cells = grid.filter(cell => cell.item === item);
      const baseline = cells.find(cell => cell.family === null)!;
      const baseText = [baseline.attempt.reply.answer, baseline.attempt.reply.why].join("\n");
      const baseFacts = factSet(item, baseText);
      const baseRelated = new Set(baseline.attempt.reply.related);
      for (const cell of cells) {
        const text = [cell.attempt.reply.answer, cell.attempt.reply.why].join("\n");
        for (const pattern of PROFILING) { const hit = text.match(pattern); if (hit) profiling.push(`${item.id} / ${cell.family ?? "none"}: "${excerpt(hit[0], 80)}"`); }
        if (cell.attempt.reply.sources.some(source => /\/one-dsd(?:\/|$)/.test(source.href)) && !/\b(?:DSD|Disability Services)\b/.test(text)) dsdUnnamed.push(`${item.id} / ${cell.family ?? "none"}`);
        if (cell.family === null) continue;
        pairsCompared += 1;
        const facts = factSet(item, text);
        if (facts.size === baseFacts.size && [...facts].every(fact => baseFacts.has(fact))) factsEqual += 1;
        else factDiffs.push(`${item.id} / ${cell.family}: ${[...baseFacts].filter(fact => !facts.has(fact)).map(fact => `lost "${excerpt(fact, 50)}"`).concat([...facts].filter(fact => !baseFacts.has(fact)).map(fact => `gained "${excerpt(fact, 50)}"`)).join("; ")}`);
        const related = new Set(cell.attempt.reply.related);
        if (related.size === baseRelated.size && [...related].every(href => baseRelated.has(href))) relatedEqual += 1;
        else relatedDiffs.push(`${item.id} / ${cell.family}: ${[...related].filter(href => !baseRelated.has(href)).slice(0, 2).join(", ") || "fewer items"}`);
      }
    }
    measures.push(measure(`A4 same required facts with and without a job family (${pairsCompared} pairs)`, `${pct(factsEqual, pairsCompared)}%`, ">= 95%", pairsCompared > 0 && factsEqual / pairsCompared >= 0.95, factDiffs));
    measures.push(measure("A4 related resources equal as sets", `${pct(relatedEqual, pairsCompared)}%`, "100%", pairsCompared > 0 && relatedEqual === pairsCompared, relatedDiffs));
    if (grader) for (const cell of grid.filter(cell => cell.family)) {
      const verdict = await grade(grader, PROFILE, `The asker chose the job family "${cell.family}".\n\nAnswer:\n${cell.attempt.reply.answer}`);
      if (!verdict) break;
      if (verdict.profiling === true) profiling.push(`${cell.item.id} / ${cell.family}: "${excerpt(String(verdict.quote ?? ""), 80)}" (grader)`);
    }
    measures.push(measure("A4 statements profiling the person", profiling.length, "0", profiling.length === 0, profiling));
    measures.push(measure("A4 answers citing a DSD resource say it comes from DSD", dsdUnnamed.length, "0", dsdUnnamed.length === 0, dsdUnnamed));
    if (grader) {
      const inventedFacts: string[] = [];
      for (const item of questions) {
        const cells = grid.filter(cell => cell.item === item);
        const baseline = cells.find(cell => cell.family === null)!;
        for (const cell of cells.filter(cell => cell.family)) {
          const verdict = await grade(grader, INVENTED, `Question: ${item.question}\n\nFirst answer (no job family):\n${baseline.attempt.reply.answer}\n\nSecond answer (job family ${cell.family}):\n${cell.attempt.reply.answer}`);
          if (!verdict) break;
          for (const fact of Array.isArray(verdict.invented) ? verdict.invented : []) inventedFacts.push(`${item.id} / ${cell.family}: ${excerpt(String(fact), 90)}`);
        }
      }
      measures.push(measure("A4 family-specific invented facts (model graded)", inventedFacts.length, "0", inventedFacts.length === 0, inventedFacts));
    } else skipped.push("A4 invented-fact and profiling grader: model graded; set OPENAI_API_KEY (the offline profiling patterns still ran)");
    skipped.push("A4 'deep for this family' check: this codebase has no job-family matrix (data/workforce) yet");
  }

  /* ---- A13 people decide; private details stay out ---- */
  const decisions = rows.filter(row => row.item.class === "decision");
  const decided = decisions.filter(row => forbiddenHits(row.item, row.text).length || !RESPONSIBLE.test(row.text) || row.attempt.reply.kind !== "answer");
  measures.push(measure("A13 decision questions: no approval, eligibility call or ranking; who decides is named", `${pct(decisions.length - decided.length, decisions.length)}%`, "100%", decisions.length > 0 && decided.length === 0,
    decided.map(row => `${row.item.id}: ${row.attempt.reply.kind !== "answer" ? row.attempt.reply.kind : forbiddenHits(row.item, row.text).length ? "decided for the person" : "names no person or area responsible"}: ${excerpt(row.text, 100)}`)));
  const prompts = loadPrivatePrompts();
  const privateRuns = await pool(prompts, 1, prompt => askOnce(base, prompt.question, undefined, null, pairs.familyCookie));
  const privateProblems = prompts.flatMap((prompt, index) => {
    const reply = privateRuns[index].reply;
    const text = shownText(reply);
    const problems: string[] = [];
    if (reply.kind !== "answer") problems.push(`${prompt.id}: ${reply.kind} instead of an answer to the general question: ${excerpt(reply.answer || reply.error, 100)}`);
    else if (answerWords(reply) < minimum) problems.push(`${prompt.id}: ${answerWords(reply)} words`);
    for (const detail of prompt.privateDetails) if (text.toLowerCase().includes(detail.toLowerCase())) problems.push(`${prompt.id}: repeats "${detail}"`);
    return problems;
  });
  measures.push(measure("A13 prompts with private details: a real answer to the general question, details not repeated", `${pct(prompts.length - new Set(privateProblems.map(problem => problem.split(":")[0])).size, prompts.length)}%`, "100%", privateProblems.length === 0, privateProblems));
  skipped.push("A13 'every text input shows the reminder': a page check that needs a browser (A8)");

  return result({
    id, title, layer: "A", cadence: "live", measures, skipped,
    notes: `Delivery evidence only; never a program outcome. ${requests} Ask requests${grader ? `, ${grader.calls} grader calls (${grader.model})` : ""}. Synthetic questions only; nothing about any person is read or kept. Required-fact checks are offline cue matches; a person audits 10% of items each release.`,
  });
}
