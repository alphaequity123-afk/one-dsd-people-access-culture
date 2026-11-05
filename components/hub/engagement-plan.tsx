"use client";

import { useId, useState } from "react";

// A fill-in engagement and report-back plan. Owner rule: nothing about a
// person's work here is counted, stored or sent anywhere. The plan lives only
// in this page until the person prints or copies it.

export const PLAN_FIELDS = [
  { key: "decision", label: "What decision is still open?", help: "Name the decision and who makes it." },
  { key: "influence", label: "What can participants influence, and what can they not?", help: "Be honest about limits. People notice when input cannot change anything." },
  { key: "who", label: "Whose experience does this decision affect? Whose is missing?", help: "Include people who could not use the service or take part before." },
  { key: "organizations", label: "Which organizations or community members will you contact, and why them?", help: "No organization speaks for a whole community. Plan to hear from people directly too." },
  { key: "language", label: "Language and communication", help: "Which languages and dialects, interpreters, plain language, American Sign Language, captions, written and spoken options." },
  { key: "access", label: "Access, timing and place", help: "Disability access, transportation, broadband, work schedules, caregiving, rural distance, observances." },
  { key: "compensation", label: "Compensation and supports", help: "What can be offered through approved arrangements, and who will confirm it?" },
  { key: "use", label: "How will you use and represent what people share?", help: "How participants can review how their words are used, and choose how their contributions may be used." },
] as const;

export const REPORT_FIELDS = [
  { key: "changed", label: "What changed because people took part?" },
  { key: "unchanged", label: "What did not change, and why?" },
  { key: "followUp", label: "Who will follow up, and when?" },
  { key: "method", label: "How will you report back?", help: "In the languages and formats participants used. Give a way to correct your summary." },
  { key: "reflect", label: "What would you do differently next time?" },
] as const;

type Values = Record<string, string>;

function asText(title: string, values: Values) {
  const lines = [title, ""];
  for (const field of [...PLAN_FIELDS, ...REPORT_FIELDS]) {
    lines.push(field.label, values[field.key]?.trim() || "(not filled in)", "");
  }
  return lines.join("\n");
}

export function EngagementPlan() {
  const id = useId();
  const [values, setValues] = useState<Values>({});
  const [status, setStatus] = useState("");
  const set = (key: string) => (event: React.ChangeEvent<HTMLTextAreaElement>) => setValues(v => ({ ...v, [key]: event.target.value }));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText("Engagement and report-back plan", values));
      setStatus("Plan copied. Paste it into a document you keep.");
    } catch {
      setStatus("Copying did not work in this browser. Use print instead.");
    }
  };
  const field = (f: { key: string; label: string; help?: string }) => <div key={f.key} className="space-y-1">
    <label htmlFor={`${id}-${f.key}`} className="block font-semibold">{f.label}</label>
    {"help" in f && f.help ? <p id={`${id}-${f.key}-help`} className="text-sm text-muted">{f.help}</p> : null}
    <textarea id={`${id}-${f.key}`} aria-describedby={"help" in f && f.help ? `${id}-${f.key}-help` : undefined} rows={3} value={values[f.key] ?? ""} onChange={set(f.key)}
      className="w-full rounded border border-gray-400 p-2 print:border-0 print:p-0" />
  </div>;
  return <form className="space-y-6" onSubmit={e => e.preventDefault()} aria-label="Engagement and report-back plan">
    <fieldset className="space-y-4">
      <legend className="text-xl font-bold">Engagement plan</legend>
      {PLAN_FIELDS.map(field)}
    </fieldset>
    <fieldset className="space-y-4" id="report-back">
      <legend className="text-xl font-bold">Report-back plan</legend>
      <p>Fill this in after the engagement, before you close the work.</p>
      {REPORT_FIELDS.map(field)}
    </fieldset>
    <div className="flex flex-wrap gap-3 print:hidden">
      <button type="button" onClick={() => window.print()} className="min-h-11 rounded bg-[#1f4e79] px-4 font-semibold text-white">Print or save as PDF</button>
      <button type="button" onClick={copy} className="min-h-11 rounded border border-[#1f4e79] px-4 font-semibold text-[#1f4e79]">Copy the plan as text</button>
      <button type="button" onClick={() => { setValues({}); setStatus("The plan was cleared."); }} className="min-h-11 rounded border border-gray-400 px-4">Clear</button>
    </div>
    <p role="status" className="text-sm">{status}</p>
  </form>;
}
