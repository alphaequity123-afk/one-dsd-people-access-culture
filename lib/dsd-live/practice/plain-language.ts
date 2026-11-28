/**
 * "Rewrite it in plain language" (owner decision 2026-11-22): the reader rewrites a dense sentence from a fictional
 * notice, sees instant checks worked out in the browser, then compares a stronger version. Nothing typed is kept, and
 * no outside service reads it.
 */
export type RewriteItem = { id: string; context: string; original: string; stronger: string; changes: string[] };

const DSD: RewriteItem[] = [
  {
    id: "waiver-reassessment",
    context: "A letter about a yearly assessment",
    original: "Pursuant to applicable program requirements, recipients of home and community-based waiver services are required to participate in an annual reassessment, and failure to complete said reassessment within the designated timeframe may result in the suspension of services.",
    stronger: "Each year, we meet with you to talk about your needs and your services. Please schedule this meeting by March 31. If we can't meet by then, your services could stop for a while. Call us if you need more time.",
    changes: ["Speaks to the reader as \"you\"", "Gives the real date instead of \"the designated timeframe\"", "Breaks one long sentence into four short ones", "Tells the reader what to do if they need help"],
  },
  {
    id: "provider-change",
    context: "A notice about changing a provider",
    original: "Individuals wishing to initiate a change of service provider must submit a written request to their assigned case manager, who will subsequently facilitate the transition in accordance with established procedures.",
    stronger: "You can change who provides your services. Tell your case manager, in writing or by phone, and they will help you make the switch.",
    changes: ["Starts with what the reader can do", "Offers more than one way to ask", "Replaces \"facilitate the transition\" with \"help you make the switch\""],
  },
  {
    id: "support-plan",
    context: "A paragraph about a support plan",
    original: "The person-centered support plan shall be developed collaboratively utilizing information obtained from the individual and their identified support network to ensure that services are responsive to the individual's preferences.",
    stronger: "You and the people you choose will help write your support plan. It will be built around what matters to you.",
    changes: ["Uses active voice: who does what is clear", "Replaces \"utilizing\" and \"obtained\" with everyday words", "Cuts the sentence to half its length"],
  },
  {
    id: "appeal",
    context: "A paragraph about appeal rights",
    original: "Should you disagree with the determination referenced herein, you may exercise your right to request a fair hearing by submitting an appeal within 30 days of the date of this notice.",
    stronger: "If you disagree with this decision, you can ask for a hearing. You have 30 days from the date on this letter to ask. We can help you fill out the form.",
    changes: ["Replaces \"determination referenced herein\" with \"this decision\"", "Puts the deadline in its own sentence", "Offers help with the next step"],
  },
  {
    id: "employment",
    context: "A paragraph about employment services",
    original: "Eligible individuals may be afforded the opportunity to access employment exploration services in order to facilitate informed decision-making regarding competitive integrated employment.",
    stronger: "If you'd like to explore working at a job in the community, we can help you learn about your options and decide what you want.",
    changes: ["Explains \"competitive integrated employment\" in plain words", "Leads with the reader's choice", "Removes filler like \"afforded the opportunity\""],
  },
  {
    id: "documentation",
    context: "A request for documents",
    original: "Prior to the commencement of services, documentation verifying eligibility must be provided to the lead agency.",
    stronger: "Before your services can start, please send us papers that show you qualify. Your case manager can tell you which papers to send.",
    changes: ["Replaces \"prior to the commencement\" with \"before … start\"", "Uses \"we\" and \"you\" instead of \"the lead agency\"", "Tells the reader where to get help"],
  },
];

const DHS: RewriteItem[] = [
  {
    id: "renewal",
    context: "A letter about renewing health coverage",
    original: "In order to maintain continuous eligibility for Medical Assistance, enrollees are required to complete and return the enclosed renewal form, and failure to do so within the specified timeframe will result in the termination of coverage.",
    stronger: "To keep your health coverage, fill out the form in this envelope and send it back by June 15. If we don't get it by then, your coverage will end. Call us if you need help.",
    changes: ["Speaks to the reader as \"you\"", "Names \"health coverage\" instead of the program's formal name alone", "Gives the real date", "Ends with where to get help"],
  },
  {
    id: "snap-change",
    context: "A paragraph about reporting changes",
    original: "Households receiving SNAP benefits shall report any changes in income exceeding the applicable threshold within ten days of the date the change becomes known to the household.",
    stronger: "If your household's income goes up above the amount on this letter, tell us within 10 days of finding out.",
    changes: ["Uses active voice: who does what is clear", "Replaces \"applicable threshold\" with \"the amount on this letter\"", "Cuts the sentence by more than half"],
  },
  {
    id: "child-care",
    context: "A notice about child care assistance",
    original: "Eligibility for the Child Care Assistance Program is contingent upon verification of employment, education or training activities in accordance with program guidelines.",
    stronger: "To get help paying for child care, you need to show that you work, go to school or are in training. We'll tell you which papers to send.",
    changes: ["Explains what the program does", "Replaces \"contingent upon verification\" with \"you need to show\"", "Tells the reader what happens next"],
  },
  {
    id: "appeal",
    context: "A paragraph about appeal rights",
    original: "Should you disagree with the determination referenced herein, you may exercise your right to request a fair hearing by submitting an appeal within 30 days of the date of this notice.",
    stronger: "If you disagree with this decision, you can ask for a hearing. You have 30 days from the date on this letter to ask. We can help you fill out the form.",
    changes: ["Replaces \"determination referenced herein\" with \"this decision\"", "Puts the deadline in its own sentence", "Offers help with the next step"],
  },
  {
    id: "interview",
    context: "A letter scheduling an interview",
    original: "Applicants are required to participate in an interview, which will be conducted telephonically at the date and time indicated below, and non-participation may result in the denial of the application.",
    stronger: "We will call you for a short interview at the date and time below. If that time doesn't work, call us to pick another. If we can't reach you, we may not be able to approve your application.",
    changes: ["Replaces \"conducted telephonically\" with \"we will call you\"", "Offers a way to change the time", "Explains the consequence calmly and last"],
  },
  {
    id: "documentation",
    context: "A request for documents",
    original: "Prior to the processing of your application, documentation verifying identity and residency must be provided to the county agency.",
    stronger: "Before we can finish your application, please send papers that show who you are and where you live. Your county worker can tell you which papers count.",
    changes: ["Replaces \"prior to the processing\" with \"before we can finish\"", "Names the papers in everyday words", "Tells the reader where to get help"],
  },
];

export function rewriteItems(unit: "dhs" | "dsd"): RewriteItem[] {
  return unit === "dhs" ? DHS : DSD;
}

/** Words and phrases with plainer alternatives; checked in the browser as the reader types. */
export const HARD_WORDS: [string, string][] = [
  ["pursuant to", "under"], ["in accordance with", "under, following"], ["prior to", "before"], ["subsequently", "later, then"],
  ["utilize", "use"], ["utilizing", "using"], ["facilitate", "help"], ["commencement", "start"], ["commence", "start"],
  ["terminate", "end"], ["termination", "end"], ["herein", "here, in this letter"],
  ["shall", "will, must"], ["afforded", "given"], ["contingent upon", "depends on"], ["determination", "decision"],
  ["obtain", "get"], ["obtained", "got"], ["individuals", "people, you"], ["designated", "set, named"],
  ["timeframe", "time, date"], ["telephonically", "by phone"], ["verification", "proof"], ["verifying", "showing"],
  ["non-participation", "not taking part"], ["exceeding", "more than"], ["applicable", "that applies"],
];
