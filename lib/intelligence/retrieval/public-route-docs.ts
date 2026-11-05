import "server-only";
import { createHash } from "node:crypto";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { Doc } from "./search";

// These are the public landing-page introductions, not the course lists or
// visitor-created work. Course records have their own publication checks.
const pages = [
  {
    id: "equity-review-analyze", href: "/equity-review/analyze", title: "Analyze a document",
    summary: "Attach or paste a policy, program description, notice or plan and get each question answered as evidence, inference or gap, with next steps in this program.",
    detail: "Choose one of six analysis methods: equity analysis, policy review, program analysis, engagement plan, plain language, or a legislatively required working group plan. Each question gets an answer typed as evidence (a quotation from the material), inference (a conclusion drawn from it) or gap (something the material does not settle), with next steps that point to pages in this program. Nothing uploaded or pasted is stored; the result goes back to the browser only, and can be printed, copied or kept in that browser.",
    links: ["/equity-review", "/learn/equity-toolkit", "/community-outreach/plan", "/equity-review/working-group-plan"], tags: ["analyze a document", "document analysis", "policy", "notice", "plan", "evidence", "inference", "gap", "equity analysis"],
  },
  {
    id: "equity-review-working-group-plan", href: "/equity-review/working-group-plan", title: "Plan a legislatively required working group",
    summary: "This page turns that charge into a month-by-month plan, using the Waiver Case Management Advisory Working Group as the worked example, and shows how to reuse the plan for another group.",
    detail: "The charge from 2026 Session Law chapter 121, article 9, section 53: purpose, nine member groups, monthly meetings under the open meeting law, seven duties, report due September 1, 2027. A roadmap, ten meetings, a consistent method for every topic, topic plans with evidence, discussion, approach and expected output, a recommendation record, report checkpoints, kickoff decisions, and steps to reuse the plan.",
    links: ["/equity-review", "/community-outreach/how-the-system-connects", "/community-outreach/plan"], tags: ["working group", "task force", "legislative report", "waiver case management", "lead agency", "statutory duties"],
  },
  {
    id: "community-outreach-how-the-system-connects", href: "/community-outreach/how-the-system-connects", title: "How the system connects",
    summary: "This page shows how those parts connect, with a source for each point.",
    detail: "How the Department of Human Services, the Disability Services Division, other divisions and offices, lead agencies and providers connect in Minnesota disability services: structure, lead agency types, division and department roles, referral paths, Tribal Nations and a plain-language glossary.",
    links: ["/community-outreach/county-agencies", "/community-outreach/providers", "/learn/tribal-referral"], tags: ["lead agency", "Department of Human Services", "Disability Services Division", "structure", "referral"],
  },
  {
    id: "community-outreach-providers", href: "/community-outreach/providers", title: "Providers and designated agencies",
    summary: "Each entry names the public record of its designation.",
    detail: "Centers for Independent Living, area agencies on aging, health plans under contract, Disability Hub MN, licensed home and community-based services providers and other state-designated agencies, with the counties each serves.",
    links: ["/community-outreach/how-the-system-connects", "/community-outreach/county-agencies", "/community-outreach/county-map", "/learn/tribal-referral"], tags: ["providers", "designated", "centers for independent living", "area agencies on aging", "health plans", "licensed"],
  },
  {
    id: "community-outreach-sources", href: "/community-outreach/sources", title: "Where to reach people",
    summary: "These are possible sources, not partners.",
    detail: "Places to find job candidates, share information and involve community members across Minnesota: state hiring programs, workforce programs, colleges and universities, professional associations, community media, community institutions, venues and cultural events.",
    links: ["/community-outreach", "/learn/tribal-referral"], tags: ["recruitment", "outreach", "engagement", "media", "events", "colleges", "workforce"],
  },
  {
    id: "community-outreach-plan", href: "/community-outreach/plan", title: "Plan an engagement",
    summary: "Answer these questions before you reach out. Then draft your engagement and report-back plan below.",
    detail: "Questions about your own lens, the decision, the community, who to involve, language and access, compensation, report-back and Tribal Nations, practice situations, and a fill-in engagement and report-back plan. The page saves nothing.",
    links: ["/community-outreach", "/minnesota-communities", "/community-outreach/organizations", "/learn/community-connections"], tags: ["community outreach", "community engagement", "report back", "planning"],
  },
  {
    id: "community-outreach-county-map", href: "/community-outreach/county-map", title: "Minnesota county map",
    summary: "A difference is a question to look into, not an explanation.",
    detail: "Compare each Minnesota county's population with the people receiving home and community-based services, and earned income, by race and ethnicity, from Department of Human Services public dashboards.",
    links: ["/community-outreach", "/minnesota-communities", "/community-outreach/plan"], tags: ["county", "map", "home and community-based services", "race and ethnicity", "equity data"],
  },
  {
    id: "community-outreach-organizations", href: "/community-outreach/organizations", title: "Organizations connected with the Disability Services Division",
    summary: "Each page lists the records it rests on.",
    detail: "Grantees, contractors, partners and advisory members of the Disability Services Division, filtered by community and type of connection, each with the public records behind the connection.",
    links: ["/community-outreach"], tags: ["community outreach", "organizations", "grantees", "partners"],
  },
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
    summary: "For Native American and Tribal-specific learning, questions, or engagement, connect with the appropriate Department of Human Services office or responsible Tribal liaison.",
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
