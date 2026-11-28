"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ACCESS, COMMUNITIES, PURPOSES, REMINDERS } from "@/lib/dsd-live/communities/conversation-planner";

/** Choose a purpose, a community and the access needed; get a plan to copy or print. Nothing chosen is kept. */
export function ConversationPlanner() {
  const [purposeId, setPurposeId] = useState<string>("");
  const [community, setCommunity] = useState<string>("");
  const [access, setAccess] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const purpose = PURPOSES.find(p => p.id === purposeId);
  const communityName = COMMUNITIES.find(([id]) => id === community)?.[1];
  const accessLines = ACCESS.filter(a => access.includes(a.id));

  const planText = useMemo(() => {
    if (!purpose) return "";
    return [
      `Conversation plan: ${purpose.label}${communityName ? ` (${communityName})` : ""}`,
      "",
      "Before",
      ...purpose.before.map(x => `- ${x}`),
      ...(communityName ? [`- Read the brief and profile for ${communityName} to prepare thoughtful questions.`] : []),
      "",
      "Questions to ask",
      ...purpose.questions.map(x => `- ${x}`),
      "",
      "Access and language",
      "- Ask each person what they need; don't guess.",
      ...accessLines.map(a => `- ${a.line}`),
      "",
      "Keep in mind",
      ...REMINDERS.map(x => `- ${x}`),
      "",
      "Afterward",
      ...purpose.after.map(x => `- ${x}`),
    ].join("\n");
  }, [purpose, communityName, accessLines]);

  async function copyPlan() {
    try { await navigator.clipboard.writeText(planText); setNote("Copied. Paste it into your notes, an email or a document."); }
    catch { setNote("You can select the plan and copy it instead."); }
  }

  return <div className="planner">
    <section className="planner-step" aria-labelledby="step-1">
      <p className="eyebrow">Step 1</p>
      <h2 id="step-1">What is the conversation for?</h2>
      <div className="planner-options" role="radiogroup" aria-labelledby="step-1">
        {PURPOSES.map(p => <label key={p.id} className={`planner-option${purposeId === p.id ? " is-chosen" : ""}`}>
          <input type="radio" name="purpose" value={p.id} checked={purposeId === p.id} onChange={() => setPurposeId(p.id)} />
          <span><strong>{p.label}</strong><span>{p.hint}</span></span>
        </label>)}
      </div>
    </section>

    <section className="planner-step" aria-labelledby="step-2">
      <p className="eyebrow">Step 2</p>
      <h2 id="step-2">Which community are you preparing to meet?</h2>
      <p className="planner-help">Optional. Choosing one adds its brief to your plan.</p>
      <select value={community} onChange={e => setCommunity(e.target.value)} aria-labelledby="step-2">
        <option value="">Not one community, or not sure</option>
        {COMMUNITIES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </section>

    <section className="planner-step" aria-labelledby="step-3">
      <p className="eyebrow">Step 3</p>
      <h2 id="step-3">What access and language arrangements might be needed?</h2>
      <p className="planner-help">Choose any that apply. You can always ask people directly, too.</p>
      <div className="planner-checks">{ACCESS.map(a => <label key={a.id} className={`planner-check${access.includes(a.id) ? " is-chosen" : ""}`}>
        <input type="checkbox" checked={access.includes(a.id)} onChange={e => setAccess(list => e.target.checked ? [...list, a.id] : list.filter(x => x !== a.id))} />
        <span>{a.label}</span>
      </label>)}</div>
    </section>

    <section className="planner-plan" aria-labelledby="plan-title" aria-live="polite">
      <p className="eyebrow">Your plan</p>
      <h2 id="plan-title">{purpose ? purpose.label : "Your conversation plan"}</h2>
      {!purpose ? <p className="planner-help">Choose what the conversation is for, and your plan appears here.</p> : <>
        <div className="planner-grid">
          <div><h3>Before</h3><ul>{purpose.before.map(x => <li key={x}>{x}</li>)}{communityName ? <li>Read the <Link href={`/minnesota-communities/${community}`}>{communityName}</Link> brief and its <Link href={`/minnesota-communities/${community}/profile`}>community profile</Link> to prepare thoughtful questions.</li> : null}</ul></div>
          <div><h3>Questions to ask</h3><ul>{purpose.questions.map(x => <li key={x}>{x}</li>)}</ul></div>
          <div><h3>Access and language</h3><ul><li>Ask each person what they need; don&apos;t guess.</li>{accessLines.map(a => <li key={a.id}>{a.line}</li>)}</ul></div>
          <div><h3>Afterward</h3><ul>{purpose.after.map(x => <li key={x}>{x}</li>)}</ul></div>
        </div>
        <div className="planner-reminders"><h3>Keep in mind</h3><ul>{REMINDERS.map(x => <li key={x}>{x}</li>)}</ul></div>
        <p className="planner-actions">
          <button type="button" className="button" onClick={() => void copyPlan()}>Copy my plan</button>
          <button type="button" className="button secondary" onClick={() => window.print()}>Print</button>
        </p>
        <p className="meta" role="status">{note}</p>
      </>}
    </section>
  </div>;
}
