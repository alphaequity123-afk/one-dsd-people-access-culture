import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team kits" };

type Kit = { id: string; title: string; when: string; minutes: number; agenda: string[]; materials: { label: string; href: string }[]; record: string };

const KITS: Kit[] = [
  { id: "book-discussion", title: "A thirty-minute book discussion", when: "Your team wants to learn together but no one has time to plan.", minutes: 30,
    agenda: ["Five minutes: one person reads the summary's main ideas aloud.", "Fifteen minutes: two of the ready-made discussion questions.", "Five minutes: each person names one thing they noticed about their own work.", "Five minutes: agree on one small change to try, and who will check back."],
    materials: [{ label: "Readings and their discussion questions", href: "/learn/readings" }], record: "An action plan for the change the team agreed to try." },
  { id: "practice-case", title: "A twenty-minute practice case", when: "Before a real decision, rehearse a similar one where the stakes are low.", minutes: 20,
    agenda: ["Three minutes: read the case aloud.", "Ten minutes: who is affected, and who has not been asked?", "Five minutes: compare two options, including keeping things as they are.", "Two minutes: what would we do differently on our real decision?"],
    materials: [{ label: "Guided practices and cases", href: "/practice" }], record: "A note in the team's own files on what you would do differently." },
  { id: "hiring-panel", title: "Prepare a fair hiring panel", when: "Before the next interview round.", minutes: 45,
    agenda: ["Ten minutes: which requirements truly predict success in this job?", "Fifteen minutes: write the same job-related questions for every candidate.", "Ten minutes: agree on the scoring before anyone is interviewed.", "Ten minutes: plan accommodations offered up front, without asking anyone to disclose."],
    materials: [{ label: "Inclusive hiring and selection", href: "/explore/task/run-selection" }], record: "A written selection plan kept with the hiring file." },
  { id: "accessible-meeting", title: "Plan an accessible meeting", when: "Before sending a public or team meeting invitation.", minutes: 20,
    agenda: ["Five minutes: what can people actually influence?", "Five minutes: offer interpreters and accommodations in the invitation.", "Five minutes: check the date against the Culture Calendar and the location against transit.", "Five minutes: decide how people will hear what happened to their input."],
    materials: [{ label: "Make participation more accessible", href: "/practice-guides/inclusive-meetings" }, { label: "Culture Calendar", href: "/minnesota-communities/calendar" }], record: "The invitation itself, and a short note of what was heard and what changed." },
  { id: "notice-review", title: "Review a notice or form together", when: "Before a letter, form or notice reaches the public.", minutes: 30,
    agenda: ["Ten minutes: read it as the person receiving it. What must they do next?", "Ten minutes: mark unclear words, missing language options and steps that need a smartphone.", "Ten minutes: plan who outside the team will test the revised version."],
    materials: [{ label: "Make a process easier to use", href: "/practice-guides/clearer-processes" }], record: "A decision record for the change, if it affects people outside the team." },
  { id: "look-back", title: "A thirty-day look back", when: "A month after the team tried something new.", minutes: 20,
    agenda: ["Five minutes: what did we try?", "Ten minutes: what changed for the people affected, and how do we know?", "Five minutes: keep, adjust or stop."],
    materials: [{ label: "Find out what changed in practice", href: "/practice-guides/review-a-change" }], record: "The review section of each person's action plan, or the team's decision record." },
];

export default function TeamKitsPage() {
  return <div className="calm">
    <p className="calm-kicker">Learn together</p>
    <h1>Team kits</h1>
    <p className="calm-lede">Ready-to-run sessions for a regular staff meeting. Each one has a time, an agenda, the material to open and what the team keeps afterward. Nothing about who attends is recorded.</p>
    {KITS.map(kit => <details key={kit.id} id={kit.id}>
      <summary>{kit.title} <span className="calm-muted calm-small">{kit.minutes} minutes</span></summary>
      <p className="calm-muted">{kit.when}</p>
      <h3 style={{ marginTop: "1rem" }}>Agenda</h3>
      <ol>{kit.agenda.map(step => <li key={step}>{step}</li>)}</ol>
      <h3 style={{ marginTop: "1rem" }}>Open</h3>
      <ul>{kit.materials.map(item => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul>
      <h3 style={{ marginTop: "1rem" }}>What the team keeps</h3>
      <p>{kit.record}</p>
    </details>)}
    <p className="calm-note">Supervisors who want slides can use the editable PowerPoint that comes with each <Link href="/learning/self-directed/index.html">self-directed course</Link>.</p>
  </div>;
}
