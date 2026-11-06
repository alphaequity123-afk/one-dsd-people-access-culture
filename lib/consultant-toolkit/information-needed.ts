import { getQuestions } from "./instrument";
import type { ToolkitRequest, ToolkitResponse } from "./schema";

// What information an analysis still needs. beforeRun is a heuristic check of the
// attached material against the selected track's questions; afterRun gathers the
// gaps, limits and open questions an analysis recorded. Pure and deterministic.
// Responsible parties are named by role or as "the person or area responsible",
// never by a person's name.

export type InformationNeed = {
  id: string;
  need: string;
  why: string;
  whoMightHaveIt: string;
  questionIds: string[];
  status: "missing" | "found";
};

export const INFORMATION_CHECK_NOTE = "This is a check of the attached material for these kinds of information. It looks for words and patterns, so it can miss information or count a passing mention. It is not a judgement of the work or of the people involved.";

const RESPONSIBLE = "the person or area responsible for the decision";

type NeedRule = Omit<InformationNeed, "questionIds" | "status"> & { questions: string[]; found: (text: string) => boolean };

const has = (pattern: RegExp) => (text: string) => pattern.test(text);
const DEMOGRAPHIC = /\b(?:race|racial|ethnic\w*|language|languages|disabilit\w*|age group|ages?\s+\d|aged|county|counties|American Indian|Black|Hispanic|Latino|Latina|Latinx|Asian|white|Somali|Hmong|Karen)\b/i;
const FIGURE = /\b\d+(?:\.\d+)?\s*(?:%|percent)|\b\d{1,3}(?:,\d{3})+\b|\b\d+\s+(?:people|persons|participants|recipients|enrollees|individuals|members|families)\b|\brates?\s+(?:of|was|were|is)\s+\d/i;
const YEAR = /\b(?:19|20)\d{2}\b/;
const MONTH_DATE = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/i;

const RULES: NeedRule[] = [
  {
    id: "people-served-data",
    need: "Dated information describing who is served, by race, ethnicity, language, disability, age and county.",
    why: "The analysis compares how the decision reaches different groups. Figures need a date or period, a source and the number they are counted out of.",
    whoMightHaveIt: "the person or area responsible for program data and reporting",
    questions: ["full-2-1", "full-2-2", "full-2-3", "full-2-4", "scan-1", "scan-2"],
    found: text => DEMOGRAPHIC.test(text) && FIGURE.test(text) && YEAR.test(text),
  },
  {
    id: "experience-of-people-affected",
    need: "What people affected by the decision have said: engagement notes, listening sessions, surveys, complaints or feedback.",
    why: "The toolkit asks what affected communities actually contributed. Published research does not replace what the people affected say.",
    whoMightHaveIt: "the person or area responsible for community engagement, with the community partners involved",
    questions: ["prep-2", "prep-3", "prep-4", "full-3-1", "full-3-2", "full-3-3", "full-4-1", "scan-3"],
    found: has(/\b(?:engagement (?:notes|sessions?|findings|summary)|listening sessions?|focus groups?|surveys?|surveyed|interviews?|interviewed|feedback|testimony|public comments?|comments received|advisory (?:council|committee|group)|(?:people|participants|members|families|community members?|recipients) (?:said|told us|told|shared|reported|described|asked))\b/i),
  },
  {
    id: "decision-and-decider",
    need: "The decision or change being made, and who makes the decision.",
    why: "The analysis is tied to a specific decision. Knowing who decides shows where the findings and recommendations should go.",
    whoMightHaveIt: RESPONSIBLE,
    questions: ["prep-1", "full-1-1", "scan-1"],
    found: text => /\b(?:decid\w*|decision|approv\w*|sign[- ]off|authori[sz]\w*)\b/i.test(text)
      && /\b(?:commissioner|director|manager|leadership|legislature|board|supervisor|administrator|decision[- ]maker|lead agenc\w*|the department will|division will)\b/i.test(text),
  },
  {
    id: "alternatives-considered",
    need: "The alternatives or options considered, including keeping the current approach.",
    why: "The toolkit compares benefits and burdens across options. Without them, the analysis can only comment on one proposal.",
    whoMightHaveIt: "the person or area responsible for the proposal",
    questions: ["full-4-3", "full-4-5", "scan-4"],
    found: has(/\b(?:alternatives?|options? (?:considered|include|are|were)|option [A-D1-4]\b|instead of|other approaches?|trade-?offs?|considered (?:whether|other|several))\b/i),
  },
  {
    id: "budget-and-resources",
    need: "The budget, staffing and other resources available for the change.",
    why: "The implementation questions ask whether the work is funded and staffed, and whether data collection and engagement can continue.",
    whoMightHaveIt: "the person or area responsible for the budget",
    questions: ["full-5-3", "full-5-4", "full-5-5", "full-5-6", "full-5-7", "scan-5"],
    found: has(/\b(?:budget\w*|funding|funded|appropriation\w*|cost(?:s|ing)?|dollars|full-time equivalent|FTEs?|staffing levels?|grant funds?)\b|\$\s?\d/i),
  },
  {
    id: "timeline",
    need: "The timeline: when the decision is made, when the change takes effect and any deadlines.",
    why: "Dates show how much time there is to gather evidence and engage people, and when results can be checked.",
    whoMightHaveIt: "the person or area responsible for implementation",
    questions: ["full-5-1", "full-5-2", "scan-5"],
    found: text => MONTH_DATE.test(text) || /\b(?:timeline|deadline|effective date|implementation date|go-live|phased in|fiscal year|calendar year \d{4}|quarter of \d{4})\b/i.test(text),
  },
  {
    id: "prior-analyses",
    need: "Earlier equity analyses, evaluations, audits or reports about this program or decision.",
    why: "Earlier findings show what is already known, what was promised and what changed since.",
    whoMightHaveIt: "the person or area responsible for equity analysis and evaluation",
    questions: ["full-2-5", "full-6-1", "full-6-4", "scan-2", "scan-6"],
    found: has(/\b(?:(?:prior|previous|earlier|completed|\d{4})\s+(?:equity\s+)?(?:analysis|analyses|scan|evaluation|audit|review|study)|evaluation (?:found|showed|report)|audit (?:found|report)|legislative report)\b/i),
  },
  {
    id: "tribal-nations",
    need: "Whether the decision may affect Tribal Nations or American Indian people, and whether it has been referred to the Office of Indian Affairs.",
    why: "Tribal Nations are sovereign governments. Consultation with them is led by the Office of Indian Affairs and is different from a stakeholder meeting. This analysis records the referral; it does not design the consultation.",
    whoMightHaveIt: RESPONSIBLE,
    questions: ["prep-3", "prep-4", "full-3-1", "scan-3"],
    found: has(/\b(?:Tribal|Tribes?|Tribal Nations?|American Indian|Native American|Indigenous|Office of Indian Affairs|reservations?|Ojibwe|Anishinaabe|Dakota)\b/i),
  },
];

