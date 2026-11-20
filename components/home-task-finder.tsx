"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/app-link";

type Task = {
  id: string;
  label: string;
  title: string;
  summary: string;
  href: string;
  action: string;
  related?: readonly [label: string, href: string];
};

/** Each task opens one published starting point; the summaries describe what that page offers. */
const tasks: readonly Task[] = [
  {
    id: "decision",
    label: "Make a policy or service decision",
    title: "Equity analysis for your work",
    summary: "Examine a decision before it is final: who it affects, which alternatives exist and which requirements apply.",
    href: "/learn/equity-toolkit",
    action: "Open the Equity Analysis Toolkit",
  },
  {
    id: "meeting",
    label: "Plan a meeting",
    title: "Make participation more accessible",
    summary: "Prepare ways for people to contribute, understand the decision and hear what happens next.",
    href: "/practice-guides/inclusive-meetings",
    action: "Open the meeting guide",
  },
  {
    id: "process",
    label: "Improve a form or process",
    title: "Make a process easier to use",
    summary: "Examine the steps people face and prepare a change grounded in their experience.",
    href: "/practice-guides/clearer-processes",
    action: "Open the process guide",
  },
  {
    id: "engagement",
    label: "Plan community engagement",
    title: "Community engagement or shared design",
    summary: "Plan engagement that is respectful, useful and grounded in what people need. Review the relevant Minnesota Communities briefs first.",
    href: "/practice/gp-3",
    action: "Open the engagement path",
    related: ["Minnesota Communities", "/minnesota-communities"],
  },
  {
    id: "review",
    label: "Review a change",
    title: "Find out what changed in practice",
    summary: "Connect an action with what you observed, acknowledge uncertainty and choose the next adjustment.",
    href: "/practice-guides/review-a-change",
    action: "Open the review guide",
  },
  {
    id: "understand",
    label: "Build my understanding",
    title: "Learn",
    summary: "Courses, readings and collections to build your understanding at your own pace.",
    href: "/learn",
    action: "Open Learn",
  },
  {
    id: "decides",
    label: "Find who decides",
    title: "Find the right person",
    summary: "Answer a few questions to find who can help with your question.",
    href: "/support/right-person",
    action: "Find the right person",
    related: ["Support directory", "/support/directory"],
  },
  {
    id: "lead",
    label: "Lead equity work across DHS",
    title: "Equity Director toolkit",
    summary: "Tools for equity work across the agency, with a first 90-day plan, a starter package and printable templates.",
    href: "/equity-review/director-toolkit",
    action: "Open the toolkit",
  },
];

/** "What are you working on?": choosing a task shows where to start, without leaving the page. */
export function HomeTaskFinder() {
  const [selected, setSelected] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const task = tasks.find(item => item.id === selected);

  // On a narrow screen the answer can sit below the fold; bring it into view without moving focus.
  useEffect(() => {
    const box = panel.current;
    if (!task || !box) return;
    const { top, bottom } = box.getBoundingClientRect();
    if (top >= 0 && bottom <= window.innerHeight) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [task]);

  return <section className="home-tasks" aria-labelledby="home-tasks-title">
    <h2 id="home-tasks-title">What are you working on?</h2>
    <p className="home-tasks-lede">Choose the task closest to your work to see where to start.</p>
    <ul className="home-task-grid">
      {tasks.map(item => <li key={item.id}>
        <button type="button" className="home-task" aria-pressed={item.id === selected} aria-controls="home-task-answer"
          onClick={() => setSelected(item.id === selected ? null : item.id)}>{item.label}</button>
      </li>)}
    </ul>
    {/* The live region stays in the page so screen readers announce each new answer. */}
    <div id="home-task-answer" aria-live="polite">
      {task ? <div ref={panel} className="home-task-answer">
        <h3>{task.title}</h3>
        <p>{task.summary}</p>
        <div className="home-task-actions">
          <Link className="home-task-primary" href={task.href}>{task.action}</Link>
          {task.related ? <Link href={task.related[1]}>{task.related[0]}</Link> : null}
        </div>
      </div> : null}
    </div>
    <p className="home-tasks-new"><Link href="/start#new-to-dsd">New to DSD? Get started here</Link></p>
  </section>;
}
