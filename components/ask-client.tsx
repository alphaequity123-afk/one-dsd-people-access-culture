"use client";
import { agencyZoneEnabled } from "@/lib/program/agency-zone";
import { SourceLink } from "@/components/app-link";


/** Typed Ask is explicitly enabled only for the owner-authorized clone pilot. */
import Link from "@/components/app-link";
import { AskVoice, VOICE_PRIVACY_NOTE } from "./ask-voice";
import { AskBox } from "@/components/ask-box";
import { ResourceMediaPreview, mediaResourceIdFromHref } from "@/components/multimedia/resource-media-preview";
import styles from "@/components/workspace-presentation.module.css";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ActionList, Notice } from "@/components/ui";
import type { AskResearchMode, AskResponseMode, StaffAskAnswer, StaffAskResult } from "@/lib/intelligence/agents/ask";
import type { GraduationPath } from "@/lib/content/paths";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";
import { newId, readStored, useHydrated, useStored, writeStored } from "@/lib/client/storage";
import { BROWSER_STORAGE_KEYS } from "@/lib/client/storage-keys";
import { useProgramContext } from "@/components/program-context";
import type { ProductContextId } from "@/lib/product/federation";
import { activePracticeArtifact, PracticeArtifactSchema, type PracticeArtifact } from "@/lib/content/practice-artifact";
import { ASK_PROGRESS_TYPE, readAskProgress, stageLine, type AskStage } from "@/lib/ask/progress-stream";
import { captureScreen } from "@/lib/ask/screen-context";
import { AskWorkDownload } from "@/components/ask-work-download";
import type { AskPage } from "@/lib/ask/page-context";

type Turn = { at: string; question: string; result: StaffAskResult; context?: ProductContextId };
type Session = { id: string; turns: Turn[] };

const EMPTY_SESSION: Session = { id: "", turns: [] };

function copyText(copy: EditableSurfaceValues, key: string): string {
  const value = copy[key];
  return typeof value === "string" ? value : "";
}

function copyList(copy: EditableSurfaceValues, key: string): string[] {
  const value = copy[key];
  return Array.isArray(value) && (value.length === 0 || typeof value[0] === "string") ? value as string[] : [];
}

