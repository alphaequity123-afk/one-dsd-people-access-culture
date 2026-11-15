import { defineEditableSurface } from "./editable-surface-contract";

export const CULTURAL_INTELLIGENCE_SURFACE_ID = "learn.cultural-intelligence";

const heading = (key: string, label: string) => ({ key, label, kind: "short" as const, required: true, maxLength: 300 });
const body = (key: string, label: string) => ({ key, label, kind: "long" as const, required: true, maxLength: 4_000 });

/**
 * The hub's own publication, separate from learn.intercultural so that withdrawing one
 * topic cannot take the collection with it. It is deliberately not code-approved: a
 * code-approved area falls back to these values after a withdrawal, which would make
 * withdrawal do nothing. The current-program release registers and publishes it.
 */
export const CULTURAL_INTELLIGENCE_SURFACE = defineEditableSurface({
  surfaceId: CULTURAL_INTELLIGENCE_SURFACE_ID,
  route: "/learn/cultural-intelligence",
  scopePolicy: "inheritable",
  label: "Cultural Intelligence collection",
  fields: [
    heading("eyebrow", "Opening section label"), heading("title", "Page title"), body("intro", "Opening description"),
    body("scopeLine", "How the collection connects practices"),
    heading("foundationTitle", "Foundation heading"), body("foundationBody", "Foundation for everyday work"),
    heading("messageTitle", "Central message heading"), body("centralMessage", "Central message"),
    body("foundationBook", "Retired wording (compatibility)"),
    heading("bookTitle", "Retired wording (compatibility)"), body("bookAnchor", "Retired wording (compatibility)"), body("bookCitation", "Retired wording (compatibility)"), body("bookAccess", "Retired wording (compatibility)"),
    body("bookDefinition", "Retired wording (compatibility)"), heading("capabilitiesTitle", "Retired wording (compatibility)"), body("capabilitiesIntro", "Retired wording (compatibility)"),
    body("capabilityDrive", "Retired wording (compatibility)"), body("capabilityKnowledge", "Retired wording (compatibility)"), body("capabilityStrategy", "Retired wording (compatibility)"), body("capabilityAction", "Retired wording (compatibility)"),
    heading("bookContributesTitle", "Retired wording (compatibility)"), body("bookBody", "Retired wording (compatibility)"),
    heading("buildsTitle", "Retired wording (compatibility)"), body("buildsIntro", "Retired wording (compatibility)"),
    heading("buildDisabilityTitle", "Retired wording (compatibility)"), body("buildDisability", "Retired wording (compatibility)"),
    heading("buildServicesTitle", "Retired wording (compatibility)"), body("buildServices", "Retired wording (compatibility)"),
    heading("buildTribalTitle", "Retired wording (compatibility)"), body("buildTribal", "Retired wording (compatibility)"),
    heading("buildMeasuresTitle", "Retired wording (compatibility)"), body("buildMeasures", "Retired wording (compatibility)"),
    heading("differTitle", "Retired wording (compatibility)"), body("differIntro", "Retired wording (compatibility)"),
    heading("differHiringTitle", "Retired wording (compatibility)"), body("differHiring", "Retired wording (compatibility)"),
    heading("differAskingTitle", "Retired wording (compatibility)"), body("bookLimit", "Retired wording (compatibility)"),
    heading("differClustersTitle", "Retired wording (compatibility)"), body("differClusters", "Retired wording (compatibility)"),
    heading("bookEvidenceTitle", "Retired wording (compatibility)"), body("bookEvidence", "Retired wording (compatibility)"), body("trademarkNote", "Retired wording (compatibility)"),
    body("learnBook", "Retired wording (compatibility)"), body("exploreOwnCulture", "The worlds you belong to"), body("exploreBook", "Retired wording (compatibility)"),
    body("applyQuestions", "Questions for a live project"), body("applyRoutine", "Plan, notice and check routine"),
  ],
  approvedValues: {
    eyebrow: "Learning for everyday work",
    title: "Cultural Intelligence collection",
    intro: "This collection helps staff of the Disability Services Division (DSD) build cultural understanding. You will explore your own perspective, learn with people and communities, and bring access and equity into your work.",
    scopeLine: "Cultural intelligence draws on a range of practices and perspectives. No single tool or model tells the whole story.",
    foundationTitle: "Cultural understanding grows through listening and practice",
    foundationBody: "Cultural understanding grows through reflection, listening, and practice with other people. Notice how your background, workplace, and professional assumptions shape your approach. Consider language, disability access, bias, power, and the systems around you. Ask each person what matters to them instead of making assumptions.",
    messageTitle: "This collection cannot replace talking with communities",
    centralMessage: "Knowledge and training never replace direct community engagement, everyday equity conversations and action, or a welcoming, inclusive workplace.",
    foundationBook: "",
    bookTitle: "",
    bookAnchor: "",
    bookCitation: "",
    bookAccess: "",
    bookDefinition: "",
    capabilitiesTitle: "",
    capabilitiesIntro: "",
    capabilityDrive: "",
    capabilityKnowledge: "",
    capabilityStrategy: "",
    capabilityAction: "",
    bookContributesTitle: "",
    bookBody: "",
    buildsTitle: "",
    buildsIntro: "",
    buildDisabilityTitle: "",
    buildDisability: "",
    buildServicesTitle: "",
    buildServices: "",
    buildTribalTitle: "",
    buildTribal: "",
    buildMeasuresTitle: "",
    buildMeasures: "",
    differTitle: "",
    differIntro: "",
    differHiringTitle: "",
    differHiring: "",
    differAskingTitle: "",
    bookLimit: "",
    differClustersTitle: "",
    differClusters: "",
    bookEvidenceTitle: "",
    bookEvidence: "",
    trademarkNote: "",
    learnBook: "",
    exploreOwnCulture: "Consider the communities, experiences and workplaces that shape how you see the world, and stay open to what you may not have noticed.",
    exploreBook: "",
    applyQuestions: "What assumptions might shape this decision? Who is affected, what access do they need, and whose perspective is missing? What can change, and who will tell us whether it helped?",
    applyRoutine: "Plan a next step, notice what happens and check with the people affected. Adjust your approach when you learn something new.",
  },
});

