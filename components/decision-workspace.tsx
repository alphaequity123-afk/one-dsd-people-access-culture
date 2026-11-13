"use client";
import { SourceLink } from "@/components/app-link";


import { useEffect, useId, useRef, useState } from "react";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { DECISION_STAGES, DECISION_TASKS, decisionLinks, decisionText } from "@/lib/content/decision-workspace";
import { decisionChecks, decisionNotesSections, decisionNotesText, emptyDecisionNotes, type DecisionField, type DecisionNotes, type DecisionOption, type DecisionCheckStatus } from "@/lib/client/decision-notes";
import { loadDecisionNotes, saveDecisionNotes } from "@/lib/client/dsd-practice-plans";
import { goalPlanHtml } from "@/lib/program/goal-plan-report";
import styles from "./decision-workspace.module.css";

const storage = () => window.localStorage;
const statusKeys: Record<DecisionCheckStatus, string> = { "not-started": "statusNotStarted", reviewed: "statusReviewed", "needs-work": "statusNeedsWork", "not-applicable": "statusNotApplicable" };
const optionFields = ["benefits", "burden", "risks", "evidence"] as const;
type WorkingNavigateEvent = Event & { destination?: { url: string } };

/** Working notes are never persisted by an input handler. Saving is an explicit local action. */
export function DecisionWorkspace({ values, scope = "one-dhs" }: { values?: EditableSurfaceValues; scope?: StaffProgramScope }) {
  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const permittedNavigation = useRef<string | null>(null);
  const [notes, setNotes] = useState<DecisionNotes>(emptyDecisionNotes);
  const [step, setStep] = useState(0);
  const [planId, setPlanId] = useState<string | null>(null);
  const [expectedRaw, setExpectedRaw] = useState<string | null | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const text = (key: string) => decisionText(values, key);
  const stage = DECISION_STAGES[step];

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requestedPlan = query.get("plan");
    const loaded = loadDecisionNotes(storage, requestedPlan);
    if (loaded.ok) {
      const task = query.get("task");
      const next = loaded.notes;
      if (!requestedPlan && task && (DECISION_TASKS as readonly string[]).includes(task)) next.task = task;
      // Restore this browser's selected plan after hydration, before allowing saves.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes(next);
      setPlanId(loaded.planId);
      setExpectedRaw(loaded.raw);
    } else {
      setLoadFailed(Boolean(requestedPlan));
      setMessage(decisionText(values, requestedPlan ? "loadError" : "saveError"));
      setError(true);
    }
    setReady(true);
    // Opening a page reads only once; changing published copy must never replace someone's notes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dirty) return;
    let resetPermission: ReturnType<typeof setTimeout> | undefined;
    const sameDocument = (href: string) => {
      const destination = new URL(href, window.location.href);
      return destination.origin === window.location.origin && destination.pathname === window.location.pathname && destination.search === window.location.search;
    };
    const allow = (href: string) => {
      if (permittedNavigation.current === href) return true;
      if (!window.confirm("Leave this analysis? Changes not saved to My Work will be lost. You can stay here to save or download your notes.")) return false;
      permittedNavigation.current = href;
      clearTimeout(resetPermission);
      resetPermission = setTimeout(() => { permittedNavigation.current = null; }, 2000);
      return true;
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (permittedNavigation.current) return;
      event.preventDefault(); event.returnValue = "";
    };
    const guardLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (!["https:", "http:"].includes(destination.protocol) || sameDocument(destination.href)) return;
      if (!allow(destination.href)) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    const guardNavigation = (event: Event) => {
      const destination = (event as WorkingNavigateEvent).destination;
      if (!event.cancelable || !destination || sameDocument(destination.url)) return;
      if (!allow(destination.url)) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardLink, true);
    navigation?.addEventListener("navigate", guardNavigation);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guardLink, true);
      navigation?.removeEventListener("navigate", guardNavigation);
      clearTimeout(resetPermission); permittedNavigation.current = null;
    };
  }, [dirty]);

  function updateAddress(url: URL) {
    // Saving changes the resume address; it does not leave or discard this working draft.
    permittedNavigation.current = url.href;
    window.history.replaceState(window.history.state, "", url);
    queueMicrotask(() => { permittedNavigation.current = null; });
  }

  function update(change: (previous: DecisionNotes) => DecisionNotes) {
    setNotes(change); setDirty(true); setMessage(""); setError(false);
  }
  function changeField(key: DecisionField, value: string) {
    update(previous => ({ ...previous, fields: { ...previous.fields, [key]: value } }));
  }
  function changeOption(optionId: string, key: keyof Omit<DecisionOption, "id">, value: string) {
    update(previous => ({ ...previous, options: previous.options.map(option => option.id === optionId ? { ...option, [key]: value } : option) }));
  }
  function go(index: number) {
    setStep(index);
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  function save() {
    if (!notes.title.trim()) {
      setMessage(text("titleNeeded")); setError(true); titleRef.current?.focus(); return;
    }
    const result = saveDecisionNotes(storage, notes, expectedRaw, planId);
    if (!result.ok) {
      setMessage(text(result.reason === "conflict" ? "conflictError" : "saveError")); setError(true); return;
    }
    setPlanId(result.planId); setExpectedRaw(result.raw); setDirty(false); setError(false); setMessage(text("saved"));
    const url = new URL(window.location.href);
    url.searchParams.set("plan", result.planId);
    updateAddress(url);
  }
  function startNew() {
    if (dirty && !window.confirm(text("confirmNew"))) return;
    const loaded = loadDecisionNotes(storage);
    setExpectedRaw(loaded.ok ? loaded.raw : undefined);
    setNotes(emptyDecisionNotes()); setPlanId(null); setStep(0); setDirty(false); setLoadFailed(false); setMessage(text("newReady")); setError(false);
    const url = new URL(window.location.href); url.searchParams.delete("plan"); url.searchParams.delete("task");
    updateAddress(url);
    titleRef.current?.focus();
  }
  function download() {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(new Blob([decisionNotesText(notes, scope === "dsd" ? "dsd" : "dhs")], { type: "text/plain;charset=utf-8" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "decision-working-notes.txt"; anchor.click();
      setMessage(text("downloaded")); setError(false);
    } catch {
      setMessage(text("downloadError")); setError(true);
    } finally {
      if (url) { const created = url; setTimeout(() => URL.revokeObjectURL(created), 1000); }
    }
  }

  function printNotes() {
    let view: Window | null = null;
    try {
      view = window.open("", "_blank");
      if (!view) throw new Error("Print window unavailable");
      view.opener = null;
      const report = goalPlanHtml({
        title: notes.title || "Untitled analysis",
        notes: [`One ${scope === "dsd" ? "DSD" : "DHS"} People, Access and Culture`, "Working draft. This is not submitted, approved, or a completed official equity analysis."],
        sections: decisionNotesSections(notes),
      });
      view.document.open(); view.document.write(report); view.document.close();
      view.focus(); view.print();
      setMessage("Your complete analysis is ready to print."); setError(false);
    } catch {
      view?.close();
      setMessage("The print window could not open. Your notes remain here. Allow a print window and try again, or download your notes."); setError(true);
    }
  }

  const field = (key: DecisionField, rows = 3) => <div className={styles.field} key={key}>
    <label htmlFor={`${id}-${key}`}>{text(key === "participation" ? "participationLabelField" : `${key}Label`)}</label>
    <p id={`${id}-${key}-help`}>{text(`${key}Help`)}</p>
    {key === "reviewDate" ? <input id={`${id}-${key}`} type="date" value={notes.fields[key]} aria-describedby={`${id}-${key}-help ${id}-privacy`} onInput={event => changeField(key, event.currentTarget.value)} onChange={event => changeField(key, event.target.value)} />
      : <textarea id={`${id}-${key}`} rows={rows} maxLength={20000} autoComplete="off" value={notes.fields[key]} aria-describedby={`${id}-${key}-help ${id}-privacy`} onChange={event => changeField(key, event.target.value)} />}
  </div>;
  const taskKnown = (DECISION_TASKS as readonly string[]).includes(notes.task);
  const taskLinks = taskKnown ? decisionLinks(values, `${notes.task}Resources`) : [];
  const stageLinks = decisionLinks(values, stage === "participation" ? "participationStageResources" : `${stage}Resources`);
  const resources = [...new Map([...taskLinks, ...stageLinks].map(link => [link.href, link])).values()];
  const contextLinks = [...decisionLinks(values, "contextResources"), ...(scope === "dsd" ? decisionLinks(values, "dsdContextResources") : [])];

  return <section id="toolkit-draft" aria-labelledby={`${id}-title`} className={styles.workspace} data-equity-working-draft data-decision-workspace>
    <header className={styles.header}>
      <h2 id={`${id}-title`}>{text("title")}</h2>
      <p>{text("intro")}</p>
      <p id={`${id}-privacy`} className={styles.privacy}>{text("privacy")}</p>
      <p className={styles.noPrint}>{text("saveNote")}</p>
      <details className={`${styles.details} ${styles.noPrint}`}><summary>{text("aboutNotes")}</summary><p>{text("boundary")}</p><p>{text("retention")}</p></details>
    </header>
    <div className={styles.noPrint}>
      <div className={styles.setup}>
        <div className={styles.field}><label htmlFor={`${id}-name`}>{text("titleLabel")}</label><input ref={titleRef} id={`${id}-name`} maxLength={120} autoComplete="off" value={notes.title} aria-describedby={`${id}-privacy`} onChange={event => update(previous => ({ ...previous, title: event.target.value }))} /></div>
        <div className={styles.field}><label htmlFor={`${id}-task`}>{text("taskLabel")}</label><select id={`${id}-task`} value={taskKnown ? notes.task : ""} aria-describedby={`${id}-task-help`} onChange={event => update(previous => ({ ...previous, task: event.target.value }))}><option value="">{text("taskEmpty")}</option>{DECISION_TASKS.map(task => <option key={task} value={task}>{text(`${task}Label`)}</option>)}</select><p id={`${id}-task-help`}>{text("taskHelp")}</p></div>
      </div>
      {taskKnown && <p className={styles.taskPrompt}>{text(`${notes.task}${scope === "dsd" ? "DsdPrompt" : "Prompt"}`)}</p>}
      <nav className={styles.stages} aria-label="Stages for your working analysis">{DECISION_STAGES.map((item, index) => <button type="button" key={item} aria-current={index === step ? "step" : undefined} aria-controls={`${id}-stage`} onClick={() => go(index)}><span>{index + 1}</span>{text(`${item}Stage`)}</button>)}</nav>
      <section id={`${id}-stage`} className={styles.stage} aria-labelledby={`${id}-stage-title`}>
        <header className={styles.stageHeader}><h3 ref={headingRef} id={`${id}-stage-title`} tabIndex={-1}>{text(`${stage}Stage`)}</h3><p>{text(`${stage}Intro`)}</p></header>
        {stage === "decision" && <>{field("decision", 4)}{field("decisionOwner", 2)}{field("requirements")}</>}
        {stage === "people" && <>{field("people")}{field("evidence", 4)}{field("uncertainties")}</>}
        {stage === "options" && <>
          <div className={styles.options}>{notes.options.map((option, index) => <fieldset className={styles.option} key={option.id}>
            <legend>{text("optionTitleLabel")} {index + 1}</legend>
            <div className={styles.field}><label htmlFor={`${id}-${option.id}-title`}>{text("optionTitleLabel")}</label><textarea id={`${id}-${option.id}-title`} rows={2} maxLength={500} value={option.title} aria-describedby={`${id}-privacy`} onChange={event => changeOption(option.id, "title", event.target.value)} /></div>
            {optionFields.map(key => <div className={styles.field} key={key}><label htmlFor={`${id}-${option.id}-${key}`}>{text(`option${key[0].toUpperCase()}${key.slice(1)}Label`)}</label><textarea id={`${id}-${option.id}-${key}`} rows={2} maxLength={20000} value={option[key]} aria-describedby={`${id}-privacy`} onChange={event => changeOption(option.id, key, event.target.value)} /></div>)}
            {notes.options.length > 2 && <button className={styles.textButton} type="button" onClick={() => { if (Object.entries(option).some(([key, value]) => key !== "id" && value.trim()) && !window.confirm(text("confirmRemove"))) return; update(previous => ({ ...previous, options: previous.options.filter(item => item.id !== option.id) })); }}>{text("optionsRemove")}</button>}
          </fieldset>)}</div>
          <button type="button" className={styles.secondary} disabled={notes.options.length >= 8} onClick={() => update(previous => ({ ...previous, options: [...previous.options, { id: `option-${crypto.randomUUID()}`, title: "", benefits: "", burden: "", risks: "", evidence: "" }] }))}>{text("optionsAdd")}</button>
          {field("alternatives")}{field("proposal")}
        </>}
        {stage === "participation" && <>{field("participation", 4)}{field("feedback", 4)}{field("action")}{field("nextActionOwner", 2)}{field("support")}</>}
        {stage === "review" && <>
          {field("outcome")}{field("reviewDate")}{field("review", 4)}{field("observations", 4)}
          <details className={styles.details}><summary>{text("promptsTitle")}</summary><p>{text("promptsIntro")}</p><div className={styles.checks}>{decisionChecks.map(check => <div className={styles.check} key={check.key}>
            <label htmlFor={`${id}-check-${check.key}`}>{text(`${check.key}Check`)}</label>
            <select id={`${id}-check-${check.key}`} value={notes.checklist[check.key].status} onChange={event => update(previous => ({ ...previous, checklist: { ...previous.checklist, [check.key]: { ...previous.checklist[check.key], status: event.target.value as DecisionCheckStatus } } }))}>{Object.entries(statusKeys).map(([status, key]) => <option key={status} value={status}>{text(key)}</option>)}</select>
            <label className={styles.smallLabel} htmlFor={`${id}-check-${check.key}-note`}>{text("promptNote")}</label><textarea id={`${id}-check-${check.key}-note`} rows={2} maxLength={20000} value={notes.checklist[check.key].note} aria-describedby={`${id}-privacy`} onChange={event => update(previous => ({ ...previous, checklist: { ...previous.checklist, [check.key]: { ...previous.checklist[check.key], note: event.target.value } } }))} />
          </div>)}</div></details>
        </>}
        <nav className={styles.stageActions} aria-label="Continue your analysis"><button className={styles.secondary} type="button" disabled={step === 0} onClick={() => go(step - 1)}>{text("previousLabel")}</button><button className={styles.secondary} type="button" disabled={step === DECISION_STAGES.length - 1} onClick={() => go(step + 1)}>{text("nextLabel")}</button></nav>
      </section>
      <details className={styles.details}><summary>{text("resourcesTitle")}</summary><p>{text("resourcesHelp")}</p><p className={styles.smallLabel}>Tools open in a new tab so your notes stay here.</p><ul>{resources.map(link => <li key={link.href}><SourceLink href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</SourceLink></li>)}</ul><button type="button" className={styles.textButton} onClick={() => {
        update(previous => ({ ...previous, resources: [...new Map([...previous.resources, ...resources.map(link => ({ id: link.href, title: link.label, href: link.href }))].map(link => [link.href, link])).values()].slice(0, 50) }));
        setMessage(text("resourcesKept"));
      }}>{text("resourcesKeep")}</button>
      {notes.resources.length > 0 && <ul className={styles.kept}>{notes.resources.map(resource => <li key={resource.id}><SourceLink href={resource.href} target="_blank" rel="noopener noreferrer">{resource.title}</SourceLink><button type="button" className={styles.textButton} aria-label={`Remove saved link: ${resource.title}`} onClick={() => update(previous => ({ ...previous, resources: previous.resources.filter(item => item.id !== resource.id) }))}>Remove</button></li>)}</ul>}
      </details>
      <details className={styles.details}><summary>{text("contextTitle")}</summary><p>{text(scope === "dsd" ? "contextDsd" : "contextDhs")}</p><ul>{contextLinks.map(link => <li key={link.href}><SourceLink href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</SourceLink></li>)}</ul></details>
      <div className={styles.saveArea}>
        {dirty && <p className={styles.dirty}>{text("changed")}</p>}
        <div className={styles.actions}><button className={styles.primary} type="button" disabled={!ready || loadFailed} onClick={save}>{text("saveLabel")}</button><button className={styles.secondary} type="button" onClick={download}>{text("downloadLabel")}</button><button className={styles.textButton} type="button" onClick={printNotes}>{text("printLabel")}</button><button className={styles.textButton} type="button" onClick={startNew}>{text("newLabel")}</button><SourceLink href="/my-work" target="_blank" rel="noopener noreferrer">{text("myWorkLabel")}</SourceLink></div>
        <p className={error ? styles.error : styles.status} role="status" aria-live="polite">{message}</p>
      </div>
    </div>
    <div className={styles.printOnly}><pre>{decisionNotesText(notes, scope === "dsd" ? "dsd" : "dhs")}</pre></div>
  </section>;
}
