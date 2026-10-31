import { createHash } from "node:crypto";
import { ProgramEventSchema, ProgramTaskSchema, type ProgramEvent, type ProgramTask } from "./work-schema";

export type ProgramAppendResult = { applied: true; event: ProgramEvent } | { applied: false; reason: "not_found" | "conflict" | "invalid_transition"; event: ProgramEvent | null };
export function orderedProgramEvents(events: ProgramEvent[]) {
  return [...events].sort((a,b) => a.at.localeCompare(b.at) || a.attempt-b.attempt || a.id.localeCompare(b.id));
}
export function programState(task: ProgramTask, input: ProgramEvent[]) {
  const events = orderedProgramEvents(input.filter(e => e.taskId === task.id));
  const execution = events.filter(e => ["started","completed","prepared","failed","cancelled","retry_requested"].includes(e.phase));
  const latest = execution.at(-1);
  const currentDraftEvents = latest && ["prepared","completed"].includes(latest.phase) ? events.filter(event=>event.at>latest.at) : [];
  const progressStage = latest?.phase === "cancelled" ? "stopped" : currentDraftEvents.some(event=>event.phase==="results_recorded") ? "results_reported" : currentDraftEvents.some(event=>event.phase==="applied") ? "implementation_reported" : currentDraftEvents.some(event=>event.phase==="decision_recorded") ? "decision_reported" : latest && ["prepared","completed"].includes(latest.phase) ? "prepared_for_review" : latest?.phase ?? "queued";
  return { progressStage, events, lastEventId: events.at(-1)?.id ?? null, status: latest?.phase ?? "queued",
    decisionRecorded: Boolean(latest && ["prepared","completed"].includes(latest.phase) && events.some(event=>event.phase==="decision_recorded" && event.at>latest.at)),
    implementationRecorded: Boolean(latest && ["prepared","completed"].includes(latest.phase) && events.some(event=>event.phase==="applied" && event.at>latest.at)),
    attempts: Math.max(0, ...events.map(e=>e.attempt)),
    receipt: latest && ["completed","prepared"].includes(latest.phase) ? latest.receipt : undefined,
    humanInterventions: events.filter(e => e.actor === "owner" && ["retry_requested","cancelled"].includes(e.phase)).length };
}
export function validProgramTransition(task: ProgramTask, events: ProgramEvent[], event: ProgramEvent): boolean {
  const current=programState(task, events), last=current.events.at(-1);
  if(event.taskId!==task.id || (last && event.at<=last.at)) return false;
  const definition=event.preparationPlan?.measureDefinition;
  if(definition && (event.phase!=="prepared" || definition.id!=="measure-"+task.id.slice(5) || definition.version!==Math.max(0,...events.map(previous=>previous.preparationPlan?.measureDefinition?.version??0))+1)) return false;
  if(event.receipt && createHash("sha256").update(event.receipt.body).digest("hex")!==event.receipt.contentHash) return false;
  if(event.phase==="prepared") return task.executionMode==="manual" && event.actor==="owner" && event.attempt===current.attempts
    && ["queued","retry_requested","failed"].includes(current.status) && event.receipt?.method==="owner_report" && event.receipt.evidenceLevel==="delivery";
  if(event.phase==="started") return task.executionMode!=="manual" && event.actor==="agent" && event.attempt===current.attempts+1 && (
    current.status==="queued" || current.status==="retry_requested" ||
    (current.status==="failed" && current.attempts<3) ||
    (current.status==="started" && Date.parse(event.at)-Date.parse(current.events.findLast(e=>e.phase==="started")!.at)>=600000));
  if(["completed","failed"].includes(event.phase)) return event.actor==="agent" && current.status==="started" && event.attempt===current.attempts
    && (event.phase!=="completed" || event.receipt?.evidenceLevel==="delivery");
  if(event.actor!=="owner" || event.attempt!==current.attempts || event.receipt) return false;
  if(event.phase==="cancelled") return current.status!=="cancelled";
  if(event.phase==="retry_requested") return ["failed","cancelled","completed","prepared"].includes(current.status);
  return ["decision_recorded","applied","reviewed","results_recorded"].includes(event.phase) && ["completed","prepared"].includes(current.status) && Boolean(current.receipt)
    && (event.phase!=="applied" || current.decisionRecorded) && (event.phase!=="results_recorded" || current.implementationRecorded);
}
export function evaluateProgramAppend(taskValue: unknown, eventValues: unknown[], expectedEventId: string|null, input: ProgramEvent): ProgramAppendResult {
  const task=ProgramTaskSchema.safeParse(taskValue), event=ProgramEventSchema.parse(input);
  if(!task.success || task.data.id!==event.taskId) return {applied:false,reason:"not_found",event:null};
  const events=eventValues.flatMap(value=>{const parsed=ProgramEventSchema.safeParse(value);return parsed.success&&parsed.data.taskId===event.taskId?[parsed.data]:[];});
  const replay=events.find(e=>e.id===event.id);
  if(replay) return JSON.stringify(replay)===JSON.stringify(event) ? {applied:true,event:replay} : {applied:false,reason:"conflict",event:replay};
  const current=programState(task.data,events);
  if(current.lastEventId!==expectedEventId) return {applied:false,reason:"conflict",event:current.events.at(-1)??null};
  if(!validProgramTransition(task.data,events,event)) return {applied:false,reason:"invalid_transition",event:current.events.at(-1)??null};
  return {applied:true,event};
}
