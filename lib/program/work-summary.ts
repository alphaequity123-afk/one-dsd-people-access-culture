import { adsaWorkAction } from "./adsa-work-links";
import { measureDefinitionFields } from "./measure-definition-fields";
import type { ProgramWorkView } from "./work";

/** A review handoff, not a certification or a replacement for official records. */
export function programWorkSummary(task: ProgramWorkView): string {
  const lines = ["One DSD People, Access and Culture", task.title, "Working summary for human review", "This is a preparation and reported follow-through record. It does not grant authority, certify a source, establish causation or replace official agency records.", "", "QUESTION AND SCOPE", task.objective, "", "CURRENT POSITION", task.progressStage.replaceAll("_", " ")];
  if(task.goalActionIds?.length) lines.push("", "OPTIONAL ADSA PLAN CONNECTION", "These selected action steps describe relevance, not completed action, verified adoption or an agency-wide mandate.", ...task.goalActionIds.map(id=>{const action=adsaWorkAction(id);return action?`${id} · Goal ${action.goalNumber}: ${action.goalTitle}\n${action.sourceText}\nProgram reference: /program/implementation#${id}`:id;}));
  if (task.receipt) {
    lines.push("", "PREPARED CONTRIBUTION", task.receipt.body, "", "SOURCE AND RESOURCE REFERENCES", ...task.receipt.references.map(reference => `${reference.label}: ${reference.href}`));
    if (!task.receipt.references.length) lines.push("No structured references recorded. Review the contribution's source limitations before relying on it.");
  } else lines.push("No prepared contribution is recorded.");
  const latestPreparation = task.events.findLastIndex(event => event.phase === "prepared" || event.phase === "completed");
  const latestRevision = task.events.findLastIndex(event => event.phase === "retry_requested");
  const currentStart = Math.max(latestPreparation, latestRevision);
  const currentEvents = currentStart >= 0 ? task.events.slice(currentStart) : task.events;
  const plan = currentEvents.findLast(event => event.preparationPlan)?.preparationPlan;
  if (plan) lines.push("", "REVIEWS AND PROPOSED FOLLOW-THROUGH", `Needed reviews: ${plan.reviewNeeds}`, `Proposed check: ${plan.measure}`, `Report back to: ${plan.reportBack}`);
  if (plan?.measureDefinition) {
    const definition=plan.measureDefinition;
    lines.push("", "PROPOSED MEASURE DEFINITION", `Definition: ${definition.id} · version ${definition.version}`, "Status: proposed — reported references do not constitute verified approval", ...measureDefinitionFields.map(field=>`${field.label}: ${definition[field.id]}`));
  }
  for (const event of currentEvents.filter(event => event.actor === "owner" && event.phase !== "prepared")) {
    lines.push("", `${event.phase.replaceAll("_", " ").toUpperCase()} — ${event.at.slice(0, 10)}`, event.note);
    if (event.phase === "decision_recorded") lines.push(`Reported decision person/role: ${event.decisionOwner}`, `Decision reference: ${event.decisionReference}`, `Agreed next action: ${event.nextAction}`, `Responsible implementation role: ${event.implementationOwner}`);
    if (event.phase === "results_recorded") lines.push(`Observed change: ${event.resultObservation}`, `Evidence and comparison: ${event.resultEvidence}`, `Limitations: ${event.resultLimitations}`, `Observation strength: ${event.resultConfidence?.replaceAll("_", " ")}`);
    if (event.followUpAt) lines.push(`Next review recorded: ${event.followUpAt.slice(0, 10)}`);
  }
  if (latestRevision > latestPreparation) lines.push("", "A revised contribution is requested. Earlier decision and implementation reports do not authorize this new revision.");
  if (currentStart > 0) lines.push("", "Earlier revisions remain in the protected work history. This summary focuses on the current revision.");
  return lines.join("\n");
}
