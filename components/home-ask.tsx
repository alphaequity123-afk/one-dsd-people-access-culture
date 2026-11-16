"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AskBox } from "@/components/ask-box";
import { AskClient } from "@/components/ask-client";
import { AskVoice } from "@/components/ask-voice";
import { WaveIcon } from "@/components/ask-icons";
import { writeStored } from "@/lib/client/storage";
import { BROWSER_STORAGE_KEYS } from "@/lib/client/storage-keys";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";

/**
 * The Ask window on the landing page. A question is typed or dictated here and answered in a side
 * panel that holds the whole Ask conversation: follow-up questions, dictation (speech to text),
 * Talk with Ask (speech to speech) and read aloud (text to speech). The landing page stays in
 * place behind the panel. The question travels in this browser's session storage, never in the page address.
 */
export function HomeAsk({ copy, researchAvailable }: { copy: EditableSurfaceValues; researchAvailable: boolean }) {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();

  function show(trigger: HTMLElement | null) {
    opener.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setOpen(true);
  }
  function close() {
    panel.current?.close();
  }
  function restoreFocus() {
    setOpen(false);
    opener.current?.focus({ preventScroll: true });
    opener.current = null;
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim().slice(0, 4000);
    if (!text) { setError("Type a question first."); return; }
    // The panel's conversation picks the question up and asks it once.
    writeStored("session", BROWSER_STORAGE_KEYS.askHomeQuestion, text);
    setQuestion("");
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    show(submitter instanceof HTMLElement ? submitter : null);
  }
  useEffect(() => {
    const dialog = panel.current;
    if (!open || !dialog) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    dialog.querySelector("textarea")?.focus();
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return <>
    <form className="home-ask" onSubmit={submit} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="home-ask-title">Ask a question</h2>
      <AskBox
        id={`${id}-question`}
        labelledBy={`${id}-title`}
        value={question}
        onChange={value => { setQuestion(value); setError(""); }}
        placeholder="Ask a question or explore an idea…"
        sendLabel="Ask"
        describedBy={`${id}-note${error ? ` ${id}-error` : ""}`}
        invalid={Boolean(error)}
      >
        <AskVoice mode="dictate" busy={false} onDictation={setQuestion} onQuestion={async () => undefined} />
        <button type="button" className="ask-icon" title="Talk with Ask" aria-haspopup="dialog" onClick={event => show(event.currentTarget)}><WaveIcon /><span className="sr-only">Talk with Ask</span></button>
      </AskBox>
      {error ? <p id={`${id}-error`} role="alert" className="ask-box-small error">{error}</p> : null}
      <p id={`${id}-note`} className="ask-box-small">Please leave out names, case details and anything private.</p>
    </form>
    {open ? <dialog ref={panel} className="ask-panel-layer" aria-labelledby={`${id}-panel-title`} onClose={restoreFocus}>
      <div className="ask-panel-shade" onClick={close} aria-hidden="true" />
      <div className="ask-panel">
        <div className="ask-panel-head">
          <h2 id={`${id}-panel-title`} className="ask-panel-title">Ask</h2>
          <button type="button" className="ask-panel-close" onClick={close}>Close</button>
        </div>
        <div className="ask-panel-body">
          <AskClient compact researchAvailable={researchAvailable} intakeEnabled={false} copy={copy} />
        </div>
      </div>
    </dialog> : null}
  </>;
}
