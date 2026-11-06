"use client";

import { useId, useState } from "react";
import { PLAN_FIELDS, REPORT_BACK_INTRO, REPORT_FIELDS } from "@/lib/content/hub/engagement-plan-fields";

// A fill-in engagement and report-back plan. Owner rule: nothing about a
// person's work here is counted, stored or sent anywhere. The plan lives only
// in this page until the person prints or copies it.

export { PLAN_FIELDS, REPORT_FIELDS };

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
      <p>{REPORT_BACK_INTRO}</p>
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
