"use client";

import { useRef, useState } from "react";
import { useProgramContext } from "@/components/program-context";
import { ADSA_WORK_GOALS } from "@/lib/program/adsa-work-links";
import { programOutcomes } from "@/lib/program/model";

/**
 * One screen for sharing what changed after trying something in the work. No name, role, unit or contact is asked
 * for; the month is set when the account arrives.
 */
export function ProgramOutcomeForm() {
  const { context } = useProgramContext();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [shared, setShared] = useState(false);
  const requestId = useRef<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    requestId.current ??= crypto.randomUUID();
    const text = (name: string) => String(fields.get(name) ?? "").trim();
    const action = text("goalActionId");
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/program/outcomes", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionId: requestId.current,
          programScope: context === "one_dsd" ? "dsd" : "one-dhs",
          problem: text("problem"), action: text("action"), adoptedChange: text("adoptedChange"),
          observedResult: text("observedResult"), followUp: text("followUp"),
          evidenceUrl: text("evidenceUrl") || undefined,
          decision: text("decision") || "not_yet_known",
          outcomeId: text("outcomeId") || undefined,
          goalActionIds: action ? [action] : undefined,
          reviewMonth: text("reviewMonth") || undefined,
          consent: fields.get("consent") === "on",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setMessage(result.error || "This account could not be shared. Your writing is still here."); return; }
      setShared(true); form.reset(); requestId.current = null;
    } catch { setMessage("This account could not be shared. Your writing is still here; try again."); }
    finally { setBusy(false); }
  }

  if (shared) return <section role="status" className="space-y-4">
    <h2 className="text-2xl font-semibold">Thank you for sharing what happened.</h2>
    <p>Accounts like this one show what makes a difference in the work, and what to change next.</p>
    <button type="button" className="btn btn--light" onClick={() => setShared(false)}>Share another</button>
  </section>;

  return <form onSubmit={submit} className="space-y-6">
    <p>Leave out names and any client, case, health or personnel details. Describe the situation in general terms.</p>
    <fieldset disabled={busy} className="space-y-5">
      <label className="field">What were you trying to improve?<textarea name="problem" required maxLength={1500} rows={3} /></label>
      <label className="field">What did you try?<textarea name="action" required maxLength={1500} rows={3} /></label>
      <label className="field">What changed in practice?<textarea name="adoptedChange" required maxLength={1500} rows={3} /></label>
      <label className="field">What have you noticed so far?<textarea name="observedResult" required maxLength={2000} rows={3} /></label>
      <label className="field">What should happen next?<textarea name="followUp" required maxLength={1500} rows={3} /></label>
      <label className="field">Your recommendation<select name="decision" defaultValue="not_yet_known">
        <option value="not_yet_known">More time or evidence is needed</option>
        <option value="retain">Keep the change</option>
        <option value="revise">Adjust the approach</option>
        <option value="stop">Stop this approach</option>
      </select></label>
      <label className="field">Which change does this speak to?<select name="outcomeId" defaultValue="">
        <option value="">Not sure</option>
        {programOutcomes.map(outcome => <option key={outcome.id} value={outcome.id}>{outcome.title}: {outcome.intendedChange}</option>)}
      </select></label>
      <label className="field">Which ADSA action step does it connect to?<select name="goalActionId" defaultValue="">
        <option value="">None or not sure</option>
        {ADSA_WORK_GOALS.map(goal => <optgroup key={goal.number} label={`Goal ${goal.number}: ${goal.title}`}>
          {goal.actions.map(action => <option key={action.id} value={action.id}>{action.id.replace("ADSA-", "")}: {action.sourceText.length > 90 ? action.sourceText.slice(0, 87) + "…" : action.sourceText}</option>)}
        </optgroup>)}
      </select></label>
      <label className="field">A public page that shows the change<input name="evidenceUrl" type="url" maxLength={1000} placeholder="https://" /></label>
      <label className="field">Month to look at it again<input name="reviewMonth" type="month" /></label>
      <label className="flex items-start gap-3"><input type="checkbox" name="consent" required className="mt-1" /><span>I choose to share this account so the program owner can learn from it. It leaves out names and private details.</span></label>
      <button className="btn" type="submit">{busy ? "Sharing…" : "Share this account"}</button>
    </fieldset>
    {message ? <p role="alert">{message}</p> : null}
  </form>;
}
