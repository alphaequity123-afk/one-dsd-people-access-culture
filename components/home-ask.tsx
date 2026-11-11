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
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();

  function show() {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }
  function close() {
    setOpen(false);
    opener.current?.focus();
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim().slice(0, 4000);
    if (!text) { setError("Type a question first."); return; }
    // The panel's conversation picks the question up and asks it once.
    writeStored("session", BROWSER_STORAGE_KEYS.askHomeQuestion, text);
    setQuestion("");
    show();
  }
  // While the panel is open the page behind it does not scroll, and the panel takes the keyboard.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("textarea")?.focus();
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
        <button type="button" className="ask-icon" title="Talk with Ask" onClick={show}><WaveIcon /><span className="sr-only">Talk with Ask</span></button>
      </AskBox>
      {error ? <p id={`${id}-error`} role="alert" className="ask-box-small error">{error}</p> : null}
      <p id={`${id}-note`} className="ask-box-small">Please leave out names, case details and anything private. Your question, and your recording when you speak, go to outside services to be answered. No audio is saved on this site.</p>
    </form>
    {open ? <div className="ask-panel-layer" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
      <div className="ask-panel-shade" onClick={close} />
      <div ref={panel} className="ask-panel" role="dialog" aria-modal="true" aria-labelledby={`${id}-panel-title`}>
        <div className="ask-panel-head">
          <h2 id={`${id}-panel-title`} className="ask-panel-title">Ask</h2>
          <button type="button" className="ask-panel-close" onClick={close}>Close</button>
        </div>
        <div className="ask-panel-body">
          <AskClient compact researchAvailable={researchAvailable} intakeEnabled={false} copy={copy} />
        </div>
      </div>
    </div> : null}
  </>;
}
