"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "@/components/app-link";
import { ANALYSIS_LIMITS, ANALYSIS_NOTICE, analysisRequestSchema, analysisResponseSchema, type AnalysisRequest, type AnalysisResponse, type AnalysisSource, type InstrumentId } from "@/lib/analysis/contract";
import { plainIssue } from "@/lib/analysis/issues";
import { INSTRUMENTS, getInstrument } from "@/lib/analysis/instruments";
import { SourceIntake } from "@/components/analysis/source-intake";
import { AskReviewHandoff } from "@/components/ask-review-handoff";
import { practiceReturnKey } from "@/lib/learning/practice-review";
import { AnalysisResult, analysisResultText } from "./analysis-result";
import styles from "./analyze.module.css";
import { LTSS_RESOURCES } from "@/lib/consultant-toolkit/ltss";
import bundledLtssData from "@/public/data/ltss/metadata.json";
import { TOOLKIT_STEP_LESSONS } from "@/lib/content/courses/rise/equity-analysis-toolkit";

export type CommunityOption = { id: string; title: string };

/** Native community pages get no added content, so they are never offered here. */
const EXCLUDED_COMMUNITY_IDS = new Set(["native-american", "tribal-nations", "alaska-native"]);
const KEEP_KEY = "one-dsd-analyze-document-v1";
export const PRIVACY_LINE = "Use only public or appropriately de-identified material approved for this purpose. Attaching a file sends it for text extraction; Analyze sends the supplied text and question for processing and may use an outside answer service. Leave out names, case details and other confidential information.";
export const BUSY_LINE = "Reading the material and preparing the analysis. This can take up to a minute.";
/** Shown over the worksheet when the answer service cannot run on this site. */
export const UNAVAILABLE_REASON = "The analysis service is not available on this site right now. You can still work through the questions below yourself.";
/** The code the staff lock sends with its 403 (lib/product/staff-lock.ts). The lock itself is not imported here because it depends on the server runtime. */
const STAFF_WRITE_CLOSED_CODE = "staff_browse_download_only";

type Kept = { request: AnalysisRequest; result: AnalysisResponse };

function readKept(key: string): Kept | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { request?: unknown; result?: unknown };
    const request = analysisRequestSchema.safeParse(parsed.request);
    const result = analysisResponseSchema.safeParse(parsed.result);
    return request.success && result.success ? { request: request.data, result: result.data } : null;
  } catch { return null; }
}

function writeKept(kept: Kept | null, key: string): boolean {
  try {
    if (kept) window.localStorage.setItem(key, JSON.stringify(kept));
    else window.localStorage.removeItem(key);
    return true;
  } catch { return false; }
}

/** A result that shows the instrument's questions as a worksheet. Built here so the worksheet needs no server. */
function unavailableResult(instrumentId: InstrumentId, reason: string): AnalysisResponse {
  return { instrumentId, summary: "", answers: [], limitations: [], nextSteps: [], counts: { evidence: 0, inference: 0, gap: 0 }, unavailable: true, unavailableReason: reason, notice: ANALYSIS_NOTICE };
}

