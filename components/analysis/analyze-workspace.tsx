"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ANALYSIS_LIMITS, ANALYSIS_NOTICE, analysisRequestSchema, analysisResponseSchema, type AnalysisRequest, type AnalysisResponse, type AnalysisSource, type InstrumentId } from "@/lib/analysis/contract";
import { plainIssue } from "@/lib/analysis/issues";
import { INSTRUMENTS, getInstrument } from "@/lib/analysis/instruments";
import { SourceIntake } from "@/components/analysis/source-intake";
import { AnalysisResult, analysisResultText } from "./analysis-result";
import styles from "./analyze.module.css";

export type CommunityOption = { id: string; title: string };

/** Native community pages get no added content, so they are never offered here. */
const EXCLUDED_COMMUNITY_IDS = new Set(["native-american", "tribal-nations", "alaska-native"]);
const KEEP_KEY = "one-dsd-analyze-document-v1";
export const PRIVACY_LINE = "Nothing you upload or paste is stored. Use public or de-identified material; leave out names and personal details.";
export const BUSY_LINE = "Reading the material and preparing the analysis. This can take up to a minute.";
/** Shown over the worksheet when the answer service cannot run on this site. */
export const UNAVAILABLE_REASON = "The analysis service is not available on this site right now. You can still work through the questions below yourself.";
/** The code the staff lock sends with its 403 (lib/product/staff-lock.ts). The lock itself is not imported here because it depends on the server runtime. */
const STAFF_WRITE_CLOSED_CODE = "staff_browse_download_only";

type Kept = { request: AnalysisRequest; result: AnalysisResponse };

function readKept(): Kept | null {
  try {
    const raw = window.localStorage.getItem(KEEP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { request?: unknown; result?: unknown };
    const request = analysisRequestSchema.safeParse(parsed.request);
    const result = analysisResponseSchema.safeParse(parsed.result);
    return request.success && result.success ? { request: request.data, result: result.data } : null;
  } catch { return null; }
}

function writeKept(kept: Kept | null): boolean {
  try {
    if (kept) window.localStorage.setItem(KEEP_KEY, JSON.stringify(kept));
    else window.localStorage.removeItem(KEEP_KEY);
    return true;
  } catch { return false; }
}

/** A result that shows the instrument's questions as a worksheet. Built here so the worksheet needs no server. */
function unavailableResult(instrumentId: InstrumentId, reason: string): AnalysisResponse {
  return { instrumentId, summary: "", answers: [], limitations: [], nextSteps: [], counts: { evidence: 0, inference: 0, gap: 0 }, unavailable: true, unavailableReason: reason, notice: ANALYSIS_NOTICE };
}

export function AnalyzeWorkspace({ communities, analyzeUrl = "/api/analyze", uploadUrl }: { communities: readonly CommunityOption[]; analyzeUrl?: string; uploadUrl?: string }) {
  const id = useId();
  const [instrumentId, setInstrumentId] = useState<InstrumentId>(INSTRUMENTS[0].id);
  const [sources, setSources] = useState<AnalysisSource[]>([]);
  const [context, setContext] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analyzed, setAnalyzed] = useState<Kept | null>(null);
  const [kept, setKept] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const options = communities.filter(community => !EXCLUDED_COMMUNITY_IDS.has(community.id));
  const instrument = getInstrument(instrumentId) ?? INSTRUMENTS[0];

  useEffect(() => {
    const stored = readKept();
    if (!stored) return;
    setAnalyzed(stored);
    setKept(true);
    setInstrumentId(stored.request.instrumentId);
    setSources(stored.request.sources);
    setContext(stored.request.context ?? "");
    setCommunityId(stored.request.communityId ?? "");
  }, []);

  function settle(next: Kept) {
    setAnalyzed(next);
    if (kept) writeKept(next);
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
    setAnalyzed(null);
    setSources([]);
    setContext("");
    setCommunityId("");
    setError("");
    setCopied(false);
    if (kept) { writeKept(null); setKept(false); }
  }

  function keep() {
    if (!analyzed) return;
    if (writeKept(analyzed)) setKept(true);
    else setError("This browser did not allow the analysis to be kept.");
  }

  function forget() {
    writeKept(null);
    setKept(false);
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

  return <div className={styles.workspace}>
    <section className={`${styles.step} ${styles.noPrint}`} aria-labelledby={`${id}-choose`}>
      <p className={styles.stepNumber}>Step 1</p>
      <h2 id={`${id}-choose`}>Choose what to analyze</h2>
      <ul className={styles.instruments} role="radiogroup" aria-labelledby={`${id}-choose`}>
        {INSTRUMENTS.map(item => <li key={item.id} className={styles.instrument}>
          <input type="radio" name={`${id}-instrument`} id={`${id}-instrument-${item.id}`} value={item.id} checked={instrumentId === item.id} disabled={busy} aria-describedby={`${id}-instrument-${item.id}-about`} onChange={() => setInstrumentId(item.id)} />
          <label htmlFor={`${id}-instrument-${item.id}`}>{item.title}</label>
          <p id={`${id}-instrument-${item.id}-about`}>{item.whatToUpload}</p>
        </li>)}
      </ul>
      <p className={styles.help} aria-live="polite">{instrument.intro}</p>
    </section>

    <section className={`${styles.step} ${styles.noPrint}`} aria-labelledby={`${id}-material`}>
      <p className={styles.stepNumber}>Step 2</p>
      <h2 id={`${id}-material`}>Bring in the material</h2>
      <p className={styles.privacy}>{PRIVACY_LINE}</p>
      <SourceIntake sources={sources} onChange={setSources} disabled={busy} uploadUrl={uploadUrl} maxSources={ANALYSIS_LIMITS.sources} />
    </section>

    <section className={`${styles.step} ${styles.noPrint}`} aria-labelledby={`${id}-question`}>
      <p className={styles.stepNumber}>Step 3</p>
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
      <p className={styles.stepNumber}>Step 4</p>
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
      <section className={`${styles.step} ${styles.noPrint}`} aria-labelledby={`${id}-after`}>
        <h2 id={`${id}-after`}>Keep or share the result</h2>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => window.print()}>Print or save as PDF</button>
          <button type="button" className={styles.secondary} onClick={() => void copy()}>{copied ? "Copied" : "Copy as text"}</button>
          {kept ? <button type="button" className={styles.secondary} onClick={forget}>Forget</button> : <button type="button" className={styles.secondary} onClick={keep}>Keep in this browser</button>}
          <button type="button" className={styles.secondary} onClick={clear}>Clear</button>
        </div>
        <p className={styles.kept}>{kept ? "This analysis and the material you supplied are kept in this browser only, on this device. Forget removes them." : "Keep in this browser stores this analysis and the material you supplied in this browser only, on this device. Nothing is sent anywhere."}</p>
      </section>
    </div> : null}
  </div>;
}