/** The attached material: the person's documents and pasted text, the question, background and typed notes. Application references are not counted. */
export function attachedMaterial(request: ToolkitRequest): string {
  return [
    request.title, request.question, request.context,
    ...request.sources.filter(source => source.origin !== "application-context").flatMap(source => [source.title, source.text]),
    ...Object.values(request.answers),
  ].filter(Boolean).join("\n");
}

export function beforeRun(request: ToolkitRequest): InformationNeed[] {
  const text = attachedMaterial(request);
  const ids = new Set(getQuestions(request.track).map(question => question.id));
  return RULES.map(({ found, questions, ...rule }) => ({
    ...rule,
    questionIds: questions.filter(id => ids.has(id)),
    status: found(text) ? "found" as const : "missing" as const,
  }));
}

/** Each toolkit question as a plain request for the information that would answer it. */
export const PLAIN_REQUESTS: Record<string, string> = {
  "prep-1": "Who leads this work and who is taking part in the review.",
  "prep-2": "Whether the review team reflects the identities of the people the decision will affect.",
  "prep-3": "Which perspectives the team has and which are still missing.",
  "prep-4": "How the team will hear from the perspectives that are missing.",
  "full-1-1": "A description of the decision or action and the results it is meant to achieve.",
  "full-1-2": "The areas the proposal could affect.",
  "full-1-3": "The results intended for the community.",
  "full-1-4": "The outcomes intended for the organization, its workforce or the people it serves.",
  "full-1-5": "Which areas of disparity the proposal relates to, such as health, housing, income or employment.",
  "full-1-6": "Whether the proposal mainly affects people inside the organization or outside it.",
  "full-2-1": "The places and programs affected, and the racial makeup of the people in them.",
  "full-2-2": "Population and community data on existing racial inequities and their causes.",
  "full-2-3": "Evidence of inequities and the story behind the data.",
  "full-2-4": "Performance data for the proposal and how success will be defined.",
  "full-2-5": "The data that is missing and how better information could be obtained.",
  "full-3-1": "Who the most affected community members are and how they have been involved.",
  "full-3-2": "What engagement has shown about the benefits and burdens for different groups.",
  "full-3-3": "What engagement has shown about the causes of racial inequity related to the proposal.",
  "full-4-1": "What has been learned from the data and from community engagement.",
  "full-4-2": "Who would benefit and who would carry burdens under the proposal.",
  "full-4-3": "Possible unintended consequences and changes that would correct them.",
  "full-4-4": "Whether the expected effects match the community results set out at the start.",
  "full-4-5": "How effects will be addressed, including strategies that work alongside the proposal.",
  "full-5-1": "The implementation plan: strategies, tasks, responsible roles, dates and resources.",
  "full-5-2": "Whether the implementation plan is realistic.",
  "full-5-3": "Whether the work is adequately funded.",
  "full-5-4": "Whether there are enough staff to carry it out.",
  "full-5-5": "Whether there are ways to make sure it is carried out and enforced.",
  "full-5-6": "Whether there are resources for ongoing data collection, public reporting and engagement.",
  "full-5-7": "The resources or actions needed where any of these are lacking.",
  "full-6-1": "How effects will be documented and evaluated, and how the plan will change course if needed.",
  "full-6-2": "How the analysis and its results will be shared.",
  "full-6-3": "How relationships with communities will be kept up over time.",
  "full-6-4": "The issues that remain unresolved and the resources or partners needed to address them.",
  "scan-1": "The decision being reviewed, its intended results and who may be affected differently.",
  "scan-2": "Evidence describing existing inequities, and the gaps or assumptions that need checking.",
  "scan-3": "What affected communities have contributed and whose views are missing.",
  "scan-4": "Who may gain or carry burdens, and the changes or alternatives that could reduce harm.",
  "scan-5": "The actions, responsible roles, resources and timing that would make the response workable.",
  "scan-6": "How results will be measured, shared with affected people and revisited.",
};

