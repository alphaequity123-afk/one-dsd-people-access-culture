import { defineEditableSurface, type EditableSurfaceValues } from "./editable-surface-contract";

export const DECISION_TASKS = ["notice", "policy", "service", "workforce", "participation", "contracts"] as const;
export type DecisionTask = typeof DECISION_TASKS[number];
export const DECISION_STAGES = ["decision", "people", "options", "participation", "review"] as const;

const copy: Record<string, string> = {
  title: "Work through a decision",
  intro: "Begin with a piece of work, explore the choices, and prepare a useful next step. You can move between the five stages in any order.",
  boundary: "These are working notes alongside the Equity Analysis Toolkit. They do not replace the official toolkit, engagement with people affected, or the review and decisions your work requires.",
  privacy: "Use general notes. Leave out names, case details, personnel information, and other confidential information.",
  saveNote: "Nothing is saved until you choose Save to My Work. Saved notes stay in this browser on this device.",
  aboutNotes: "About these notes",
  retention: "Notes stay on this page until you choose Save to My Work. A saved copy stays in this browser on this device; it is not sent to anyone. Download a copy if you need to keep it elsewhere, following your work’s information rules.",
  titleLabel: "Give this piece of work a name",
  taskLabel: "What are you working on?",
  taskEmpty: "Choose a starting point, or begin without one",
  taskHelp: "Choosing a task changes the suggestions, not your notes. You can use any of the tools.",
  noticeLabel: "A notice, form, or message",
  noticePrompt: "Help someone understand the message, decide what to do next, and find help. Check the accuracy of essential information before changing wording or formats.",
  noticeDsdPrompt: "For a CFSS or waiver notice, examine the explanation and help route. Confirm current guidance; a clearer draft does not change eligibility, deadlines, or appeal rights.",
  policyLabel: "A policy or legislative question",
  policyPrompt: "Identify what is proposed, what is already required, and which choices remain open. Examine possible effects and prepare questions for the policy staff responsible.",
  policyDsdPrompt: "For a waiver, state-plan, or legislative question, distinguish a proposal from an enacted change and current program guidance. Make the decision authority and remaining choices clear.",
  serviceLabel: "A service, process, or handoff",
  servicePrompt: "Follow a person’s path through the process. Identify what they must do, where help is needed, and which responsibilities must connect.",
  serviceDsdPrompt: "Consider an assessment, support-planning, or navigation handoff involving MnCHOICES, a lead agency, or Disability Hub MN. Keep each partner’s responsibilities clear and examine the person’s next step.",
  workforceLabel: "Hiring, onboarding, or team practice",
  workforcePrompt: "Examine job-related expectations, access to support, and opportunities to contribute. Confirm workforce requirements with the responsible people before proposing a change.",
  workforceDsdPrompt: "Consider a new DSD colleague, a hiring process, or a team practice. Clarify expectations and useful support without assuming authority to change employment requirements.",
  participationLabel: "Participation and community feedback",
  participationPrompt: "Invite people while choices remain open. Plan accessible ways to contribute, record what their input changed, and explain decisions and unresolved questions when reporting back.",
  participationDsdPrompt: "For a service or planning decision, consider people with disabilities, families, and relevant partners. No person or meeting represents every community; identify whose perspective is still missing.",
  contractsLabel: "A contract or purchase",
  contractsPrompt: "Examine the purpose, outreach, access, and proposed terms with the responsible contracting staff. Compare workable approaches before choices are settled.",
  contractsDsdPrompt: "For a possible purchase of technical assistance or training, examine participation and usable delivery. Keep purchasing distinct from Medicaid provider enrollment and individual service authorization.",
  decisionStage: "Describe the decision",
  peopleStage: "People and evidence",
  optionsStage: "Compare approaches",
  participationStage: "Participation and action",
  reviewStage: "Review and revisit",
  decisionIntro: "Define the choice, what can change, and who can decide. Begin planning participation while people can still influence it.",
  peopleIntro: "Separate what you know from what you are assuming. Keep missing evidence and perspectives visible.",
  optionsIntro: "Compare at least two feasible approaches, including the current approach where useful. Apply the same questions to each. Write unknown when the evidence is not available.",
  participationIntro: "Connect participation with the proposal and the next action. A planned conversation is not completed engagement or community agreement.",
  reviewIntro: "Plan what to examine, then return to record what happened. An uncertain, unchanged, or unhelpful result is worth recording too.",
  decisionLabel: "The decision and its limits", decisionHelp: "What is being considered, what can still change, and what is outside this piece of work?",
  decisionOwnerLabel: "Who has decision authority?", decisionOwnerHelp: "Name the person or area responsible and any authority that still needs confirmation.",
  requirementsLabel: "Requirements to confirm", requirementsHelp: "Record the source, version or date, how it may apply, and the question for the person responsible. Keep requirements separate from suggestions.",
  peopleLabel: "People who may be affected", peopleHelp: "Consider differences in access, benefits, burdens, and support. Ask about preferences rather than inferring them from a person’s identity.",
  evidenceLabel: "Evidence and experience available", evidenceHelp: "Reference the source and period, what it supports, and how people’s accounts inform it. Do not paste confidential records.",
  uncertaintiesLabel: "What is missing or uncertain?", uncertaintiesHelp: "Whose perspective is missing? What assumptions, alternative explanations, or unanswered questions need attention?",
  alternativesLabel: "What do you learn from comparing the options?", alternativesHelp: "Explain the important tradeoffs, adjustments, and remaining questions. An option is not automatically the best because it sounds more inclusive.",
  proposalLabel: "A proposal to discuss", proposalHelp: "If you are ready, describe the approach you would recommend, why, and the review or evidence still needed. It is also fine to record why no recommendation is ready.",
  participationLabelField: "Participation while choices are open", participationHelp: "Who should contribute, what can they influence, and what language, disability access, timing, or other support would make participation possible?",
  feedbackLabel: "What people said, and the response", feedbackHelp: "Distinguish planned conversations from input actually received. Record changes, decisions and reasons, unresolved concerns, and how you will report back. Leave out identifying details.",
  actionLabel: "The next action", actionHelp: "What useful step can happen next? Mark it as proposed until agreed.",
  nextActionOwnerLabel: "Who would carry it forward?", nextActionOwnerHelp: "Name the responsible role and any agreement still needed. This may be different from the decision-maker.",
  supportLabel: "Support and resources needed", supportHelp: "Consider staff time, access arrangements, funding, coordination, and maintaining the work after a change.",
  outcomeLabel: "What change would matter?", outcomeHelp: "Describe the experience, access, or work outcome you hope to improve. Keep this separate from a document produced, a meeting held, or a course completed.",
  reviewDateLabel: "Proposed review date", reviewDateHelp: "Choose timing that fits the work. Leave it blank if it has not been agreed.",
  reviewLabel: "What will you examine, and with whom?", reviewHelp: "Name useful signals, their sources and limits, the people responsible, and what would prompt reconsideration. Confirm permissions and reporting protections before using data.",
  observationsLabel: "What happened, and what should happen next?", observationsHelp: "Return after review. Note the period, evidence, perspectives, what improved or did not, uncertainty, and the next decision. Do not assume that one change caused a result.",
  optionTitleLabel: "Approach", optionBenefitsLabel: "Possible benefits", optionBurdenLabel: "Time, effort, and access needs", optionRisksLabel: "Risks, limits, and uncertainty", optionEvidenceLabel: "Evidence or questions to investigate",
  optionsAdd: "Add another approach", optionsRemove: "Remove this approach",
  promptsTitle: "Questions to consider before sharing",
  promptsIntro: "These optional prompts help you revisit the work. A status records your own reflection; it does not approve the analysis.",
  authorityCheck: "Is the decision authority clear, and have applicable requirements been checked?",
  participationCheck: "Could people influence the decision, and is the response to their input clear?",
  accessCheck: "Have language, disability access, and practical burdens been considered?",
  evidenceCheck: "Are evidence, assumptions, and uncertainty distinguishable?",
  followThroughCheck: "Is there a responsible next action and a useful plan to review what happens?",
  statusNotStarted: "Not yet considered", statusReviewed: "Considered", statusNeedsWork: "Needs more work", statusNotApplicable: "Does not apply — explain why",
  promptNote: "Evidence, open question, or reason",
  resourcesTitle: "Tools for this part of the work", resourcesHelp: "Open a resource whenever useful. These links support the work; they are not steps you must complete.",
  resourcesKeep: "Keep these links with my notes", resourcesKept: "Resource links added to your notes. Save to My Work to keep this change.",
  contextTitle: "Connect with the wider purpose", contextDsd: "The Equity Outcome Map sets out intended outcomes. Where an ADSA goal applies, connect its action to a real work product and questions about results. The goals do not replace the requirements for your work.", contextDhs: "The Equity Outcome Map provides shared direction. The DSD video shows one application of that direction; confirm the priorities and requirements that apply to your own work.",
  saveLabel: "Save to My Work", downloadLabel: "Download my notes", printLabel: "Print my notes", newLabel: "Start a new analysis", previousLabel: "Previous stage", nextLabel: "Next stage", myWorkLabel: "Open My Work",
  saved: "Saved to My Work.",
  changed: "You have changes that are not saved to My Work.",
  downloaded: "Your notes download is ready.",
  downloadError: "The download could not be created. Your notes remain here. Try printing them, or save to My Work before leaving.",
  loadError: "This saved analysis could not be opened. Your saved work has not changed. Return to My Work, or choose Start a new analysis.",
  saveError: "Your notes could not be saved. They remain on this page; download a copy before leaving. Existing saved work has not been replaced.",
  conflictError: "Saved work changed in another tab. Your notes remain here and have not replaced it. Download your notes before reopening the saved analysis from My Work.",
  titleNeeded: "Give this piece of work a name before saving.",
  confirmNew: "Start a new blank analysis? Any changes not saved or downloaded will be cleared from this page. Saved work stays in My Work.",
  confirmRemove: "Remove this approach and its notes from this draft?",
  newReady: "A new blank analysis is ready. Existing saved work is unchanged.",
};

