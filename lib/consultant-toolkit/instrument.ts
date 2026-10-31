/** Source line references use the supplied 2023 guide, excluding its email wrapper. */
export type ToolkitTrack = "scan" | "full";
export type ToolkitScope = "agency" | "administration" | "division" | "team" | "individual";
export type ToolkitRouting = { priorAnalysisIntegrated: boolean; materialChange: boolean; knownDisparities: boolean; timeLimited: boolean };
export type InstrumentSourceRef = { sourceId: string; locator: string; startLine?: number; endLine?: number };
export type ToolkitQuestion = { id: string; prompt: string; help: string; sourceRefs: InstrumentSourceRef[] };
export type ToolkitStage = { id: string; title: string; description: string; questions: ToolkitQuestion[] };
export type ToolkitInstrument = { id: string; title: string; version: string; authorityNote: string; preparationIntro: string; preparation: ToolkitQuestion[]; stages: ToolkitStage[] };
export const TOOLKIT_VERSION = "2026-10-15.1";
export const TOOLKIT_SOURCES = [
  { id: "dhs-guide-2023", title: "DHS Equity Analysis Toolkit and Scan Guide — Equity Policy Companion Document (2023)", kind: "user-supplied-guide", sha256: "1ab101b976330c9680fc9fcbe1819d76ca117ed849d6e2b33daaa5880a800cdd", note: "Six-step guide supplied by the consultant; current revision not independently verified. Separate forms and decision-tree graphic were absent." },
  { id: "gare-toolkit", title: "GARE Racial Equity Toolkit: An Opportunity to Operationalize Equity", kind: "published-method", url: "https://www.racialequityalliance.org/viewdocument/racial-equity-toolkit-an-opportuni-2", documentUrl: "https://belonging.berkeley.edu/sites/default/files/ARCHIVE/gare-racial_equity_toolkit.pdf", note: "GARE-authored primary document retained by its publishing partner. Official resource listing uploaded March 13, 2024; this is not claimed as the original publication date." },
];
function q(id: string, prompt: string, startLine: number, endLine = startLine, help = ""): ToolkitQuestion {
  return { id, prompt, help, sourceRefs: [{ sourceId: "dhs-guide-2023", locator: `lines ${startLine}-${endLine}`, startLine, endLine }] };
}
export const PREPARATION_QUESTIONS: ToolkitQuestion[] = [
  q("prep-1", "Does this team adequately represent the organization?", 248, 248, "Identify the process owner, roles, and the people participating in the review."),
  q("prep-2", "Does this team adequately represent the identities of people who will be impacted by the action(s) or decision(s)?", 250),
  q("prep-3", "What perspectives does this team have and what perspectives is the team still missing?", 252),
  q("prep-4", "How will the team engage missing perspectives?", 254, 254, "Distinguish actual engagement from a proposed engagement plan."),
];
const fullStages: ToolkitStage[] = [
  { id: "full-stage-1", title: "Set desired results and outcomes", description: "Describe the proposal and distinguish community results from organizational outcomes.", questions: [
    q("full-1-1", "Set desired results and outcomes and describe the policy, program, practice, or budget decision or action for consideration", 293, 299),
    q("full-1-2", "What areas does the proposal have the ability to impact?", 302, 303),
    q("full-1-3", "What are the intended results in the community?", 305, 306),
    q("full-1-4", "What are the intended organizational outcomes (workforce or service population)?", 307, 308),
    q("full-1-5", "Which of the disparity domains does this proposal align with?", 310, 323, "Consider education, employment, income, health, housing, transportation, justice, public safety, institutional systems, employee engagement, advancement, belonging, the built environment, neighborhoods, and social and community context."),
    q("full-1-6", "Does the proposal primarily have an internal or external impact?", 325, 326),
  ] },
  { id: "full-stage-2", title: "Data", description: "Examine quantitative and qualitative evidence, racial inequities, root causes, and missing information.", questions: [
    q("full-2-1", "Will the proposal impact specific geographic areas (neighborhoods, areas, or regions) and program areas? What are the racial demographics of the geographic and program area(s)?", 339, 340),
    q("full-2-2", "What do population and community-level data tell you about existing racial inequities? What does it tell you about root causes or factors influencing racial inequities and intersecting identities?", 342, 343),
    q("full-2-3", "What evidence of inequities exists? Explain the story behind the data: including positive and negative factors and internal and external factors.", 345),
    q("full-2-4", "What performance level data do you have available for your proposal?", 347, 348, "Are there existing performance measures? Define success for your proposal – what will it look like if your proposal does a good job? How will impacted groups be better off? How will you observe change (can include: knowledge, attitude, behavior, and circumstance)? How will impacted groups be worse off if your proposal does not work?"),
    q("full-2-5", "Are there data gaps? What would additional data help analyze the proposal? If so, how can you obtain better information?", 350, 353),
  ] },
  { id: "full-stage-3", title: "Engaging Communities", description: "Document actual engagement and what communities contributed. Identify missing perspectives.", questions: [
    q("full-3-1", "Who are the most affected community members? How have you involved these community members in the development of this proposal?", 359, 360),
    q("full-3-2", "What has your engagement process told you about the burdens or benefits for different groups?", 362, 363),
    q("full-3-3", "What has your engagement process told you about the factors that produce and perpetuate racial inequity related to this proposal?", 365, 366),
  ] },
  { id: "full-stage-4", title: "Benefits/Burdens", description: "Assess racial equity effects and changes that address burdens and unintended consequences.", questions: [
    q("full-4-1", "What have you learned from data and community engagement?", 370, 371),
    q("full-4-2", "How will the proposal increase or decrease racial equity? Who would benefit, and who would be burdened by your proposal?", 372, 373),
    q("full-4-3", "What are the possible unintended consequences? How can you modify your proposal to correct negative impacts and enhance positive impacts?", 375, 376),
    q("full-4-4", "Are the impacts aligned with community outcomes defined in Step 1?", 378, 379),
    q("full-4-5", "How will you address impacts? Are there complementary strategies you can implement?", 381, 382, "Do strategies address the root cause of inequity? How will you partner with stakeholders for long-term impact? Is your proposal aligned with desired community outcomes? If not, how will you realign?"),
  ] },
  { id: "full-stage-5", title: "Implementation", description: "Plan strategies, tasks, responsibilities, dates, resources, and practical delivery.", questions: [
    q("full-5-1", "Describe Plan for Implementation", 386, 395, "Strategy: how you aim to mitigate unintended consequences or expand the impact. Action/Task: break down the strategy into actionable steps and identify targeted actions. Person Responsible: assign ownership. Deadline: set a date. Resources needed: tools, activities, staffing, budget, partnerships, and other implementation support."),
    q("full-5-2", "Realistic?", 397, 398, "Is your implementation plan realistic?"),
    q("full-5-3", "Is it adequately funded?", 400),
    q("full-5-4", "Are we adequately resourced with personnel?", 402),
    q("full-5-5", "Are we adequately resourced with mechanisms to ensure successful implementation and enforcement?", 404),
    q("full-5-6", "Are we adequately resourced to ensure ongoing data collection, public reporting, and community engagement?", 406),
    q("full-5-7", "If the answer to any of these questions is no, what resources or actions are needed?", 408),
  ] },
  { id: "full-stage-6", title: "Accountability, Communication, and Evaluation of Results", description: "Plan evaluation, reporting back, continuing relationships, course correction, and unresolved issues.", questions: [
    q("full-6-1", "How will impacts be documented and evaluated? Are you achieving anticipated outcomes? Do you have a plan to course-correct, if needed?", 414, 415, "Consider quantity: how much did we do? Quality: how well did we do it? Is anyone better off?"),
    q("full-6-2", "What are your messages and communication strategies? How will you share your analysis?", 418, 419),
    q("full-6-3", "How will you continue to deepen relationships with communities to ensure the sustainability of your proposal?", 422, 423),
    q("full-6-4", "What issues remain unresolved? What resources/partnerships do you need to address unresolved issues?", 426, 427),
  ] },
];
const scanPrompts = [
  "What decision is being reviewed, what community results and organizational outcomes are intended, and who may be affected differently by race and intersecting identities?",
  "What available quantitative and qualitative evidence describes existing inequities, and which gaps or assumptions need checking?",
  "What have affected communities actually contributed, whose views are missing, and how will they influence the next decision?",
  "Who may gain or carry additional burdens, and which changes or alternatives could reduce racial inequity and unintended harm?",
  "What actions, responsible roles, resources, and timing would make the proposed response feasible?",
  "How will results be measured, shared with affected people, and revisited when evidence or circumstances change?",
];
const scanStages: ToolkitStage[] = scanPrompts.map((prompt, index) => ({
  id: `scan-stage-${index + 1}`, title: fullStages[index].title, description: "Adapted consultant scan prompt.",
  questions: [{ id: `scan-${index + 1}`, prompt, help: "Distinguish documented evidence, interpretation, and missing information.", sourceRefs: [{ sourceId: "dhs-guide-2023", locator: `full-analysis guide, step ${index + 1}` }, { sourceId: "gare-toolkit", locator: `six-step method, step ${index + 1}; Appendix C` }] }],
}));
const preparationIntro = "Identify the process owner, affected people, representative team, and missing perspectives. Consider workforce and leadership, procurement, and culturally and linguistically appropriate services. Actual community engagement remains part of planning, implementation, and evaluation.";
export const FULL_ANALYSIS: ToolkitInstrument = {
  id: "dhs-guide-full", title: "Full equity analysis", version: TOOLKIT_VERSION,
  authorityNote: "Organized from the six-step DHS 2023 Equity Analysis Toolkit and Scan Guide supplied by the consultant. This worksheet preserves the guide questions; it does not reproduce the separate DHS blank form.",
  preparationIntro, preparation: PREPARATION_QUESTIONS, stages: fullStages,
};
export const ADAPTED_SCAN: ToolkitInstrument = {
  id: "consultant-adapted-scan", title: "Equity scan — adapted consultant worksheet", version: TOOLKIT_VERSION,
  authorityNote: "A concise consultant worksheet adapted from the supplied DHS guide and GARE six-step method. It is not a reproduction of the unavailable DHS Equity Scan form.",
  preparationIntro, preparation: PREPARATION_QUESTIONS, stages: scanStages,
};
export function getInstrument(track: ToolkitTrack): ToolkitInstrument { return track === "full" ? FULL_ANALYSIS : ADAPTED_SCAN; }
export function getQuestions(track: ToolkitTrack): ToolkitQuestion[] { const instrument = getInstrument(track); return [...instrument.preparation, ...instrument.stages.flatMap(stage => stage.questions)]; }
export type TrackRecommendation = { track: ToolkitTrack; reasons: string[]; advisoryOnly: true; sourceRefs: InstrumentSourceRef[] };
/** A program recommendation, not a reconstruction of the absent DHS decision tree. */
export function recommendTrack(routing: ToolkitRouting): TrackRecommendation {
  const reasons: string[] = [];
  let track: ToolkitTrack = "full";
  if (routing.priorAnalysisIntegrated && !routing.materialChange && !routing.knownDisparities) {
    track = "scan";
    reasons.push("A prior full analysis has been integrated, with no material change or known disparity flagged. An adapted scan can re-examine the decision.");
  } else {
    if (!routing.priorAnalysisIntegrated) reasons.push("No integrated prior full analysis is recorded.");
    if (routing.materialChange) reasons.push("The proposal has materially changed; broader analysis can examine new effects.");
    if (routing.knownDisparities) reasons.push("Known disparities call for deeper analysis of evidence and responses.");
  }
  if (routing.timeLimited) reasons.push("Time pressure does not automatically select a scan. The supplied guide recommends negotiating time first and, where external constraints prevent that, working with the relevant equity director or specialist to adapt the process. The consultant may select a track and record the reason.");
  reasons.push("This is editable consultant guidance. The supplied decision-tree criteria were absent, so no official eligibility determination is claimed.");
  return { track, reasons, advisoryOnly: true, sourceRefs: [{ sourceId: "dhs-guide-2023", locator: "lines 170, 225-227, 430-433" }] };
}
