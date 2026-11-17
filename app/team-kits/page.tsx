import Link from "@/components/app-link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team kits" };

type Kit = { id: string; title: string; when: string; minutes: number; agenda: string[]; materials: { label: string; href: string }[]; record: string };

const KITS: Kit[] = [
  { id: "book-discussion", title: "A thirty-minute book discussion", when: "Your team wants to learn together but no one has time to plan.", minutes: 30,
    agenda: ["Five minutes: one person reads the summary's main ideas aloud.", "Fifteen minutes: two of the ready-made discussion questions.", "Five minutes: invite participants to name something they noticed about their work, without sharing confidential or identifying details.", "Five minutes: decide what to retain, test or investigate further, within the team’s authority, and who will follow up."],
    materials: [{ label: "Readings and their discussion questions", href: "/learn/readings" }], record: "A brief record of the agreed next step, its reasons and who will follow up." },
  { id: "practice-case", title: "A twenty-minute practice case", when: "Before a real decision, rehearse a similar one where the stakes are low.", minutes: 20,
    agenda: ["Three minutes: read the case aloud.", "Ten minutes: who is affected, and who has not been asked?", "Five minutes: compare two options, including keeping things as they are.", "Two minutes: what reasoning should we carry into the real decision, and what still needs checking?"],
    materials: [{ label: "Guided practices and cases", href: "/practice" }], record: "A note in the team’s appropriate working files on the reasoning, remaining questions and responsible next step." },
  { id: "hiring-panel", title: "Prepare a fair hiring panel", when: "Before the next interview round.", minutes: 45,
    agenda: ["Ten minutes: which requirements are necessary for the work, and what evidence supports them?", "Fifteen minutes: write the same job-related questions for every candidate.", "Ten minutes: agree on the scoring before anyone is interviewed.", "Ten minutes: plan accessible interviews and explain how candidates can request an accommodation through the authorized process."],
    materials: [{ label: "Inclusive hiring and selection", href: "/explore/task/run-selection" }], record: "A written selection plan kept with the hiring file." },
  { id: "accessible-meeting", title: "Plan an accessible meeting", when: "Before sending a public or team meeting invitation.", minutes: 20,
    agenda: ["Five minutes: what can people actually influence?", "Five minutes: confirm available access supports and explain how people can request interpreters or accommodations.", "Five minutes: check the date against the Culture Calendar and the location against transit.", "Five minutes: decide how people will hear what happened to their input."],
    materials: [{ label: "Make participation more accessible", href: "/practice-guides/inclusive-meetings" }, { label: "Culture Calendar", href: "/minnesota-communities/calendar" }], record: "The invitation and a report-back plan explaining what was heard, what changed, what remained unchanged and why." },
  { id: "notice-review", title: "Review a notice or form together", when: "Before a letter, form or notice reaches the public.", minutes: 30,
    agenda: ["Ten minutes: read it as the person receiving it. What must they do next?", "Ten minutes: mark unclear words, missing language options and steps that need a smartphone.", "Ten minutes: decide whether revision is needed and how to test comprehension with intended readers, preserving required wording and procedures."],
    materials: [{ label: "Make a process easier to use", href: "/practice-guides/clearer-processes" }], record: "A record of the review, the decision and its reasons, kept through the appropriate process." },
  { id: "look-back", title: "A thirty-day look back", when: "A month after the team tried something new.", minutes: 20,
    agenda: ["Five minutes: what did we try?", "Ten minutes: what changed for the people affected, and how do we know?", "Five minutes: keep, adjust or stop."],
    materials: [{ label: "Find out what changed in practice", href: "/practice-guides/review-a-change" }], record: "The review section of each person's action plan, or the team's decision record." },
];

export default function TeamKitsPage() {
  return <div className="calm">
    <p className="calm-kicker">Learn together</p>
    <h1>Team kits</h1>
    <p className="calm-lede">Adapt these session plans for a regular staff meeting. Each includes suggested timing, an agenda, related material and a proposed working record. This page does not collect attendance; follow your team’s requirements for any official meeting record.</p>
    {KITS.map(kit => <details key={kit.id} id={kit.id}>
      <summary><h2 style={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", lineHeight: "inherit", color: "inherit", margin: 0 }}>{kit.title} <span className="calm-muted calm-small">{kit.minutes} minutes</span></h2></summary>
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
