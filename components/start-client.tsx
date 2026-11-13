"use client";

import Link from "@/components/app-link";
import styles from "@/components/workspace-presentation.module.css";
import { useRef, useState } from "react";
import { useProgramContext } from "@/components/program-context";
import {
  START_ROLES,
  START_URGENCIES,
  WORK_AREAS,
  buildStartRecommendation,
  validateStartIntake,
  type StartRoleId,
  type StartUrgencyId,
  type WorkAreaId,
} from "@/lib/product";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";

type Recommendation = ReturnType<typeof buildStartRecommendation>;

export function StartClient({ copy }: { copy: EditableSurfaceValues }) {
  const { context } = useProgramContext();
  const [role, setRole] = useState<StartRoleId | "">("");
  const [task, setTask] = useState<WorkAreaId | "">("");
  const [urgency, setUrgency] = useState<StartUrgencyId | "">("");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const roleRef = useRef<HTMLSelectElement>(null);
  const taskRef = useRef<HTMLSelectElement>(null);
  const urgencyRef = useRef<HTMLInputElement>(null);
  const recommendedArea = recommendation
    ? {
        label: textValue(copy, areaKey(recommendation.workArea.id, "Label")),
        summary: textValue(copy, areaKey(recommendation.workArea.id, "Summary")),
        tasks: textListValue(copy, areaKey(recommendation.workArea.id, "Tasks")),
      }
    : null;

  function recommend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateStartIntake({ contextPreference: context, role, task, urgency });
    if (!result.ok) {
      setRecommendation(null);
      setIssues(Object.fromEntries(result.issues.map((issue) => [issue.field, issue.message])));
      const first = result.issues[0]?.field;
      setTimeout(() => {
        if (first === "role") roleRef.current?.focus();
        else if (first === "task") taskRef.current?.focus();
        else if (first === "urgency") urgencyRef.current?.focus();
      }, 0);
      return;
    }
    setIssues({});
    setRecommendation(buildStartRecommendation(result.value));
  }

  return (
    <div className="pilot-start-flow">
      <form className={styles.formPanel} onSubmit={recommend} noValidate>
        <p className="kicker">{textValue(copy, "formKicker")}</p>
        <h2 className="text-2xl font-extrabold">{textValue(copy, "formTitle")}</h2>
        <p className="text-muted">{textValue(copy, "formIntro")}</p>

        <div className="field">
          <label htmlFor="start-role">{textValue(copy, "roleLabel")}</label>
          <select
            id="start-role"
            ref={roleRef}
            value={role}
            onChange={(event) => setRole(event.target.value as StartRoleId | "")}
            aria-invalid={Boolean(issues.role)}
            aria-describedby={issues.role ? "start-role-error" : undefined}
          >
            <option value="">{textValue(copy, "rolePlaceholder")}</option>
            {START_ROLES.map((option) => <option key={option.id} value={option.id}>{textValue(copy, roleKey(option.id, "Label"))}</option>)}
          </select>
          {issues.role ? <p id="start-role-error" className="error m-0" role="alert">{issues.role}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="start-task">{textValue(copy, "taskLabel")}</label>
          <select
            id="start-task"
            ref={taskRef}
            value={task}
            onChange={(event) => setTask(event.target.value as WorkAreaId | "")}
            aria-invalid={Boolean(issues.task)}
            aria-describedby={issues.task ? "start-task-error" : undefined}
          >
            <option value="">{textValue(copy, "taskPlaceholder")}</option>
            {WORK_AREAS.map((option) => <option key={option.id} value={option.id}>{textValue(copy, areaKey(option.id, "Label"))}</option>)}
          </select>
          {issues.task ? <p id="start-task-error" className="error m-0" role="alert">{issues.task}</p> : null}
        </div>

        <fieldset className="field" aria-invalid={Boolean(issues.urgency)} aria-describedby={issues.urgency ? "start-urgency-error" : undefined}>
          <legend className="font-bold text-navy-deep">{textValue(copy, "urgencyLabel")}</legend>
          <div className="checks">
            {START_URGENCIES.map((option, index) => (
              <label key={option.id}>
                <input
                  ref={index === 0 ? urgencyRef : undefined}
                  type="radio"
                  name="urgency"
                  value={option.id}
                  checked={urgency === option.id}
                  onChange={() => setUrgency(option.id)}
                />
                <span>{textValue(copy, urgencyKey(option.id, "Label"))}</span>
              </label>
            ))}
          </div>
          {issues.urgency ? <p id="start-urgency-error" className="error m-0" role="alert">{issues.urgency}</p> : null}
        </fieldset>

        <button type="submit" className="btn btn--primary">{textValue(copy, "submitLabel")}</button>
      </form>

      <div aria-live="polite">
      {recommendation && <section className={styles.recommendation} aria-labelledby="start-result-title">
        <p className="kicker">{textValue(copy, "resultKicker")}</p>
        <h2 id="start-result-title" className="text-2xl font-extrabold">
          {`${textValue(copy, "recommendationPrefix")} ${recommendedArea?.label ?? ""}.`}
        </h2>
            <p>{recommendedArea?.summary}</p>
            <p>{textValue(copy, roleKey(recommendation.role.id, "Guidance"))} {textValue(copy, urgencyKey(recommendation.urgency.id, "Guidance"))}</p>
            <h3 className="text-lg font-bold">{textValue(copy, "workHeading")}</h3>
            <ul className="mt-2 list-disc pl-6">
              {recommendedArea?.tasks.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              {recommendation.roleSpace ? <Link href={recommendation.roleSpace.href} className="btn btn--primary">{recommendation.roleSpace.label}</Link> : null}
              <Link href={`/areas#${recommendation.workArea.id}`} className={recommendation.roleSpace ? "btn btn--secondary" : "btn btn--primary"}>
                {textValue(copy, "areaLinkLabel")}
              </Link>
              <Link href="/practice" className="btn btn--secondary">
                {textValue(copy, "practiceLinkLabel")}
              </Link>
              <Link href={`/support/right-person?area=${recommendation.workArea.id}`} className="btn btn--light">
                {textValue(copy, "supportLinkLabel")}
              </Link>
            </div>
      </section>}
      </div>
    </div>
  );
}

function pascal(value: string): string {
  return value.split(/[^A-Za-z0-9]+/).filter(Boolean).map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join("");
}

function roleKey(id: string, suffix: "Label" | "Guidance"): string {
  return `role${pascal(id)}${suffix}`;
}

function urgencyKey(id: string, suffix: "Label" | "Guidance"): string {
  return `urgency${pascal(id)}${suffix}`;
}

function areaKey(id: string, suffix: "Label" | "Summary" | "Tasks"): string {
  return `area${pascal(id)}${suffix}`;
}

function textValue(values: EditableSurfaceValues, key: string): string {
  return typeof values[key] === "string" ? values[key] as string : "";
}

function textListValue(values: EditableSurfaceValues, key: string): string[] {
  const value = values[key];
  return Array.isArray(value) && (value.length === 0 || typeof value[0] === "string") ? value as string[] : [];
}
