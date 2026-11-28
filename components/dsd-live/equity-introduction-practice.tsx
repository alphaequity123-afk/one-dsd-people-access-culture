"use client";
import { useState } from "react";
import Link from "next/link";

const choices = [
  ["same", "Keep one format so everyone receives exactly the same information.", "Consistency can help, but one format can still create different barriers. Keep the information consistent while offering accessible ways to receive it and contribute."],
  ["ask", "Ask about access needs, offer ways to contribute, and check whose views are missing.", "This is a useful starting point. It combines access with participation. Follow through on the needs people identify, and check whether the changes actually helped."],
  ["assume", "Choose a different format for each person based on what you assume they need.", "Offering options can help. Assigning them based on assumptions can limit people’s choice. Ask what works, explain the options, and let people tell you what they need."],
] as const;

export function EquityIntroductionPractice() {
  const [choice, setChoice] = useState("");
  const [reviewed, setReviewed] = useState("");
  const [task, setTask] = useState("");
  const [change, setChange] = useState("");
  const [message, setMessage] = useState("");
  return <>
    <section id="try-it" className="equity-practice" aria-labelledby="practice-title">
      <p className="equity-eyebrow">A moment to practise</p><h2 id="practice-title">The same invitation. Different opportunities to participate.</h2>
      <p>A DSD team is revising guidance about employment supports. It invites people with disabilities and service partners to a video meeting, attaching a scanned document. One participant uses a screen reader; another needs more time to communicate. The team has not asked about language or access arrangements.</p>
      <fieldset><legend>What would be a useful next step?</legend>{choices.map(([id, label]) => <label className="equity-choice" key={id}><input type="radio" name="equity-scenario" value={id} checked={choice === id} onChange={() => { setChoice(id); setReviewed(""); }} /><span>{label}</span></label>)}</fieldset>
      <button className="button" disabled={!choice} onClick={() => setReviewed(choice)}>Explore this choice</button>
      <div role="status" className={reviewed ? "equity-feedback" : undefined}>{reviewed ? <><strong>Consider the effect</strong><p>{choices.find(([id]) => id === reviewed)?.[2]}</p><p>Who could still be left out, and how would you find out?</p></> : null}</div>
    </section>
    <section id="your-next-step" aria-labelledby="next-step-title">
      <h2 id="next-step-title">Choose one change in your own work</h2>
      <p>Choose a DSD task you can influence: an employment-support explanation, recruitment notice, meeting, form or team practice. Ask people with disabilities about the barrier, identify a change and decide how to check whether it helped.</p>
      <p className="meta">This optional reflection stays on this page and is not saved. Leave out names, case details, and confidential information.</p>
      <label htmlFor="equity-task">A task, decision, or workplace habit I want to examine</label>
      <textarea id="equity-task" rows={3} maxLength={2000} value={task} onChange={e => { setTask(e.target.value); setMessage(""); }} />
      <label htmlFor="equity-change">One change to try, whose perspective to seek, and how to check whether it helps</label>
      <textarea id="equity-change" rows={4} maxLength={3000} value={change} onChange={e => { setChange(e.target.value); setMessage(""); }} />
      <button className="button" disabled={!task.trim() || !change.trim()} onClick={async () => {
        try { await navigator.clipboard.writeText(`My equity practice\n\nWhat I will examine: ${task}\n\nMy next step: ${change}`); setMessage("Your reflection is copied. Paste it somewhere you choose to keep it."); }
        catch { setMessage("Copy is unavailable in this browser. Your reflection is still here; select the text and copy it manually."); }
      }}>Copy my reflection</button><p role="status">{message}</p>
      <p>For another perspective, <Link href="/ask?q=How%20can%20I%20examine%20a%20workplace%20decision%20for%20fairness%2C%20access%20and%20whose%20perspectives%20are%20missing%3F">open a starting question in Ask</Link>. Your reflection is not sent with this link.</p>
    </section>
  </>;
}
