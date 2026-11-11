"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SendIcon } from "@/components/ask-icons";
import "@/components/ask-box.css";

/**
 * The window a question is typed into: the text, then one row of small controls ending in Send.
 * It must sit inside a form. Enter sends and Shift+Enter starts a new line; on a touch keyboard
 * Enter always starts a new line and the Send control sends.
 */
export function AskBox({ id, value, onChange, placeholder, sendLabel, busy = false, labelledBy, describedBy, invalid = false, children }: {
  id: string; value: string; onChange: (value: string) => void; placeholder?: string; sendLabel: string;
  busy?: boolean; labelledBy?: string; describedBy?: string; invalid?: boolean;
  /** Controls shown before Send, such as the voice controls. */
  children?: ReactNode;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  // Grow with the text up to the height the style sheet allows.
  useEffect(() => {
    const element = field.current;
    if (!element) return;
    element.style.height = "auto";
    if (element.scrollHeight) element.style.height = `${element.scrollHeight}px`;
  }, [value]);
  return <div className="ask-box">
    <textarea
      ref={field}
      id={id}
      className="ask-box-input"
      value={value}
      onChange={event => onChange(event.target.value)}
      onKeyDown={event => {
        if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
        if (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) return;
        event.preventDefault();
        if (!busy) event.currentTarget.form?.requestSubmit();
      }}
      rows={2}
      maxLength={4000}
      placeholder={placeholder}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid}
    />
    <div className="ask-box-bar">
      {children}
      <button type="submit" className="ask-icon ask-icon--send" disabled={busy} title={sendLabel}><SendIcon /><span className="sr-only">{sendLabel}</span></button>
    </div>
  </div>;
}
