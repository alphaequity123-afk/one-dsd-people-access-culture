"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { GeffenReadAloud } from "@/components/geffen-read-aloud";
import styles from "./water-learning-assistant.module.css";

type StudyMode = "explain" | "compare" | "practice" | "reflect";
type Reading = { id: string; title: string; href: string };
type StudyAnswer = {
  paragraphs: { text: string; sourceIds: string[] }[];
  sources: Reading[];
  grounded: boolean;
};

const modes: { value: StudyMode; label: string; prompt: string; modulePrompt: string }[] = [
  {
    value: "explain",
    label: "Explain an idea",
    prompt: "What does the course mean by the water we swim in? Show me a workplace example.",
    modulePrompt: "Explain a main idea in this lesson and show how it could come up at work.",
  },
  {
    value: "compare",
    label: "Compare readings",
    prompt: "How do the essay and the American and Minnesota Culture briefs help explain differences in communication at work?",
    modulePrompt: "Compare what the essay and culture briefs tell us about this lesson's topic. Where do they emphasize different things?",
  },
  {
    value: "practice",
    label: "Try a scenario",
    prompt: "Give me a fictional workplace scenario where I can spot an assumption and improve how a service works. Ask me what I would do.",
    modulePrompt: "Give me a fictional workplace scenario to practice this lesson. Ask what I would do and let me think through the choice.",
  },
  {
    value: "reflect",
    label: "Reflect on a practice",
    prompt: "Help me examine an everyday team practice for barriers. Give me questions I can use to test one change.",
    modulePrompt: "What assumption could I look for in my work after this lesson, and how could I check it?",
  },
];

export function WaterLearningAssistant({ unit }: { unit?: string }) {
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
    setMessage("Gemini is working with the readings…");

    try {
      const response = await fetch("/api/learn/water-we-swim-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text, mode, unit }),
        signal: controller.signal,
      });
      const answer = await response.json();
      if (!response.ok) throw new Error(answer.error || "The learning assistant is unavailable right now.");
      if (!controller.signal.aborted) {
        setMessage("");
        setResult(answer as StudyAnswer);
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
    .filter(reading => /^\/(learn\/water-we-swim-in(?:[\/#]|$)|minnesota-communities\/(american|minnesota)(?:[\/#?]|$))/.test(reading.href))
    .map((reading, index) => [reading.id, { ...reading, number: index + 1 }]));

  return <aside id="water-learning-assistant" className={styles.panel} aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>Gemini learning assistant</h2>
    <p>Explore The Water We Swim In and the American and Minnesota Culture briefs. Choose a starting question or ask your own.</p>
    <form onSubmit={ask}>
      <fieldset disabled={busy} className={styles.controls}>
        <legend>Start with a question</legend>
        <div className={styles.actions}>
          {modes.map(({ value, label, prompt, modulePrompt }) => <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setQuestion(unit ? modulePrompt : prompt);
              questionBox.current?.focus();
            }}
          >{label}</button>)}
        </div>
        <label htmlFor={`${id}-question`}>Your question</label>
        <textarea
          id={`${id}-question`}
          ref={questionBox}
          rows={3}
          maxLength={600}
          required
          value={question}
          onChange={event => setQuestion(event.target.value)}
          aria-describedby={`${id}-privacy`}
        />
        <p id={`${id}-privacy`} className={styles.privacy}>Your question is sent to Google Gemini along with relevant course passages. Use fictional or anonymized examples and leave out names, case details, and other private information.</p>
      </fieldset>
      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={busy || !question.trim()}>Ask Gemini</button>
        {busy && <button type="button" onClick={stop}>Cancel</button>}
      </div>
    </form>
    <p className={styles.status} role="status">{message}</p>
    {result && <div className={styles.answer}>
      <h3 ref={answerHeading} tabIndex={-1}>Gemini response</h3>
      {result.paragraphs.map((paragraph, index) => <p key={index}>
        {paragraph.text}
        {Array.from(new Set(paragraph.sourceIds)).map(sourceId => {
          const reading = readings.get(sourceId);
          return reading && <a key={sourceId} className={styles.citation} href={reading.href} aria-label={`Reading ${reading.number}: ${reading.title}`}>[{reading.number}]</a>;
        })}
      </p>)}
      {result.grounded && readings.size > 0 && <>
        <GeffenReadAloud text={result.paragraphs.map(paragraph => paragraph.text).join("\n\n")} label="Gemini response" />
        <h4>Readings cited</h4>
        <ol>
          {Array.from(readings.values()).map(reading => <li key={reading.id}><a href={reading.href}>{reading.title}</a></li>)}
        </ol>
      </>}
    </div>}
  </aside>;
}
