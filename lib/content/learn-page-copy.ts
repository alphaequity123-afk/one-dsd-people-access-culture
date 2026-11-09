/**
 * Wording and lists that /learn pages render and their downloadable copies reuse,
 * so a download always matches the page.
 */

export type LearnPageLink = { title: string; href: string; use: string };
export type EquityInPracticeExample = { id: string; title: string; situation: string; action: string; goals: string; links: LearnPageLink[]; evidence: string };

/** /learn/equity-in-practice: four situations from disability services work. */
export const EQUITY_IN_PRACTICE_EXAMPLES: readonly EquityInPracticeExample[] = [
  { id: "cfss", title: "Make a service change easier to understand", situation: "Imagine a person reading information about moving to Community First Services and Supports (CFSS) and wondering what to do next or where to turn for help.", action: "Examine the notice with people who use it. Compare clearer wording and accessible formats, then check whether people can explain their next step.", goals: "Eliminate Disparities · Community Engagement · Communication and Accessibility", links: [
    { title: "Equity Analysis Toolkit", href: "/learn/equity-toolkit", use: "Examine who may face barriers, whose perspectives are needed, and which alternatives deserve consideration." },
    { title: "National Culturally and Linguistically Appropriate Services Standards and language-access planning", href: "/practice/clas", use: "Consider cultural and language access, the people responsible, and the requirements that apply to the service." },
    { title: "Plain language and accessible documents checklist", href: "/library/ja-plain-language", use: "Review purpose, language, accessibility, and the action the reader needs to take." },
    { title: "Language access checklist", href: "/library/ja-language-access-checklist", use: "Prepare the language support people need to understand information and participate." }
  ], evidence: "Look for whether people understand the message and can find help—not simply whether the notice was sent." },
  { id: "planning", title: "Connect assessment, planning, and navigation", situation: "A person wants their preferences reflected in planning and needs understandable next steps.", action: "Follow the handoffs between assessment, support planning, and navigation. MnCHOICES supports assessment and planning; Disability Hub MN helps people understand options and navigate services. Eligibility and service decisions remain with the responsible agencies.", goals: "Eliminate Disparities · Community Engagement · Learning and Development", links: [
    { title: "Engagement and report-back plan", href: "/practice/gp-3", use: "Invite perspectives while choices are open and explain what happened to the input." },
    { title: "Teams and Cross-Collaboration", href: "/learn/collaboration", use: "Practice clear handoffs, shared responsibilities, and communication across teams and partners." },
    { title: "Measurement and evaluation", href: "/practice/measurement", use: "Identify what would show whether the handoff became more understandable and useful." }
  ], evidence: "Look for whether people can describe their choices, identify the next contact, and participate in decisions." },
  { id: "procurement", title: "Examine a technical-assistance contract", situation: "Imagine a DSD team considering a purchase of provider training and technical assistance for organizations serving different communities and locations.", action: "This hypothetical purchase is distinct from Medicaid provider enrollment and individual service authorization. Examine scope, outreach, and accessibility with the responsible contracting staff before choices are settled.", goals: "Contracts and Procurement · Eliminate Disparities · Community Engagement", links: [
    { title: "Procurement and contract review", href: "/practice/gp-10", use: "Prepare questions about participation, accessibility, proposed terms, and the review needed before a decision." },
    { title: "Equity Analysis Toolkit", href: "/learn/equity-toolkit", use: "Compare alternatives and their effects, including burdens that may fall differently across organizations." }
  ], evidence: "Look for whose participation improved and whether the support is usable; a completed contract alone does not establish the result." },
  { id: "workforce", title: "Help a new colleague contribute", situation: "A new employee is learning how disability programs, team responsibilities, and partner organizations connect.", action: "A supervisor and colleagues make expectations clear, identify relevant learning, and check that materials, relationships, and support help the employee participate.", goals: "Hiring and Retention · Learning and Development · Communication and Accessibility", links: [
    { title: "Inclusive hiring and workforce planning", href: "/practice/gp-6", use: "Consider access and support across hiring, onboarding, and continuing opportunity." },
    { title: "Learning and facilitation plan", href: "/practice/gp-5", use: "Connect learning to a real responsibility and a useful opportunity to practice." },
    { title: "Stay conversations and retention", href: "/library/pn-stay-interviews-and-retention", use: "Learn what helps colleagues contribute, find support, and raise concerns before deciding what to improve." }
  ], evidence: "Look for understandable responsibilities, usable support, and opportunities to contribute—not only course completion." }
];

