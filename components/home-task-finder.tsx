"use client";

import { useRouter } from "next/navigation";

const tasks = [
  ["/learn/equity-toolkit", "a policy or service decision"],
  ["/practice-guides/inclusive-meetings", "a meeting"],
  ["/practice-guides/clearer-processes", "a form or process"],
  ["/practice/gp-3", "community engagement"],
  ["/practice-guides/review-a-change", "reviewing a change"],
  ["/learn", "building my understanding"],
  ["/support/right-person", "finding who decides"],
  ["/equity-review/director-toolkit", "leading equity work across the Department of Human Services"],
] as const;

export function HomeTaskFinder() {
  const router = useRouter();
  return <form className="builder" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const task = String(data.get("task"));
    if (!tasks.some(([href]) => href === task)) return;
    router.push(data.get("role") === "new" && task === "/learn" ? "/start#new-to-dsd" : task);
  }}>
    <label htmlFor="home-role">I’m</label>
    <select id="home-role" name="role" defaultValue="any">
      <option value="any">working on</option>
      <option value="lead">leading a team on</option>
      <option value="new">new and starting with</option>
    </select>
    <label className="sr" htmlFor="home-task">Task</label>
    <select id="home-task" name="task" defaultValue={tasks[0][0]}>
      {tasks.map(([href, label]) => <option key={href} value={href}>{label}</option>)}
    </select>
    <button type="submit">Show me</button>
  </form>;
}
