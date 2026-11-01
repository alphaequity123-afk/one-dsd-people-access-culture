"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { LinkRun, PageEditEngine, TextRun } from "@/lib/content/page-edit-dom";
import { writeRun } from "@/lib/content/page-edit-dom";
import { cleanReplacementText, comparableText, linkAddressIsAllowed, PAGE_EDIT_LIMITS } from "@/lib/content/page-edit-keys";

/** The owner's controls for editing any page in place. Loaded only for a signed-in owner. */
export type PageEditEntry = {
  key: string;
  scope: "page" | "site";
  kind: "text" | "link";
  original: string;
  value: string;
  updatedAt: string;
};

export type PageEditsResponse = {
  ok: true;
  canEdit: boolean;
  page: Record<string, string>;
  site: Record<string, string>;
  entries?: PageEditEntry[];
  degraded?: boolean;
};

export type PageEditControlsProps = {
  path: string;
  engine: PageEditEngine;
  data: PageEditsResponse;
  onChange: (next: PageEditsResponse) => void;
};

type Selection = {
  run: TextRun | null;
  link: LinkRun | null;
  returnFocus: HTMLElement | null;
};

const TARGET = "data-pac-page-edit-target";
const ACTIVE = "data-pac-page-edit-active";
const FOCUSABLE = "a[href],button,summary,input,select,textarea,[tabindex]";