// Preserve the complete persisted surface schema, but only offer current fields
// to the owner editor. Retired values remain stored and are never rendered.
export const CULTURAL_INTELLIGENCE_VISIBLE_FIELDS = new Set([
  "eyebrow", "title", "intro", "scopeLine", "foundationTitle", "foundationBody",
  "messageTitle", "centralMessage", "exploreOwnCulture", "applyQuestions", "applyRoutine",
]);

export function culturalIntelligenceVisibleText(key: string, value: string): string {
  const retiredFraming = /livermore|leading with cultural intelligence|the real secret to success|vitalsource|(?:the|this|his) book|\bCQ\b|one foundation: careful research on culture/i;
  if (!retiredFraming.test(value)) return value;
  const fallback = (CULTURAL_INTELLIGENCE_SURFACE.approvedValues as Record<string, unknown>)[key];
  return typeof fallback === "string" ? fallback : "";
}

export const COMMUNITY_GUIDE_COURSE_PATTERN = /^cultural-intelligence-[a-z0-9-]+$/;

export const CAPABILITY_COURSE_IDS = [
  "dc-i1-what-is-culture",
  "dc-s71-understanding-implicit-bias",
  "div-f05-implicit-bias-iat",
  "dc-i41-using-cultural-frameworks-responsibly",
] as const;

export const LEADER_COURSE_IDS = [
  "dc-i30-culturally-intelligent-leadership",
] as const;

export const LEADER_AREA_GROUPS = [
  { title: "Policy, programs and resources", areaIds: ["policy-program-service", "leadership-systems"] },
  { title: "Workforce and workplace culture", areaIds: ["workforce", "culture-trust"] },
] as const;

export const OWN_CULTURE_COMMUNITY_IDS = ["american", "minnesota", "european-american"] as const;

