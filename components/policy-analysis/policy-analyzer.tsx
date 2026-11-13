"use client";
import { SourceLink } from "@/components/app-link";


import Link from "@/components/app-link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DECISION_ROLE_LABELS, DECISION_ROLES, policyRefSchema, type DecisionRoleId, type PolicyCase, type PolicyRef, type PolicySource } from "@/lib/policy-analysis/contract";
import { AnalyzeStep } from "./analyze-step";
import { ApiError, api, downloadExport, isConflict, type ExportKind, type WorkspaceStatus } from "./api";
import { CaseLibrary } from "./case-library";
import { DecisionsStep, type DecisionInput } from "./decisions-step";
import { FormalizeStep } from "./formalize-step";
import { humanizeId, STATUS_LABELS, type CatalogKind, type CatalogPolicy, type QuestionLabels } from "./labels";
import { PolicyPicker, type PolicyChoice } from "./policy-picker";
import type { EditableRecommendation } from "./recommendation-card";
import { RecommendationsStep } from "./recommendations-step";
import { SourcesEditor } from "./sources-editor";
import styles from "./policy-analysis.module.css";

type Setup = { choice: PolicyChoice | null; title: string; titleTouched: boolean; sources: PolicySource[]; context: string };
type Problem = { message: string; signIn?: boolean };

const EMPTY_SETUP: Setup = { choice: null, title: "", titleTouched: false, sources: [], context: "" };
const NOT_IN_CATALOG = "That policy is not in the catalog. Search for it below, or name a policy that is not in the catalog.";
const STEP_NAMES = ["Choose the policy", "Add material", "Analyze", "Recommended changes", "Decide", "Formalize and download"];

function setupFrom(value: PolicyCase): Setup {
  const choice: PolicyChoice = value.policy.catalogId ? { mode: "catalog", catalogId: value.policy.catalogId } : { mode: "other", title: value.policy.title, url: value.policy.sourceUrl ?? "" };
  return { choice, title: value.title, titleTouched: true, sources: value.sources, context: value.context };
}

function currentStep(value: PolicyCase | null): number {
  if (!value) return 1;
  if (value.status === "final") return 6;
  if (value.status === "review") return 5;
  return value.recommendations.length ? 4 : 3;
}