const STAGE_HOLDERS: [RegExp, string][] = [
  [/^prep-/, RESPONSIBLE],
  [/^(?:full-1-|scan-1$)/, "the person or area responsible for the proposal"],
  [/^(?:full-2-|scan-2$)/, "the person or area responsible for program data and reporting"],
  [/^(?:full-3-|scan-3$)/, "the person or area responsible for community engagement, with the community partners involved"],
  [/^(?:full-4-|scan-4$)/, "the person or area responsible for the proposal"],
  [/^(?:full-5-|scan-5$)/, "the person or area responsible for implementation"],
  [/^(?:full-6-|scan-6$)/, "the person or area responsible for evaluation and reporting"],
];
export function holderFor(questionId: string): string { return STAGE_HOLDERS.find(([pattern]) => pattern.test(questionId))?.[1] ?? RESPONSIBLE; }
export function plainRequest(questionId: string, prompt?: string): string { return PLAIN_REQUESTS[questionId] ?? prompt ?? questionId; }

const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function afterRun(request: ToolkitRequest, result: ToolkitResponse): InformationNeed[] {
  const prompts = new Map(getQuestions(request.track).map(question => [question.id, question.prompt]));
  const items: InformationNeed[] = [];
  const seen = new Set<string>();
  const push = (item: InformationNeed, key = item.need) => { const value = normalized(key); if (!value || seen.has(value)) return; seen.add(value); items.push(item); };
  for (const answer of result.answers) {
    if (answer.kind !== "gap") continue;
    const need = plainRequest(answer.questionId, prompts.get(answer.questionId));
    seen.add(normalized(answer.text));
    push({ id: `gap-${answer.questionId}`, need, why: answer.text, whoMightHaveIt: holderFor(answer.questionId), questionIds: [answer.questionId], status: "missing" });
  }
  result.limitations.forEach((text, index) => push({ id: `limitation-${index + 1}`, need: text, why: "Recorded as a limit of the evidence in this analysis.", whoMightHaveIt: RESPONSIBLE, questionIds: [], status: "missing" }));
  result.questionsForReview.forEach((text, index) => push({ id: `review-${index + 1}`, need: text, why: "Raised as an open question for review.", whoMightHaveIt: RESPONSIBLE, questionIds: [], status: "missing" }));
  return items;
}

export function gapQuestionIds(result: ToolkitResponse | null | undefined): string[] {
  return result ? result.answers.filter(answer => answer.kind === "gap").map(answer => answer.questionId) : [];
}

/** Needs from the previous run that the new run no longer records as gaps. */
export function closedSinceLastRun(previousGapIds: string[], result: ToolkitResponse): { questionId: string; title: string }[] {
  const current = new Set(gapQuestionIds(result));
  const answered = new Set(result.answers.map(answer => answer.questionId));
  return previousGapIds.filter(id => !current.has(id) && answered.has(id)).map(questionId => ({ questionId, title: plainRequest(questionId) }));
}
