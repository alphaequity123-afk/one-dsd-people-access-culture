"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { suggestedPath, type StartAnswers } from "@/lib/content/leadership-journey";
import styles from "./collections.module.css";

type Path = { slug: string; title: string; description: string };
type Choice = boolean | undefined;

function YesNo({ legend, name, value, onChange }: { legend: string; name: string; value: Choice; onChange: (value: boolean) => void }) {
  return <fieldset className="mt-4">
    <legend className="font-bold">{legend}</legend>
    <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
      <label className="inline-flex items-center gap-2"><input type="radio" name={name} checked={value === true} onChange={() => onChange(true)} /> Yes</label>
      <label className="inline-flex items-center gap-2"><input type="radio" name={name} checked={value === false} onChange={() => onChange(false)} /> No</label>
    </div>
  </fieldset>;
}

/**
 * A few questions about a person's own work that suggest where to start. The answers stay on the
 * page: they are not saved, counted or sent, and every path remains open whatever is suggested.
 */
export function LeadingStartChooser({ paths }: { paths: readonly Path[] }) {
  const [supervises, setSupervises] = useState<Choice>();
  const [guidesProgram, setGuidesProgram] = useState<Choice>();
  const [firstYear, setFirstYear] = useState<Choice>();
  const [supervisesSupervisors, setSupervisesSupervisors] = useState<Choice>();
  const [setsDirection, setSetsDirection] = useState<Choice>();

  const answered = supervises === false ? guidesProgram !== undefined
    : supervises === true && supervisesSupervisors === true ? setsDirection !== undefined
    : supervises === true && supervisesSupervisors === false ? firstYear !== undefined
    : false;
  const answers: StartAnswers = { supervises: supervises === true, guidesProgram, firstYear, supervisesSupervisors, setsDirection };
  const suggestion = answered ? paths.find(path => path.slug === suggestedPath(answers)) : undefined;

  return <form onSubmit={event => event.preventDefault()} aria-label="Find a starting point">
    <YesNo legend="Do you supervise people?" name="supervises" value={supervises} onChange={value => { setSupervises(value); setGuidesProgram(undefined); setFirstYear(undefined); setSupervisesSupervisors(undefined); setSetsDirection(undefined); }} />
    {supervises === false ? <YesNo legend="Do you guide a program, policy or project?" name="guides-program" value={guidesProgram} onChange={setGuidesProgram} /> : null}
    {supervises === true ? <YesNo legend="Do the people you supervise also supervise others?" name="supervises-supervisors" value={supervisesSupervisors} onChange={value => { setSupervisesSupervisors(value); setFirstYear(undefined); setSetsDirection(undefined); }} /> : null}
    {supervises === true && supervisesSupervisors === false ? <YesNo legend="Is this your first year of supervising?" name="first-year" value={firstYear} onChange={setFirstYear} /> : null}
    {supervises === true && supervisesSupervisors === true ? <YesNo legend="Do you set direction for a division or a function across the agency?" name="sets-direction" value={setsDirection} onChange={setSetsDirection} /> : null}
    <div role="status" aria-live="polite" className="mt-4">
      {suggestion ? <p className={styles.plain}>A good place to start: <Link href={`/leading/paths/${suggestion.slug}`}>{suggestion.title}</Link>. {suggestion.description} It is only a suggestion. Every path is open to you.</p> : null}
    </div>
  </form>;
}
