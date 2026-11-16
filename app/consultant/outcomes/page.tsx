import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { ownerPageGuard } from "@/lib/auth/owner-page";
import { listProgramOutcomes, outcomeThemes, type OutcomeThemeGroup, type ProgramOutcomeRecord } from "@/lib/program/outcomes";
import { outcomeGoalActionIds, outcomeMonth } from "@/lib/program/outcome-schema";
import { programOutcomes } from "@/lib/program/model";

export const metadata: Metadata = { title: "Shared results" };
export const dynamic = "force-dynamic";

const DECISION: Record<string, string> = { retain: "Keep the change", revise: "Adjust the approach", stop: "Stop this approach", not_yet_known: "More time or evidence is needed" };

function monthLabel(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function Account({ record }: { record: ProgramOutcomeRecord }) {
  const outcome = programOutcomes.find(item => item.id === record.outcomeId);
  const actions = outcomeGoalActionIds(record);
  return <article className="border-t pt-4">
    <p className="text-sm text-muted">{monthLabel(outcomeMonth(record))} · {record.programScope === "dsd" ? "One DSD" : "One DHS"}{outcome ? ` · ${outcome.title}` : ""}{actions.length ? ` · ${actions.map(id => id.replace("ADSA-", "ADSA ")).join(", ")}` : ""}</p>
    <dl className="mt-2 space-y-2">
      <div><dt className="font-semibold">Trying to improve</dt><dd>{record.problem}</dd></div>
      <div><dt className="font-semibold">What was tried</dt><dd>{record.action}</dd></div>
      <div><dt className="font-semibold">What changed in practice</dt><dd>{record.adoptedChange}</dd></div>
      <div><dt className="font-semibold">What was noticed</dt><dd>{record.observedResult}</dd></div>
      <div><dt className="font-semibold">What should happen next</dt><dd>{record.followUp}</dd></div>
      <div><dt className="font-semibold">Recommendation</dt><dd>{DECISION[record.decision]}</dd></div>
      {record.evidenceUrl ? <div><dt className="font-semibold">Public page</dt><dd><Link href={record.evidenceUrl}>{record.evidenceUrl}</Link></dd></div> : null}
    </dl>
  </article>;
}

function Theme({ group }: { group: OutcomeThemeGroup }) {
  return <section className="card p-6" aria-labelledby={`theme-${group.key}`}>
    <h3 id={`theme-${group.key}`} className="text-xl font-semibold">{group.heading}</h3>
    {group.detail ? <p className="mt-1">{group.detail}</p> : null}
    <div className="mt-4 space-y-4">{group.records.map(record => <Account key={record.id} record={record} />)}</div>
  </section>;
}

/** Owner only. Accounts are read as themes under each goal and outcome. They are not a measure of reach. */
export default async function SharedResultsPage() {
  if (!(await ownerPageGuard())) return null;
  let records: ProgramOutcomeRecord[];
  try { records = await listProgramOutcomes(); }
  catch { return <div className="wrap py-10"><h1>Shared results</h1><p role="alert">Shared results could not be opened. Refresh this page to try again.</p></div>; }
  const themes = outcomeThemes(records);
  return <>
    <PageIntro kicker="Consultant Workspace" title="Shared results" lede="Accounts colleagues chose to share about a change they tried, grouped by ADSA goal and by outcome. Read them for themes: what helped, what got in the way, what to try next." />
    <div className="wrap space-y-8 py-8">
      <section className="card p-6">
        <h2 className="text-2xl font-semibold">Reading these accounts</h2>
        <p>Each account is the contributor&apos;s own report: application-level evidence from a participant, not an independent observation. Look for what recurs across accounts and what differs. Carry a theme into a <Link href="/consultant/program">Plan-Do-Study-Act cycle</Link> when it points to something worth testing. An empty group means not yet evidenced, never that nothing changed.</p>
      </section>
      {!records.length ? <p>No accounts have been shared yet.</p> : <>
        {themes.byGoal.length ? <section aria-labelledby="by-goal" className="space-y-4"><h2 id="by-goal" className="text-2xl font-semibold">By ADSA goal</h2>{themes.byGoal.map(group => <Theme key={group.key} group={group} />)}</section> : null}
        {themes.byOutcome.length ? <section aria-labelledby="by-outcome" className="space-y-4"><h2 id="by-outcome" className="text-2xl font-semibold">By outcome</h2>{themes.byOutcome.map(group => <Theme key={group.key} group={group} />)}</section> : null}
        {themes.unlinked.length ? <section aria-labelledby="unlinked" className="space-y-4"><h2 id="unlinked" className="text-2xl font-semibold">Not linked to a goal or outcome</h2><Theme group={{ key: "unlinked", heading: "Accounts to place", detail: "Decide which goal or outcome each speaks to when you read it.", records: themes.unlinked }} /></section> : null}
      </>}
    </div>
  </>;
}