export function AnalyzeWorkspace({ communities, analyzeUrl = "/api/analyze", uploadUrl, toolkit = false }: { communities: readonly CommunityOption[]; analyzeUrl?: string; uploadUrl?: string; toolkit?: boolean }) {
  const storageKey = toolkit ? "one-dhs-equity-toolkit-analysis-v1" : KEEP_KEY;
  const id = useId();
  const [instrumentId, setInstrumentId] = useState<InstrumentId>(toolkit ? "equity-analysis" : INSTRUMENTS[0].id);
  const [sources, setSources] = useState<AnalysisSource[]>([]);
  const [context, setContext] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analyzed, setAnalyzed] = useState<Kept | null>(null);
  const [kept, setKept] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ltssData, setLtssData] = useState(bundledLtssData);
  const resultRef = useRef<HTMLDivElement>(null);
  const options = communities.filter(community => !EXCLUDED_COMMUNITY_IDS.has(community.id));
  const instrument = getInstrument(instrumentId) ?? INSTRUMENTS[0];

  useEffect(() => {
    if (!toolkit) return;
    const controller = new AbortController();
    void fetch("/api/ltss", { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(data => {
      if (data && typeof data.checkedAt === "string" && /^\d{4}-\d{2}$/.test(data.snapshot?.period) && Number.isSafeInteger(data.snapshot?.ltss) && Number.isSafeInteger(data.snapshot?.hcbs) && data.sources?.demographics?.url === bundledLtssData.sources.demographics.url && data.sources?.performance?.url === bundledLtssData.sources.performance.url) setLtssData(data);
    }).catch(() => {});
    return () => controller.abort();
  }, [toolkit]);

  useEffect(() => {
    const stored = readKept(storageKey);
    let returning: Kept | null = null;
    if (toolkit) {
      try {
        const key = practiceReturnKey("equity-toolkit"); const raw = window.sessionStorage.getItem(key);
        if (raw) {
          const value = JSON.parse(raw) as { request?: unknown; result?: unknown };
          const request = analysisRequestSchema.safeParse(value.request); const result = analysisResponseSchema.safeParse(value.result);
          if (request.success && result.success) { returning = { request: request.data, result: result.data }; window.sessionStorage.removeItem(key); }
        }
      } catch { /* A saved browser copy, if any, remains available. */ }
    }
    const restored = returning ?? stored;
    if (!restored) return;
    // Browser-kept work is restored after hydration so the server and first render agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnalyzed(restored);
    setKept(Boolean(stored));
    setInstrumentId(restored.request.instrumentId);
    setSources(restored.request.sources);
    setContext(restored.request.context ?? "");
    setCommunityId(restored.request.communityId ?? "");
  }, [storageKey, toolkit]);

  function settle(next: Kept) {
    setAnalyzed(next);
    if (kept && !writeKept(next, storageKey)) {
      setKept(false);
      setError("The new result could not be saved. An earlier saved copy may remain in this browser profile. Keep this page open to copy the new result, or use Clear to remove the saved copy.");
    }
    setTimeout(() => resultRef.current?.focus(), 50);
  }

  async function analyze() {
    setError("");
    setCopied(false);
    const draft = {
      instrumentId,
      sources,
      context: context.trim() || undefined,
      communityId: communityId && !EXCLUDED_COMMUNITY_IDS.has(communityId) ? communityId : undefined,
    };
    const parsed = analysisRequestSchema.safeParse(draft);
    if (!parsed.success) {
      setError(sources.length === 0 ? "Bring in at least one document or pasted text before you analyze." : plainIssue(parsed.error.issues[0]));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(analyzeUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
      // The body may start with keep-alive spaces before the JSON; response.json() tolerates them.
      const payload = await response.json().catch(() => null) as { refusal?: boolean; message?: string; error?: string; code?: string } | null;
      if (payload && payload.refusal === true) {
        setError(typeof payload.message === "string" && payload.message ? payload.message : "This material cannot be analyzed here.");
        return;
      }
      // The answer service is not running on this site, or is paused: show the worksheet, which needs no server.
      const closed = response.status === 403 && payload?.code === STAFF_WRITE_CLOSED_CODE;
      if (closed || response.status === 503) {
        const reason = !closed && typeof payload?.error === "string" && payload.error ? payload.error : UNAVAILABLE_REASON;
        settle({ request: parsed.data, result: unavailableResult(parsed.data.instrumentId, reason) });
        return;
      }
      if (!response.ok || !payload || typeof payload.error === "string") {
        setError(payload && typeof payload.error === "string" && payload.error ? payload.error : "The analysis could not be prepared. Try again in a moment.");
        return;
      }
      const result = analysisResponseSchema.safeParse(payload);
      if (!result.success) {
        setError("The analysis came back in an unexpected form. Try again in a moment.");
        return;
      }
      settle({ request: parsed.data, result: result.data });
    } catch {
      setError("The analysis could not be prepared. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    if (!writeKept(null, storageKey)) {
      setError("This browser could not remove the saved copy. Your current material is still shown; try Clear again before leaving.");
      return;
    }
    setAnalyzed(null);
    setSources([]);
    setContext("");
    setCommunityId("");
    setError("");
    setCopied(false);
    setKept(false);
  }

  function keep() {
    if (!analyzed) return;
    if (writeKept(analyzed, storageKey)) { setKept(true); setError(""); }
    else setError("This browser did not allow the analysis to be kept.");
  }

  function forget() {
    if (!writeKept(null, storageKey)) {
      setError("This browser could not remove the saved copy. It may still be visible to others using this browser profile. Try Forget again.");
      return;
    }
    setKept(false);
    setError("");
  }

  async function copy() {
    if (!analyzed) return;
    const text = analysisResultText(analyzed.result, instrument, analyzed.request.sources);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError("Copying did not work in this browser. Select the result and copy it instead.");
    }
  }

  const analyzedInstrument = analyzed ? getInstrument(analyzed.result.instrumentId) ?? instrument : instrument;

  function addExample() {
    const example: AnalysisSource = { id: `practice-scheduling-${Date.now()}`, title: "Practice situation: LTSS service scheduling", text: "Practice situation, not an actual DHS record: A team is considering changes to how people schedule home and community-based services. The current proposed schedule offers appointments during weekday business hours. The team wants to consider whether other appointment times or ways to schedule would better support people who rely on family assistance, interpreters, transportation, or support workers. The team has not yet reviewed scheduling requests, declined appointments, wait times, program requirements, staffing capacity, or feedback from people receiving services. No differences in access or outcomes have been established." };
    if (sources.length >= ANALYSIS_LIMITS.sources) { setError("Remove a source before adding the example."); return; }
    setSources([...sources, example]);
    if (!context.trim()) setContext("How could a team assess whether proposed LTSS service scheduling options meet people's needs, and what evidence and perspectives are needed before deciding?");
    setError("");
  }

  const snapshotDate = new Date(`${ltssData.snapshot.period}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const checkedDate = new Date(ltssData.checkedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

  function addLtssSnapshot() {
    if (sources.length >= ANALYSIS_LIMITS.sources) { setError("Remove a source before adding the data."); return; }
    if (sources.some(source => source.id === "ltss-statewide-snapshot")) { setError("The LTSS data example is already included."); return; }
    setSources([...sources, {
      id: "ltss-statewide-snapshot",
      title: `DHS LTSS demographics: statewide, ${snapshotDate}`,
      text: `Source: Minnesota Department of Human Services LTSS Program Demographics workbook, Summary worksheet, checked ${checkedDate}: ${ltssData.sources.demographics.url}. Reporting month: ${snapshotDate}. Geography: Statewide. Race summary: All Race/Ethnicities. Age summary: All Ages. Program population: Total LTSS Population. Number of people: ${ltssData.snapshot.ltss.toLocaleString("en-US")}. Program population: Total HCBS Population. Number of people: ${ltssData.snapshot.hcbs.toLocaleString("en-US")}. These are counts of people receiving services, not scheduling requests, wait times, unmet need, or evidence of barriers. The figures alone do not establish differences in access or their causes.`,
      note: `${snapshotDate} statewide snapshot, not scheduling data. Confirm definitions and select a relevant geography and period before applying findings to a decision.`,
    }]);
    setError("");
  }

  return <div className={styles.workspace}>
    {toolkit ? <section className={`${styles.step} ${styles.noPrint}`} aria-labelledby={`${id}-start`}>
      <h2 id={`${id}-start`}>Start with a decision</h2>
      <p>Bring a decision and the information you have. This initial scan follows the six DHS equity analysis steps: outcomes, data, community engagement, benefits and burdens, implementation, and accountability.</p>
      <details className={styles.help}><summary>Learn each step in the DHS Equity Analysis Toolkit course</summary><ol>{TOOLKIT_STEP_LESSONS.map(item => <li key={item.lesson}><Link href={item.href}>{item.step}</Link></li>)}</ol><p>For the groups your decision touches, the <Link href="/minnesota-communities">Minnesota Communities briefs</Link> help with results and engagement.</p></details>
      <button type="button" className={styles.secondary} disabled={busy} onClick={addExample}>Add the service-scheduling example</button>
      <p className={styles.help}>The example is a practice situation. It adds to your sources without replacing your work. It does not contain real scheduling results.</p>
      <h3>Long-term services and supports data</h3>
      <p>Use published data to understand who receives services. Add relevant rows or figures, including their measure, location, period and source. These data alone do not establish scheduling barriers or their causes.</p>
      <button type="button" className={styles.secondary} disabled={busy} onClick={addLtssSnapshot}>Add statewide LTSS data</button>
      <p className={styles.help}>{snapshotDate}: a public, statewide snapshot for context; it does not measure scheduling. Source files checked {checkedDate} (UTC). The reporting period changes only when DHS publishes newer figures.</p>
      <ul>{LTSS_RESOURCES.map(resource => <li key={resource.id}><a href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a>{resource.id === "ltss-demographics" ? <> · <a href={ltssData.sources.demographics.url}>Download DHS data</a></> : resource.id === "ltss-performance" ? <> · <a href={ltssData.sources.performance.url}>Download DHS data</a></> : null}</li>)}</ul>
      <p className={styles.help}>The linked data are not automatically included. Use the button above to add the statewide snapshot, or download the data and attach or paste a relevant selection with its context below. Large workbooks may need a smaller selection.</p>
    </section> : null}
    {!toolkit && <section className={`${styles.step} ${styles.noPrint}`} aria-labelledby={`${id}-choose`}>
      <p className={styles.stepNumber}>Step 1</p>
      <h2 id={`${id}-choose`}>Choose what to analyze</h2>
      <div role="radiogroup" aria-labelledby={`${id}-choose`}><ul className={styles.instruments}>
        {INSTRUMENTS.map(item => <li key={item.id} className={styles.instrument}>
          <input type="radio" name={`${id}-instrument`} id={`${id}-instrument-${item.id}`} value={item.id} checked={instrumentId === item.id} disabled={busy} aria-describedby={`${id}-instrument-${item.id}-about`} onChange={() => setInstrumentId(item.id)} />
          <label htmlFor={`${id}-instrument-${item.id}`}>{item.title}</label>
          <p id={`${id}-instrument-${item.id}-about`}>{item.whatToUpload}</p>
        </li>)}
      </ul></div>
      <p className={styles.help} aria-live="polite">{instrument.intro}</p>
    </section>}

    <section className={`${styles.step} ${styles.noPrint}`} aria-labelledby={`${id}-material`}>
      <p className={styles.stepNumber}>{toolkit ? "Step 1" : "Step 2"}</p>
      <h2 id={`${id}-material`}>Bring in the material</h2>
      <p className={styles.privacy}>{toolkit ? "Use public or appropriately de-identified material approved for this purpose. Leave out names, case details and other confidential information." : PRIVACY_LINE}</p>
      <SourceIntake sources={sources} onChange={setSources} disabled={busy} uploadUrl={toolkit ? "/api/ask-attachment" : uploadUrl} multimedia={toolkit} maxSources={ANALYSIS_LIMITS.sources} />
    </section>

    <section className={`${styles.step} ${styles.noPrint}`} aria-labelledby={`${id}-question`}>
      <p className={styles.stepNumber}>{toolkit ? "Step 2" : "Step 3"}</p>
      <h2 id={`${id}-question`}>Your question</h2>
      <div className={styles.field}>
        <label htmlFor={`${id}-context`}>What do you want to know or decide? (optional)</label>
        <p className={styles.help} id={`${id}-context-help`}>One or two sentences about the decision in front of you help the analysis focus. Leave out names and personal details.</p>
        <textarea id={`${id}-context`} value={context} rows={3} maxLength={ANALYSIS_LIMITS.contextCharacters} disabled={busy} aria-describedby={`${id}-context-help`} onChange={event => setContext(event.target.value)} />
        <p className={styles.counter}>{context.length} of {ANALYSIS_LIMITS.contextCharacters} characters</p>
      </div>
      {options.length ? <div className={styles.field}>
        <label htmlFor={`${id}-community`}>Community this work concerns (optional)</label>
        <select id={`${id}-community`} value={communityId} disabled={busy} onChange={event => setCommunityId(event.target.value)}>
          <option value="">No particular community</option>
          {options.map(community => <option key={community.id} value={community.id}>{community.title}</option>)}
        </select>
      </div> : null}
    </section>

    <section className={`${styles.step} ${styles.noPrint}`} aria-labelledby={`${id}-run`}>
      <p className={styles.stepNumber}>{toolkit ? "Step 3" : "Step 4"}</p>
      <h2 id={`${id}-run`}>Analyze</h2>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled={busy} onClick={() => void analyze()}>{busy ? "Analyzing" : "Analyze"}</button>
        <button type="button" className={styles.secondary} disabled={busy} onClick={clear}>Clear</button>
      </div>
      <p role="status" className={busy ? styles.status : styles.silent}>{busy ? BUSY_LINE : ""}</p>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </section>

    {analyzed ? <div ref={resultRef} tabIndex={-1} role="region" aria-label="Analysis result">
      <p className={styles.notice}>{ANALYSIS_NOTICE}</p>
      <AnalysisResult result={analyzed.result} instrument={analyzedInstrument} sources={analyzed.request.sources} />
      {toolkit ? <AskReviewHandoff practiceId="equity-toolkit" title="Equity analysis" notes={analysisResultText(analyzed.result, analyzedInstrument, analyzed.request.sources)} hasNotes={!analyzed.result.unavailable} returnState={analyzed} /> : null}
      {toolkit ? <p className={styles.help}>Review the source passages and missing perspectives, then use the findings to identify actions, a responsible person and a review date. <Link href="/ask">Continue the discussion in Ask</Link> · <Link href="/learn/equity-toolkit">Return to toolkit learning</Link></p> : null}
      <section className={`${styles.step} ${styles.noPrint}`} aria-labelledby={`${id}-after`}>
        <h2 id={`${id}-after`}>Keep or share the result</h2>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => window.print()}>Print or save as PDF</button>
          <button type="button" className={styles.secondary} onClick={() => void copy()}>{copied ? "Copied" : "Copy as text"}</button>
          {kept ? <button type="button" className={styles.secondary} onClick={forget}>Forget</button> : <button type="button" className={styles.secondary} onClick={keep}>Keep in this browser</button>}
          <button type="button" className={styles.secondary} onClick={clear}>Clear</button>
        </div>
        <p className={styles.kept}>{kept ? "This analysis and the supplied text are saved in this browser profile. Others using the same profile may see them. Forget removes this saved copy; printed, copied or downloaded versions remain separate." : "Keep in this browser saves the analysis and supplied text in this browser profile. It does not submit them again for analysis. Others using the same profile may see the saved copy. Printing or copying creates a separate version."}</p>
      </section>
    </div> : null}
  </div>;
}
