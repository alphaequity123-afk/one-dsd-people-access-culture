"use client";

import { useRouter } from "next/navigation";

const tasks = [
  ["/learn/equity-toolkit", "Make a policy or service decision"],
  ["/practice-guides/inclusive-meetings", "Plan a meeting"],
  ["/practice-guides/clearer-processes", "Improve a form or process"],
  ["/practice/gp-3", "Plan community engagement"],
  ["/practice-guides/review-a-change", "Review a change"],
  ["/learn", "Build my understanding"],
  ["/support/right-person", "Find who decides"],
  ["/equity-review/director-toolkit", "Lead equity work across DHS"],
] as const;

export function HomeTaskFinder() {
  const router = useRouter();
  return <form className="builder" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const task = String(data.get("task"));
    if (!tasks.some(([href]) => href === task)) return;
    router.push(task);
  }}>
    <label htmlFor="home-task">Choose a task</label>
    <select id="home-task" name="task" defaultValue={tasks[0][0]}>
      {tasks.map(([href, label]) => <option key={href} value={href}>{label}</option>)}
    </select>
    <button type="submit">Go to resource</button>
  </form>;
}