/** Paths that bring people together around a real decision; the One DSD Team is added in that scope. */
export const FACILITATION_ROUTES = [
  { href: "/practice/gp-5", use: "Plan a session or huddle around what people will use afterward." },
  { href: "/practice/gp-4", use: "Work on participation, candor and everyday team practices with your team." },
  { href: "/practice/gp-3", use: "Plan community engagement with people, while the work can still change." },
] as const;
export const TEAM_FACILITATION_ROUTE = { href: "/one-dsd/team", use: "Bring a practice question to colleagues across the division." } as const;

export type CulturalFramework = {
  id: string;
  name: string;
  /** What kind of claim this is, so a standard, a rule and a promising tool do not read alike. */
  kind: string;
  contributes: string;
  hrefs: readonly string[];
};

export const CULTURAL_FRAMEWORKS: readonly CulturalFramework[] = [
  {
    id: "implicit-bias", name: "Checking assumptions in decisions", kind: "Research and decision practice",
    contributes: "Learn how quick judgments such as familiarity and first impressions can enter a decision, and how shared criteria, a second reader and written reasons keep the decision fair for everyone.",
    hrefs: ["/courses/div-f05-implicit-bias-iat"],
  },
  {
    id: "psychological-safety", name: "Psychological safety and a culture of safety", kind: "Workplace practice",
    contributes: "Make room for people to ask questions, raise concerns and learn together. Attend to access, power and whether people can participate without fear of being dismissed or penalized.",
    hrefs: ["/practice/gp-4"],
  },
  {
    id: "toolkit", name: "Equity Analysis Toolkit and Scan", kind: "DHS policy tool",
    contributes: "Examines how a decision may affect people differently and compares alternatives while the decision can still change. The scan is the shorter form, used only when current official guidance identifies it as the appropriate review.",
    hrefs: ["/learn/equity-toolkit", "/learn/equity-toolkit/practice", "/practice/gp-7"],
  },
  {
    id: "clas", name: "National CLAS Standards", kind: "National standards",
    contributes: "A shared reference for culturally and linguistically appropriate services: communication, workforce preparation, community participation and improvement. Confirm which standards, and which separate legal, policy or contract requirements, apply to your work.",
    hrefs: ["/learn/clas", "/practice/clas"],
  },
  {
    id: "engagement", name: "Community engagement", kind: "Practice",
    contributes: "Asks who sets the agenda, what people can actually influence and how they will hear what happened to their input. No one person or organization stands for a whole community.",
    hrefs: ["/learn/community-connections", "/practice/gp-3"],
  },
  {
    id: "accessibility", name: "Accessibility", kind: "Law and practice",
    contributes: "Makes taking part possible at all: language, captions, interpreting, formats, place and timing. For Deaf people who use ASL, this is language access and cultural relations at once, and nobody should have to choose between them.",
    hrefs: ["/library/ja-access-checks"],
  },
  {
    id: "person-centered", name: "Person-centeredness", kind: "Federal rule and value",
    contributes: "The person leads, and how they decide and with whom is asked, not assumed. It guards against two failures: imposing individualism on someone, and using culture to override or speak for a disabled person.",
    hrefs: ["/courses/ipe-04-person-centered-systems", "/library/lm-disability-rights-and-service-delivery"],
  },
  {
    id: "idi", name: "Intercultural Development Inventory (IDI)", kind: "Licensed assessment",
    contributes: "Supports individual and group development, given by qualified administrators. It names five orientations. Integration, the sixth orientation in these applications, comes from Bennett's Developmental Model of Intercultural Sensitivity and the applications' own use, not from the IDI. It is never used for hiring, ranking or performance.",
    hrefs: ["/library/tool-idi"],
  },
  {
    id: "lifecourse", name: "Charting the LifeCourse", kind: "Promising framework, not evidence-based",
    contributes: "A published way to plan a good life across the lifespan, using the person's vision and a mix of supports. Its value depends on the person leading the conversation.",
    hrefs: ["/library/tool-lifecourse"],
  },
  {
    id: "communities", name: "Minnesota Communities", kind: "Context, not prediction",
    contributes: "History, institutions, languages, migration and differences within groups, as background for better questions. A page is never evidence about an individual in planning, eligibility or investigation.",
    hrefs: ["/minnesota-communities"],
  },
];
