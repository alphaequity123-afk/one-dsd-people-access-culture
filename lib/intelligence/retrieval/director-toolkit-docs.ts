import "server-only";
import { createHash } from "node:crypto";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import {
  DIRECTOR_TEMPLATES, DIRECTOR_TEMPLATES_HREF, DIRECTOR_TOOLKIT_HREF, DIRECTOR_TOOLKIT_INTRO, DIRECTOR_TOOLKIT_REVIEWED_ON, DIRECTOR_TOOLKIT_SECTIONS,
  sectionHref, sectionText, templateDescriptionText, templateHref,
} from "@/lib/content/director-toolkit";
import type { Doc } from "./search";

/** Ids are prefixed "public-" so the Ask audit boundary projects them to opaque asset ids. */
export const DIRECTOR_TOOLKIT_DOC_PREFIX = "public-director-toolkit-";

/**
 * One Ask document for the toolkit overview, one per numbered section (its own anchor) and one per fill-in template
 * (its own anchor), so retrieval lands on the exact passage. Code-defined, public guidance only: what a person types
 * into a template never leaves their browser and is never read here.
 */
export function directorToolkitDocs(scope: StaffProgramScope): Doc[] {
  const docScope = scope === "dsd" ? "dsd" : "agencywide";
  const make = (id: string, title: string, href: string, summary: string, text: string, tags: string[], related: string[], type: string, intents: Doc["intents"]): Doc => ({
    kind: "content", id: `${DIRECTOR_TOOLKIT_DOC_PREFIX}${id}`, title, href, authority: "guidance", type, status: "approved", reviewDate: DIRECTOR_TOOLKIT_REVIEWED_ON,
    scope: docScope, summary, text, tags: ["Equity Director toolkit", "equity director", ...tags], intents, graphRelated: [...new Set(related)],
    evidenceRevisions: [{ sourceId: `${DIRECTOR_TOOLKIT_DOC_PREFIX}${id}`, revisionId: null, payloadHash: createHash("sha256").update(text).digest("hex"), scope }],
  });
  const overview = make("overview", DIRECTOR_TOOLKIT_INTRO.title, DIRECTOR_TOOLKIT_HREF, DIRECTOR_TOOLKIT_INTRO.lede,
    [DIRECTOR_TOOLKIT_INTRO.title, DIRECTOR_TOOLKIT_INTRO.lede, ...DIRECTOR_TOOLKIT_INTRO.summary, DIRECTOR_TOOLKIT_INTRO.privacy,
      "Sections:", ...DIRECTOR_TOOLKIT_SECTIONS.map(section => `${section.number}. ${section.title}: ${section.question}`),
      `Printable templates: ${DIRECTOR_TEMPLATES.map(template => template.title).join("; ")}.`].join("\n"),
    ["DEI tools", "equity tools", "toolkit overview"], [DIRECTOR_TEMPLATES_HREF, "/equity-review", "/equity-policy", "/learn/equity-toolkit"], "public_director_toolkit", ["policy_orientation", "next_actions"]);
  const sections = DIRECTOR_TOOLKIT_SECTIONS.map(section => {
    const templates = [...new Set(section.items.flatMap(item => item.templateId ? [item.templateId] : []))];
    const related = [DIRECTOR_TOOLKIT_HREF, ...templates.map(templateHref), ...section.items.flatMap(item => item.href ? [item.href] : []), ...(section.related ?? []).map(link => link.href)];
    return make(`section-${section.id}`, `Equity Director toolkit: ${section.title}`, sectionHref(section.id), section.question, sectionText(section),
      [section.title, ...section.items.map(item => item.name)], related, "public_director_toolkit_section",
      section.id === "first-90-days" || section.id === "starter-package" ? ["next_actions", "practice_method"] : ["practice_method"]);
  });
  const templates = DIRECTOR_TEMPLATES.map(template => make(`template-${template.id}`, `${template.title} template`, templateHref(template.id), template.purpose,
    templateDescriptionText(template), [template.title, "template", "worksheet", "checklist", "printable"], [DIRECTOR_TEMPLATES_HREF, sectionHref(template.sectionId)],
    "public_director_toolkit_template", ["practice_method", "next_actions"]));
  return [overview, ...sections, ...templates];
}
