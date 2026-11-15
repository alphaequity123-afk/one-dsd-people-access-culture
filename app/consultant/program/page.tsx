import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { ownerPageGuard } from "@/lib/auth/owner-page";
import { ProgramWorkControls, ProgramObservationForm, ManualPreparationForm } from "@/components/program-work-controls";
import { listProgramWork, summarizeProgramWork } from "@/lib/program/work";
import { receiptBodyForDisplay } from "@/lib/program/receipt-display";
import { ProgramWorkSummary } from "@/components/program-work-summary";
import { programWorkSummary } from "@/lib/program/work-summary";
import { programFunctions } from "@/lib/program/model";
import { getStore, storeIsPersistent } from "@/lib/intelligence/memory/store";
import { leadersKey } from "@/lib/auth/leaders";
export const metadata:Metadata={title:"Program work"};
export const dynamic="force-dynamic";
const labels:Record<string,string>={queued:"Ready to begin",started:"In progress",completed:"Preparation produced",prepared:"Preparation recorded",decision_recorded:"Decision reported",failed:"Unfinished",cancelled:"Stopped",retry_requested:"Ready to revise",applied:"Implementation reported",reviewed:"Reviewed",results_recorded:"Results reported",results_reported:"Results reported",implementation_reported:"Implementation reported",decision_reported:"Decision reported",prepared_for_review:"Prepared for review",stopped:"Stopped"};
export default async function ProgramWorkPage(){
  if (!(await ownerPageGuard())) return null;
  let items:Awaited<ReturnType<typeof listProgramWork>>;
  try{items=await listProgramWork();}catch{return <div className="wrap py-10"><h1>Program work</h1><p role="alert">Program work could not be opened. Refresh this page to try again.</p></div>;}
  const summary=summarizeProgramWork(items);
  return <>
    <PageIntro kicker="Consultant Workspace" title="Priorities, preparation and follow-through" lede="This page is for the consultant, the Equity and Inclusion Operations Consultant for the Disability Services Division (DSD). Use it to connect an approved priority with evidence, affected perspectives, a reasoned recommendation, and the responsible next step."/>
    <div className="wrap space-y-8 py-8">
      <ProgramWorkControls/>
      {(()=>{const key=leadersKey();return <section className="card p-6" aria-labelledby="leaders-key-heading"><h2 id="leaders-key-heading" className="text-2xl font-semibold">Equity baseline access for managers and supervisors</h2><p>The <Link href="/data/equity-baseline">equity baseline</Link> is for Disability Services Division managers and supervisors and for you. They open it with the leaders access key below. Share it in person or by direct message, not in a group post. The key changes only when the owner key changes.</p>{key?<details className="mt-3"><summary>Show the leaders access key</summary><p className="mt-2"><code>{key}</code></p></details>:<p role="alert">Leaders access is not set up, so the equity baseline is locked.</p>}</section>;})()}
      <section className="card p-6"><h2 className="text-2xl font-semibold">A contribution is not a decision</h2><p>Prepare the analysis, name what remains unknown, and identify who can decide. Record an authorized decision only when it has actually been made. Implementation and observed results remain separate from the draft and from one another.</p><p className="mt-3">You can prepare work manually with automated assistance off. Sources, authority, privacy and evidence standards remain the same; the two paths do not promise identical reasoning.</p><p className="mt-3"><Link href="/program/model">Explore learning and practice</Link> · <Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link> · <Link href="/equity-review">Prepare an equity review</Link></p></section>
      <section className="card p-6" aria-labelledby="work-evidence-heading">
        <h2 id="work-evidence-heading" className="text-2xl font-semibold">What the work shows</h2>
        <p>{summary.completed} completed · {summary.failed} unfinished · {summary.queued} ready or in progress · {summary.cancelled} stopped.</p>
        <p>{summary.eligible} work items count toward the completion measure: {summary.autonomousCompleted} completed without a recorded request to retry or stop, and {summary.assistedCompleted} completed with one.</p>
        <p>{summary.autonomousShare===null?"Nothing has been recorded for this measure yet.":summary.autonomousShare+"% of the work counted was completed without a recorded request to retry or stop."} This describes preparation only. It is not a target for employee performance or evidence that equity improved.</p>
        <p>{items.filter(task=>task.status==="prepared").length} manually prepared contributions recorded. These are kept separate from assisted completion measures.</p>
        <p className="text-sm text-muted">Period: {summary.period.since??"No start recorded"} to {summary.period.until}. {storeIsPersistent(getStore()) ? "Saved records are kept." : "Saved records are temporary and may be lost when the program restarts."} Help or time that was not recorded is not counted.</p>
        <p>{summary.applicationReports} work items include a report of how they were used; {summary.reviewed} have a recorded review; {summary.resultReports} include reported results with evidence and limitations.</p>
      </section>
      <section aria-labelledby="work-items-heading"><h2 id="work-items-heading" className="text-2xl font-semibold">Work and follow-through</h2>
        {!items.length&&<p className="mt-4">Add a work item, or prepare the program-area resource reviews, to begin.</p>}
        <div className="mt-5 space-y-6">{items.map(task=><article key={task.id} className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="kicker">{programFunctions.find(f=>f.id===task.functionId)?.title??task.functionId}</p><h3 className="text-xl font-semibold">{task.title}</h3></div><span className="tag">{labels[task.progressStage]??task.progressStage}</span></div>
          <p className="mt-3">{task.objective}</p>
          <p className="text-sm text-muted">Ready from {task.dueAt.slice(0,10)} · Attempt {task.attempts} · {task.evidenceMode==="verification"?"Verification work":"Operational preparation"}</p>
          {task.receipt&&<section className="mt-5 border-t pt-5" aria-label={"Result for "+task.title}>
            <h4 className="font-semibold">Saved result</h4><div className="mt-3 whitespace-pre-wrap">{receiptBodyForDisplay(task.receipt.body, task.receipt.method)}</div>
            <ul className="mt-4 list-disc pl-5">{task.receipt.references.map((reference,index)=><li key={reference.href+index}><Link href={reference.href}>{reference.label}</Link></li>)}</ul>
          </section>}
          {task.events.findLast(event=>event.phase==="prepared")?.preparationPlan&&<section className="mt-4 border-t pt-4"><h4 className="font-semibold">Preparation and follow-through plan</h4><p>Needed reviews: {task.events.findLast(event=>event.phase==="prepared")?.preparationPlan?.reviewNeeds}</p><p>Proposed check: {task.events.findLast(event=>event.phase==="prepared")?.preparationPlan?.measure}</p><p>Report back to: {task.events.findLast(event=>event.phase==="prepared")?.preparationPlan?.reportBack}</p><p>These identify needed work; they do not record completed reviews or an approved measure.</p></section>}
          {task.executionMode==="manual"&&["queued","retry_requested","failed"].includes(task.status)&&<ManualPreparationForm task={task}/>}
          {task.events.filter(event=>event.phase==="decision_recorded").map(event=><section key={event.id} className="mt-4 border-t pt-4"><h4 className="font-semibold">Reported decision and next action</h4><p>Decision by {event.decisionOwner} · {event.decisionReference}</p><p>{event.nextAction}</p><p>Implementation responsibility: {event.implementationOwner}. This is the consultant&apos;s record; the program does not independently validate approval.</p></section>)}
          <ProgramObservationForm key={task.lastEventId??task.id} task={task}/>
          <ProgramWorkSummary text={programWorkSummary(task)}/>
          <details className="mt-5"><summary className="cursor-pointer font-semibold">Attempts and receipts ({task.events.length})</summary>
            <ol className="mt-3 space-y-4">{task.events.map(event=><li key={event.id} className="border-t pt-3">
              <p><strong>{labels[event.phase]??event.phase}</strong> · {event.at} · {event.actor==="owner"?"You":"The program"}</p><p>{event.note}</p>{event.phase==="results_recorded"&&<div className="mt-2"><p>Observed change: {event.resultObservation}</p><p>Evidence: {event.resultEvidence}</p><p>Limitations: {event.resultLimitations}</p><p>Observation status: {event.resultConfidence?.replaceAll("_"," ")}. This report is not independent verification of benefit or causation.</p></div>}
              {event.receipt&&<details><summary>See what this attempt produced</summary><div className="mt-3 whitespace-pre-wrap">{receiptBodyForDisplay(event.receipt.body, event.receipt.method)}</div><p className="break-all text-sm">Receipt {event.id} · {event.receipt.method} · content fingerprint {event.receipt.contentHash}</p></details>}
            </li>)}</ol>
          </details>
        </article>)}</div>
      </section>
    </div>
  </>;
}
