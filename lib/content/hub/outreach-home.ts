// The task cards and the five-step cycle on the Community Outreach and Engagement
// front page. Shared by the page and its downloadable copy. The step titles and
// bodies are owner-editable copy in hub-surface.ts.

export type OutreachLink = { label: string; href: string };
export type OutreachTask = { title: string; body: string; href: string; action: string };
export type OutreachStep = { key: "Understand" | "Learn" | "Connect" | "Engage" | "Report"; capability: string; links: OutreachLink[] };

export const OUTREACH_TASKS: OutreachTask[] = [
  { title: "I'm preparing to meet a community", body: "Read who the community is, how people differ within it, dated figures and questions to ask.", href: "/minnesota-communities", action: "Minnesota Communities" },
  { title: "I need to find an organization", body: "See organizations connected with the Disability Services Division, what they do and the public records behind each connection.", href: "/community-outreach/organizations", action: "Organization directory" },
  { title: "I'm planning an engagement", body: "Work through the questions to answer before you reach out, then draft an engagement and report-back plan.", href: "/community-outreach/plan", action: "Plan an engagement" },
  { title: "I need to reach people", body: "Find colleges, workforce programs, associations, media, community places and events for recruitment, outreach and engagement.", href: "/community-outreach/sources", action: "Where to reach people" },
  { title: "I need to understand who does what", body: "See how the Department of Human Services, the Disability Services Division, other divisions, lead agencies and providers connect, and which designated agencies serve each county.", href: "/community-outreach/how-the-system-connects", action: "How the system connects" },
  { title: "I need to know which policy applies", body: "Find the statutes, rules, manual chapters, waiver plans and department policies that govern disability services, each summarized in plain language with what it requires and what to check for equity.", href: "/community-outreach/policies", action: "Policies that shape disability services" },
  { title: "I'm looking at the numbers", body: "Compare each county's population with the people receiving home and community-based services, by race and ethnicity.", href: "/community-outreach/county-map", action: "Minnesota county map" },
  { title: "I need to analyze a document", body: "Attach or paste a policy, program description, notice or plan and get an analysis typed as evidence, inference or gap, with next steps in this program.", href: "/equity-review/analyze", action: "Analyze a document" },
];

export function outreachSteps(organizationCount: number): OutreachStep[] {
  return [
    { key: "Understand", capability: "Cultural intelligence: drive, the motivation to learn and adapt.", links: [{ label: "Cultural Intelligence collection", href: "/learn/cultural-intelligence" }, { label: "The water we swim in", href: "/learn/water-we-swim-in" }] },
    { key: "Learn", capability: "Cultural intelligence: knowledge of how cultures shape needs and choices.", links: [{ label: "Minnesota Communities", href: "/minnesota-communities" }, { label: "Minnesota county map", href: "/community-outreach/county-map" }] },
    { key: "Connect", capability: "Cultural intelligence: strategy, planning before you act.", links: [{ label: `Organization directory (${organizationCount} organizations)`, href: "/community-outreach/organizations" }, { label: "Where to reach people", href: "/community-outreach/sources" }, { label: "County agencies", href: "/community-outreach/county-agencies" }, { label: "Providers and designated agencies", href: "/community-outreach/providers" }, { label: "Policies that shape disability services", href: "/community-outreach/policies" }, { label: "How the system connects", href: "/community-outreach/how-the-system-connects" }, { label: "Find the right person", href: "/support/right-person" }] },
    { key: "Engage", capability: "Cultural intelligence: action, adapting what you do in the moment.", links: [{ label: "Community engagement: from input to action", href: "/learn/community-connections" }, { label: "Plan an engagement", href: "/community-outreach/plan" }, { label: "Analyze a document", href: "/equity-review/analyze" }, { label: "Equity Analysis Toolkit", href: "/learn/equity-toolkit" }] },
    { key: "Report", capability: "Cultural intelligence: strategy again, checking what worked and what to change.", links: [{ label: "Report-back plan", href: "/community-outreach/plan#report-back" }] },
  ];
}