function setUrl(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

export function PolicyAnalyzer({ catalog, kinds, questions, principleLabels, initialCaseId, initialCatalogId }: {
  catalog: CatalogPolicy[];
  kinds: CatalogKind[];
  questions: QuestionLabels;
  principleLabels?: Record<string, string>;
  initialCaseId?: string;
  initialCatalogId?: string;
}) {
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [view, setView] = useState<"library" | "case">(initialCaseId || initialCatalogId ? "case" : "library");
  const [current, setCurrent] = useState<PolicyCase | null>(null);
  const [setup, setSetup] = useState<Setup>(() => {
    const policy = !initialCaseId && initialCatalogId ? catalog.find(item => item.id === initialCatalogId) : undefined;
    return policy ? { ...EMPTY_SETUP, choice: { mode: "catalog", catalogId: policy.id }, title: `Equity analysis: ${policy.title}`.slice(0, 240) } : EMPTY_SETUP;
  });
  const [busy, setBusy] = useState<string | null>(initialCaseId ? "open" : null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [notice, setNotice] = useState(() => !initialCaseId && initialCatalogId && !catalog.some(item => item.id === initialCatalogId) ? NOT_IN_CATALOG : "");
  const [manual, setManual] = useState(false);
  const [manualReason, setManualReason] = useState<string | null>(null);
  const [libraryKey, setLibraryKey] = useState(0);
  // The role the person is deciding as. Remembered in this browser only, as a convenience.
  const [decidingAs, setDecidingAsState] = useState<DecisionRoleId>("consultant");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("equity-workspace:deciding-as");
      if (saved && (DECISION_ROLES as readonly string[]).includes(saved)) setDecidingAsState(saved as DecisionRoleId);
    } catch { /* storage unavailable */ }
  }, []);
  const setDecidingAs = useCallback((role: DecisionRoleId) => {
    setDecidingAsState(role);
    try { window.localStorage.setItem("equity-workspace:deciding-as", role); } catch { /* storage unavailable */ }
  }, []);
  const errorRef = useRef<HTMLDivElement>(null);

  const catalogById = useMemo(() => new Map(catalog.map(item => [item.id, item])), [catalog]);
  const catalogTitles = useMemo(() => Object.fromEntries(catalog.map(item => [item.id, item.title])), [catalog]);
  const principleName = useCallback((id: string) => principleLabels?.[id] ?? humanizeId(id), [principleLabels]);

  const report = useCallback((error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") return;
    if (error instanceof ApiError && error.status === 401) setProblem({ message: "Your sign-in has ended. Sign in again, then come back to this page.", signIn: true });
    else setProblem({ message: error instanceof Error && error.message ? error.message : "Something went wrong. Your saved analysis is unchanged." });
    window.requestAnimationFrame(() => errorRef.current?.focus());
  }, []);

  const showCase = useCallback((value: PolicyCase) => {
    setCurrent(value);
    setSetup(setupFrom(value));
    setView("case");
    setUrl({ case: value.id });
  }, []);

  const openCase = useCallback(async (id: string) => {
    setBusy("open");
    setProblem(null);
    setNotice("");
    try {
      showCase(await api.getCase(id));
    } catch (error) {
      report(error);
      setView("library");
      setUrl({});
    } finally {
      setBusy(null);
    }
  }, [report, showCase]);

  const startNew = useCallback((catalogId?: string) => {
    const policy = catalogId ? catalogById.get(catalogId) : undefined;
    setCurrent(null);
    setProblem(null);
    setNotice(catalogId && !policy ? NOT_IN_CATALOG : "");
    setSetup(policy ? { ...EMPTY_SETUP, choice: { mode: "catalog", catalogId: policy.id }, title: `Equity analysis: ${policy.title}`.slice(0, 240) } : EMPTY_SETUP);
    setView("case");
    setUrl(policy ? { policy: policy.id } : {});
  }, [catalogById]);

  useEffect(() => {
    let active = true;
    api.status().then(value => {
      if (!active) return;
      setStatus(value);
      if (!value.analysisAvailable) { setManual(true); setManualReason(value.analysisUnavailableReason ?? null); }
    }).catch(error => { if (active) report(error); });
    return () => { active = false; };
  }, [report]);

  // Opens the case named in the address (?case=), for example one sent from the Equity Analysis Toolkit.
  useEffect(() => {
    if (!initialCaseId) return;
    let active = true;
    api.getCase(initialCaseId)
      .then(value => { if (active) showCase(value); })
      .catch(error => { if (!active) return; report(error); setView("library"); setUrl({}); })
      .finally(() => { if (active) setBusy(null); });
    return () => { active = false; };
  }, [initialCaseId, report, showCase]);

  /** Runs one change against the saved case. A 409 reloads the case and explains why. */
  const run = useCallback(async (name: string, action: (value: PolicyCase) => Promise<PolicyCase>, done?: string): Promise<PolicyCase | null> => {
    if (!current) return null;
    setBusy(name);
    setProblem(null);
    setNotice("");
    try {
      const next = await action(current);
      setCurrent(next);
      setSetup(setupFrom(next));
      if (done) setNotice(done);
      return next;
    } catch (error) {
      if (isConflict(error)) {
        try {
          showCase(await api.getCase(current.id));
          setProblem({ message: "This analysis was changed somewhere else, so your last step was not saved. The latest version is shown now. Check it and try again." });
          window.requestAnimationFrame(() => errorRef.current?.focus());
        } catch (reloadError) { report(reloadError); }
      } else if (name === "analyze" && error instanceof ApiError && error.status === 503 && error.code === "unavailable") {
        setManual(true);
        setManualReason(error.message);
        setNotice("The analysis service is not available, so this analysis has switched to writing the changes by hand.");
      } else {
        report(error);
      }
      return null;
    } finally {
      setBusy(null);
    }
  }, [current, report, showCase]);

  const selectedCatalog = setup.choice?.mode === "catalog" ? catalogById.get(setup.choice.catalogId) ?? null : null;
  const dirty = Boolean(current) && (setup.title !== current?.title || setup.context !== current?.context || setup.sources.map(s => s.id).join("|") !== current?.sources.map(s => s.id).join("|"));
  const savingAvailable = status?.caseSavingAvailable !== false;

  function policyRef(): PolicyRef | string {
    if (!setup.choice) return "Choose a policy in step 1.";
    if (setup.choice.mode === "catalog") {
      const item = selectedCatalog;
      if (!item) return "Choose a policy in step 1.";
      const parsed = policyRefSchema.safeParse({ catalogId: item.id, title: item.title.slice(0, 300), kindLabel: item.kindLabel.slice(0, 80), ...(item.sourceUrl ? { sourceUrl: item.sourceUrl } : {}), programs: item.programs.slice(0, 20).map(name => name.slice(0, 120)) });
      return parsed.success ? parsed.data : "This catalog policy could not be used. Choose a policy that is not in the catalog and attach it instead.";
    }
    if (!setup.choice.title.trim()) return "Give the policy a title in step 1.";
    const parsed = policyRefSchema.safeParse({ title: setup.choice.title.trim(), ...(setup.choice.url.trim() ? { sourceUrl: setup.choice.url.trim() } : {}), programs: [] });
    return parsed.success ? parsed.data : "Use a full web address for the link, starting with https://, or leave it empty.";
  }

  async function save(): Promise<PolicyCase | null> {
    if (!setup.title.trim()) { report(new Error("Give this analysis a name in step 2.")); return null; }
    if (!current) {
      const policy = policyRef();
      if (typeof policy === "string") { report(new Error(policy)); return null; }
      setBusy("save");
      setProblem(null);
      try {
        const created = await api.createCase({ title: setup.title.trim(), policy, sources: setup.sources, context: setup.context });
        showCase(created);
        setLibraryKey(key => key + 1);
        setNotice("Saved. Next, run the analysis in step 3.");
        return created;
      } catch (error) { report(error); return null; } finally { setBusy(null); }
    }
    return run("save", value => api.updateCase(value.id, { expectedVersion: value.version, title: setup.title.trim(), sources: setup.sources, context: setup.context }), "Your changes are saved.");
  }

  async function analyze() {
    if (!current) return;
    if (current.recommendations.length && !window.confirm("Running the analysis again drafts a new set of recommended changes. Continue?")) return;
    let base: PolicyCase | null = current;
    if (dirty) base = await save();
    if (!base) return;
    const target = base;
    setBusy("analyze");
    setProblem(null);
    setNotice("");
    try {
      const next = await api.analyze(target.id, target.version, "both");
      setCurrent(next);
      setSetup(setupFrom(next));
      setNotice(next.recommendations.length ? "The analysis is ready, with recommended changes in step 4." : "The analysis is ready.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 503 && error.code === "unavailable") {
        setManual(true);
        setManualReason(error.message);
        setNotice("The analysis service is not available, so this analysis has switched to writing the changes by hand.");
      } else if (isConflict(error)) {
        try { showCase(await api.getCase(target.id)); } catch { /* reported below */ }
        report(new Error("This analysis was changed somewhere else. The latest version is shown now. Check it and run the analysis again."));
      } else report(error);
    } finally {
      setBusy(null);
    }
  }

  async function getOfficialText(catalogId: string) {
    setBusy("fetch-source");
    setProblem(null);
    try {
      const source = await api.fetchSource(catalogId);
      setSetup(value => ({ ...value, sources: [...value.sources.filter(item => item.id !== source.id), source] }));
      setNotice(`Added the official text: "${source.title}". ${current ? "Save your changes in step 2 to keep it." : "It is listed in step 2."}`);
    } catch (error) { report(error); } finally { setBusy(null); }
  }

  const officialTextAdded = Boolean(selectedCatalog && setup.sources.some(source => source.origin === "catalog"));
  const locked = Boolean(busy);
  const step = currentStep(current);
  const final = current?.status === "final";

  return (
    <div className={styles.stack}>
      <div ref={errorRef} tabIndex={-1} role="alert" className="outline-none">
        {problem ? (
          <div className="notice notice--stop">
            <p className="m-0">{problem.message}</p>
            {problem.signIn ? <p className="mb-0 mt-2"><SourceLink href="/equity-workspace">Sign in again</SourceLink></p> : null}
          </div>
        ) : null}
      </div>
      <p className="m-0" role="status">{notice}</p>

      {status ? <p className={`${styles.muted} m-0`}>Decisions are recorded with the role you choose in step 5, now the {DECISION_ROLE_LABELS[decidingAs]}.</p> : null}
      {status && !status.caseSavingAvailable ? (
        <div className="notice notice--warn"><p className="m-0"><strong>Saving is not available right now.</strong> {status.caseSavingUnavailableReason ?? ""}</p></div>
      ) : null}

      {view === "library" ? (
        <CaseLibrary onOpen={id => void openCase(id)} onStart={() => startNew()} onError={report} savingAvailable={savingAvailable} refreshKey={libraryKey} />
      ) : (
        <>
          <div className={styles.between}>
            <button type="button" className={styles.linkButton} disabled={locked} onClick={() => { setView("library"); setCurrent(null); setUrl({}); setLibraryKey(key => key + 1); }}>Back to saved policy analyses</button>
            {current ? <p className="m-0"><strong>{current.title}</strong> · {STATUS_LABELS[current.status]}</p> : null}
          </div>
          <nav aria-label="Steps">
            <ol className={styles.steps}>
              {STEP_NAMES.map((name, index) => (
                <li key={name} aria-current={index + 1 === step ? "step" : undefined} className={index + 1 < step ? styles.done : undefined}>
                  {index + 1}. {name}{index + 1 < step ? <span className="sr-only"> (done)</span> : null}
                </li>
              ))}
            </ol>
          </nav>
          {busy === "open" ? <p role="status">Opening the analysis…</p> : null}

          <PolicyPicker catalog={catalog} kinds={kinds} choice={setup.choice} locked={Boolean(current)} busy={locked} officialTextAdded={officialTextAdded}
            onGetOfficialText={id => void getOfficialText(id)}
            onChoose={choice => setSetup(value => {
              const item = choice?.mode === "catalog" ? catalogById.get(choice.catalogId) : undefined;
              const title = value.titleTouched ? value.title : item ? `Equity analysis: ${item.title}`.slice(0, 240) : choice?.mode === "other" && choice.title ? `Equity analysis: ${choice.title}`.slice(0, 240) : "";
              return { ...value, choice, title };
            })} />

          <SourcesEditor title={setup.title} onTitle={title => setSetup(value => ({ ...value, title, titleTouched: true }))}
            sources={setup.sources} onSources={sources => setSetup(value => ({ ...value, sources }))}
            context={setup.context} onContext={context => setSetup(value => ({ ...value, context }))}
            disabled={locked || final} onError={report} onNotice={setNotice}>
            {final ? <p className={styles.muted}>This analysis is formalized. Reopen it in step 6 to change the material.</p> : (
              <div className={styles.row}>
                <button type="button" className="btn btn--primary" disabled={locked || !savingAvailable || (Boolean(current) && !dirty)} onClick={() => void save()}>
                  {busy === "save" ? "Saving…" : current ? "Save changes" : "Save"}
                </button>
                {current && dirty ? <span className={styles.muted}>You have unsaved changes.</span> : null}
                {!current ? <span className={styles.muted}>Saving keeps this analysis so you and the One DSD Team can come back to it.</span> : null}
              </div>
            )}
          </SourcesEditor>

          <AnalyzeStep value={current} saved={!dirty} manual={manual} manualReason={manualReason} running={busy === "analyze"} busy={locked} onAnalyze={() => void analyze()} questions={questions} principleLabels={principleLabels} />

          {current && (current.recommendations.length || current.analysis || manual) ? (
            <RecommendationsStep recommendations={current.recommendations} sources={current.sources} catalogTitles={catalogTitles} principleName={principleName}
              editable={!final} busy={locked} manual={manual && !current.analysis}
              onSave={async (all: EditableRecommendation[]) => (await run("recommendations", value => api.updateCase(value.id, { expectedVersion: value.version, recommendations: all }), "The recommended changes are saved.")) !== null} />
          ) : null}

          {current && current.status === "draft" && current.recommendations.length ? (
            <div className={styles.step}>
              <p className="mt-0">When the recommended changes read correctly, send them for decisions. You can still correct a change while decisions are being recorded.</p>
              <button type="button" className="btn btn--primary" disabled={locked} onClick={() => void run("send", value => api.sendForDecisions(value.id, value.version), "The changes are ready for decisions in step 5.")}>
                {busy === "send" ? "Sending…" : "Send the changes for decisions"}
              </button>
            </div>
          ) : null}

          {current && current.recommendations.length ? (
            <DecisionsStep recommendations={current.recommendations} canDecide={current.status === "review"} busy={locked} decidingAs={decidingAs} onDecidingAs={setDecidingAs}
              notReadyText={current.status === "draft" ? "Send the changes for decisions to record approvals." : final ? "This analysis is formalized. Reopen it in step 6 to change a decision." : undefined}
              onDecide={async (input: DecisionInput) => (await run("decide", value => api.decide({ caseId: value.id, expectedVersion: value.version, ...input, decidingAs }), "The decision is recorded.")) !== null} />
          ) : null}

          {current && (current.analysis || current.recommendations.length) ? (
            <FormalizeStep key={current.id} value={current} busy={locked} decidingAsLabel={DECISION_ROLE_LABELS[decidingAs]}
              onFormalize={documentTitle => run("formalize", value => api.formalize(value.id, value.version, documentTitle, decidingAs), "The approved changes are formalized. Download the formal policy proposal below.")}
              onReopen={() => run("reopen", value => api.reopen(value.id, value.version), "The analysis is open for changes again.")}
              onDownload={async (kind: ExportKind, format) => {
                setProblem(null);
                try { await downloadExport(current.id, current.version, kind, format); setNotice("The download has started."); }
                catch (error) {
                  if (isConflict(error)) { await openCase(current.id); setProblem({ message: "This analysis was changed somewhere else. The latest version is shown now. Try the download again." }); }
                  else report(error);
                }
              }} />
          ) : null}

          <p className={`${styles.muted} m-0`}>Need background on a policy? Browse <Link href="/community-outreach/policies">Policies that shape disability services</Link>.</p>
        </>
      )}
    </div>
  );
}
