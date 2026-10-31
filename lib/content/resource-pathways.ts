import type { ContentItem } from "./types";

export type ResourcePathwayChoice = {
  label: string;
  purpose: string;
  resourceIds: readonly string[];
};

export type ResourcePathway = {
  title: string;
  introduction: string;
  workProduct: string;
  intendedBenefit: string;
  choices: readonly ResourcePathwayChoice[];
};

/** Optional starting choices, not prerequisites or a prescribed work sequence. */
export const RESOURCE_PATHWAYS: Readonly<Record<string, ResourcePathway>> = {
  identity: {
    title: "Prepare for a conversation across difference",
    introduction: "Make room for another person's experience without assuming a community description tells you who that person is.",
    workProduct: "Questions to ask, assumptions to examine, and a communication approach you can adapt together.",
    intendedBenefit: "People have more opportunity to explain what matters to them and influence the conversation.",
    choices: [
      { label: "Find a starting point", purpose: "Use community context to prepare questions, not to predict a person's preferences.", resourceIds: ["pn-intercultural-method", "pn-cultural-humility-briefs-as-questions"] },
      { label: "Consider whose experience is missing", purpose: "Examine how identity, institutional practices, and power can shape the same situation differently.", resourceIds: ["lm-intersectionality-foundations", "lm-structural-racism-and-institutions"] },
      { label: "Bring learning into a conversation", purpose: "Plan participation and activities that people can use in their own work.", resourceIds: ["ja-facilitation-session-plan"] },
    ],
  },
  access: {
    title: "Make a notice easier to understand and use",
    introduction: "For example, review a notice that people receive before an important choice or deadline. Begin with the tool that fits the change you need to make.",
    workProduct: "A revised notice and a plan to check whether people can find, understand, and act on its message.",
    intendedBenefit: "People can understand their choices and take the next step with fewer avoidable barriers.",
    choices: [
      { label: "Review the notice", purpose: "Look at the message, timing, format, and action the reader needs to take.", resourceIds: ["ja-form-notice-change", "ja-plain-language"] },
      { label: "Plan language and communication support", purpose: "Consider the language and access needs of the people receiving the notice.", resourceIds: ["ja-language-cultural-access-planning", "ja-language-access-checklist"] },
      { label: "Keep the meaning while improving clarity", purpose: "Practice explaining complex information without losing important choices or qualifications.", resourceIds: ["lm-plain-language-carries-complexity"] },
    ],
  },
  disability: {
    title: "Understand a barrier in someone's service experience",
    introduction: "Consider the person's goals, the choices available, and the demands a service places on them. The tools support inquiry alongside the applicable program guidance.",
    workProduct: "A description of the barrier, the person's priorities, and options for improving the service experience.",
    intendedBenefit: "People have more usable choices and fewer avoidable obstacles to participating in their communities.",
    choices: [
      { label: "Understand the service context", purpose: "Connect rights, person-centered practice, and the frameworks used in disability services.", resourceIds: ["lm-disability-rights-and-service-delivery", "tool-lifecourse"] },
      { label: "Examine the experience", purpose: "Review access, provider capacity, and the steps, time, and effort a process asks of people.", resourceIds: ["tool-one-dsd-hcbs-review", "ja-process-burden"] },
      { label: "Plan for transitions", purpose: "Look for access or accommodation gaps when a person's circumstances change.", resourceIds: ["ja-accommodation-across-transitions"] },
    ],
  },
  policy: {
    title: "Prepare an equity-informed recommendation",
    introduction: "Use the collection to examine a proposed policy, service change, budget choice, or contract. Choose a practical aid directly or explore the learning behind it.",
    workProduct: "A recommendation that explains who is affected, the alternatives considered, and what needs to happen next.",
    intendedBenefit: "Decisions respond more clearly to people's experiences, avoidable barriers, and the consequences of different choices.",
    choices: [
      { label: "Frame the decision", purpose: "Identify the questions and depth of analysis that fit the decision.", resourceIds: ["ja-equity-impact-questions", "ja-equity-scan-or-full-analysis"] },
      { label: "Compare the alternatives", purpose: "Use the equity review and consult the toolkit source as needed.", resourceIds: ["tool-one-dsd-policy-review", "ext-dhs-equity-toolkit", "ja-procurement-contract-equity"] },
      { label: "Explain the follow-through", purpose: "Plan how people will hear what changed, what could not change, and why.", resourceIds: ["ja-report-back", "guide-one-dsd-work-plan"] },
    ],
  },
  workforce: {
    title: "Make a hiring or development decision more equitable",
    introduction: "For example, examine a job requirement or an opportunity for staff development. Start with the immediate decision and explore the wider employee experience when useful.",
    workProduct: "A clearer job-related requirement, selection approach, or staff-development opportunity.",
    intendedBenefit: "Staff and applicants have a fairer opportunity to demonstrate relevant strengths and access development.",
    choices: [
      { label: "Examine a requirement", purpose: "Ask what the work actually requires and which assumptions might restrict opportunity.", resourceIds: ["ja-job-relatedness-check", "ja-leadership-criteria-job-relatedness"] },
      { label: "Consider the wider employee experience", purpose: "Connect recruitment and selection with development, advancement, and retention.", resourceIds: ["ja-inclusive-hiring-lifecycle", "pn-pay-classification-advancement"] },
      { label: "Support development and retention", purpose: "Choose useful mentoring, sponsorship, and stay-conversation practices.", resourceIds: ["pn-mentoring-sponsorship", "pn-stay-interviews-and-retention"] },
    ],
  },
  partnership: {
    title: "Plan participation that can influence a decision",
    introduction: "Identify what is still open to change, whose experience matters, and how people can participate. Make the opportunity for influence clear from the beginning.",
    workProduct: "An engagement plan that explains participation, influence, access, and how you will report back.",
    intendedBenefit: "People can see how their contributions were considered and what difference their participation made.",
    choices: [
      { label: "Decide who to involve", purpose: "Recognize affected people and relationships that need attention.", resourceIds: ["ja-stakeholder-map", "pn-partnership-spine"] },
      { label: "Make influence and participation clear", purpose: "Choose an honest level of influence and plan an accessible conversation.", resourceIds: ["ja-engagement-influence-ladder", "ja-accessible-meetings"] },
      { label: "Close the conversation with people", purpose: "Explain what you heard, what changed, and the reasons for decisions.", resourceIds: ["ja-report-back"] },
    ],
  },
  leadership: {
    title: "Turn a shared intention into changes people can see",
    introduction: "Use these resources when a team is ready to improve a recurring workplace or service issue. The starting choices are useful at different responsibilities and experience levels.",
    workProduct: "A working plan with clear actions, responsibilities, support, and a way to learn from progress.",
    intendedBenefit: "Commitments are more likely to lead to sustained improvements in people's everyday experience.",
    choices: [
      { label: "Understand the team's experience", purpose: "Make room for honest conversation and examine how positional authority affects participation.", resourceIds: ["lm-workplace-climate", "lm-power-and-positional-authority"] },
      { label: "Choose achievable changes", purpose: "Translate concerns and intentions into a team or implementation plan.", resourceIds: ["ja-climate-action-plan", "guide-one-dsd-work-plan"] },
      { label: "Review what the change needs", purpose: "Consider access, responsibilities, and support before carrying the work forward.", resourceIds: ["ja-launch-embed-checklist", "pn-self-check"] },
    ],
  },
  evidence: {
    title: "Find out whether a change is helping",
    introduction: "Bring together available evidence, people's experience, and the questions you still need to answer. A completed activity is useful information, but does not by itself show an improved outcome.",
    workProduct: "A focused account of progress, remaining questions, and the next adjustment to try.",
    intendedBenefit: "Staff and leadership can learn which changes help people and where further attention is needed.",
    choices: [
      { label: "Choose what to examine", purpose: "Connect the intended benefit with evidence that could show whether conditions changed.", resourceIds: ["guide-one-dsd-measures", "pn-measurement-without-surveillance"] },
      { label: "Explain what the evidence supports", purpose: "Separate known results, useful examples, and unanswered questions.", resourceIds: ["guide-one-dsd-quarterly-report", "tool-one-dsd-quarterly-report"] },
      { label: "Use what you learn", purpose: "Make the next adjustment explicit and report back to people involved.", resourceIds: ["guide-one-dsd-work-plan", "ja-report-back"] },
    ],
  },
};

/** Published input only: a curated recommendation never revives a withdrawn item. */
export function publishedPathwayChoices(pathway: ResourcePathway, items: readonly ContentItem[]) {
  const published = new Map(items.filter(item => item.status === "approved").map(item => [item.id, item]));
  return pathway.choices.map(choice => ({
    ...choice,
    resources: choice.resourceIds.flatMap(id => published.has(id) ? [published.get(id)!] : []),
  })).filter(choice => choice.resources.length > 0);
}
