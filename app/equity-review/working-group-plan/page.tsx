import type { Metadata } from "next";
import Link from "next/link";
import { PrintPageButton } from "@/components/hub/print-page-button";
import { CHARGE, CHECKPOINTS, KICKOFF_DECISIONS, LAW, MEETINGS, PROGRAM_SUPPORT, RECOMMENDATION_RECORD, REUSE_STEPS, ROADMAP, TOPICS, TOPIC_METHOD, WORKING_GROUP_PLAN_CHECKED } from "@/lib/content/hub/working-group-plan";
import styles from "@/app/community-outreach/hub.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "Plan a legislatively required working group",
  description: "A reusable plan for a working group created by law, with the Waiver Case Management Advisory Working Group (2026 to 2027) as the worked example.",
};

export default async function WorkingGroupPlanPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const expanded = (await searchParams).view === "complete";
  return <article className={`${styles.page} pilot-reading-width`}>
    <p className={`${styles.kicker} ${styles.noPrint}`}><Link href="/equity-review">Equity in practice</Link> · <Link href="/community-outreach/how-the-system-connects">How the system connects</Link></p>
    <h1 className={styles.title}>Plan a legislatively required working group</h1>
    <p className={styles.lede}>When the Legislature creates a working group or task force, the law sets its purpose, members, meetings, duties and report date. This page turns that charge into a month-by-month plan, using the Waiver Case Management Advisory Working Group as the worked example, and shows how to reuse the plan for another group.</p>
    <p className={styles.note}>The charge below is quoted from the law. The workplan, topic method, recommendation record and checkpoints are proposed practice for confirmation by the group and the department, not statutory requirements. Checked on {WORKING_GROUP_PLAN_CHECKED}.</p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="equity-review" id="working-group-plan" noun="plan" /></details>
    {expanded ? <nav aria-label="On this page" className={styles.links}><a href="#charge">The charge</a><a href="#roadmap">Roadmap</a><a href="#meetings">Meetings</a><a href="#method">Each topic</a><a href="#topics">Topic plans</a><a href="#record">Recommendation record</a><a href="#checkpoints">Checkpoints</a><a href="#kickoff">Kickoff</a><a href="#reuse">Reuse this plan</a><a href="#support">What this program supplies</a></nav> : null}

    <details className="pilot-supporting" id="charge" open={expanded}>
      <summary>The charge, from the law</summary>
      <div className="pilot-supporting-body space-y-4">
      <p>{CHARGE.purpose}</p>
      <h3 className="font-bold">Members</h3>
      <ul className="list-disc pl-6">{CHARGE.membership.map(m => <li key={m}>{m}</li>)}</ul>
      <p>{CHARGE.membershipNote}</p>
      <h3 className="font-bold">Meetings and support</h3>
      <p>{CHARGE.meetings}</p>
      <h3 className="font-bold">Duties</h3>
      <ol className="list-decimal space-y-1 pl-6">{CHARGE.duties.map(d => <li key={d}>{d}</li>)}</ol>
      <h3 className="font-bold">Report</h3>
      <p>{CHARGE.report}</p>
      <p className={styles.note}><strong>Scope boundary.</strong> {CHARGE.scopeBoundary}</p>
      <p><strong>Common lens.</strong> {CHARGE.commonLens} For Tribal Nations, membership on a working group is not consultation: contact the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation.</p>
      <p className={styles.small}>Source: <a href={LAW.url}>{LAW.title}</a>. {LAW.section53} {LAW.section54}</p>
      </div>
    </details>

    <details className="pilot-supporting" id="roadmap" open={expanded}>
      <summary>Roadmap: recommendations develop during topic review, with a complete draft in June</summary>
      <div className="pilot-supporting-body space-y-4">
      <div role="region" aria-label="Roadmap" tabIndex={0} style={{ overflowX: "auto" }}><table className={styles.table}>
        <thead><tr><th scope="col">Period</th><th scope="col">Primary work</th><th scope="col">Milestone</th></tr></thead>
        <tbody>{ROADMAP.map(r => <tr key={r.period}><th scope="row">{r.period}</th><td>{r.work}</td><td>{r.milestone}</td></tr>)}</tbody>
      </table></div>
      </div>
    </details>

    <details className="pilot-supporting" id="meetings" open={expanded}>
      <summary>Meeting sequence: one full-group session a month, with focused work between</summary>
      <div className="pilot-supporting-body space-y-4">
      <div role="region" aria-label="Meeting sequence" tabIndex={0} style={{ overflowX: "auto" }}><table className={styles.table}>
        <thead><tr><th scope="col">Meeting</th><th scope="col">Focus and preparation</th><th scope="col">Output</th></tr></thead>
        <tbody>{MEETINGS.map(m => <tr key={m.number}><th scope="row">{m.number} · {m.month}</th><td>{m.focus}</td><td>{m.output}</td></tr>)}</tbody>
      </table></div>
      </div>
    </details>

    <details className="pilot-supporting" id="method" open={expanded}>
      <summary>A consistent approach to every topic</summary>
      <div className="pilot-supporting-body space-y-4">
      <p>Staff organize the evidence and the discussion. Members shape the recommendations.</p>
      <div className="grid gap-4">{TOPIC_METHOD.map(step => <div className={styles.card} key={step.when}><h3>{step.when}</h3><p>{step.what}</p></div>)}</div>
      </div>
    </details>

    <details className="pilot-supporting" id="topics" open={expanded}>
      <summary>Topic plans</summary>
      <div className="pilot-supporting-body space-y-4">
      <div className="grid gap-4">{TOPICS.map(topic => <div className={styles.card} key={topic.title}>
        <p className={styles.kicker}>{topic.duty} · {topic.month}</p>
        <h3>{topic.title}</h3>
        <p><strong>Evidence.</strong> {topic.evidence}</p>
        <p><strong>Discussion.</strong> {topic.discussion}</p>
        <p><strong>Approach.</strong> {topic.approach}</p>
        <p><strong>Expected output.</strong> {topic.output}</p>
        <p className={styles.small}><strong>Note for the facilitator.</strong> {topic.note}</p>
      </div>)}</div>
      </div>
    </details>

    <details className="pilot-supporting" id="record" open={expanded}>
      <summary>The recommendation record</summary>
      <div className="pilot-supporting-body space-y-4">
      <p>Keep one record per proposed change from the first topic onward.</p>
      <dl>{RECOMMENDATION_RECORD.map(item => <div key={item.field} style={{ marginBottom: ".5rem" }}><dt><strong>{item.field}</strong></dt><dd>{item.what}</dd></div>)}</dl>
      </div>
    </details>

    <details className="pilot-supporting" id="checkpoints" open={expanded}>
      <summary>Report checkpoints that protect the deadline</summary>
      <div className="pilot-supporting-body space-y-4">
      <div role="region" aria-label="Checkpoints" tabIndex={0} style={{ overflowX: "auto" }}><table className={styles.table}>
        <thead><tr><th scope="col">Target</th><th scope="col">Checkpoint</th><th scope="col">Responsibility</th></tr></thead>
        <tbody>{CHECKPOINTS.map(c => <tr key={c.target}><th scope="row">{c.target}</th><td>{c.checkpoint}</td><td>{c.responsibility}</td></tr>)}</tbody>
      </table></div>
      <p className={styles.small}>The commissioner is the statutory submitting authority. Confirm actual review windows and required approvals at kickoff.</p>
      </div>
    </details>

    <details className="pilot-supporting" id="kickoff" open={expanded}>
      <summary>Kickoff decisions for the first full-group meeting</summary>
      <div className="pilot-supporting-body space-y-4">
      <div className="grid gap-4">{KICKOFF_DECISIONS.map(item => <div className={styles.card} key={item.title}><h3>{item.title}</h3><p>{item.what}</p></div>)}</div>
      </div>
    </details>

    <details className="pilot-supporting" id="reuse" open={expanded}>
      <summary>Reuse this plan for another working group</summary>
      <div className="pilot-supporting-body space-y-4">
      <ol className="list-decimal space-y-2 pl-6">{REUSE_STEPS.map(step => <li key={step}>{step}</li>)}</ol>
      <p className={styles.noPrint}><Link href="/community-outreach/plan">Plan an engagement</Link> covers the participation supports in detail.</p>
      </div>
    </details>

    <details className="pilot-supporting" id="support" open={expanded}>
      <summary>What this program can supply to the duties</summary>
      <div className="pilot-supporting-body space-y-4">
      <div role="region" aria-label="Program support by duty" tabIndex={0} style={{ overflowX: "auto" }}><table className={styles.table}>
        <thead><tr><th scope="col">Duties</th><th scope="col">Resource</th></tr></thead>
        <tbody>{PROGRAM_SUPPORT.map(item => <tr key={item.duties}><th scope="row">{item.duties}</th><td><Link href={item.href}>{item.resource}</Link></td></tr>)}</tbody>
      </table></div>
      </div>
    </details>
    <div className={`${styles.noPrint} mt-6 flex flex-wrap items-center gap-4`}>
      {expanded ? <><PrintPageButton /><Link href="/equity-review/working-group-plan">Return to the overview</Link></> : <Link href="?view=complete">Open the complete plan for reading or printing</Link>}
    </div>
  </article>;
}