const links = {
  noticeResources: [{ label: "Plain-language guide", href: "/library/ja-plain-language" }, { label: "Cultural and language access planning", href: "/practice/clas" }, { label: "Language-access checklist", href: "/library/ja-language-access-checklist" }],
  policyResources: [{ label: "DHS equity policy", href: "/equity-policy" }, { label: "Equity analysis for policy review", href: "/learn/equity-toolkit/policy-review" }, { label: "Requirements and review evidence", href: "/practice/requirements" }, { label: "Policy and legislative analysis learning", href: "/learn/self-directed?course=A21" }],
  serviceResources: [{ label: "Examine a process barrier", href: "/equity-review/structural" }, { label: "Make a process easier to use", href: "/practice-guides/clearer-processes" }, { label: "Teams and cross-collaboration", href: "/learn/collaboration" }],
  workforceResources: [{ label: "Inclusive hiring and workforce planning", href: "/practice/gp-6" }, { label: "Learning and facilitation plan", href: "/practice/gp-5" }, { label: "Stay conversations and retention", href: "/library/pn-stay-interviews-and-retention" }],
  participationResources: [{ label: "Engagement and report-back plan", href: "/practice/gp-3" }, { label: "Make participation more accessible", href: "/practice-guides/inclusive-meetings" }, { label: "Cultural and language access planning", href: "/practice/clas" }],
  contractsResources: [{ label: "Procurement and contract review", href: "/practice/gp-10" }, { label: "Requirements and review evidence", href: "/practice/requirements" }],
  decisionResources: [{ label: "Official toolkit and access details", href: "/library/ext-dhs-equity-toolkit" }, { label: "Confirm applicable requirements", href: "/practice/requirements" }],
  peopleResources: [{ label: "Plan cultural and language access", href: "/practice/clas" }, { label: "Plan meaningful evidence", href: "/practice/measurement" }],
  optionsResources: [{ label: "Watch the toolkit worked example", href: "/learn/equity-toolkit/practice#worked-example" }, { label: "Examine a process barrier", href: "/equity-review/structural" }],
  participationStageResources: [{ label: "Engagement and report-back plan", href: "/practice/gp-3" }, { label: "Find the person or area responsible", href: "/support/right-person" }],
  reviewResources: [{ label: "Measurement and evaluation", href: "/practice/measurement" }, { label: "Requirements and review evidence", href: "/practice/requirements" }],
  contextResources: [{ label: "Watch the Equity Outcome Map", href: "/learn/equity-in-practice#understand-the-map" }, { label: "See the DSD practice example", href: "/learn/equity-in-practice#put-it-into-practice" }, { label: "Watch the toolkit worked example", href: "/learn/equity-toolkit/practice#worked-example" }],
  dsdContextResources: [{ label: "DSD programs and services", href: "/one-dsd/programs" }, { label: "Connect applicable ADSA goals to work", href: "/program/implementation" }],
};

export const DECISION_WORKSPACE_SURFACE = defineEditableSurface({
  surfaceId: "equity-toolkit.decision", route: "/learn/equity-toolkit/practice", scopePolicy: "inheritable", label: "Working through a decision",
  fields: [
    ...Object.keys(copy).map(key => ({ key, label: key, kind: "long" as const, required: true })),
    ...Object.keys(links).map(key => ({ key, label: key, kind: "link-list" as const, required: true, maxItems: 8 })),
  ],
  approvedValues: { ...copy, ...links },
});

export function decisionText(values: Readonly<EditableSurfaceValues> | undefined, key: string): string {
  const supplied = values?.[key];
  return typeof supplied === "string" ? supplied : copy[key] ?? "";
}
export function decisionLinks(values: Readonly<EditableSurfaceValues> | undefined, key: string): {label: string; href: string}[] {
  const entries = values?.[key] ?? links[key as keyof typeof links];
  return Array.isArray(entries) ? entries.filter((entry): entry is {label: string; href: string} => Boolean(entry && typeof entry === "object" && "label" in entry && typeof entry.label === "string" && "href" in entry && typeof entry.href === "string")) : [];
}