/** /learn/equity-in-practice: where to go when the question involves policy or legislation. */
export const EQUITY_IN_PRACTICE_POLICY_LINKS: readonly LearnPageLink[] = [
  { title: "DHS equity policy", href: "/equity-policy", use: "Read the policy that informs the work." },
  { title: "Equity analysis for policy review", href: "/learn/equity-toolkit/policy-review", use: "Explore how equity analysis can inform a policy recommendation." },
  { title: "Policy and legislative analysis learning", href: "/learning/self-directed/index.html?course=A21", use: "Work through policy, legislative, and bill analysis with examples and practice." },
  { title: "Connect applicable requirements with your work", href: "/practice/requirements", use: "Identify the relevant source and the people authorized to interpret or act on it." },
];

/** /learn/emotions-and-values: the four courses in the series, in reading order. */
export const EMOTIONS_AND_VALUES_COURSE_IDS: readonly string[] = ["ei-understanding-emotions", "ei-conversations-and-leadership", "cv-understanding-your-lens", "cv-decisions-and-services"];

/** /learn/engagement-resources: the four starting points. */
export const ENGAGEMENT_STARTING_STEPS: readonly { lead: string; body: string }[] = [
  { lead: "Orient your team.", body: "Use the ADSA presentation to discuss when engagement is needed and what people can influence." },
  { lead: "Build the plan.", body: "Read the ADSA guide for relationships, responsibilities, participation, accommodations, outreach, and reporting." },
  { lead: "Check readiness.", body: "Use the ADSA checklist to identify missing resources, responsibilities, and arrangements before engagement begins." },
  { lead: "Strengthen cultural and language access.", body: "Use the CLAS checklist and action worksheet to choose three practices and plan their implementation." },
];

/** /learn/cultural-intelligence: sources behind the perspectives the collection connects. */
export const CULTURAL_INTELLIGENCE_PERSPECTIVE_SOURCES: readonly { title: string; href: string }[] = [
  { title: "Intercultural Development Inventory: qualified administration", href: "https://idiinventory.zendesk.com/hc/en-us/articles/360042578534-Should-I-become-an-IDI-Qualified-Administrator-QA" },
  { title: "American Anthropological Association: what is anthropology?", href: "https://americananthro.org/practice-teach/what-is-anthropology/" },
  { title: "American Anthropological Association: ethnographic fieldwork", href: "https://perspectives.americananthro.org/Chapters/Fieldwork.pdf" },
  { title: "American Anthropological Association: informed consent", href: "https://ethics.americananthro.org/ethics-statement-3-obtain-informed-consent-and-necessary-permissions/" },
  { title: "American Sociological Association: exploring sociology", href: "https://www.asanet.org/wp-content/uploads/savvy/documents/research/pdfs/ASA_Launching_Majors_Faculty_Manual_2010.pdf" },
  { title: "Federal Reserve Education: choices and opportunity cost", href: "https://www.federalreserveeducation.org/teaching-resources/economics/scarcity/opportunity-cost" },
  { title: "World Health Organization: social and economic conditions", href: "https://www.who.int/news-room/questions-and-answers/item/determinants-of-health" },
  { title: "EEOC: examining systemic workplace practices", href: "https://www.eeoc.gov/systemic-enforcement-eeoc" },
  { title: "Crossroads Ministry: continuum for anti-racist multicultural organizations", href: "https://www.upliftoregon.org/wp-content/uploads/Continuum_AntiRacist.pdf" },
  { title: "Research on psychological safety and learning in teams", href: "https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Organizational_Learning_and_Change/Edmondson_1999_Psychological_safety.pdf" },
  { title: "AHRQ: safety culture in health care", href: "https://psnet.ahrq.gov/perspective/ensuring-patient-and-workforce-safety-culture-healthcare" },
  { title: "CMS: person-centered planning in home and community-based services", href: "https://www.cms.gov/newsroom/fact-sheets/home-and-community-based-services" },
];
