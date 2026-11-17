"use client";
import { EngagementToolkitRoute } from "./multimedia/engagement-toolkit-route";

import { useId, useRef, useState } from "react";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { EAT_CHOICES, EAT_ROLES, EAT_STAGES } from "@/lib/content/equity-toolkit";
import { DecisionWorkspace } from "./decision-workspace";

/** The page supplies released values inside its server-side EditableSurfaceRegion. */
export function EquityToolkitExperience({ values, renderDraft = true, decisionValues, scope = "one-dhs" }: { values: EditableSurfaceValues; renderDraft?: boolean; decisionValues?: EditableSurfaceValues; scope?: StaffProgramScope }) {
  const prefix = useId();
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [role, setRole] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});
  const text = (key: string) => typeof values[key] === "string" ? values[key] as string : "";
  const list = (key: string): string[] => Array.isArray(values[key])
    ? values[key].filter((item): item is string => typeof item === "string") : [];
  const stage = EAT_STAGES[stageIndex];
  const selectedChoice = choices[stage.id];

  function changeStage(index: number) {
    setStageIndex(index);
    requestAnimationFrame(() => stageHeading.current?.focus());
  }

  const buttonClass = "min-h-11 rounded-lg border border-slate-400 bg-slate-50 px-4 py-3 text-left font-medium hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50";

  return <div className="space-y-12" data-equity-toolkit-experience>
    <div id="toolkit-practice" className="space-y-8 print:hidden">
      <section className="space-y-4" aria-labelledby={`${prefix}-role-label`}>
        <h2 id={`${prefix}-role-label`} className="text-2xl font-semibold">{text("roleLabel")}</h2>
        <p className="max-w-3xl">{text("roleIntro")}</p>
        <select
          aria-labelledby={`${prefix}-role-label`}
          className="min-h-11 w-full max-w-xl border border-line bg-white p-3"
          value={role}
          onChange={event => setRole(event.target.value)}
        >
          <option value="">{text("noRoleLabel")}</option>
          {EAT_ROLES.map(item => <option key={item.id} value={item.id}>{text(`${item.id}Label`)}</option>)}
        </select>
        <div role="status" aria-live="polite" aria-atomic="true">{role ? <p className="max-w-3xl border-l-2 border-line pl-5">{text(`${role}Context`)}</p> : null}</div>
      </section>

      <nav aria-label={text("stageNavLabel")} className="flex flex-wrap gap-2">
        {EAT_STAGES.map((item, index) => <button
          key={item.id}
          type="button"
          className={buttonClass}
          aria-current={index === stageIndex ? "step" : undefined}
          aria-controls={`${prefix}-stage`}
          style={index === stageIndex ? { backgroundColor: "#173d59", color: "white" } : undefined}
          onClick={() => changeStage(index)}
        >{index + 1}. {text(`${item.id}Title`)}</button>)}
      </nav>

      <section id={`${prefix}-stage`} aria-label={`Learning example: ${text(`${stage.id}Title`)}`} className="space-y-7 rounded-xl border border-line bg-slate-50/70 p-5 md:p-7">
        <header className="max-w-3xl space-y-4">
          <h2 id={`${prefix}-stage-title`} ref={stageHeading} tabIndex={-1} className="text-3xl font-semibold">{text(`${stage.id}Title`)}</h2>
          <p className="text-lg">{text(`${stage.id}Intro`)}</p>
        </header>
        <section aria-labelledby={`${prefix}-objectives`} className="max-w-3xl">
          <h3 id={`${prefix}-objectives`} className="text-xl font-semibold">{text("objectivesTitle")}</h3>
          <ul className="mt-4 list-disc space-y-2 pl-6">{list(`${stage.id}Objectives`).map((objective, index) => <li key={index}>{objective}</li>)}</ul>
        </section>
        <section aria-labelledby={`${prefix}-scenario`} className="space-y-5 rounded-lg border border-line bg-white p-5 md:p-7">
          <h3 id={`${prefix}-scenario`} className="text-xl font-semibold">{text("scenarioTitle")}</h3>
          <p className="max-w-3xl text-sm">{text("scenarioNote")}</p>
          <p className="max-w-3xl">{text(`${stage.id}Scenario`)}</p>
          <div className="grid gap-3">
            {EAT_CHOICES.map(choice => <button
              key={`${stage.id}-${choice}`}
              type="button"
              className={buttonClass}
              aria-pressed={selectedChoice === choice}
              aria-controls={`${prefix}-consequence`}
              style={selectedChoice === choice ? { borderColor: "#173d59", backgroundColor: "#eef3f7" } : undefined}
              onClick={() => setChoices(previous => ({ ...previous, [stage.id]: choice }))}
            >{text(`${stage.id}Choice${choice}`)}</button>)}
          </div>
          <div id={`${prefix}-consequence`} role="status" aria-live="polite" aria-atomic="true">
            {selectedChoice ? <div className="space-y-3 border-t border-line pt-5">
              <h4 className="font-semibold">{text("consequenceTitle")}</h4>
              <p>{text(`${stage.id}Consequence${selectedChoice}`)}</p>
            </div> : null}
          </div>
        </section>
        <div className="flex flex-wrap justify-between gap-3">
          <button type="button" className={buttonClass} disabled={stageIndex === 0} onClick={() => changeStage(stageIndex - 1)}>{text("previousLabel")}</button>
          <button type="button" className={buttonClass} disabled={stageIndex === EAT_STAGES.length - 1} onClick={() => changeStage(stageIndex + 1)}>{text("nextLabel")}</button>
        </div>
      </section>
      <EngagementToolkitRoute /><p className="max-w-3xl">{text("culturalContext")}</p>
    </div>

    {renderDraft && <DecisionWorkspace values={decisionValues} scope={scope} />}
  </div>;
}
