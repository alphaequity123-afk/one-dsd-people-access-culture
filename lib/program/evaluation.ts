/**
 * Program evaluation (Layer B): data-only definitions, design in docs/EVALS-STUDY.md section 6.B.
 *
 * Evidence comes only from records people choose to keep or share (owner decision, 2026-11-16). Nothing here counts
 * learning or use of any kind. Every indicator names its allowed evidence sources, its evidence level, whether it rests
 * on a participant report or an independent observation, and who reviews it.
 *
 * Kept free of value imports so the eval runner can load it with plain Node. Identifiers are checked two ways: by the
 * types below at compile time, and by validateEvaluationModel() against the live program model at run time.
 */
import type { ProgramEvidenceLevel, ProgramOutcomeId } from "./model";
import type { ADSA_WORK_GOALS } from "./adsa-work-links";
import type { measureDefinitionFields } from "./measure-definition-fields";

export const EVALUATION_MODEL_VERSION = "2026-11-16.1";

type AdsaGoal = (typeof ADSA_WORK_GOALS)[number];
export type AdsaActionId = AdsaGoal["actions"][number]["id"];
export type AdsaGoalNumber = AdsaGoal["number"];
export type MeasureFieldId = (typeof measureDefinitionFields)[number]["id"];

/* ---------------------------------------------------------------- evidence ---------------------------------------------------------------- */

export type EvidenceSourceId =
  | "shared_decision_record"
  | "voluntary_outcome_record"
  | "before_after_pair"
  | "review_record"
  | "program_work_record"
  | "task_session"
  | "dhs_aggregate_data"
  | "you_said_we_did"
  | "plan_or_charter"
  | "meeting_record"
  | "content_record"
  | "application_check_results";

export type EvidenceSource = {
  id: EvidenceSourceId;
  label: string;
  holds: string;
  keptBy: string;
  /** The evidence levels this source can support. */
  levels: readonly ProgramEvidenceLevel[];
};

/** B1: the only sources an indicator or measure may draw on. */
export const allowedEvidenceSources: readonly EvidenceSource[] = [
  { id: "shared_decision_record", label: "Shared decision record", holds: "A decision, who it affects, the evidence, alternatives considered, the decision owner and a review date.", keptBy: "The person who chooses to share it with the team space.", levels: ["application", "benefit"] },
  { id: "voluntary_outcome_record", label: "Voluntary outcome record", holds: "What someone tried in their work, what changed, what they noticed and whether to keep, revise or stop it. No name, month only.", keptBy: "The person who chooses to share it; read only by the program owner.", levels: ["application", "benefit"] },
  { id: "before_after_pair", label: "Before-and-after pair", holds: "A notice, form, meeting plan or job posting before and after a change, with a short note. Public or de-identified text only.", keptBy: "The goal lead or decision owner who chooses to keep it.", levels: ["application", "benefit"] },
  { id: "review_record", label: "Equity review record", holds: "The review tool used, what it found and the decision owner's disposition.", keptBy: "The decision owner or the person who led the review.", levels: ["delivery", "application"] },
  { id: "program_work_record", label: "Program work record (improvement cycle)", holds: "The question, prediction, measure, what was tried, what was found and the disposition of one Plan-Do-Study-Act cycle.", keptBy: "The program owner or a goal lead.", levels: ["delivery", "application", "benefit"] },
  { id: "task_session", label: "Representative task session", holds: "Themes from facilitated, consented sessions where volunteers try representative tasks. No names in the notes.", keptBy: "The program owner, with the volunteers' agreement.", levels: ["application"] },
  { id: "dhs_aggregate_data", label: "DHS aggregate data", holds: "Service access, hiring and retention, accommodation and interpreter timeliness or vendor participation, by group, with small cells suppressed.", keptBy: "The person or area responsible for the data, under an agreed comparison period.", levels: ["benefit"] },
  { id: "you_said_we_did", label: "\"You said, we did\" account", holds: "Input received, what changed, what did not and why, and how people can correct the account.", keptBy: "The goal lead, written with the people who gave the input.", levels: ["application", "benefit"] },
  { id: "plan_or_charter", label: "Plan, charter or guide", holds: "A charter, plan, guide or crosswalk with its responsible role.", keptBy: "The goal lead or the program owner.", levels: ["delivery"] },
  { id: "meeting_record", label: "Meeting decisions", holds: "Decisions and follow-up from a leaders' review or team meeting.", keptBy: "The person who keeps the meeting's decisions.", levels: ["delivery", "application"] },
  { id: "content_record", label: "Content and source record", holds: "Source dates, corrections and the guidance each correction reached.", keptBy: "The program owner.", levels: ["delivery", "benefit"] },
  { id: "application_check_results", label: "Application check results", holds: "Layer A results: accessibility, sources, links and sharing.", keptBy: "The program owner.", levels: ["delivery"] },
];

export type ForbiddenEvidenceId =
  | "page_views"
  | "completions"
  | "time_spent"
  | "check_answers"
  | "ask_counts"
  | "learning_attendance"
  | "learning_activity_count"
  | "feedback_widget"
  | "individual_scores";

export type ForbiddenEvidence = { id: ForbiddenEvidenceId; label: string; why: string; patterns: readonly RegExp[] };

const LEARNING_THING = String.raw`(?:courses?|lessons?|modules?|learning|trainings?|podcasts?|episodes?|chapters?|videos?|readings?|resources?|pages?|site|webinars?|workshops?)`;

