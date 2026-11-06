// The equity principles the Equity Policy Analyzer applies to a policy. Each one names
// the published source it comes from; every address below already appears in this
// program's content. Plain language, every name in full, no status labels.

export type EquityPrinciple = {
  id: string;
  title: string;
  /** What the principle means, in one or two plain sentences. */
  plainMeaning: string;
  /** The question the analyzer asks of the policy. */
  questionForPolicy: string;
  source: { title: string; url: string };
};

export const EQUITY_PRINCIPLES: readonly EquityPrinciple[] = Object.freeze([
  {
    id: "equity-analysis",
    title: "Look at who benefits and who is burdened before deciding",
    plainMeaning: "The State of Minnesota equity analysis asks who a decision affects, what the data and the people affected say, which options were compared, and how results will be checked, before the decision is made.",
    questionForPolicy: "Does the policy show who it affects, what evidence supports it, which options were compared, and how its results will be reviewed?",
    source: { title: "State of Minnesota Equity Analysis Toolkit", url: "https://mn.gov/oeoa/resources/equity-analysis-toolkit/" },
  },
  {
    id: "culturally-and-linguistically-appropriate-services",
    title: "Services that fit people's culture and language",
    plainMeaning: "The national standards for culturally and linguistically appropriate services ask organizations to offer language help at no cost, to tell people that help is available, and to govern and plan with the communities they serve.",
    questionForPolicy: "Does the policy provide language help at no cost, tell people it is available, and involve the communities it serves in planning and review?",
    source: { title: "National Standards for Culturally and Linguistically Appropriate Services in Health and Health Care", url: "https://thinkculturalhealth.hhs.gov/clas/standards" },
  },
  {
    id: "most-integrated-setting",
    title: "Living, working and taking part in the most integrated setting",
    plainMeaning: "Minnesota's Olmstead Plan commits the state to supporting people with disabilities to live, learn, work and enjoy life in the most integrated setting, with choices like people without disabilities.",
    questionForPolicy: "Does the policy support people with disabilities to live and work in the community, or does it make a more separate setting easier to reach than an integrated one?",
    source: { title: "Minnesota Olmstead Plan", url: "https://mn.gov/olmstead/" },
  },
  {
    id: "effective-communication",
    title: "Communication that works for people with disabilities",
    plainMeaning: "Under the Americans with Disabilities Act, public programs must communicate with people with disabilities as effectively as with others, providing aids and services such as sign language interpreters, large print or screen-reader-ready documents.",
    questionForPolicy: "Does the policy say how people who are deaf, blind, or have speech, intellectual or other disabilities will receive and respond to its notices and steps?",
    source: { title: "Americans with Disabilities Act: effective communication", url: "https://www.ada.gov/resources/effective-communication/" },
  },
  {
    id: "disability-nondiscrimination",
    title: "No exclusion on the basis of disability in federally funded programs",
    plainMeaning: "Section 504 of the Rehabilitation Act forbids programs that receive federal money from excluding or denying benefits to a person because of disability, and requires reasonable changes so people can take part.",
    questionForPolicy: "Could any rule, step or deadline in the policy screen out people with disabilities, and does it offer reasonable changes to how things are done?",
    source: { title: "United States Department of Health and Human Services: disability rights under Section 504 of the Rehabilitation Act", url: "https://www.hhs.gov/civil-rights/for-individuals/disability/index.html" },
  },
  {
    id: "language-access",
    title: "Meaningful access for people with limited English",
    plainMeaning: "Title VI of the Civil Rights Act of 1964 forbids national origin discrimination in federally funded programs, which includes taking reasonable steps so people with limited English can understand and use the program.",
    questionForPolicy: "Does the policy say which languages its notices, forms and conversations will be offered in, and how a person asks for an interpreter or translation?",
    source: { title: "United States Department of Justice: limited English proficiency and Title VI of the Civil Rights Act", url: "https://www.justice.gov/crt/limited-english-proficiency" },
  },
  {
    id: "human-rights-act",
    title: "Equal access to public services in Minnesota",
    plainMeaning: "The Minnesota Human Rights Act forbids discrimination in public services because of race, color, creed, religion, national origin, sex, disability, sexual orientation, gender identity and other protected characteristics.",
    questionForPolicy: "Could the policy, as written or as carried out, treat people differently or affect them differently because of a characteristic the Minnesota Human Rights Act protects?",
    source: { title: "Minnesota Human Rights Act, Minnesota Statutes chapter 363A", url: "https://www.revisor.mn.gov/statutes/cite/363A" },
  },
  {
    id: "person-centered",
    title: "The person's own goals and choices lead",
    plainMeaning: "Person-centered practices put the person's preferences, culture and goals at the center of planning and services, with the person deciding who takes part in planning.",
    questionForPolicy: "Does the policy leave room for the person's own goals, culture and choices, or does it set one path that everyone must follow?",
    source: { title: "Minnesota Department of Human Services: person-centered practices", url: "https://mn.gov/dhs/partners-and-providers/program-overviews/long-term-services-and-supports/person-centered-practices/index.jsp" },
  },
  {
    id: "community-settings",
    title: "Home and community-based services settings that support full community life",
    plainMeaning: "The federal home and community-based services settings rule requires settings that are part of the wider community and that support a person's choice, privacy, independence and control over daily life.",
    questionForPolicy: "Does the policy protect choice, privacy and access to the wider community for people who use home and community-based services?",
    source: { title: "Code of Federal Regulations, title 42, section 441.301(c): home and community-based settings", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-C/part-441/subpart-G/section-441.301" },
  },
  {
    id: "plain-language",
    title: "Plain language people can act on",
    plainMeaning: "The federal plain language guidelines ask that public writing put the reader first, use common words and short sentences, and say clearly what the reader must do.",
    questionForPolicy: "Can the people the policy affects understand what it asks of them, what they must do and by when?",
    source: { title: "Federal plain language guidelines", url: "https://www.plainlanguage.gov/guidelines/" },
  },
  {
    id: "tribal-consultation",
    title: "Government-to-government consultation with Tribal Nations",
    plainMeaning: "Minnesota law recognizes the sovereignty of the Tribal Nations in Minnesota and requires state agencies to consult with them on matters that affect them. Consultation is separate from outreach or stakeholder meetings.",
    questionForPolicy: "Could the policy affect Tribal Nations or their members? If so, it is flagged for consultation through the Office of Indian Affairs, and changes for Tribal Nations are not designed in this analysis.",
    source: { title: "Minnesota Statutes, section 10.65: government-to-government relationship with Tribal governments", url: "https://www.revisor.mn.gov/statutes/cite/10.65" },
  },
]);

const byId = new Map(EQUITY_PRINCIPLES.map(principle => [principle.id, principle]));

export function getPrinciple(id: string): EquityPrinciple | undefined {
  return byId.get(id);
}

export function isPrincipleId(id: string): boolean {
  return byId.has(id);
}
