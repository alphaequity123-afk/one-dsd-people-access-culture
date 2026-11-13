import type { Metadata } from "next";
import Link from "next/link";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { ORGANIZATIONS } from "@/lib/content/hub/organizations";
import { OUTREACH_TASKS, outreachSteps } from "@/lib/content/hub/outreach-home";
import { ResourceDownloads } from "@/components/resource-downloads";
import styles from "./hub.module.css";

export const metadata: Metadata = {
  title: "Community Outreach and Engagement",
  description: "Prepare to work with Minnesota communities, find organizations connected with the Disability Services Division, and involve people in decisions.",
};

export default async function CommunityOutreachPage() {
  const surface = await prepareEditableSurface("community-outreach.home");
  const text = (key: string) => stringValue(surface.values, key);
  const steps = outreachSteps(ORGANIZATIONS.length);
  return <EditableSurfaceRegion surface={surface}>
    <div className={styles.page}>
      <header>
        <p className={styles.kicker}>{text("kicker")}</p>
        <h1 className={styles.title}>{text("title")}</h1>
        <p className={styles.lede}>{text("lede")}</p>
        {surface.available ? <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="community-outreach" id="home" noun="page" /></details> : null}
      </header>

      <section className={styles.section} aria-labelledby="tasks-title">
        <h2 id="tasks-title">{text("tasksTitle")}</h2>
        <ul className="pilot-topic-rows">
          {OUTREACH_TASKS.map(task => <li key={task.href}><Link href={task.href}>
            <strong>{task.title}</strong><span>{task.body}</span>
          </Link></li>)}
        </ul>
      </section>

      <details className={styles.section}>
        <summary className="min-h-11 cursor-pointer font-semibold" id="cycle-title">{text("cycleTitle")}</summary>
        <p>{text("cycleIntro")}</p>
        <ol className={styles.cycle}>
          {steps.map(step => <li className={styles.step} key={step.key}><div>
            <h3>{text(`step${step.key}Title`)}</h3>
            <p>{text(`step${step.key}`)}</p>
            <p className={styles.capability}>{step.capability}</p>
            <ul className={styles.links}>{step.links.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul>
          </div></li>)}
        </ol>
      </details>

      <details className={styles.section}>
        <summary className="min-h-11 cursor-pointer font-semibold" id="care-title">Before you use the figures and the directory</summary>
        <p className={styles.note}>{text("numbersNote")}</p>
        <p>{text("tribalNote")} <Link href="/learn/tribal-referral">Native American and Tribal-specific guidance</Link>.</p>
        <p>{text("privacyNote")}</p>
      </details>
    </div>
  </EditableSurfaceRegion>;
}
