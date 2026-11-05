import type { Metadata } from "next";
import Link from "next/link";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { ORGANIZATIONS } from "@/lib/content/hub/organizations";
import styles from "./hub.module.css";

export const metadata: Metadata = {
  title: "Community Outreach and Engagement",
  description: "Prepare to work with Minnesota communities, find organizations connected with the Disability Services Division, and involve people in decisions.",
};

const TASKS = [
  { title: "I'm preparing to meet a community", body: "Read who the community is, how people differ within it, dated figures and questions to ask.", href: "/minnesota-communities", action: "Minnesota Communities" },
  { title: "I need to find an organization", body: "See organizations connected with the Disability Services Division, what they do and the public records behind each connection.", href: "/community-outreach/organizations", action: "Organization directory" },
  { title: "I'm planning an engagement", body: "Work through the questions to answer before you reach out, then draft an engagement and report-back plan.", href: "/community-outreach/plan", action: "Plan an engagement" },
  { title: "I need to reach people", body: "Find colleges, workforce programs, associations, media, community places and events for recruitment, outreach and engagement.", href: "/community-outreach/sources", action: "Where to reach people" },
  { title: "I'm looking at the numbers", body: "Compare each county's population with the people receiving home and community-based services, by race and ethnicity.", href: "/community-outreach/county-map", action: "Minnesota county map" },
];

export default async function CommunityOutreachPage() {
  const surface = await prepareEditableSurface("community-outreach.home");
  const text = (key: string) => stringValue(surface.values, key);
  const steps = [
    { key: "Understand", capability: "Cultural intelligence: drive, the motivation to learn and adapt.", links: [{ label: "Cultural Intelligence collection", href: "/learn/cultural-intelligence" }, { label: "The water we swim in", href: "/learn/water-we-swim-in" }] },
    { key: "Learn", capability: "Cultural intelligence: knowledge of how cultures shape needs and choices.", links: [{ label: "Minnesota Communities", href: "/minnesota-communities" }, { label: "Minnesota county map", href: "/community-outreach/county-map" }] },
    { key: "Connect", capability: "Cultural intelligence: strategy, planning before you act.", links: [{ label: `Organization directory (${ORGANIZATIONS.length} organizations)`, href: "/community-outreach/organizations" }, { label: "Where to reach people", href: "/community-outreach/sources" }, { label: "County agencies", href: "/community-outreach/county-agencies" }, { label: "Find the right person", href: "/support/right-person" }] },
    { key: "Engage", capability: "Cultural intelligence: action, adapting what you do in the moment.", links: [{ label: "Community engagement: from input to action", href: "/learn/community-connections" }, { label: "Plan an engagement", href: "/community-outreach/plan" }, { label: "Equity Analysis Toolkit", href: "/learn/equity-toolkit" }] },
    { key: "Report", capability: "Cultural intelligence: strategy again, checking what worked and what to change.", links: [{ label: "Report-back plan", href: "/community-outreach/plan#report-back" }] },
  ];
  return <EditableSurfaceRegion surface={surface}>
    <div className={styles.page}>
      <header>
        <p className={styles.kicker}>{text("kicker")}</p>
        <h1 className={styles.title}>{text("title")}</h1>
        <p className={styles.lede}>{text("lede")}</p>
      </header>

      <section className={styles.section} aria-labelledby="tasks-title">
        <h2 id="tasks-title">{text("tasksTitle")}</h2>
        <ul className={styles.tasks}>
          {TASKS.map(task => <li key={task.href}><Link className={styles.task} href={task.href}>
            <span className={styles.taskTitle}>{task.title}</span><span>{task.body}</span><span className={styles.taskAction}>{task.action} <span aria-hidden="true">→</span></span>
          </Link></li>)}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="cycle-title">
        <h2 id="cycle-title">{text("cycleTitle")}</h2>
        <p>{text("cycleIntro")}</p>
        <ol className={styles.cycle}>
          {steps.map(step => <li className={styles.step} key={step.key}><div>
            <h3>{text(`step${step.key}Title`)}</h3>
            <p>{text(`step${step.key}`)}</p>
            <p className={styles.capability}>{step.capability}</p>
            <ul className={styles.links}>{step.links.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul>
          </div></li>)}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="care-title">
        <h2 id="care-title">Before you use the figures and the directory</h2>
        <p className={styles.note}>{text("numbersNote")}</p>
        <p>{text("tribalNote")} <Link href="/learn/tribal-referral">Native American and Tribal-specific guidance</Link>.</p>
        <p>{text("privacyNote")}</p>
      </section>
    </div>
  </EditableSurfaceRegion>;
}
