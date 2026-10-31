import { inspectCollaborationText } from "@/lib/collaboration/schema";

/** Check a new generated draft before persistence. This does not verify factual claims. */
export function assertGeneratedPreparation(body: string, references: ReadonlyArray<{ href: string }>): void {
  if (inspectCollaborationText(body)) throw new Error("This prepared draft includes information that does not belong in this workspace, so it has not been saved.");
  const suppliedLinks = new Set(references.map(reference => reference.href));
  const returnedLinks = body.match(/(?:https?|ftp):\/\/[^\s<>)\]"']+/g) ?? [];
  if (returnedLinks.some(link => !suppliedLinks.has(link.replace(/[.,;:]$/, "")))) throw new Error("This prepared draft added a source link that could not be confirmed, so it has not been saved.");
}