const NAVY = "#003865";
const shell: CSSProperties = { position: "fixed", left: 16, bottom: 16, zIndex: 1001, width: "min(420px, calc(100vw - 32px))", maxHeight: "calc(100vh - 32px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, fontSize: 15, lineHeight: 1.45, color: "#111" };
const card: CSSProperties = { background: "#fff", color: "#111", border: `2px solid ${NAVY}`, borderRadius: 10, padding: "12px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.25)", maxHeight: "60vh", overflowY: "auto" };
const primary: CSSProperties = { background: NAVY, color: "#fff", border: `2px solid ${NAVY}`, borderRadius: 8, padding: "8px 14px", minHeight: 44, fontWeight: 600, cursor: "pointer", fontSize: 15 };
const secondary: CSSProperties = { ...primary, background: "#fff", color: NAVY };
const field: CSSProperties = { display: "block", width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #555", borderRadius: 6, fontSize: 15, fontFamily: "inherit", color: "#111", background: "#fff" };
const row: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };

const PAGE_STYLE = `
  [${TARGET}] { outline: 1px dashed #1f6f8b; outline-offset: 1px; cursor: text; }
  [${TARGET}]:hover { outline: 2px dashed #123f60; }
  [${TARGET}]:focus-visible { outline: 3px solid #123f60; outline-offset: 2px; }
  [${ACTIVE}] { outline: 3px solid #b42318 !important; outline-offset: 2px; }
  [data-pac-editor] { display: none !important; }
  [data-pac-page-edit-ui] button:focus-visible, [data-pac-page-edit-ui] textarea:focus-visible, [data-pac-page-edit-ui] input:focus-visible { outline: 3px solid #b42318; outline-offset: 2px; }
`;

function shorten(text: string, limit = 90): string {
  const flat = comparableText(text);
  return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat;
}

function isVisible(element: Element): boolean {
  return element.getClientRects().length > 0;
}

async function send(body: Record<string, unknown>): Promise<PageEditsResponse> {
  let response: Response;
  try {
    response = await fetch("/api/page-edits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("The change could not be saved. Check your connection and try again.");
  }
  const parsed: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = parsed && typeof parsed === "object" ? (parsed as { error?: unknown }).error : null;
    throw new Error(typeof message === "string" && message ? message : `The change could not be saved (error ${response.status}).`);
  }
  return parsed as PageEditsResponse;
}

/** The wording under the pointer, using the caret position where the browser offers it. */
function runFromPoint(runs: TextRun[], target: Element, x: number, y: number): TextRun | null {
  const pointDocument = target.ownerDocument as Document & {
    caretPositionFromPoint?: (px: number, py: number) => { offsetNode: Node } | null;
    caretRangeFromPoint?: (px: number, py: number) => Range | null;
  };
  const node = pointDocument.caretPositionFromPoint?.(x, y)?.offsetNode
    ?? pointDocument.caretRangeFromPoint?.(x, y)?.startContainer
    ?? null;
  if (node) {
    const exact = runs.find((run) => run.nodes.includes(node as Text));
    if (exact && target.contains(exact.parent)) return exact;
  }
  return runs.find((run) => run.parent === target) ?? runs.find((run) => target.contains(run.parent)) ?? null;
}

export function PageEditControls({ path, engine, data, onChange }: PageEditControlsProps) {
  const [editing, setEditing] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [textValue, setTextValue] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [everyPage, setEveryPage] = useState(false);
  const [problem, setProblem] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [present, setPresent] = useState<Set<string>>(() => engine.present());
  const textBox = useRef<HTMLTextAreaElement | null>(null);
  const linkBox = useRef<HTMLInputElement | null>(null);
  const toggle = useRef<HTMLButtonElement | null>(null);
  const tagged = useRef<Array<{ element: HTMLElement; addedTabIndex: boolean }>>([]);

  const entries = data.entries ?? [];
  const degraded = data.degraded === true;

  const clearTargets = useCallback(() => {
    for (const { element, addedTabIndex } of tagged.current) {
      element.removeAttribute(TARGET);
      if (addedTabIndex) element.removeAttribute("tabindex");
    }
    tagged.current = [];
  }, []);

  /** Mark everything editable and reachable by keyboard. Only attributes change; React ignores them. */
  const markTargets = useCallback(() => {
    clearTargets();
    const elements = new Set<HTMLElement>();
    for (const run of engine.textRuns()) elements.add(run.parent);
    for (const link of engine.links()) elements.add(link.element);
    for (const element of elements) {
      if (element.tagName === "BODY" || element.tagName === "MAIN") continue;
      element.setAttribute(TARGET, "true");
      const addedTabIndex = !element.matches(FOCUSABLE);
      if (addedTabIndex) element.setAttribute("tabindex", "0");
      tagged.current.push({ element, addedTabIndex });
    }
  }, [engine, clearTargets]);

  useEffect(() => engine.subscribe(() => {
    setPresent(engine.present());
    if (editing && !selection) markTargets();
  }), [engine, editing, selection, markTargets]);

  const stopEditing = useCallback(() => {
    document.querySelectorAll(`[${ACTIVE}]`).forEach((element) => element.removeAttribute(ACTIVE));
    // In this order: resuming while still in edit mode puts back any unsaved preview.
    engine.resume();
    engine.setEditing(false);
    // Last, because each engine step above tells the listener to mark targets again.
    clearTargets();
    setEditing(false);
    setSelection(null);
    setProblem("");
  }, [engine, clearTargets]);

  // Leaving the page (this component is keyed by path) always removes every mark it added.
  useEffect(() => () => {
    document.querySelectorAll(`[${ACTIVE}]`).forEach((element) => element.removeAttribute(ACTIVE));
    engine.resume();
    engine.setEditing(false);
    clearTargets();
  }, [engine, clearTargets]);

  const open = useCallback((run: TextRun | null, link: LinkRun | null, returnFocus: HTMLElement | null) => {
    if (!run && !link) return;
    engine.pause();
    const current = run ? engine.edits().page[run.key] ?? (run.inMain ? undefined : engine.edits().site[run.siteKey]) : undefined;
    const currentLink = link ? engine.edits().page[link.key] ?? (link.inMain ? undefined : engine.edits().site[link.siteKey]) : undefined;
    setSelection({ run, link, returnFocus });
    setTextValue(run ? current ?? comparableText(run.original) : "");
    setLinkValue(link ? currentLink ?? link.original : "");
    // Header and footer wording repeats on every page, so that is the starting choice for it.
    const inChrome = run ? !run.inMain : link ? !link.inMain : false;
    const savedOnPageOnly = (run && Object.hasOwn(engine.edits().page, run.key)) || (link && Object.hasOwn(engine.edits().page, link.key));
    setEveryPage(inChrome && !savedOnPageOnly);
    setProblem("");
    setStatus("");
    (run?.parent ?? link?.element)?.setAttribute(ACTIVE, "true");
  }, [engine]);

  // Move focus into the editor when it opens or moves to another piece of wording.
  useEffect(() => {
    if (!selection) return;
    (selection.run ? textBox.current : linkBox.current)?.focus();
    // Bring the wording clear of this panel only if the panel would cover it.
    const chosen = selection.run?.parent ?? selection.link?.element;
    if (chosen && chosen.getBoundingClientRect().bottom > window.innerHeight - 360) chosen.scrollIntoView?.({ block: "center" });
  }, [selection]);

  const closeSelection = useCallback((message?: string) => {
    const closing = selection;
    if (closing) (closing.run?.parent ?? closing.link?.element)?.removeAttribute(ACTIVE);
    setSelection(null);
    setProblem("");
    if (message) setStatus(message);
    // Resuming puts back saved wording in place of any unsaved preview.
    engine.resume();
    const focusTarget = closing?.returnFocus;
    if (focusTarget?.isConnected) focusTarget.focus();
  }, [engine, selection]);

  // While editing, clicks choose wording instead of operating the page.
  useEffect(() => {
    if (!editing) return;
    const inControls = (element: Element | null) => Boolean(element?.closest("[data-pac-page-edit-ui]"));
    const choose = (element: Element, x: number | null, y: number | null) => {
      const runs = engine.textRuns();
      const anchor = element.closest<HTMLAnchorElement>("a[href]");
      const run = x !== null && y !== null
        ? runFromPoint(runs, element, x, y)
        : runs.find((item) => item.parent === element) ?? runs.find((item) => element.contains(item.parent)) ?? null;
      const link = anchor ? engine.links().find((item) => item.element === anchor) ?? null : null;
      if (!run && !link) {
        if (element.closest("img, picture, svg, video, audio")) setStatus("Pictures and media cannot be changed here.");
        else if (element.closest("input, textarea, select")) setStatus("Form fields cannot be changed here.");
        return;
      }
      if (selection) (selection.run?.parent ?? selection.link?.element)?.removeAttribute(ACTIVE);
      // Moving on from unsaved wording puts the saved wording back.
      engine.resume();
      open(run, link, element.closest<HTMLElement>(`[${TARGET}]`) ?? null);
    };
    const onClick = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      if (!element || inControls(element)) return;
      event.preventDefault();
      event.stopPropagation();
      if (!busy) choose(element, event.clientX, event.clientY);
    };
    const onKey = (event: KeyboardEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      if (inControls(element)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        stopEditing();
        setStatus("Editing is off.");
        toggle.current?.focus();
        return;
      }
      if ((event.key === "Enter" || event.key === " ") && element?.hasAttribute(TARGET)) {
        event.preventDefault();
        event.stopPropagation();
        if (!busy) choose(element, null, null);
      }
    };
    const stop = (event: Event) => {
      if (event.target instanceof Element && inControls(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    // On window, in the capture phase: this runs before React and next/link see the event.
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("submit", stop, true);
    window.addEventListener("auxclick", stop, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("submit", stop, true);
      window.removeEventListener("auxclick", stop, true);
    };
  }, [editing, engine, open, busy, selection, stopEditing]);

  const startEditing = () => {
    if (document.querySelector("[data-pac-editable]")) {
      setStatus("Finish with the wording and images editor first.");
      return;
    }
    engine.setEditing(true);
    setEditing(true);
    setListOpen(false);
    markTargets();
    setStatus("Editing is on. Click any text, or press Tab to reach it and Enter to choose it. Links and buttons will not operate until you turn editing off. Press Escape to finish.");
  };

  const step = (direction: 1 | -1) => {
    const current = selection?.run;
    engine.resume();
    if (selection) (selection.run?.parent ?? selection.link?.element)?.removeAttribute(ACTIVE);
    const runs = engine.textRuns().filter((run) => isVisible(run.parent));
    if (!runs.length) return;
    const position = current ? runs.findIndex((run) => run.nodes[0] === current.nodes[0]) : -1;
    const next = runs[(position + direction + runs.length) % runs.length];
    const anchor = next.parent.closest<HTMLAnchorElement>("a[href]");
    const link = anchor ? engine.links().find((item) => item.element === anchor) ?? null : null;
    open(next, link, selection?.returnFocus ?? null);
  };

  const preview = (value: string) => {
    setTextValue(value);
    if (selection?.run && value.trim()) writeRun(selection.run, value, engine.memory);
  };

  const save = async () => {
    if (!selection || busy) return;
    const { run, link } = selection;
    const scope = everyPage ? "site" : "page";
    let latest: PageEditsResponse | null = null;
    setBusy(true);
    setProblem("");
    try {
      if (run) {
        const cleaned = cleanReplacementText(textValue);
        if (!cleaned) throw new Error("Text cannot be empty. Use Undo to bring back the original.");
        const showing = engine.edits().page[run.key] ?? (run.inMain ? undefined : engine.edits().site[run.siteKey]) ?? run.original;
        if (comparableText(cleaned) !== comparableText(showing) || (everyPage && !Object.hasOwn(engine.edits().site, run.siteKey))) {
          latest = await send({ action: "save", path, kind: "text", original: comparableText(run.original), occurrence: run.occurrence, value: cleaned, scope });
        }
      }
      if (link) {
        const address = linkValue.trim();
        if (!linkAddressIsAllowed(address)) throw new Error("Use a local path starting with /, an anchor starting with #, or an address starting with https://.");
        const showing = engine.edits().page[link.key] ?? (link.inMain ? undefined : engine.edits().site[link.siteKey]) ?? link.original;
        if (address !== showing) {
          latest = await send({ action: "save", path, kind: "link", original: link.original.trim(), occurrence: link.occurrence, value: address, scope });
        }
      }
      if (latest) onChange(latest);
      closeSelection(latest ? (everyPage ? "Saved. It now shows on every page for everyone." : "Saved. It now shows on this page for everyone.") : "Nothing changed.");
    } catch (error) {
      if (latest) onChange(latest);
      setProblem(error instanceof Error ? error.message : "The change could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const undo = async (key: string, scope: "page" | "site", after?: () => void) => {
    if (busy) return;
    setBusy(true);
    setProblem("");
    try {
      onChange(await send({ action: "undo", path, key, scope }));
      setStatus("Undone. The original is back for everyone.");
      after?.();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "The change could not be undone.");
    } finally {
      setBusy(false);
    }
  };

  /** Every saved edit behind the current selection, page-only edits first. */
  const savedForSelection = (): Array<{ key: string; scope: "page" | "site" }> => {
    if (!selection) return [];
    const edits = engine.edits();
    const found: Array<{ key: string; scope: "page" | "site" }> = [];
    for (const item of [selection.run, selection.link]) {
      if (!item) continue;
      if (Object.hasOwn(edits.page, item.key)) found.push({ key: item.key, scope: "page" });
      else if (!item.inMain && Object.hasOwn(edits.site, item.siteKey)) found.push({ key: item.siteKey, scope: "site" });
    }
    return found;
  };

  const undoSelection = async () => {
    const saved = savedForSelection();
    for (const [index, item] of saved.entries()) {
      await undo(item.key, item.scope, index === saved.length - 1 ? () => closeSelection("Undone. The original is back for everyone.") : undefined);
    }
  };

  const selectionTarget = selection?.run ?? selection?.link ?? null;
  const showScopeChoice = Boolean(selectionTarget && !selectionTarget.inMain);

  return (
    <div data-pac-page-edit-ui="true" role="region" aria-label="Page editing" style={shell}>
      {editing ? <style>{PAGE_STYLE}</style> : null}

      {degraded ? (
        <p role="alert" style={{ ...card, margin: 0, borderColor: "#b42318" }}>
          The saved page edits could not be read, so this page shows its original wording and new edits cannot be saved. Nothing has been lost.
        </p>
      ) : null}

      {problem ? <p role="alert" style={{ ...card, margin: 0, borderColor: "#b42318" }}>{problem}</p> : null}

      <p role="status" aria-live="polite" style={status ? { ...card, margin: 0, background: NAVY, color: "#fff" } : { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", margin: 0 }}>
        {status}
      </p>

      {selection ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Edit the selected text"
          style={card}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              closeSelection("Change discarded.");
            }
          }}
        >
          {selection.run ? (
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Text
              <textarea
                ref={textBox}
                value={textValue}
                maxLength={PAGE_EDIT_LIMITS.text}
                rows={Math.min(8, Math.max(2, Math.ceil(textValue.length / 45)))}
                spellCheck
                onChange={(event) => preview(event.target.value)}
                style={{ ...field, marginTop: 4, fontWeight: 400 }}
              />
            </label>
          ) : null}
          {selection.link ? (
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Link address
              <input
                ref={linkBox}
                type="text"
                inputMode="url"
                value={linkValue}
                maxLength={PAGE_EDIT_LIMITS.href}
                spellCheck={false}
                aria-describedby="pac-page-edit-link-help"
                onChange={(event) => setLinkValue(event.target.value)}
                style={{ ...field, marginTop: 4, fontWeight: 400 }}
              />
              <span id="pac-page-edit-link-help" style={{ display: "block", marginTop: 4, fontWeight: 400, fontSize: 14 }}>
                A local path (/library), an anchor (#section), or an address starting with https://.
              </span>
            </label>
          ) : null}
          {showScopeChoice ? (
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
              <input type="checkbox" checked={everyPage} onChange={(event) => setEveryPage(event.target.checked)} style={{ width: 20, height: 20, flex: "none", marginTop: 2 }} />
              <span>Change this on every page. It is part of the header or footer, which every page shows.</span>
            </label>
          ) : null}
          <div style={row}>
            <button type="button" style={primary} disabled={busy || degraded} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button>
            <button type="button" style={secondary} disabled={busy} onClick={() => closeSelection("Change discarded.")}>Cancel</button>
            {savedForSelection().length ? (
              <button type="button" style={secondary} disabled={busy || degraded} onClick={() => void undoSelection()}>Undo: restore original</button>
            ) : null}
          </div>
          <div style={{ ...row, marginTop: 8 }}>
            <button type="button" style={secondary} disabled={busy} onClick={() => step(-1)}>Previous text</button>
            <button type="button" style={secondary} disabled={busy} onClick={() => step(1)}>Next text</button>
          </div>
        </div>
      ) : null}

      {listOpen ? (
        <div style={card}>
          <h2 style={{ margin: "0 0 8px", fontSize: 17, color: "#111" }}>Edits on this page</h2>
          {entries.length === 0 ? <p style={{ margin: 0 }}>There are no saved edits on this page.</p> : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {entries.map((entry) => {
                const missing = !present.has(entry.key);
                return (
                  <li key={`${entry.scope}:${entry.key}`} style={{ borderTop: "1px solid #ccc", paddingTop: 8 }}>
                    <p style={{ margin: "0 0 2px" }}><strong>{entry.kind === "link" ? "Link address" : "Text"}{entry.scope === "site" ? ", every page" : ""}</strong></p>
                    <p style={{ margin: "0 0 2px", overflowWrap: "anywhere" }}>Was: {shorten(entry.original)}</p>
                    <p style={{ margin: "0 0 4px", overflowWrap: "anywhere" }}>Now: {shorten(entry.value)}</p>
                    {missing ? (
                      <p style={{ margin: "0 0 4px", color: "#7a271a" }}>
                        {entry.scope === "site"
                          ? "The original is not in the header or footer of this page. It may still apply on other pages."
                          : "The original is not on this page right now, so this edit is not showing. The wording may have changed, or it may appear only after opening a section."}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      style={secondary}
                      disabled={busy || degraded}
                      aria-label={`Undo edit: ${shorten(entry.value, 60)}`}
                      onClick={() => void undo(entry.key, entry.scope)}
                    >
                      Undo
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <div style={row}>
        <button
          ref={toggle}
          type="button"
          style={primary}
          aria-pressed={editing}
          disabled={busy || degraded}
          onClick={() => {
            if (!editing) {
              startEditing();
              return;
            }
            if (selection) closeSelection();
            stopEditing();
            setStatus("Editing is off.");
          }}
        >
          {editing ? "Done editing" : "Edit this page"}
        </button>
        <button type="button" style={secondary} aria-expanded={listOpen} onClick={() => { setPresent(engine.present()); setListOpen((value) => !value); }}>
          Edits on this page ({entries.length})
        </button>
      </div>
    </div>
  );
}
