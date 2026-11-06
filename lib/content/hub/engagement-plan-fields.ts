// Fields of the fill-in engagement and report-back plan. Shared by the planning page
// and its downloadable blank copy. Owner rule: nothing a person types is counted,
// stored or sent anywhere.

export const PLAN_FIELDS = [
  { key: "decision", label: "What decision is still open?", help: "Name the decision and who makes it." },
  { key: "influence", label: "What can participants influence, and what can they not?", help: "Be honest about limits. People notice when input cannot change anything." },
  { key: "who", label: "Whose experience does this decision affect? Whose is missing?", help: "Include people who could not use the service or take part before." },
  { key: "organizations", label: "Which organizations or community members will you contact, and why them?", help: "No organization speaks for a whole community. Plan to hear from people directly too." },
  { key: "language", label: "Language and communication", help: "Which languages and dialects, interpreters, plain language, American Sign Language, captions, written and spoken options." },
  { key: "access", label: "Access, timing and place", help: "Disability access, transportation, broadband, work schedules, caregiving, rural distance, observances." },
  { key: "compensation", label: "Compensation and supports", help: "What can be offered through approved arrangements, and who will confirm it?" },
  { key: "use", label: "How will you use and represent what people share?", help: "How participants can review how their words are used, and choose how their contributions may be used." },
] as const;

export const REPORT_FIELDS = [
  { key: "changed", label: "What changed because people took part?" },
  { key: "unchanged", label: "What did not change, and why?" },
  { key: "followUp", label: "Who will follow up, and when?" },
  { key: "method", label: "How will you report back?", help: "In the languages and formats participants used. Give a way to correct your summary." },
  { key: "reflect", label: "What would you do differently next time?" },
] as const;

export const REPORT_BACK_INTRO = "Fill this in after the engagement, before you close the work.";
