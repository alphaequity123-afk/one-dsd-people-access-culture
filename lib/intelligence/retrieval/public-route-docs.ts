import "server-only";
import { createHash } from "node:crypto";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { Doc } from "./search";

// These are the public landing-page introductions, not the course lists or
// visitor-created work. Course records have their own publication checks.
const pages = [
  {
    id: "collaboration", href: "/learn/collaboration", title: "Teams and Cross-Collaboration",
    summary: "Good collaboration helps people contribute, understand one another, and carry shared work forward.",
    detail: "Explore learning for your team, work across DSD and ADSA, and relationships with partners. Foundation, intermediate, and advanced describe learning depth, not job rank.",
    links: ["/learn"], tags: ["teams", "collaboration", "partners"],
  },
  {
    id: "diversity", href: "/learn/diversity", title: "Diversity: understanding and practice",
    summary: "Explore identity, culture, privilege, bias, and belonging through explanation, realistic situations, reflection, and practice.",
    detail: "Foundation, Intermediate, and Advanced describe the depth of the material. They do not label you or restrict where you can begin.",
    links: ["/learn"], tags: ["diversity", "identity", "bias", "belonging"],
  },
  {
    id: "emotions-and-values", href: "/learn/emotions-and-values", title: "Emotions, Values, and Everyday Practice",
    summary: "Understand your responses, explore different perspectives, and put that understanding to work in conversations and decisions.",
    detail: "Begin with emotional awareness or your own cultural-value lens, then move into conversations and practical decisions. Each course stands on its own. There is no personal assessment to complete.",
    links: ["/learn", "/learn/equity-toolkit/practice", "/practice/clas", "/support/right-person"], tags: ["emotions", "values", "conversations", "decisions"],
  },
  {
    id: "engagement-resources", href: "/learn/engagement-resources", title: "Community engagement and cultural access resources",
    summary: "Move from understanding the approach to planning participation, checking access, and following through.",
    detail: "Orient your team; build the plan; check readiness; strengthen cultural and language access. ADSA materials describe their administration’s context, including internal processes and contacts. Their inclusion does not make every example a requirement for every service.",
    links: ["/learn/community-connections", "/practice/clas", "/learn/equity-toolkit", "/practice/measurement", "/ask"], tags: ["community engagement", "participation", "language access"],
  },
  {
    id: "tribal-referral", href: "/learn/tribal-referral", title: "Native American and Tribal-specific guidance",
    summary: "For Native American and Tribal-specific learning, questions, or engagement, connect with the appropriate DHS office or responsible Tribal liaison.",
    detail: "One DSD refers this work to those offices rather than providing its own training.",
    links: ["/support/right-person", "/learn"], tags: ["Tribal", "Native American", "referral"],
  },
  {
    id: "understanding-dhs", href: "/understanding-dhs", title: "Understanding DHS",
    summary: "People, programs and partnerships across Minnesota DHS, with a closer look at Disability Services and the work we share.",
    detail: "This reference brings together responsibilities, services and relationships. Program summaries accompany the original sources, which carry current policy and contact information.",
    links: ["/ask", "/learn"], tags: ["DHS", "Disability Services", "partners", "organization"],
  },
] as const;

/** Landing text only: organizational facts retain their independent external
 * source/freshness status in organizationalDocs(), rather than being copied
 * here as if they were current agency policy. */
export function publicRouteDocs(scope: StaffProgramScope): Doc[] {
  return pages.map(page => ({
    kind: "content", id: `public-route-${page.id}`, title: page.title, href: page.href,
    authority: "learning", type: "public_learning_hub", status: "approved", reviewDate: "",
    scope: scope === "dsd" ? "dsd" : "agencywide", summary: page.summary,
    text: `${page.title}\n${page.summary}\n${page.detail}`, tags: [...page.tags], intents: [], graphRelated: [...page.links],
    evidenceRevisions: [{ sourceId: `public-route-${page.id}`, revisionId: null,
      payloadHash: createHash("sha256").update(JSON.stringify(page)).digest("hex"), scope }],
  }));
}