/** Never allowed as evidence of anything (owner decision, 2026-11-16). Patterns find a forbidden source named in text. */
export const forbiddenEvidence: readonly ForbiddenEvidence[] = [
  { id: "page_views", label: "Page views, visits or traffic", why: "Counts use of the application.", patterns: [/\b(?:page|site|web)[ -]?(?:views?|visits?|hits|traffic)\b/i, /\bvisits? to (?:the |this )?(?:site|page|application|app)\b/i, /\b(?:unique|site|page) visitors\b/i, /\bpageviews?\b/i] },
  { id: "completions", label: "Completions of courses, lessons or other learning", why: "Counts learning activity, and finishing a course is not evidence of capability.", patterns: [new RegExp(String.raw`\b${LEARNING_THING}\s+(?:completions?|completed|finished|finish rates?)\b`, "i"), /\bcompletion (?:rates?|counts?|totals?|numbers?|percentages?)\b/i, new RegExp(String.raw`\b(?:completed|completing|finished|finishing)\s+(?:the |a |an |their |each )?${LEARNING_THING}\b`, "i"), /\b(?:share|percent(?:age)?|number|count) of (?:staff|people|employees|learners|participants) (?:who )?(?:complet|finish)\w*/i] },
  { id: "time_spent", label: "Time spent", why: "Measures a person's learning or use.", patterns: [new RegExp(String.raw`\btime spent (?:on|in|with|learning|reading|listening|watching)\s+(?:the |a |an |each |their )?(?:${LEARNING_THING}|app|application|lessons?|Ask|Guidance)`, "i"), /\btime on (?:page|site)\b/i, /\bdwell time\b/i, new RegExp(String.raw`\b(?:minutes|hours) (?:spent )?(?:learning|listening|watching|reading|on (?:the )?${LEARNING_THING})\b`, "i")] },
  { id: "check_answers", label: "Answers to checks, quizzes or practice", why: "What people answer while learning stays private.", patterns: [/\b(?:quiz|knowledge[- ]checks?|lesson checks?|practice checks?|training checks?|scenario) (?:answers?|scores?|results?|responses?|choices?)\b/i, /\bcheck answers\b/i, /\b(?:right|correct|wrong) answers?\b/i, /\bfirst[- ]try (?:rates?|answers?)\b/i] },
  { id: "ask_counts", label: "Counts of Ask or Guidance use", why: "Counts use of the application, even as anonymous totals.", patterns: [/\b(?:ask|guidance) (?:counts?|runs?|usage|sessions?|volumes?|totals?|logs?)\b/i, /\bquestions asked\b/i, /\bnumber of (?:questions|ask|guidance)\b/i, /\bhints? given\b/i] },
  { id: "learning_attendance", label: "Attendance tied to learning", why: "Counts who took part in learning.", patterns: [new RegExp(String.raw`\b(?:attendance|attendees|attended|attending|enrol(?:l)?ments?|enrol(?:l)?ed|registrations?|registered|sign[- ]?ups?)\b.{0,40}\b${LEARNING_THING}`, "i"), new RegExp(String.raw`\b${LEARNING_THING}\b.{0,40}\b(?:attendance|attendees|enrol(?:l)?ments?|registrations?)\b`, "i"), /\battendance by (?:unit|role|team|group)\b/i] },
  { id: "learning_activity_count", label: "Any other count of learning or use, including anonymous totals", why: "No count of learning or use of any kind, not even anonymous totals.", patterns: [new RegExp(String.raw`\b${LEARNING_THING}\s+(?:plays|played|listens|listened|clicks|clicked|views|viewed|reach)\b`, "i"), new RegExp(String.raw`\b(?:plays?|listens?|downloads?|clicks?|views?|opens?)\s+(?:of|per|by)\s+(?:each |the )?${LEARNING_THING}`, "i"), /\busage (?:counts?|totals?|statistics|stats|analytics|metrics|data|rates?)\b/i, /\b(?:learning|site|app|application|lesson|course) (?:activity|use|usage) (?:counts?|totals?|data|metrics|statistics)\b/i, /\busage counts?\b/i, /\banalytics\b/i, /\bactive users\b/i, /\b(?:number|count|total|share|percent(?:age)?) of (?:staff|people|employees|users|learners|participants) (?:who )?(?:used|use|using|visited|viewed|took|taking|opened|listened|watched|attended|logged in|signed in)\b/i, /\b(?:learning|training) (?:uptake|taken)\b/i, /\breach\b.{0,25}\b(?:visits?|views?|users?|downloads?|listens?|plays?)\b/i, /\bnot (?:counted|tracked|measured|recorded) yet\b/i, /\b(?:counted|tracked) (?:anonymously|as (?:a |an )?(?:anonymous )?totals?)\b/i] },
  { id: "feedback_widget", label: "An on-page feedback widget or rating", why: "Ruled out by the owner (2026-11-16): a count of submissions would act as a measure of use.", patterns: [/\b(?:feedback|rating|thumbs|star) (?:widget|button|buttons|prompt) on (?:a|each|every|the) (?:page|resource|lesson|course)\b/i, /\bwas this (?:page|resource|lesson) helpful\b/i] },
  { id: "individual_scores", label: "Scores, rankings or records about individual staff", why: "Responses are evaluated; people never are.", patterns: [/\b(?:rank|ranking|score|scoring|rating|grade|grading)\b.{0,20}\b(?:staff|employees?|individuals?|supervisors?|managers?|teams?|units?)\b/i, /\b(?:staff|employee|individual|person(?:al)?|learner)\s+(?:scores?|rankings?|ratings?|grades?|records?)\b/i, /\bper[- ](?:person|employee|staff member)\b/i] },
];

const NEGATION_BEFORE = /\b(?:no|not|never|nor|without|rather than|instead of|other than|beyond|more than|excluding|excludes?|exclude|avoid|avoiding|refuses?|forbidden|not use)\b[^.;:!?\n]{0,60}$/i;
/** A mention followed closely by a disclaimer ("completing a course is a starting point") states a limit. */
const DISCLAIMER_AFTER = /^[^.;:!?\n]{0,60}\b(?:is (?:only |just )?a starting point|is not|are not|does not|do not|doesn't|don't|alone|by itself|cannot|never)\b/i;

export type ForbiddenEvidenceFinding = { id: ForbiddenEvidenceId; match: string };

/**
 * Find forbidden evidence named in text. A mention preceded closely by a negation ("never completions", "rather than
 * page views") is a limit being stated, not a source being used, and is ignored.
 */
export function forbiddenEvidenceIn(text: string): ForbiddenEvidenceFinding[] {
  const findings: ForbiddenEvidenceFinding[] = [];
  if (!text) return findings;
  for (const item of forbiddenEvidence) {
    for (const pattern of item.patterns) {
      const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
      for (const match of text.matchAll(global)) {
        const before = text.slice(Math.max(0, (match.index ?? 0) - 80), match.index ?? 0);
        const after = text.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 80);
        const promise = /not (?:counted|tracked|measured|recorded) yet/i.test(match[0]);
        if (!promise && (NEGATION_BEFORE.test(before) || DISCLAIMER_AFTER.test(after))) continue;
        findings.push({ id: item.id, match: match[0] });
        break;
      }
      if (findings.some(f => f.id === item.id)) break;
    }
  }
  return findings;
}

