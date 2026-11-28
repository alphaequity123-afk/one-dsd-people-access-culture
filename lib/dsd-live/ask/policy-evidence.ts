import type { EvidencePassage } from "./compose";
import { isDisabilityOutreach } from "./outreach";

export const DHS_EQUITY_POLICY_URL = "https://mn.gov/dhs/assets/equity-policy_tcm1053-646921.pdf";
export const DHS_EQUITY_POLICY_SLUG = "department-of-human-services-equity-policy-policy-summary";

// Numbered Ask evidence contains only a reading of the published policy.
const passages = {
  scope: [1, "The DHS Equity Policy applies to all DHS employees, including Disability Services Division employees. Vendors, contractors, grantees and volunteers may have responsibilities through their agreements with DHS."],
  formal: [3, "Formal equity analysis is required for an action with prolonged or long-term impact scheduled for approval by a supervisor, manager, director, assistant or deputy commissioner, or the commissioner. The action must be accompanied by the DHS Equity Analysis or Equity Scan within the DHS Equity Analysis Toolkit, or by a customized tool developed in consultation with an equity director for relevance to the business area. The toolkit user guide offers further guidance on applying an analysis or scan."],
  engagement: [3, "The policy calls for authentic, meaningful and ongoing community engagement and inclusion during the formation of new or recurring policies, practices, procedures, committees and groups. Each administration or area should work with its Equity Director and Equity Committee to create goals with measurable outcomes for these objectives."],
  roles: [4, "The business area's equity director advises employees who are completing an analysis if requested. Page 1 places implementation of the policy and tool with DHS equity directors in partnership with the administration or area’s Equity Committee. Management promotes equity in strategic planning and encourages staff to apply an equity lens in daily work."],
  training: [5, "DHS assigns Equity Analysis Toolkit training through its agencywide learning and development platform and documents the training annually on the staff training record. Page 4 requires employees to complete the annual staff commitment for advancing equity and electronically sign their agreement to use the toolkit."],
  outcomes: [2, "Employees communicate how equity impacts are reviewed and what results the agency's policies, practices, procedures, rules, budgets and decisions have. Page 3 calls for administrations or areas to work with their equity directors and Equity Committees to create goals with measurable outcomes."],
} as const;
type Topic = keyof typeof passages;

// Applications are unnumbered learning advice, separate from the document Ask cites.
const applications: Record<Topic, string> = {
  scope: "Check the receiving area's program rules and who owns its decision. A division learning guide cannot authorize adoption elsewhere.",
  formal: "Coaching questions can help staff prepare or contribute to a qualifying tool. Even when those questions appear in it, complete the applicable instrument and include it with the proposal. For a customized tool, first develop it in consultation with the area equity director.",
  engagement: "Ask what a participant can still change. They might test an invitation in their preferred format or help design a callback process. A meeting after approval cannot establish that people influenced the earlier decision.",
  roles: "Check who can commit staffing or funding. Being asked for equity advice does not by itself establish an operational assignment or a person's job title.",
  training: "Check the official record and ask the authorized training contact about the assignment. The published procedure does not establish a manager-approved credit exception for a voluntary case.",
  outcomes: "Report median waiting time in minutes or hours and the number of requests still open. A higher count alone cannot demonstrate faster service. Compare like periods, eligibility and rates before claiming that timeliness improved.",
};

export function policyApplications(question: string): string {
  return policyTopics(question).map(topic => applications[topic]).join(" ");
}

export function policyTopics(question: string): Topic[] {
  const named = /\b(?:equity (?:policy|analysis|toolkit|scan)|formal equity review)\b/i.test(question);
  const authority = /\b(?:directors?|supervisors?|managers?|commissioners?|leadership)\b/i.test(question);
  const decision = /\b(?:decid\w*|decision|sign.off|approv\w*|propos\w*|adopt\w*|authoriz\w*|service change)\b/i.test(question);
  const longTerm = /\b(?:year[- ]?long|long[- ]term|prolonged|permanent|next year|for (?:a|one|the) (?:full )?year|twelve months|12 months)\b/i.test(question);
  const credit = /\b(?:credits?|counts? (?:as|for|toward)|training record|annual (?:requirement|acknowledg\w*|training)|assigned training)\b/i.test(question)
    && /\b(?:toolkit|trainings?|courses?|learning|leadership case|decision record|staff commitment)\b/i.test(question)
    && (!/\b(?:licen[cs]ure|continuing education|CLE|CME|academic credits?|college credits?)\b/i.test(question) || /\b(?:DHS|DSD|Equity Analysis Toolkit)\b/i.test(question));
  const assignedWaiver = authority && /\bwaiv\w*\b/i.test(question) && /\b(?:annual|yearly|assigned)\b/i.test(question) && /\b(?:training|assignment|exercise|Toolkit)\b/i.test(question);
  const outreach = isDisabilityOutreach(question);
  const engagement = /\b(?:outreach|community (?:partners?|input|members?|engagement)|community-led)\b/i.test(question)
    && /\b(?:process|polic(?:y|ies)|formation|design|decision|adopt\w*|approv\w*|draft\w*|involv\w*)\b/i.test(question);
  const roles = /\bequity (?:professionals?|directors?|consultants?|committees?|advisors?)\b/i.test(question) && (authority || decision || /\bown\w*\b/i.test(question));
  const outcomes = /\b(?:pilot|access|service|outcomes?|equity|people|inquiries|callbacks?)\b/i.test(question)
    && /\b(?:closure rate|closed on time|clos(?:ed|ing) (?:more|inquiries)|service measure|on.time closures|callback wait|(?:median|average) (?:callback )?wait(?:ing)?(?: time)?)\b/i.test(question);
  const topics: Topic[] = [];
  if (credit || assignedWaiver) topics.push("training");
  const transfer = outreach && /\b(?:(?:another|other|receiving|different|second|additional) (?:administration|division|area|unit)|across (?:administrations|divisions|units))\b/i.test(question);
  if ((authority && decision && longTerm) || transfer) topics.push("formal");
  if (outreach) topics.push("scope");
  if (roles) topics.push("roles");
  const publicFacingChange = /\b(?:invitations?|notices?|outreach|intake|applicants?|participants?|service users?|service delivery|service change|people who use)\b/i.test(question);
  if (engagement || (topics.includes("formal") && publicFacingChange)) topics.push("engagement");
  if (outcomes) topics.push("outcomes");
  if (named && !topics.length) topics.push("formal", "scope");
  return topics;
}

