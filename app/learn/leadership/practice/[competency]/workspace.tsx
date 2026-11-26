"use client";
import { useEffect, useRef, useState } from "react";
import { cycles, type CycleStep, type PracticeCase, type PracticeChoice, type Role } from "@/lib/dsd-live/leadership/practice-types";

type Notes = Record<"reflection" | "goal" | CycleStep, string>;
const emptyNotes: Notes = { reflection: "", goal: "", plan: "", do: "", study: "", act: "" };
const roleOptions: {key: Role; label: string}[] = [
  { key: "aspiring", label: "I influence work without formal authority" },
  { key: "supervisor", label: "I lead a team or supervise staff" },
  { key: "senior", label: "I make decisions across teams or programs" },
];

export function PracticeWorkspace({ scenario }: { scenario: PracticeCase }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const [stepId, setStepId] = useState(scenario.start);
  const [selection, setSelection] = useState<number | null>(null);
  const [response, setResponse] = useState<PracticeChoice | null>(null);
  const [role, setRole] = useState<Role | "">("");
  const [notes, setNotes] = useState<Notes>(emptyNotes);
  const [message, setMessage] = useState("");
  const decision = scenario.steps.find(step => step.id === stepId);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => {
    if (!moveFocus.current) return;
    (response ? feedback.current : heading.current)?.focus();
    moveFocus.current = false;
  }, [stepId, response]);

  function go(next: string) {
    moveFocus.current = true;
    setSelection(null);
    setResponse(null);
    setStepId(next);
  }
  function changeNote(key: keyof Notes, value: string) {
    setNotes(previous => ({ ...previous, [key]: value }));
    setMessage("");
  }
  function savePlan() {
    const roleText = roleOptions.find(option => option.key === role)?.label;
    const content = [
      scenario.title, scenario.competency, roleText ?? "", "",
      "My reflection", notes.reflection, "", "My SMART goal", notes.goal, "",
      ...cycles.flatMap(({key, label}) => [label, notes[key], ""]),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], {type:"text/plain;charset=utf-8"}));
    const a = document.createElement("a");
    a.href = url;
    a.download = "leadership-plan-" + scenario.id + ".txt";
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setMessage("Your plan is ready in your browser downloads.");
  }
  return <>
    <noscript><p>Turn on JavaScript to try the decisions and download a plan. You can still read the scenario, reflection questions and worked example below.</p></noscript>
    <p>{scenario.decisionPrompt}</p>
    <div className="leadership-actions"><a href="#reflect">Go to reflection and planning</a><a href="#related-reading">Explore related readings</a></div>
    {decision ? <section aria-label="Simulation decision">
      <h2 ref={heading} tabIndex={-1}>{stepId === scenario.start ? "Your first decision" : "Your next decision"}</h2>
      <form onSubmit={event => {
        event.preventDefault();
        if (selection === null || response) return;
        moveFocus.current = true;
        setResponse(decision.choices[selection]);
      }}>
        <fieldset disabled={!ready || Boolean(response)}><legend>{decision.prompt}</legend>
          {decision.choices.map((choice, index) => <label className="leadership-choice" key={choice.label}>
            <input type="radio" name="response" value={index} required checked={selection === index} onChange={() => setSelection(index)} />
            <span>{choice.label}</span>
          </label>)}
        </fieldset>
        {!response && <button className="button" type="submit" disabled={!ready}>See what happens</button>}
      </form>
      {response && <div className="choice-response"><h2 ref={feedback} tabIndex={-1}>What happens next</h2><p>{response.feedback}</p>
        <button type="button" className="button" onClick={() => go(response.next)}>{response.next === "finish" ? "Debrief this decision" : "Continue the scenario"}</button>
      </div>}
    </section> : <section><h2 ref={heading} tabIndex={-1}>Debrief the decision</h2><p>{scenario.debrief}</p>
      <button className="button secondary" type="button" onClick={() => go(scenario.start)}>Try another response</button>
    </section>}
    <section id="reflect" aria-labelledby="reflection-title">
      <h2 id="reflection-title">Reflect on your own practice</h2>
      <label htmlFor="responsibility">Which responsibility would you like to explore?</label>
      <select disabled={!ready} id="responsibility" value={role} onChange={event => setRole(event.target.value as Role | "")}>
        <option value="">Choose a perspective (optional)</option>
        {roleOptions.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
      </select>
      <div aria-live="polite">{role && <p>{scenario.roles[role]}</p>}</div>
      <ul className="leadership-links" id="reflection-prompts">{scenario.reflection.map(prompt => <li key={prompt}>{prompt}</li>)}</ul>
      <p id="notes-guidance">Writing is optional. Use a fictional or de-identified example. Your notes stay on this page until you leave or reload it. Download a copy if you want to return to them.</p>
      <div className="leadership-form-row"><label htmlFor="reflection-note">My reflection</label>
        <textarea disabled={!ready} id="reflection-note" aria-describedby="notes-guidance reflection-prompts" value={notes.reflection} onChange={e => changeNote("reflection", e.target.value)} /></div>
    </section>
    <section aria-labelledby="plan-title"><h2 id="plan-title">Try a change at work</h2>
      <p>A SMART goal is specific, measurable, achievable, relevant and time-bound. Choose one action within your authority. Say how you will know it helped and when you will check.</p>
      <p>Use a Plan–Do–Study–Act (PDSA) cycle to test your idea on a small scale. You can write your prediction now and complete the later steps as you learn what happened.</p><details><summary>See a SMART goal and a worked improvement cycle</summary>
        <p><strong>Example goal. </strong>{scenario.smart}</p>
        <dl>{cycles.map(({key, label}) => <div key={key}><dt><strong>{label}</strong></dt><dd>{scenario.pdsa[key]}</dd></div>)}</dl>
      </details>
      <div className="leadership-form-row"><label htmlFor="my-goal">My SMART goal</label>
        <textarea disabled={!ready} id="my-goal" value={notes.goal} onChange={e => changeNote("goal", e.target.value)} /></div>
      {cycles.map(({key, label, prompt}) => <div className="leadership-form-row" key={key}>
        <label htmlFor={"my-" + key}>{label}</label><p id={key + "-prompt"}>{prompt}</p>
        <textarea disabled={!ready} id={"my-" + key} aria-describedby={key + "-prompt"} value={notes[key]} onChange={e => changeNote(key, e.target.value)} />
      </div>)}
      <button type="button" className="button" disabled={!ready} onClick={savePlan}>Download my plan</button><p role="status">{message}</p>
    </section>
  </>;
}