export function AskClient({
  publishedPath,
  initialMode,
  initialQuestion,
  researchAvailable,
  intakeEnabled,
  copy,
  compact = false,
  page,
}: {
  publishedPath?: GraduationPath;
  initialMode?: "question" | "review";
  initialQuestion?: string;
  researchAvailable: boolean;
  intakeEnabled: boolean;
  copy: EditableSurfaceValues;
  /** One column without the side notes, for the Ask panel on the landing page. */
  compact?: boolean;
  /** The page Ask was opened from. Only its address and title go with a question, and only while the reader keeps it. */
  page?: AskPage;
}) {
  const { context } = useProgramContext();
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryQuestion, setRetryQuestion] = useState("");
  // The answer being prepared right now: which part is under way, and the words so far. Kept only on this page.
  const [live, setLive] = useState<{ question: string; stage: AskStage; text: string } | null>(null);
  const researchMode: AskResearchMode = "auto";
  const [storedSession, setSession] = useStored<Session>("session", BROWSER_STORAGE_KEYS.askSession, EMPTY_SESSION);
  // Another page may have read this key first, or older saved data may have another shape: never trust it blindly.
  const session: Session = storedSession && Array.isArray(storedSession.turns) ? storedSession : EMPTY_SESSION;
  const path = publishedPath;
  const reviewDraft = initialMode === "review";
  const textId = useId();
  const liveRef = useRef<HTMLDivElement>(null);
  // Where the read-aloud control goes: under the latest answer.
  const [listenSlot, setListenSlot] = useState<HTMLElement | null>(null);
  const hydrated = useHydrated();
  const handoffTaken = useRef(false);
  // The reader can ask without the page they were reading, and bring it back.
  const [aboutPage, setAboutPage] = useState(true);
  const askingAbout = page && aboutPage ? page : undefined;

  // A question typed on the landing page arrives through this browser's session storage, never in the
  // page address, and is asked once, after the conversation kept in this browser has been read.
  useEffect(() => {
    if (!hydrated || handoffTaken.current) return;
    handoffTaken.current = true;
    const handed = readStored<string | null>("session", BROWSER_STORAGE_KEYS.askHomeQuestion, null);
    if (typeof handed !== "string" || !handed.trim()) return;
    writeStored("session", BROWSER_STORAGE_KEYS.askHomeQuestion, null);
    void sendQuestion(handed, "text", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    await sendQuestion(question);
  }

  async function sendQuestion(raw: string, responseMode: AskResponseMode = "text", showInBox = false): Promise<string | undefined> {
    const q = raw.trim();
    if (!q) {
      setError(copyText(copy, "questionTooShort"));
      return;
    }
    // A question handed over from the landing page shows in the window while it is answered, like a typed one.
    if (showInBox) setQuestion(q);
    setError("");
    setBusy(true);
    setLive({ question: q, stage: "reading", text: "" });
    const sessionId = session.id || newId("s");
    const history = session.turns
      .filter(turn => (turn.context ?? context) === context && turn.result.kind === "answer")
      .slice(0, 4).reverse().map(turn => ({
        question: turn.question.slice(0, 1000),
        answer: turn.result.kind === "answer" ? turn.result.answer.shortAnswer.slice(0, 2500) : "",
      }));
    const priorArtifact = activePracticeArtifact(session.turns, context, q, path?.id);
    const previousAnswer = session.turns.find(turn => (turn.context ?? context) === context && turn.result.kind === "answer")?.result;
    const priorWorkProduct = previousAnswer?.kind === "answer" ? previousAnswer.answer.workProduct : undefined;
    try {
      const res = await fetch(agencyZoneEnabled ? "/dsd-api/ask" : "/api/ask", {
        method: "POST",
        // Ask for progress as the answer is prepared; a single finished answer is still accepted.
        headers: { "content-type": "application/json", accept: `${ASK_PROGRESS_TYPE}, application/json` },
        body: JSON.stringify({ question: q, responseMode, pathId: path?.id, mode: initialMode, researchMode, contextPreference: context, history, priorArtifact, priorWorkProduct, page: askingAbout, screen: page && !aboutPage ? undefined : captureScreen() }),
      });
      const payload = res.ok && res.body && res.headers.get("content-type")?.includes(ASK_PROGRESS_TYPE)
        ? await readAskProgress(res.body, event => setLive(current => !current ? current
          : event.type === "stage" ? { ...current, stage: event.stage }
          : event.type === "text" ? { ...current, text: event.text }
          : { ...current, text: "" })) as { error?: unknown }
        : await res.json();
      // The answer's connection opens before the work finishes, so a late failure arrives in the body.
      if (!res.ok || typeof payload?.error === "string") {
        setError(typeof payload?.error === "string" ? payload.error : copyText(copy, "answerError"));
        setRetryQuestion(q);
        return;
      }
      setRetryQuestion("");
      const result = payload as StaffAskResult;
      setSession({ id: sessionId, turns: [{ at: new Date().toISOString(), question: q, result, context }, ...session.turns].slice(0, 30) });
      setQuestion("");
      setTimeout(() => liveRef.current?.focus(), 50);
      return result.kind === "answer" ? result.answer.shortAnswer : undefined;
    } catch {
      setError(copyText(copy, "answerError"));
      setRetryQuestion(q);
    } finally {
      setBusy(false);
      setLive(null);
    }
  }

  function prepareConsult(answer: StaffAskAnswer) {
    if (!answer.consultation) return;
    writeStored("session", BROWSER_STORAGE_KEYS.consultationPrefill, {
      equity_questions_considered: answer.consultation.questionSummary,
    });
  }

  return (
    <div className={compact ? undefined : styles.askLayout}>
      <div>
        {reviewDraft ? (
          <section className="card mb-4" aria-labelledby={`${textId}-analyze`}>
            <h2 id={`${textId}-analyze`} className="text-lg font-bold">Review a draft with Analyze a document</h2>
            <p className="mt-2">Attach or paste the draft and get each question answered as evidence, inference or gap, with next steps in this program. <Link href="/equity-review/analyze">Open Analyze a document</Link></p>
          </section>
        ) : null}
        <form onSubmit={submit} className="ask-form">
          <label htmlFor={textId} className="ask-form-label">
            {copyText(copy, reviewDraft ? "reviewDraftLabel" : "questionLabel")}
          </label>
          {/* The window speaks for itself; the help stays for screen readers, and shows when a draft or a path needs it. */}
          <p id={`${textId}-help`} className={reviewDraft || path ? "ask-box-small ask-box-small--above" : "sr-only"}>
            {copyText(copy, reviewDraft ? "reviewDraftHelp" : "questionHelp")} {path ? `${copyText(copy, "connectedPathLead")} "${path.staffLabel}" path.` : ""}
            <span className="sr-only"> Press Enter to send. Press Shift and Enter to start a new line.</span>
          </p>
          {page ? (
            <p id={`${textId}-page`} className="ask-box-small ask-box-small--above" aria-live="polite">
              {aboutPage ? <>Asking about: <strong>{page.title}</strong></> : "Your question will be answered on its own."}{" "}
              <button type="button" className="underline" disabled={busy} onClick={() => setAboutPage(!aboutPage)}>
                {aboutPage ? "Ask without this page" : `Ask about ${page.title} instead`}
              </button>
            </p>
          ) : null}
          <AskBox
            id={textId}
            value={question}
            onChange={setQuestion}
            placeholder={reviewDraft ? copyText(copy, "reviewDraftPlaceholder") : path ? path.askStarters[0] : copyText(copy, "questionExample")}
            sendLabel={copyText(copy, reviewDraft ? "reviewDraftLabel" : "answerButton")}
            busy={busy}
            describedBy={`${textId}-help${page ? ` ${textId}-page` : ""} ${textId}-research-privacy${error ? ` ${textId}-error` : ""}`}
            invalid={Boolean(error)}
          >
            <AskVoice busy={busy} busyLabel={live ? undefined : busyLabel(researchMode, copy)} onDictation={setQuestion} onQuestion={text => sendQuestion(text, "spoken")} latestAnswer={session.turns[0]?.result.kind === "answer" ? session.turns[0].result.answer.shortAnswer : undefined} listenSlot={listenSlot} />
          </AskBox>
          {error ? (
            <p className="error mt-2 font-bold" id={`${textId}-error`} role="alert">
              {error}
              {retryQuestion ? <> <button type="button" className="underline" disabled={busy} onClick={() => void sendQuestion(retryQuestion)}>Try again</button></> : null}
            </p>
          ) : null}
          <p className="ask-box-small" id={`${textId}-research-privacy`}>Leave out names and private details. Outside services help answer your question.</p>
          <div className="mt-2 flex flex-wrap items-start gap-x-5 text-sm">
            <details>
              <summary className="min-h-11 cursor-pointer py-2">Privacy</summary>
              <p className="max-w-prose pb-2">{copyText(copy, "privacyNotice")} {VOICE_PRIVACY_NOTE}</p>
            </details>
            {session.turns.length ? <button
              type="button"
              className="min-h-11 underline"
              disabled={busy}
              onClick={() => {
                setSession(EMPTY_SESSION);
                setQuestion("");
                setError("");
                document.getElementById(textId)?.focus();
              }}
            >Clear conversation</button> : null}
          </div>
          {copyText(copy, "libraryButton") ? <p className="ask-box-small"><Link href="/library">{copyText(copy, "libraryButton")}</Link></p> : null}
          {path ? (
            <details className="mt-3">
              <summary>{copyText(copy, "starterQuestionsLabel")}</summary>
              <ul className="list-disc pl-6">
                {path.askStarters.map((s) => (
                  <li key={s}>
                    <button type="button" className="text-left underline" onClick={() => setQuestion(s)}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </form>

        {live ? (
          // Outside the announced region on purpose: a screen reader hears each stage once, not every added word.
          <article className={`${styles.answer} mt-6`} aria-busy="true">
            <p className="kicker">{copyText(copy, "askedKicker")}</p>
            <p className="font-bold">{live.question}</p>
            {live.text ? (
              <div className="mt-3">
                <h2 className="text-xl font-extrabold">{copyText(copy, "shortAnswerTitle")}</h2>
                <p className="whitespace-pre-wrap break-words">{live.text}</p>
              </div>
            ) : null}
            <p className="ask-box-small mt-3" role="status">{stageLine(live.stage)}</p>
          </article>
        ) : null}
        <div ref={liveRef} tabIndex={-1} aria-live="polite" className="mt-6 space-y-6">
          {session.turns.map((t, i) => (
            <article key={t.at + i} className={styles.answer}>
              <p className="kicker">{copyText(copy, "askedKicker")}{t.context ? ` in ${t.context === "one_dsd" ? copyText(copy, "oneDsdName") : copyText(copy, "oneDhsName")}` : ""}</p>
              <p className="font-bold">{t.question}</p>
              {t.result.kind === "refusal" ? (
                <div className="mt-3">
                  <Notice tone="stop">
                    <strong>{copyText(copy, "differentSupportLead")} </strong>
                    {t.result.safety.message}
                  </Notice>
                  {t.result.safety.redirect ? (
                    <p className="mt-2">
                      <Link href={context !== "one_dsd" && t.result.safety.redirect.href.startsWith("/support/request") ? "/support/right-person" : t.result.safety.redirect.href} className="btn btn--primary">
                        {context !== "one_dsd" && t.result.safety.redirect.href.startsWith("/support/request")
                          ? copyText(copy, "rightPersonLabel")
                          : !intakeEnabled && t.result.safety.redirect.href.startsWith("/support/request")
                            ? copyText(copy, "previewConsultLabel")
                            : t.result.safety.redirect.label}
                      </Link>
                    </p>
                  ) : null}
                  <ActionList
                    heading={copyText(copy, "alternativesHeading")}
                    actions={(t.result.safety.alternatives ?? []).map((action) =>
                      context !== "one_dsd" && action.href.startsWith("/support/request")
                        ? { label: copyText(copy, "rightPersonLabel"), href: "/support/right-person" }
                        : !intakeEnabled && action.href.startsWith("/support/request")
                          ? { ...action, label: copyText(copy, "previewConsultLabel") }
                          : action,
                    )}
                  />
                </div>
              ) : (
                <AnswerView context={context} answer={t.result.answer} onPrepareConsult={prepareConsult} intakeEnabled={intakeEnabled} dsdContext={context === "one_dsd" && (t.context ?? context) === "one_dsd"} copy={copy}
                  onFollowUp={i === 0 ? value => { void sendQuestion(value, "text", true); } : undefined} busy={busy}
                  tools={i === 0 ? <span ref={setListenSlot} className="ask-answer-tools" /> : undefined} />
              )}
            </article>
          ))}
        </div>
      </div>
      {compact ? null : <aside className={styles.askRail}>
        <div className={styles.railNote}>
          <p className="kicker">{copyText(copy, "howKicker")}</p>
          <ul className="list-disc pl-5 text-sm">
            {copyList(copy, "howItems").slice(0, 4).map((item) => <li key={item}>{item}</li>)}
            <li>{context === "one_dsd" ? (intakeEnabled ? copyText(copy, "howDsdOpenSupport") : copyText(copy, "howDsdPreviewSupport")) : copyText(copy, "howOneDhsSupport")}</li>
            {copyList(copy, "howItems").slice(4).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className={styles.railNote}>
          <p className="kicker">{copyText(copy, "moreKicker")}</p>
          <p className="text-sm">
            {context !== "one_dsd"
              ? copyText(copy, "moreOneDhsBody")
              : intakeEnabled
                ? copyText(copy, "moreDsdOpenBody")
                : copyText(copy, "moreDsdPreviewBody")}
          </p>
          <Link href="/support/right-person">{copyText(copy, "rightPersonLabel")}</Link>
        </div>
      </aside>}
    </div>
  );
}

/** Render provider citation markers as ordinary safe links, never injected markup. */
function citedAnswer(text: string, sources: Array<{ title: string; url: string }>) {
  return text.split(/(\x60{3}[\s\S]*?\x60{3}|\x60[^\x60\n]+\x60|\[\d+\]|\*\*[^*\n]+\*\*|(?<![*\w])\*[^*\n]+\*(?![*\w]))/g).map((part, index) => {
    if (part.startsWith(String.fromCharCode(96).repeat(3))) {
      const code = part.replace(/^\x60{3}[^\n]*\n/, "").replace(/\x60{3}$/, "");
      return <code key={index} className="my-2 block overflow-x-auto rounded bg-gray-100 p-3 font-mono text-sm whitespace-pre">{code}</code>;
    }
    if (part.startsWith(String.fromCharCode(96))) return <code key={index} className="font-mono">{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{citedAnswer(part.slice(2, -2), sources)}</strong>;
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    const marker = /^\[(\d+)\]$/.exec(part);
    const source = marker ? sources[Number(marker[1]) - 1] : undefined;
    return source && /^https:\/\//i.test(source.url)
      ? <SourceLink key={index} href={source.url} target="_blank" rel="noreferrer" aria-label={"Source " + marker![1] + ": " + source.title}>{part}</SourceLink>
      : part;
  });
}

export function AnswerView({ answer, onPrepareConsult, intakeEnabled, dsdContext, copy, context, tools, onFollowUp, busy }: { context: ProductContextId; answer: StaffAskAnswer; onPrepareConsult: (a: StaffAskAnswer) => void; intakeEnabled: boolean; dsdContext: boolean; copy: EditableSurfaceValues;
  onFollowUp?: (question: string) => void; busy?: boolean;
  /** Small controls shown under the answer, such as read aloud. */
  tools?: ReactNode }) {
  // Keep every evidence record for claim references, while listing each
  // destination once in the separate program-reading navigation.
  const programSources = [...new Map(answer.sources.map(source => [source.href, source])).values()];
  const grouped = (answer.questions ?? []).reduce<Record<string, string[]>>((acc, q) => {
    (acc[q.categoryLabel] ||= []).push(q.text);
    return acc;
  }, {});
  const consult = dsdContext && intakeEnabled ? answer.nextActions.find((n) => n.href.startsWith("/support/request")) : undefined;
  const independent = answer.nextActions.filter((n) => !n.href.startsWith("/support/request"));
  return (
    <div className="mt-3">
      <h2 className="text-xl font-extrabold">{copyText(copy, "shortAnswerTitle")}</h2>
      <p className="whitespace-pre-wrap break-words">{citedAnswer(answer.shortAnswer, answer.publicResearch?.sources ?? [])}</p>
      {tools}
      {answer.workProduct ? <AskWorkDownload work={answer.workProduct} /> : null}
      {answer.notice ? <Notice tone="warn">{answer.notice}</Notice> : null}

      {Object.keys(grouped).length ? (
        <div>
          <h3 className="text-lg font-bold">{copyText(copy, "earlyQuestionsTitle")}</h3>
          {Object.entries(grouped).map(([categoryLabel, qs]) => (
            <div key={categoryLabel} className="mt-2">
              <p className="font-bold">{categoryLabel}</p>
              <ul className="list-disc pl-6">
                {qs.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {answer.conflict ? (
        <Notice tone="warn">
          <strong>{copyText(copy, "sourceConflictLead")} </strong>
          {answer.conflict.message}
        </Notice>
      ) : null}

      {answer.publicResearch ? (
        <section className={styles.researchPanel}>
          <p className="kicker">{copyText(copy, "publicInformationKicker")}</p>
          <h3 className="text-lg font-bold">{answer.publicResearch.heading}</h3>
          {answer.publicResearch.answer && answer.publicResearch.answer !== answer.shortAnswer ? <p className="whitespace-pre-wrap break-words">{citedAnswer(answer.publicResearch.answer, answer.publicResearch.sources)}</p> : null}
          <p className="text-sm text-muted">{answer.publicResearch.note}</p>
          {answer.publicResearch.sources.length ? (
            <details className="mt-2">
              <summary>{copyText(copy, "sourcesUsedLabel")} ({answer.publicResearch.sources.length})</summary>
              <ol className="list-decimal pl-6">
                {answer.publicResearch.sources.slice(0, 10).map((source) => (
                  <li key={source.url}>
                    <SourceLink href={source.url} target="_blank" rel="noreferrer">{source.title}</SourceLink>
                    {source.date ? <span className="text-sm text-muted"> {copyText(copy, "datedPrefix")} {source.date}</span> : null}
                  </li>
                ))}
              </ol>
              {answer.publicResearch.sources.length > 10 ? <details className="mt-2"><summary>Show the other {answer.publicResearch.sources.length - 10} sources</summary><ol className="list-decimal pl-6" start={11}>
                {answer.publicResearch.sources.slice(10).map((source) => (
                  <li key={source.url}>
                    <SourceLink href={source.url} target="_blank" rel="noreferrer">{source.title}</SourceLink>
                    {source.date ? <span className="text-sm text-muted"> {copyText(copy, "datedPrefix")} {source.date}</span> : null}
                  </li>
                ))}
              </ol></details> : null}
            </details>
          ) : null}
        </section>
      ) : null}

      {answer.whyItMatters ? <details className="mt-3">
        <summary>{copyText(copy, "whyItMattersLabel")}</summary>
        <p className="whitespace-pre-wrap">{answer.whyItMatters}</p>
      </details> : null}

      {answer.evidenceClaims?.length ? <details className="mt-3">
        <summary>{copyText(copy, "evidencePassagesLabel") || "Passages and interpretation"}</summary>
        {answer.evidenceClaims.map((claim,index) => <div key={index} className="mt-3">
          {claim.kind === "source_excerpt" ? <blockquote className="border-l-2 pl-4 whitespace-pre-wrap">{claim.text}</blockquote> : <p className="whitespace-pre-wrap"><strong>{copyText(copy, "inferenceLabel") || "Suggested interpretation"}: </strong>{claim.text}</p>}
          {claim.references.map((reference,refIndex) => { const source=answer.sources.find(item=>item.evidence?.evidenceId===reference.evidenceId); return source ? <p key={refIndex} className="text-sm"><Link href={source.href}>{source.title}</Link>{claim.kind === "inference" ? <q className="block mt-1">{reference.quote}</q> : null}</p> : null; })}
        </div>)}
      </details> : null}

      {programSources.length ? <details className="mt-2">
        <summary>{copyText(copy, answer.evidenceClaims?.length ? "programSourcesLabel" : "relatedReadingLabel") || "Related program reading"} ({programSources.length})</summary>
        <ul className="list-disc pl-6">
            {programSources.map((s) => (
              <li key={s.href}>
                <Link href={s.href}>{s.title}</Link>{" "}
                {mediaResourceIdFromHref(s.href) ? <ResourceMediaPreview resourceId={mediaResourceIdFromHref(s.href)!} /> : null}
              </li>
            ))}
        </ul>
      </details> : null}

      {answer.limits.length ? <details className="mt-2" open>
        <summary>{copyText(copy, "limitsLabel")}</summary>
        <ul className="list-disc pl-6">
          {answer.limits.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details> : null}

      <ActionList heading={copyText(copy, "actionsHeading")} actions={independent} />

      {onFollowUp && answer.followUpQuestions?.length ? <section className="mt-8 border-t border-slate-300 pt-5" aria-label="Continue exploring">
        <h3 className="text-base font-medium">Continue exploring</h3>
        <ul className="mt-3 space-y-2 list-none p-0">
          {answer.followUpQuestions.map(question => <li key={question}>
            <button type="button" disabled={busy} onClick={() => onFollowUp(question)} className="min-h-11 w-full rounded border border-slate-300 px-4 py-3 text-left text-[color:var(--blue)] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">{question}</button>
          </li>)}
        </ul>
      </section> : null}

      {answer.practiceArtifact && !answer.workProduct ? <PracticeDraftLink artifact={answer.practiceArtifact} context={context} copy={copy} /> : null}

      {answer.pathSuggestion ? (
        <p className="mt-3 text-sm">
          <Link href={answer.pathSuggestion.href}>{copyText(copy, "openPathLead")} {answer.pathSuggestion.title} path</Link>. {answer.pathSuggestion.why}
        </p>
      ) : null}

      {answer.consultation && dsdContext && intakeEnabled ? (
        <div className="notice mt-4">
          <p className="m-0">
            <strong>{intakeEnabled ? copyText(copy, "consultOpenLead") : copyText(copy, "consultPreviewLead")} </strong>
            {answer.consultation.reason}{" "}
            {intakeEnabled
              ? copyText(copy, "consultOpenBody")
              : copyText(copy, "consultPreviewBody")}
          </p>
          <p className="mt-2">
            <Link href={consult?.href ?? "/support/request"} className="btn btn--primary" onClick={() => onPrepareConsult(answer)}>
              {intakeEnabled ? copyText(copy, "consultOpenButton") : copyText(copy, "consultPreviewButton")}
            </Link>
          </p>
        </div>
      ) : answer.consultation ? (
        <div className="notice mt-4">
          <p className="m-0">
            <strong>{copyText(copy, "humanJudgmentLead")} </strong>
            {answer.consultation.reason} {copyText(copy, "humanJudgmentBody")}
          </p>
          <p className="mt-2"><Link href="/support/right-person" className="btn btn--primary">{copyText(copy, "rightPersonLabel")}</Link></p>
        </div>
      ) : consult ? (
        <p className="mt-3 text-sm">
          <Link href={consult.href} onClick={() => onPrepareConsult(answer)}>
            {intakeEnabled ? consult.label : copyText(copy, "consultPreviewButton")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function busyLabel(mode: AskResearchMode, copy: EditableSurfaceValues): string {
  if (mode === "web_results") return copyText(copy, "busyResults");
  if (mode === "current_web") return copyText(copy, "busyCurrent");
  if (mode === "deep_research") return copyText(copy, "busyDeep");
  return copyText(copy, "busyProgram");
}

function PracticeDraftLink({ artifact, context, copy }: { artifact: PracticeArtifact; context: ProductContextId; copy: EditableSurfaceValues }) {
  const [message, setMessage] = useState("");
  const parsed = PracticeArtifactSchema.safeParse(artifact);
  if (!parsed.success || parsed.data.context !== context) return null;
  return <div className="notice mt-4">
    <p><strong>{parsed.data.title}</strong></p>
    <p>{copyText(copy, "draftReadyBody") || "Your draft is ready to review and adapt in Practice."}</p>
    <Link className="btn btn--light" href={"/practice/" + parsed.data.pathId} onClick={event => {
      if (!writeStored("session", BROWSER_STORAGE_KEYS.askPracticeHandoff, parsed.data)) {
        event.preventDefault();
        setMessage(copyText(copy, "draftTransferError") || "Your draft could not be carried over on this computer. Your answer is still here.");
      }
    }}>{copyText(copy, "draftContinueLabel") || "Continue this draft in Practice"}</Link>
    {message ? <p role="alert">{message}</p> : null}
  </div>;
}