/** These are directions for applying evidence, distinct from the numbered policy source. */
export function policyPracticeGuidance(question: string): string {
  const topics = policyTopics(question);
  const guidance: string[] = [];
  if (topics.length) guidance.push("The numbered policy reading is the authority. The following is unnumbered program guidance for applying it. Attribute only what the published policy actually says to that document. Explain a practical inference in your own voice, naming it as a proposed approach when useful. " + policyApplications(question));
  if (topics.includes("formal") && topics.includes("engagement")) {
    guidance.push("For a proposed public-facing change, tell the learner how to invite a person affected to test a real choice before approval, in a format they choose. Carry the person's concern and any unresolved barrier to the decision owner with the analysis. Identify this as an application of the engagement objective, distinct from the required instrument.");
  }
  if (topics.includes("roles")) {
    guidance.push("Explain who does which work: the area equity director and Equity Committee implement the policy and toolkit together (page 1); the equity director advises employees doing an analysis on request (page 4); management promotes equity in planning. As practical advice, ask who owns the operating change and resources. Ask who holds authority in this case. Do not assume the person seeking advice is the designated equity director.");
  }
  if (topics.includes("outcomes")) {
    guidance.push("Specify the unit for each proposed measure. Report counts as numbers, durations such as a median wait in minutes or hours, and proportions as a numerator over an eligible denominator. State the observation period separately. Use the learner's actual figures or placeholders. Do not instruct the reader to express every measure as a rate. Define the two events used to measure elapsed time and report unresolved requests separately. Verify what a cited toolkit actually lists. Successful service connection and a person's report that they could take the next step are distinct measures; present the latter as a proposed check unless the cited source specifically lists it.");
  }
  return guidance.join("\n");
}

/** Use the previous question for an actual continuation without carrying an unrelated policy topic forward. */
export function policyQuestion(question: string, previousQuestion = ""): string {
  if (!previousQuestion) return question;
  const current = policyTopics(question);
  const previous = policyTopics(previousQuestion);
  const continuation = /\b(?:they|them|those|it|that|this|same|another|earlier|still|rollout|callback|coaching questions?|decision record|present (?:the |that )?disagreement|what can I offer|what should the director clarify|four questions)\b/i.test(question);
  if (previous.length && (continuation || (current.length && previous.some(topic => current.includes(topic))))) {
    return previousQuestion + " " + question;
  }
  return question;
}

export function policyEvidence(question: string): EvidencePassage | undefined {
  const topics = policyTopics(question);
  if (!topics.length) return;
  const firstPage = passages[topics[0]][0];
  return {
    n: 1, passageId: null, slug: DHS_EQUITY_POLICY_SLUG, title: "DHS Equity Policy", parentTitle: null,
    heading: "Reading of the published DHS Equity Policy, version 2.0, effective August 4, 2023",
    content: topics.map(topic => `Page ${passages[topic][0]}. ${passages[topic][1]}`).join("\n\n"),
    sourceUrl: DHS_EQUITY_POLICY_URL + "#page=" + firstPage,
  };
}

/** A legacy course paragraph may be an appropriate learning source but cannot establish a credit exception. */
export function filterPolicyPassages<T extends { slug: string; content: string }>(items: T[], policy?: EvidencePassage): T[] {
  return items.filter(item => {
    if (policy && item.slug === policy.slug) return false;
    if (!policy?.content.includes(passages.training[1])) return true;
    const obsoleteCredit = /\b(?:training credits?|required credits?|course credits?|credit for (?:this |the )?(?:course|training)|required.training credits?|credit exception|exception (?:for|to) (?:training )?credit)\b/i.test(item.content)
      && /\bexceptions?\b/i.test(item.content);
    return !obsoleteCredit || !/\b(?:management|director|leadership|express(?:ly)?|approved|credit exceptions?)\b/i.test(item.content);
  });
}

export function withPolicyEvidence(items: EvidencePassage[], policy?: EvidencePassage): EvidencePassage[] {
  const allowed = filterPolicyPassages(items, policy);
  return (policy ? [policy, ...allowed] : allowed).map((item, i) => ({ ...item, n: i + 1 }));
}