/** The measure fields that define what is counted or compared. Privacy and review notes may name what is excluded. */
const MEASURED_FIELDS: readonly MeasureFieldId[] = ["title", "calculation", "population", "evidenceSource", "period", "comparison", "targetReference"];

/** Problems with a measure definition (the ten fields in measure-definition-fields.ts). Empty means allowed. */
export function measureDefinitionProblems(measure: Partial<Record<MeasureFieldId, string>>): string[] {
  const problems: string[] = [];
  for (const field of MEASURED_FIELDS) {
    for (const finding of forbiddenEvidenceIn(measure[field] ?? "")) {
      const label = forbiddenEvidence.find(f => f.id === finding.id)?.label ?? finding.id;
      problems.push(`${field}: uses forbidden evidence (${label}): "${finding.match}"`);
    }
  }
  return problems;
}

/** Throws when a measure definition draws on forbidden evidence. */
export function assertAllowedMeasure(measure: Partial<Record<MeasureFieldId, string>>): void {
  const problems = measureDefinitionProblems(measure);
  if (problems.length) throw new Error(`This measure counts learning or use, which is never evidence. ${problems[0]}`);
}

/* ------------------------------------------------------------- logic model and reviewers ------------------------------------------------------------- */

export type LogicLevelId = "inputs" | "activities" | "outputs" | "short_term_outcomes" | "intermediate_outcomes" | "long_term_outcomes";

/** B2 levels, each tied to the stage of the logic model shown at /program/model (dsd-logic-model.ts). */
export const logicLevels: readonly { id: LogicLevelId; label: string; stageSlug: string; question: string }[] = [
  { id: "inputs", label: "Inputs", stageSlug: "what-informs", question: "Is what informs the work current and owned?" },
  { id: "activities", label: "Activities", stageSlug: "practice", question: "Is the work happening, with owners and reviews?" },
  { id: "outputs", label: "Outputs", stageSlug: "resources", question: "Are the tools and resources there, and do they meet the bars?" },
  { id: "short_term_outcomes", label: "Short-term outcomes", stageSlug: "progress", question: "Can people do the work, and are barriers being found?" },
  { id: "intermediate_outcomes", label: "Intermediate outcomes", stageSlug: "progress", question: "Is how decisions and practices are made changing?" },
  { id: "long_term_outcomes", label: "Long-term outcomes", stageSlug: "impact", question: "Are results improving for staff and the people DHS serves?" },
];

export type ReviewerId =
  | "decision_owner"
  | "goal_lead"
  | "program_owner"
  | "program_owner_and_goal_lead"
  | "team"
  | "leaders_review"
  | "data_partners"
  | "hr_partner"
  | "community"
  | "accessibility_contact"
  | "administration_contacts"
  | "independent_reviewer";

export const reviewers: Readonly<Record<ReviewerId, string>> = {
  decision_owner: "The decision owner",
  goal_lead: "The goal lead for that ADSA goal",
  program_owner: "The program owner",
  program_owner_and_goal_lead: "The program owner with one goal lead",
  team: "One DSD Team (the standing volunteer committee)",
  leaders_review: "Leaders' review",
  data_partners: "The ADSA Equity Director and HR partners who hold the data",
  hr_partner: "The Goal 3 lead with an HR partner",
  community: "The Goal 2 lead with community partners; the responsible Tribal liaison for Tribal matters",
  accessibility_contact: "The accessibility contact, with people who use assistive technology",
  administration_contacts: "The program owner with contacts in each administration",
  independent_reviewer: "A reviewer outside the program, for example a DHS research and evaluation colleague",
};

/** B6: who reviews, when. */
export const evaluationReviews: readonly { id: string; when: string; who: string; what: string }[] = [
  { id: "each-cycle", when: "At the end of each improvement cycle", who: "The decision owner, with the goal lead for that ADSA goal", what: "The prediction against the result, and the disposition: retain, revise, stop or not yet known." },
  { id: "monthly", when: "Monthly", who: reviewers.team, what: "Open cycles, \"you said, we did\" accounts and themes from voluntary outcome records." },
  { id: "quarterly", when: "Quarterly program review", who: "The program owner, the goal leads and leaders' review", what: "The evidence summary by level (delivery, application, benefit), application check results reported apart, and decisions to retain, revise, connect, support or stop." },
  { id: "data", when: "When aggregate data is refreshed", who: reviewers.data_partners, what: "Aggregate DHS data, small-cell suppression and the comparison period." },
  { id: "community", when: "After each engagement", who: reviewers.community, what: "Whether community input changed the decision, and the account given back." },
  { id: "accessibility", when: "After each accessibility review", who: reviewers.accessibility_contact, what: "Accessibility findings tried with people, and whether the correction works." },
  { id: "yearly-independent", when: "Once a year", who: reviewers.independent_reviewer, what: "Method, limits, whether claims match their evidence level, and the privacy of the evaluation itself." },
];

/* ---------------------------------------------------------------- indicators ---------------------------------------------------------------- */

export type IndicatorSourceType = "participant_report" | "independent_observation";
export type EvaluationYear = 1 | 2 | 3;

export type EvaluationIndicator = {
  id: string;
  /** What to look for. Checked against the forbidden evidence list. */
  statement: string;
  evidenceSources: readonly EvidenceSourceId[];
  evidenceLevel: ProgramEvidenceLevel;
  sourceType: IndicatorSourceType;
  reviewer: ReviewerId;
  logicLevel: LogicLevelId;
  outcomeIds: readonly ProgramOutcomeId[];
  goalActionIds: readonly AdsaActionId[];
  /** B4 only: the ADSA goal and the year (1 delivery, 2 application, 3 benefit). */
  goalNumber?: AdsaGoalNumber;
  year?: EvaluationYear;
  /** What this indicator cannot show. Empty evidence means "not yet evidenced", never "no change". */
  limits: string;
};

export const yearEvidenceLevel: Readonly<Record<EvaluationYear, ProgramEvidenceLevel>> = { 1: "delivery", 2: "application", 3: "benefit" };

