"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { GeffenReadAloud } from "@/components/geffen-read-aloud";
import styles from "./water-learning-assistant.module.css";

export type StudyMode = "explain" | "compare" | "practice" | "reflect";
export type StudyPrompt = { value: StudyMode; label: string; prompt: string };
type Reading = { id: string; title: string; href: string };
type StudyAnswer = {
  paragraphs: { text: string; sourceIds: string[] }[];
  sources: Reading[];
  grounded: boolean;
};

type LearningAssistantProps = {
  panelId: string;
  endpoint: string;
  scope?: { unit?: string; resourcePath?: string };
  introduction: string;
  privacyNotice: string;
  workingMessage: string;
  modes: StudyPrompt[];
  citationAllowed: (href: string) => boolean;
  sourcesHeading?: string;
  sourceLabel?: string;
  maxQuestionLength?: number;
};

function parseAnswer(value: unknown): StudyAnswer {
  const answer = value as StudyAnswer;
  if (!answer || typeof answer.grounded !== "boolean" || !Array.isArray(answer.paragraphs) || !Array.isArray(answer.sources)
    || !answer.paragraphs.every(p => p && typeof p.text === "string" && Array.isArray(p.sourceIds) && p.sourceIds.every(id => typeof id === "string"))
    || !answer.sources.every(source => source && typeof source.id === "string" && typeof source.title === "string" && typeof source.href === "string")) {
    throw new Error("The learning assistant returned an incomplete answer. Please try again.");
  }
  return answer;
}

export function LearningAssistant({
  panelId, endpoint, scope, introduction, privacyNotice, workingMessage, modes, citationAllowed,
  sourcesHeading = "Readings cited", sourceLabel = "Reading", maxQuestionLength = 600,
}: LearningAssistantProps) {
  const id = useId();
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<StudyMode>("explain");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<StudyAnswer | null>(null);
  const request = useRef<AbortController | null>(null);
  const questionBox = useRef<HTMLTextAreaElement>(null);
  const answerHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (result) answerHeading.current?.focus();
  }, [result]);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setResult(null);
    setMessage(workingMessage);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text, mode, ...scope }),
        signal: controller.signal,
      });
      const answer = await response.json();
      if (!response.ok) throw new Error(answer.error || "The learning assistant is unavailable right now.");
      if (!controller.signal.aborted) {
        setMessage("");
        setResult(parseAnswer(answer));
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setMessage(error instanceof Error && !(error instanceof SyntaxError) && !(error instanceof TypeError)
          ? error.message
          : "The learning assistant could not finish. Please try again.");
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  function stop() {
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setMessage("Request canceled.");
    questionBox.current?.focus();
  }

  const readings = new Map(result?.sources
    .filter(reading => citationAllowed(reading.href))
    .map((reading, index) => [reading.id, { ...reading, number: index + 1 }]));

  return <aside id={panelId} className={styles.panel} aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>Ask about the readings</h2>
    <p>{introduction}</p>
    <form onSubmit={ask}>
      <fieldset disabled={busy} className={styles.controls}>
        <legend>Start with a question</legend>
        <div className={styles.actions}>
          {modes.map(({ value, label, prompt }) => <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setQuestion(prompt);
              questionBox.current?.focus();
            }}
          >{label}</button>)}
        </div>
        <label htmlFor={`${id}-question`}>Your question</label>
        <textarea
          id={`${id}-question`}
          ref={questionBox}
          rows={3}
          maxLength={maxQuestionLength}
          required
          value={question}
          onChange={event => setQuestion(event.target.value)}
          aria-describedby={`${id}-privacy`}
        />
        <p id={`${id}-privacy`} className={styles.privacy}>{privacyNotice}</p>
      </fieldset>
      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={busy || !question.trim()}>Ask</button>
        {busy && <button type="button" onClick={stop}>Cancel</button>}
      </div>
    </form>
    <p className={styles.status} role="status">{message}</p>
    {result && <div className={styles.answer}>
      <h3 ref={answerHeading} tabIndex={-1}>Answer</h3>
      {result.paragraphs.map((paragraph, index) => <p key={index}>
        {paragraph.text}
        {Array.from(new Set(paragraph.sourceIds)).map(sourceId => {
          const reading = readings.get(sourceId);
          return reading && <a key={sourceId} className={styles.citation} href={reading.href} aria-label={`${sourceLabel} ${reading.number}: ${reading.title}`}>[{reading.number}]</a>;
        })}
      </p>)}
      {result.grounded && readings.size > 0 && <>
        <GeffenReadAloud text={result.paragraphs.map(paragraph => paragraph.text).join("\n\n")} label="Answer" />
        <h4>{sourcesHeading}</h4>
        <ol>
          {Array.from(readings.values()).map(reading => <li key={reading.id}><a href={reading.href}>{reading.title}</a></li>)}
        </ol>
      </>}
    </div>}
  </aside>;
}
