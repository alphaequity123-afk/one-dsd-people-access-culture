/**
 * Each area's front door: its own collections and tools, the layout the Disability Services Division page set
 * (owner, 2026-11-15). DSD's is the fullest; each administration decides what it keeps here. An area with no
 * collections listed shows the collections most of whose resources belong to it.
 */
export type AreaDoor = { collections: Array<[string, string]>; tools: Array<[string, string, string]> };

/** When the division zone is configured, its complete program shares the agency origin. */
export const DSD_SITE = process.env.DHS_DSD_ZONE_ORIGIN ? "" : "https://one-people-access-culture.up.railway.app";

export const AREA_DOORS: Record<string, AreaDoor> = {
  dsd: {
    collections: [
      ["disability-services-policies", "Policies that shape disability services."],
      ["equity-data", "Explore service use across groups and years to inform questions about access."],
      ["equity-director-toolkit", "Find templates and guidance to plan, carry out and review equity work."],
      ["community-outreach", "Find connections with counties, providers and community organizations."],
      ["program-foundation", "The program's purpose, model and plan."],
      ["curricula-water-we-swim-in-self-directed", "Practice for the Moments That Matter."],
    ],
    tools: [
      ["Complete One DSD program", `${DSD_SITE}/one-dsd`, "Explore the division's program, leadership resources, planning tools and working examples."],
      ["Analyze a document", `${DSD_SITE}/equity-review/analyze`, "Review a draft for barriers to access and implications for the people affected."],
      ["Equity Analysis Toolkit", `${DSD_SITE}/learn/equity-toolkit`, "Examine a decision through evidence, community perspectives and possible alternatives."],
      ["Practice planners", `${DSD_SITE}/practice`, "Develop a plan for a meeting, community engagement or public communication."],
      ["My Work", `${DSD_SITE}/my-work`, "Your plans, reflections and saved resources."],
    ],
  },
};