/** B2: indicators by logic-model level. */
export const logicModelIndicators: readonly EvaluationIndicator[] = [
  { id: "inputs-sources-current", logicLevel: "inputs", statement: "Resources carry a dated source checked in the last 12 months, and reported corrections are handled within 30 days.", evidenceSources: ["content_record", "application_check_results"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "program_owner", outcomeIds: ["organizational_memory"], goalActionIds: [], limits: "Shows the material is current. Says nothing about use or benefit." },
  { id: "inputs-owners-named", logicLevel: "inputs", statement: "Each ADSA goal and area of work has a named goal lead or responsible role in the charter or plan.", evidenceSources: ["plan_or_charter"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "leaders_review", outcomeIds: ["institutional_application"], goalActionIds: ["ADSA-1.1"], limits: "A named owner is a precondition, not a result." },
  { id: "activities-reviews-held", logicLevel: "activities", statement: "Leaders' reviews are held with their decisions written down, and equity reviews are offered before key decisions.", evidenceSources: ["meeting_record", "program_work_record"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "leaders_review", outcomeIds: ["institutional_application"], goalActionIds: ["ADSA-1.3"], limits: "A review held is not a review that changed anything." },
  { id: "activities-cycles-planned", logicLevel: "activities", statement: "Each improvement cycle names its question, prediction, measure and decision owner before the change is tried.", evidenceSources: ["program_work_record"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "program_owner", outcomeIds: ["organizational_memory", "institutional_application"], goalActionIds: ["ADSA-1.5"], limits: "Shows the method is followed, not that the change worked." },
  { id: "outputs-resources-meet-bars", logicLevel: "outputs", statement: "Published resources meet the application checks: accessible, sourced and easy to share.", evidenceSources: ["application_check_results"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "program_owner", outcomeIds: ["access", "organizational_memory"], goalActionIds: [], limits: "Application checks are delivery evidence only and are reported apart from program outcomes." },
  { id: "outputs-tools-per-action", logicLevel: "outputs", statement: "A tool or guide is available for each of the 28 ADSA actions, with the work product it supports described.", evidenceSources: ["content_record", "plan_or_charter"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "program_owner", outcomeIds: ["staff_capability"], goalActionIds: [], limits: "A tool on hand is not a tool put to work." },
  { id: "short-task-sessions", logicLevel: "short_term_outcomes", statement: "In facilitated, consented task sessions, volunteers find a source, prepare an accessible meeting or notice, name who to involve and explain the next step with their reasoning; where they hesitate is noted as themes.", evidenceSources: ["task_session"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "program_owner_and_goal_lead", outcomeIds: ["staff_capability"], goalActionIds: ["ADSA-4.1"], limits: "Five to eight volunteers a round, no names in notes. Shows what people can do, not how widespread it is." },
  { id: "short-first-application", logicLevel: "short_term_outcomes", statement: "Staff choose to share an account of a first application of something they learned or prepared.", evidenceSources: ["voluntary_outcome_record"], evidenceLevel: "application", sourceType: "participant_report", reviewer: "program_owner", outcomeIds: ["staff_capability"], goalActionIds: [], limits: "Self-reported and self-selected. Read as themes, never as a measure of reach." },
  { id: "short-barriers-documented", logicLevel: "short_term_outcomes", statement: "Barriers are documented in review records, with who meets them and what would change.", evidenceSources: ["review_record"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "accessibility_contact", outcomeIds: ["access"], goalActionIds: ["ADSA-6.3"], limits: "Finding a barrier is not removing it." },
  { id: "intermediate-decisions-reviewed", logicLevel: "intermediate_outcomes", statement: "Key decisions carry a completed equity review and a disposition from the decision owner.", evidenceSources: ["shared_decision_record", "review_record"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "decision_owner", outcomeIds: ["institutional_application"], goalActionIds: ["ADSA-1.4"], limits: "Only decisions someone chose to share are visible." },
  { id: "intermediate-practice-changed", logicLevel: "intermediate_outcomes", statement: "A meeting, supervisory or hiring practice changes after a review, and the change is itself reviewed.", evidenceSources: ["before_after_pair", "shared_decision_record"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "goal_lead", outcomeIds: ["workplace_culture"], goalActionIds: ["ADSA-3.2"], limits: "A changed practice is not yet a changed experience; pair it with people's accounts." },
  { id: "intermediate-less-help", logicLevel: "intermediate_outcomes", statement: "A follow-up account shows comparable work done with less help, naming what the person could and could not do alone.", evidenceSources: ["voluntary_outcome_record"], evidenceLevel: "application", sourceType: "participant_report", reviewer: "program_owner", outcomeIds: ["capability_transfer"], goalActionIds: [], limits: "Fewer requests for help alone never shows independence." },
  { id: "long-service-gaps", logicLevel: "long_term_outcomes", statement: "Gaps narrow in priority service measures by race, disability, language and place.", evidenceSources: ["dhs_aggregate_data"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "data_partners", outcomeIds: ["access", "institutional_application"], goalActionIds: ["ADSA-1.2", "ADSA-1.5"], limits: "Contribution, not causation. Small groups suppressed; the comparison period is agreed with the people who hold the data." },
  { id: "long-retention-gap", logicLevel: "long_term_outcomes", statement: "The two-year retention gap by group narrows.", evidenceSources: ["dhs_aggregate_data"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "data_partners", outcomeIds: ["workplace_culture"], goalActionIds: ["ADSA-3.6"], limits: "Many causes outside the program affect retention." },
  { id: "long-community-input", logicLevel: "long_term_outcomes", statement: "Community input is acted on, and each \"you said, we did\" account is closed with the people who gave the input.", evidenceSources: ["you_said_we_did"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "community", outcomeIds: ["institutional_application"], goalActionIds: ["ADSA-2.4"], limits: "The account is written by the goal lead; community partners can correct it." },
  { id: "long-reuse", logicLevel: "long_term_outcomes", statement: "Later decisions cite an earlier maintained resource or decision, and source corrections reach every piece of affected guidance.", evidenceSources: ["shared_decision_record", "content_record"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "program_owner", outcomeIds: ["organizational_memory"], goalActionIds: [], limits: "Citations show reuse, not quality of the later decision." },
  { id: "long-adaptation", logicLevel: "long_term_outcomes", statement: "Another division or administration adapts a DSD practice and writes down what changed for its setting; pilot findings lead to a decision to expand or revise.", evidenceSources: ["program_work_record", "shared_decision_record"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "administration_contacts", outcomeIds: ["agency_coherence"], goalActionIds: [], limits: "Each administration decides what to keep; an adaptation not taken up is not a failure." },
];

/** B3: indicators per outcome (the seven). No learning counts. */
export const outcomeIndicators: readonly EvaluationIndicator[] = [
  { id: "outcome-staff-capability", logicLevel: "short_term_outcomes", outcomeIds: ["staff_capability"], statement: "Quarterly task sessions: participants could find a source, prepare an accessible meeting or notice, name who to involve and explain the next step. Themes of where they hesitated.", evidenceSources: ["task_session"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "program_owner_and_goal_lead", goalActionIds: ["ADSA-4.1"], limits: "A small, consented group; themes, not totals." },
  { id: "outcome-capability-transfer", logicLevel: "intermediate_outcomes", outcomeIds: ["capability_transfer"], statement: "Follow-up accounts where a person did comparable work on their own, with what they could and could not do alone.", evidenceSources: ["voluntary_outcome_record"], evidenceLevel: "application", sourceType: "participant_report", reviewer: "program_owner", goalActionIds: ["ADSA-4.3"], limits: "Self-reported; read as themes." },
  { id: "outcome-access-corrections", logicLevel: "intermediate_outcomes", outcomeIds: ["access"], statement: "Barriers documented and corrected, each with a check that people can now complete the task.", evidenceSources: ["before_after_pair", "review_record"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "accessibility_contact", goalActionIds: ["ADSA-6.3"], limits: "A corrected barrier in one place may remain elsewhere." },
  { id: "outcome-access-timeliness", logicLevel: "long_term_outcomes", outcomeIds: ["access"], statement: "Accommodation and interpreter requests met on time, by group where the data allow.", evidenceSources: ["dhs_aggregate_data"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "data_partners", goalActionIds: ["ADSA-6.4"], limits: "Held by the person or area responsible for the data; small cells suppressed." },
  { id: "outcome-workplace-practices", logicLevel: "intermediate_outcomes", outcomeIds: ["workplace_culture"], statement: "Changed practices with a review: meeting formats, onboarding, interview panels.", evidenceSources: ["shared_decision_record", "before_after_pair"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "hr_partner", goalActionIds: ["ADSA-3.4"], limits: "Practices can change on paper before they change in the room." },
  { id: "outcome-workplace-climate", logicLevel: "long_term_outcomes", outcomeIds: ["workplace_culture"], statement: "Climate results by group from HR's own employee-experience survey.", evidenceSources: ["dhs_aggregate_data"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "hr_partner", goalActionIds: ["ADSA-3.1"], limits: "HR's survey, HR's protections; this program runs no survey of its own." },
  { id: "outcome-institutional-application", logicLevel: "intermediate_outcomes", outcomeIds: ["institutional_application"], statement: "Policy, budget, technology and procurement decisions with a review and a disposition by the decision owner.", evidenceSources: ["shared_decision_record", "review_record"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "decision_owner", goalActionIds: ["ADSA-1.4", "ADSA-5.1"], limits: "Visible only where the decision owner shares the record." },
  { id: "outcome-organizational-memory", logicLevel: "long_term_outcomes", outcomeIds: ["organizational_memory"], statement: "Corrections that reached all affected guidance, traced; decisions that cite an earlier maintained resource or decision.", evidenceSources: ["content_record", "shared_decision_record"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "program_owner", goalActionIds: [], limits: "Traces reuse in records, never in reading or use of the application." },
  { id: "outcome-agency-coherence", logicLevel: "long_term_outcomes", outcomeIds: ["agency_coherence"], statement: "Adaptations of a DSD practice by another division or administration, each with what changed for local context; pilot findings that led to an expansion decision.", evidenceSources: ["program_work_record", "shared_decision_record"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "administration_contacts", goalActionIds: [], limits: "Local context is kept on purpose; sameness is not the aim." },
];

/** B4: indicators per ADSA goal, by year. Each action's two evidence questions (adsa-implementation.ts) are the review prompts. */
export const goalIndicators: readonly EvaluationIndicator[] = [
  // Goal 1: Eliminate Disparities
  { id: "g1-y1-team-goals-plans", goalNumber: 1, year: 1, statement: "A division equity team is chartered with a chair connected to the administration's Equity Committee; disparity goals have baselines; each goal has an action plan with a responsible role.", goalActionIds: ["ADSA-1.1", "ADSA-1.2", "ADSA-1.3"], evidenceSources: ["plan_or_charter"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "leaders_review", logicLevel: "activities", outcomeIds: ["institutional_application"], limits: "Plans and charters show the work is set up, not that it changed anything." },
  { id: "g1-y2-toolkit-decisions", goalNumber: 1, year: 2, statement: "Key decisions carry an Equity Analysis Toolkit review done while the decision could still change, with the decision owner's disposition.", goalActionIds: ["ADSA-1.4"], evidenceSources: ["shared_decision_record", "review_record"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "decision_owner", logicLevel: "intermediate_outcomes", outcomeIds: ["institutional_application"], limits: "Only decisions whose owners share the record are visible." },
  { id: "g1-y2-measures-approved", goalNumber: 1, year: 2, statement: "Each disparity goal has an approved measure definition with baseline, comparison, the person or area holding the data and privacy limits.", goalActionIds: ["ADSA-1.5", "ADSA-1.2"], evidenceSources: ["program_work_record", "plan_or_charter"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "data_partners", logicLevel: "intermediate_outcomes", outcomeIds: ["institutional_application"], limits: "An approved measure is a tool for judging change, not the change itself." },
  { id: "g1-y3-gaps-narrow", goalNumber: 1, year: 3, statement: "Priority service gaps narrow by race, disability, language and place.", goalActionIds: ["ADSA-1.2", "ADSA-1.5"], evidenceSources: ["dhs_aggregate_data"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "data_partners", logicLevel: "long_term_outcomes", outcomeIds: ["access", "institutional_application"], limits: "Contribution, not causation." },
  // Goal 2: Community Engagement
  { id: "g2-y1-engagement-plans", goalNumber: 2, year: 1, statement: "Engagement plans offer accessible ways to take part and payment for people's time where policy allows, prepared with the Equity Analysis Toolkit and the Community Relations Guide.", goalActionIds: ["ADSA-2.3", "ADSA-2.5"], evidenceSources: ["plan_or_charter"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "community", logicLevel: "activities", outcomeIds: ["access", "institutional_application"], limits: "A plan is not yet a partnership." },
  { id: "g2-y1-tribal-route", goalNumber: 2, year: 1, statement: "The route to Tribal Consultation training in the official DHS system, and to the responsible Tribal liaison, is named and current.", goalActionIds: ["ADSA-2.2"], evidenceSources: ["plan_or_charter", "content_record"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "community", logicLevel: "inputs", outcomeIds: ["institutional_application"], limits: "Training records stay in the official system; the program holds none." },
  { id: "g2-y2-input-before-final", goalNumber: 2, year: 2, statement: "Decisions take in community input before they are final; \"you said, we did\" items are closed; the relevant advisory council is consulted through its relationship owner.", goalActionIds: ["ADSA-2.4", "ADSA-2.1"], evidenceSources: ["you_said_we_did", "shared_decision_record"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "community", logicLevel: "intermediate_outcomes", outcomeIds: ["institutional_application"], limits: "Input taken in is not input acted on; the account says which." },
  { id: "g2-y3-heard", goalNumber: 2, year: 3, statement: "Communities report being heard, in their own words, gathered by the goal lead.", goalActionIds: ["ADSA-2.3", "ADSA-2.4"], evidenceSources: ["you_said_we_did"], evidenceLevel: "benefit", sourceType: "participant_report", reviewer: "community", logicLevel: "long_term_outcomes", outcomeIds: ["institutional_application", "access"], limits: "Accounts from the people who took part; others may differ." },
  // Goal 3: Hiring and Retention
  { id: "g3-y1-hiring-steps", goalNumber: 3, year: 1, statement: "Job descriptions and hiring steps are reviewed; interview panel guidance and job-related equity questions are adopted with HR; an onboarding plan is in place.", goalActionIds: ["ADSA-3.3", "ADSA-3.5", "ADSA-3.4"], evidenceSources: ["review_record", "plan_or_charter"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "hr_partner", logicLevel: "activities", outcomeIds: ["workplace_culture"], limits: "Guidance adopted is not guidance followed." },
  { id: "g3-y1-survey-plan", goalNumber: 3, year: 1, statement: "The yearly employee-experience survey has an owner in HR, a baseline and protections for small groups.", goalActionIds: ["ADSA-3.1"], evidenceSources: ["plan_or_charter"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "hr_partner", logicLevel: "inputs", outcomeIds: ["workplace_culture"], limits: "HR's survey; this program runs none of its own." },
  { id: "g3-y2-panels-practice", goalNumber: 3, year: 2, statement: "Interview panels are formed to the guidance; a workplace practice addressing bias or microaggressions changes after a review; employee resource group and Employee Engagement Committee support shows in scheduling and workload decisions.", goalActionIds: ["ADSA-3.3", "ADSA-3.2", "ADSA-3.7", "ADSA-3.8"], evidenceSources: ["shared_decision_record", "review_record"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "goal_lead", logicLevel: "intermediate_outcomes", outcomeIds: ["workplace_culture"], limits: "Taking part in a group is never required, recorded or asked about." },
  { id: "g3-y3-retention-climate", goalNumber: 3, year: 3, statement: "The two-year retention gap by group narrows, and climate results by group improve in HR's own survey.", goalActionIds: ["ADSA-3.6", "ADSA-3.1"], evidenceSources: ["dhs_aggregate_data"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "data_partners", logicLevel: "long_term_outcomes", outcomeIds: ["workplace_culture"], limits: "Many causes outside the program; contribution, not causation." },
  // Goal 4: Learning and Development
  { id: "g4-y1-plans", goalNumber: 4, year: 1, statement: "Learning-and-application plans exist for staff and hiring managers, and skills-building and leadership opportunities are listed with how people can reach them.", goalActionIds: ["ADSA-4.1", "ADSA-4.3"], evidenceSources: ["plan_or_charter"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "goal_lead", logicLevel: "outputs", outcomeIds: ["staff_capability"], limits: "Plans show what is offered, not what anyone gained." },
  { id: "g4-y1-idi-route", goalNumber: 4, year: 1, statement: "The official ADSA IDI Implementation Plan and its authorized administrator are named, and assessment results stay with that administrator.", goalActionIds: ["ADSA-4.2"], evidenceSources: ["plan_or_charter"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "goal_lead", logicLevel: "inputs", outcomeIds: ["staff_capability"], limits: "The IDI follows the official ADSA plan outside this program; the program keeps no assessment results." },
  { id: "g4-y2-applied", goalNumber: 4, year: 2, statement: "Staff choose to share accounts of learning applied in their work, and task sessions show people doing representative tasks with their reasoning.", goalActionIds: ["ADSA-4.1"], evidenceSources: ["voluntary_outcome_record", "task_session"], evidenceLevel: "application", sourceType: "participant_report", reviewer: "program_owner_and_goal_lead", logicLevel: "short_term_outcomes", outcomeIds: ["staff_capability"], limits: "Never completions from this application. Accounts are self-selected and read as themes." },
  { id: "g4-y3-transfer", goalNumber: 4, year: 3, statement: "Follow-up accounts show comparable work done with more independence, and leaders describe changed practice in their teams.", goalActionIds: ["ADSA-4.1", "ADSA-4.3"], evidenceSources: ["voluntary_outcome_record", "meeting_record"], evidenceLevel: "benefit", sourceType: "participant_report", reviewer: "leaders_review", logicLevel: "long_term_outcomes", outcomeIds: ["capability_transfer"], limits: "No promise of promotion or appointment; accounts, not ratings." },
  // Goal 5: Contracts and Procurement
  { id: "g5-y1-review-outreach", goalNumber: 5, year: 1, statement: "Current contracting and grant practices are reviewed with the Equity Analysis Toolkit; a solicitation outreach plan compares venues; the verified current benchmark and baseline for vendor participation are identified.", goalActionIds: ["ADSA-5.1", "ADSA-5.3", "ADSA-5.2"], evidenceSources: ["review_record", "plan_or_charter"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "goal_lead", logicLevel: "activities", outcomeIds: ["institutional_application"], limits: "Sourcing options need legal and procurement review." },
  { id: "g5-y2-solicitations-changed", goalNumber: 5, year: 2, statement: "Solicitations change after a review, and venues are added so more eligible vendors hear of opportunities.", goalActionIds: ["ADSA-5.1", "ADSA-5.3"], evidenceSources: ["before_after_pair", "review_record"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "decision_owner", logicLevel: "intermediate_outcomes", outcomeIds: ["institutional_application", "access"], limits: "Wider notice does not promise selection." },
  { id: "g5-y3-vendor-participation", goalNumber: 5, year: 3, statement: "Vendor participation moves toward verified benchmarks.", goalActionIds: ["ADSA-5.2"], evidenceSources: ["dhs_aggregate_data"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "data_partners", logicLevel: "long_term_outcomes", outcomeIds: ["institutional_application"], limits: "Procurement aggregate data, held by the person or area responsible." },
  // Goal 6: Communication and Accessibility
  { id: "g6-y1-guides", goalNumber: 6, year: 1, statement: "An inclusive-language guide, a crosswalk of communication practice to the National CLAS Standards and a notable-dates recognition plan are in place.", goalActionIds: ["ADSA-6.1", "ADSA-6.4", "ADSA-6.2"], evidenceSources: ["plan_or_charter"], evidenceLevel: "delivery", sourceType: "independent_observation", reviewer: "goal_lead", logicLevel: "outputs", outcomeIds: ["access"], limits: "A crosswalk does not declare compliance." },
  { id: "g6-y2-revised-checked", goalNumber: 6, year: 2, statement: "Communications are revised after a review, with a check that people can complete the task; accessibility remediation is closed and rechecked.", goalActionIds: ["ADSA-6.1", "ADSA-6.3", "ADSA-6.4"], evidenceSources: ["before_after_pair", "review_record"], evidenceLevel: "application", sourceType: "independent_observation", reviewer: "accessibility_contact", logicLevel: "intermediate_outcomes", outcomeIds: ["access"], limits: "Training records for accessibility stay in the official system." },
  { id: "g6-y3-access", goalNumber: 6, year: 3, statement: "Access complaints fall, and accommodation and interpreter requests are met on time.", goalActionIds: ["ADSA-6.3", "ADSA-6.4"], evidenceSources: ["dhs_aggregate_data"], evidenceLevel: "benefit", sourceType: "independent_observation", reviewer: "data_partners", logicLevel: "long_term_outcomes", outcomeIds: ["access"], limits: "Fewer complaints can also mean people gave up; read with people's accounts." },
];

export const allIndicators: readonly EvaluationIndicator[] = [...logicModelIndicators, ...outcomeIndicators, ...goalIndicators];

/* --------------------------------------------------------------- Plan-Do-Study-Act --------------------------------------------------------------- */

export type PdsaStep = "Plan" | "Do" | "Study" | "Act";

/** B5: the owner's Plan-Do-Study-Act cycle, mapped onto the six-stage improvement cycle (equity-framework.ts) and the program work record's phases (work-schema.ts). */
export const pdsaCycle: readonly { step: PdsaStep; frameworkStages: readonly string[]; workPhases: readonly string[]; asks: string }[] = [
  { step: "Plan", frameworkStages: ["Assess", "Plan"], workPhases: ["prepared", "decision_recorded"], asks: "The question, the change, who is affected, a prediction, the measure (the ten measure fields, with no learning or use counted), the decision owner and when to look again." },
  { step: "Do", frameworkStages: ["Implement"], workPhases: ["applied"], asks: "Try it small: one unit, one notice, one month. Keep the before and after versions. Write down what actually happened." },
  { step: "Study", frameworkStages: ["Measure", "Learn"], workPhases: ["results_recorded"], asks: "Compare with the prediction, using the measure and people's accounts. Record the observation, evidence, limits and confidence, the evidence level, and whether it rests on a participant report or an independent observation." },
  { step: "Act", frameworkStages: ["Improve"], workPhases: ["decision_recorded", "reviewed"], asks: "The decision owner records retain, revise, stop or not yet known, with the next action and who carries it. Tell the people who contributed what happened, and carry the learning into the next comparable task." },
];

export const pdsaDispositions = ["retain", "revise", "stop", "not_yet_known"] as const;

/** The worked Goal 6 example (ADSA 6.1 and 6.3), written as a complete cycle. Checked by PdsaCycleSchema in tests. */
export const goal6WorkedExample = {
  schemaVersion: 1 as const,
  id: "pdsa-goal-6-appointment-notice",
  title: "Plain-language appointment notice",
  goalActionIds: ["ADSA-6.1", "ADSA-6.3"],
  outcomeIds: ["access"],
  plan: {
    question: "People who get one unit's appointment notice often call to ask what to do next. Is the notice hard to act on?",
    change: "Rewrite the notice in plain language with the next step first, and check it with a screen reader.",
    affected: "People receiving the notice, their families and the unit's phone staff.",
    prediction: "Fewer callers will ask what the next step is, and people using the notice will say it is clear.",
    measure: {
      title: "Next-step questions about the appointment notice",
      calculation: "Calls tagged \"what do I do next\" about this notice, divided by notices sent, for the same month before and after the rewrite.",
      population: "Notices sent by one unit in one month; calls about other notices are excluded.",
      evidenceSource: "The unit's call-reason tallies, an operational record of the service kept by the unit lead; no caller details.",
      period: "One month before and one month after the change.",
      comparison: "Same unit, same month length; seasonal changes in call volume could explain some of the difference.",
      differencesPrivacy: "Totals only, no caller details; language of the call where the unit already records it.",
      targetReference: "No target is approved; this is a small test.",
      reviewReference: "The unit lead and the Goal 6 lead review the result.",
      nextTrigger: "A change to the notice template or to how calls are tagged.",
    },
    decisionOwner: "Unit lead",
    reviewMonth: "2027-03",
  },
  do: {
    scope: "One unit, one notice, one month.",
    whatHappened: "The rewritten notice went out for one month; the before and after versions were kept together.",
  },
  study: {
    comparedWithPrediction: "Next-step questions fell after the rewrite, as predicted; two callers still asked where to bring documents.",
    observation: "Callers more often asked about the appointment itself than about what to do next.",
    evidence: "The unit's call-reason tallies for the two months, comments from people using the notice, and phone staff observations.",
    evidenceLevel: "application" as const,
    sourceType: "independent_observation" as const,
    limits: "One month each side; call volume varies by season; the tallies depend on how staff tag calls.",
    confidence: "early_observation" as const,
  },
  act: {
    disposition: "revise" as const,
    decisionOwner: "Unit lead",
    decisionReference: "Unit meeting decision, next-step notice",
    nextAction: "Add where to bring documents, then use the notice template for the unit's other notices.",
    implementationOwner: "Unit lead with the Goal 6 lead",
    reportBack: "Phone staff and the people who commented hear what changed and why.",
  },
};

/* ---------------------------------------------------------------- validation ---------------------------------------------------------------- */

export type EvaluationReferences = {
  outcomeIds: readonly string[];
  goals: readonly { number: number; actionIds: readonly string[] }[];
  logicStageSlugs: readonly string[];
  frameworkStages: readonly string[];
};

const allowedIds = new Set<string>(allowedEvidenceSources.map(s => s.id));
const forbiddenIds = new Set<string>(forbiddenEvidence.map(f => f.id));

/** Problems with one indicator. Rejects any indicator that names a forbidden source or uses one in its statement. */
export function indicatorProblems(indicator: EvaluationIndicator): string[] {
  const problems: string[] = [];
  const where = `indicator ${indicator.id}`;
  if (!indicator.evidenceSources.length) problems.push(`${where}: names no evidence source`);
  for (const source of indicator.evidenceSources as readonly string[]) {
    if (forbiddenIds.has(source)) problems.push(`${where}: uses forbidden evidence source "${source}"`);
    else if (!allowedIds.has(source)) problems.push(`${where}: unknown evidence source "${source}"`);
  }
  for (const finding of forbiddenEvidenceIn(indicator.statement)) problems.push(`${where}: statement uses forbidden evidence (${finding.id}): "${finding.match}"`);
  const supports = indicator.evidenceSources.some(source => allowedEvidenceSources.find(s => s.id === source)?.levels.includes(indicator.evidenceLevel));
  if (indicator.evidenceSources.length && !supports) problems.push(`${where}: no source supports the ${indicator.evidenceLevel} level`);
  if (!["participant_report", "independent_observation"].includes(indicator.sourceType)) problems.push(`${where}: source type must be participant report or independent observation`);
  if (!(indicator.reviewer in reviewers)) problems.push(`${where}: unknown reviewer "${indicator.reviewer}"`);
  if (!indicator.limits.trim()) problems.push(`${where}: states no limits`);
  if (indicator.year !== undefined && yearEvidenceLevel[indicator.year] !== indicator.evidenceLevel) problems.push(`${where}: year ${indicator.year} indicators are ${yearEvidenceLevel[indicator.year]} evidence`);
  if ((indicator.year === undefined) !== (indicator.goalNumber === undefined)) problems.push(`${where}: goal indicators need both a goal and a year`);
  return problems;
}

/** Checks the whole model against the live program model: every reference resolves and every indicator is allowed. */
export function validateEvaluationModel(refs: EvaluationReferences, indicators: readonly EvaluationIndicator[] = allIndicators): string[] {
  const problems: string[] = [];
  const outcomes = new Set(refs.outcomeIds);
  const actions = new Map(refs.goals.flatMap(goal => goal.actionIds.map(id => [id, goal.number] as const)));
  const seen = new Set<string>();
  for (const indicator of indicators) {
    if (seen.has(indicator.id)) problems.push(`indicator ${indicator.id}: duplicate id`);
    seen.add(indicator.id);
    problems.push(...indicatorProblems(indicator));
    for (const id of indicator.outcomeIds) if (!outcomes.has(id)) problems.push(`indicator ${indicator.id}: unknown outcome "${id}"`);
    for (const id of indicator.goalActionIds) {
      if (!actions.has(id)) problems.push(`indicator ${indicator.id}: unknown ADSA action "${id}"`);
      else if (indicator.goalNumber !== undefined && actions.get(id) !== indicator.goalNumber) problems.push(`indicator ${indicator.id}: action ${id} is not in goal ${indicator.goalNumber}`);
    }
    if (indicator.goalNumber !== undefined && !refs.goals.some(goal => goal.number === indicator.goalNumber)) problems.push(`indicator ${indicator.id}: unknown goal ${indicator.goalNumber}`);
  }
  for (const level of logicLevels) if (!refs.logicStageSlugs.includes(level.stageSlug)) problems.push(`logic level ${level.id}: unknown logic-model stage "${level.stageSlug}"`);
  for (const step of pdsaCycle) for (const stage of step.frameworkStages) if (!refs.frameworkStages.includes(stage)) problems.push(`PDSA ${step.step}: unknown improvement-cycle stage "${stage}"`);
  const mapped = new Set(pdsaCycle.flatMap(step => step.frameworkStages));
  for (const stage of refs.frameworkStages) if (!mapped.has(stage)) problems.push(`improvement-cycle stage "${stage}" has no PDSA step`);
  return problems;
}

export type EvaluationCoverage = {
  actionsWithout: string[];
  outcomesWithout: string[];
  levelsWithout: LogicLevelId[];
  goalYearsWithout: string[];
  actionCount: number;
  outcomeCount: number;
};

/** Coverage: every action, outcome, logic level and goal-year has at least one indicator. */
export function evaluationCoverage(refs: EvaluationReferences, indicators: readonly EvaluationIndicator[] = allIndicators): EvaluationCoverage {
  const actionIds = refs.goals.flatMap(goal => goal.actionIds);
  const usedActions = new Set<string>(indicators.flatMap(i => i.goalActionIds));
  const usedOutcomes = new Set<string>(indicators.flatMap(i => i.outcomeIds));
  const usedLevels = new Set(indicators.map(i => i.logicLevel));
  const goalYears = new Set(indicators.filter(i => i.goalNumber !== undefined).map(i => `${i.goalNumber}-${i.year}`));
  return {
    actionsWithout: actionIds.filter(id => !usedActions.has(id)),
    outcomesWithout: refs.outcomeIds.filter(id => !usedOutcomes.has(id)),
    levelsWithout: logicLevels.map(l => l.id).filter(id => !usedLevels.has(id)),
    goalYearsWithout: refs.goals.flatMap(goal => ([1, 2, 3] as const).map(year => `${goal.number}-${year}`)).filter(key => !goalYears.has(key)),
    actionCount: actionIds.length,
    outcomeCount: refs.outcomeIds.length,
  };
}
