import { getPath } from "@/lib/content/paths";
import { publishedPracticePath } from "@/lib/content/published-practice-path";
import { applyGraduationPathValues } from "@/lib/content/staff-surface-registry";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";

const CLOSED_REQUEST = /\b(?:submit|send|start|open|track|complete)\b[^.!?]{0,100}\b(?:consultation|consultant)\b|\b(?:consultation|consultant)\b[^.!?]{0,100}\b(?:request|form|submit|track)\b/i;
const currentConsultation = (text: string) => text.split(/(?<=[.!?])\s+/).map(sentence => CLOSED_REQUEST.test(sentence)
  ? "Staff consultation request forms are closed. Use Find the right person to identify the responsible role or office." : sentence).join(" ");

/** The published path page transforms saved copy before rendering. Ask must
 * index the same safe presentation, not retained editable fields. */
export function practicePathSearchValues(surfaceId: string, values: EditableSurfaceValues): EditableSurfaceValues | undefined {
  if (!surfaceId.startsWith("graduation-path.")) return undefined;
  const raw = getPath(surfaceId.slice("graduation-path.".length));
  if (!raw) return undefined;
  const path = publishedPracticePath(applyGraduationPathValues(raw, values));
  const steps = path.steps.flatMap(step => {
    const closedConsultation = step.links.some(link => link.href.startsWith("/support/request"));
    if (closedConsultation) return ["Find the right person when needed", "If another perspective would help, use Find the right person to identify the responsible role or office. Staff consultation request forms are closed."];
    return [step.title, step.guidance, ...step.links.map(link => link.label)];
  });
  const projected: Record<string, string | string[]> = {
    title: path.title, staffLabel: path.staffLabel, startingCompetence: path.startingCompetence,
    graduatedLooksLike: path.graduatedLooksLike, steps, artifactTitle: path.artifactTitle,
    artifactFields: path.artifactFields.flatMap(field => [field.label, field.help]),
    review: [...path.antiPerformative.fake, ...path.antiPerformative.real], privacy: path.privacy,
  };
  return Object.fromEntries(Object.entries(projected).map(([key, value]) => [key, typeof value === "string" ? currentConsultation(value) : Array.isArray(value) ? value.map(currentConsultation) : value]));
}
