import type { LeadershipStyleSlug } from "@/components/leadership-style-video";
import { LEADERSHIP_STYLE_LESSONS } from "./leadership-styles-lessons";
import { LEADERSHIP_SCENARIO_FAMILIES } from "./leadership-styles-scenarios";
import type { ConduciveGroup, StyleLesson } from "./leadership-styles-pathway-types";

export type { ConduciveGroup, ScenarioFamily, ScenarioResponse, StyleLesson } from "./leadership-styles-pathway-types";
export { LEADERSHIP_STYLE_LESSONS, LEADERSHIP_SCENARIO_FAMILIES };

/**
 * The leadership-styles learning pathway for One DSD and One DHS People Access and
 * Culture. It teaches how leadership behavior affects power, conflict, access,
 * opportunity and outcomes. It does not identify anyone's “style,” score people,
 * predict behavior or rank real leaders. Practice responses are scored against a
 * rubric; people are never scored.
 */
export const LEADERSHIP_PATHWAY_HREF = "/learn/leadership-styles";
export const LEADERSHIP_PATHWAY_TITLE = "Leadership styles, conflict and equity";

export const leadershipStyleHref = (slug: string) => `${LEADERSHIP_PATHWAY_HREF}/${slug}`;
export const leadershipStyle = (slug: string): StyleLesson | undefined => LEADERSHIP_STYLE_LESSONS.find(style => style.slug === slug);

/** Static pages in the pathway besides the index and the per-style lessons. */
export const LEADERSHIP_PATHWAY_PAGES = {
  scenarios: { href: `${LEADERSHIP_PATHWAY_HREF}/scenarios`, title: "Seven more scenarios, many responses" },
  race: { href: `${LEADERSHIP_PATHWAY_HREF}/race-and-leadership`, title: "Race as a cross-cutting factor" },
  lifecycle: { href: `${LEADERSHIP_PATHWAY_HREF}/conflict-lifecycle`, title: "Combining approaches across the conflict lifecycle" },
  capstone: { href: `${LEADERSHIP_PATHWAY_HREF}/capstone`, title: "Capstone: rewrite the response" },
} as const;

/** Section anchors on every style page; Ask documents point at these. */
export const STYLE_SECTIONS = [
  { id: "how-it-works", title: "How it works" },
  { id: "common-scenario", title: "The common scenario" },
  { id: "conflict", title: "Another conflict" },
  { id: "equity", title: "Equity and inclusion" },
  { id: "swot", title: "Strengths and risks" },
  { id: "when-to-use", title: "When to use it" },
  { id: "complements", title: "Complements and safeguards" },
  { id: "practice", title: "Practice and review" },
] as const;

/** The old cultural-intelligence card ids that map to a pathway lesson. */
export const LEGACY_STYLE_TO_PATHWAY: Record<LeadershipStyleSlug, string> = {
  democratic: "participative", authoritarian: "authoritarian", "laissez-faire": "laissez-faire", servant: "servant",
  charismatic: "charismatic", transformative: "transformative", transformational: "transformational",
};

export const PATHWAY_INTRO = [
  "Leadership development should help people recognize how leadership behavior affects power, conflict, access, opportunity and outcomes. It is not about finding your preferred “style.”",
  "The most important distinction is behavior: what a leader does when challenged, when someone reports exclusion, when resources are scarce, and when a familiar process produces unequal results. A leader can use participative language while keeping every important decision. A decisive leader can also use authority responsibly to remove an access barrier.",
  "The scenarios in this pathway are fictional and the sample dialogue is original. The equity judgments are qualitative curriculum judgments. They are not validated probabilities or predictions about individual leaders.",
];

/** Keep existing requirements, ADSA guidance and project recommendations distinct. */
export const PATHWAY_AUTHORITY = [
  { label: "Existing Department of Human Services (DHS) requirements", body: "The DHS Equity Policy and the Equity Analysis Toolkit, which is required of all DHS staff. The agency's existing processes for reporting and responding to discrimination, harassment and retaliation, for reasonable accommodation, for accessibility and language access, and for Tribal consultation and coordination. When a scenario touches one of these, follow the existing process and the person or area responsible for it." },
  { label: "Aging and Disability Services Administration (ADSA) guidance", body: "The ADSA Outreach and Engagement Guide, April 2026, is guidance for ADSA staff on planning engagement, recruitment, accessibility, communication and reporting back. It is not evidence of an agencywide mandate." },
  { label: "Project recommendations", body: "This pathway, its style lessons, scenarios, conflict lifecycle and practice rubric are recommendations from this program. They are learning resources, not adopted agency policy, and they do not decide any individual matter." },
];

export const PATHWAY_BOUNDARY = "This learning is voluntary. Use the fictional scenarios and practice with non-sensitive responses. Do not enter real complaints, personnel decisions or stories that could identify anyone. Nothing here tracks commitments, awards credit or claims that anyone has changed. The application does not sign in to, read from, write to or depend on any DHS system.";

export const FOUNDATIONS = {
  styleVsConflict: {
    title: "A leadership style is not the same as a conflict response",
    body: [
      "A leadership style describes a broad pattern of using authority, motivating people and making decisions. A conflict response describes what a leader does in one particular disagreement.",
      "For example, a participative leader may still need to make a final decision. A servant leader may need to confront harmful conduct. A directive leader can hear disagreement before acting. An inclusive leader can set a firm boundary. And a coaching conversation may be the wrong tool when an authorized formal response is required.",
    ],
    questions: ["What leadership approach is being used?", "Is the response appropriate to the problem, the power relationships and the potential harm?"],
  },
  situations: {
    title: "Not every conflict belongs in mediation or dialogue",
    intro: "Before choosing an approach, name the kind of situation. Each kind puts a different responsibility on the leader.",
    rows: [
      { situation: "Task disagreement", responsibility: "Clarify evidence, roles, constraints and the decision process." },
      { situation: "Communication mismatch", responsibility: "Separate what people observed from how they interpreted it, and clarify expectations." },
      { situation: "Unequal opportunity", responsibility: "Examine criteria, how opportunities are allocated, access and who has decision authority." },
      { situation: "Accessibility barrier", responsibility: "Address the barrier through the appropriate process, not a vote on someone's need." },
      { situation: "Reported discrimination or harassment", responsibility: "Follow authorized reporting and response procedures." },
      { situation: "Retaliation concern", responsibility: "Protect against further adverse treatment and involve the authorized partners." },
      { situation: "Structural inequity", responsibility: "Examine rules, resources, power and institutional arrangements." },
    ],
    closing: "A team conversation can support learning, but it must not replace formal processes. And cultural difference is never a reason to excuse harmful behavior.",
  },
  equityInclusion: {
    title: "Equity and inclusion are related but different",
    body: [
      "Inclusion is about belonging, contribution, access to participation, and being valued without having to erase meaningful differences.",
      "Equity is about how rules, opportunities, burdens, resources and outcomes are distributed, and whether avoidable barriers are addressed.",
      "Research on inclusive leadership emphasizes both belonging and being valued for one's uniqueness, along with shared decision-making, fair treatment and helping people contribute. A team can feel friendly while opportunities remain inequitable. A procedure can be consistent while creating unequal burdens.",
    ],
  },
};

export const COMMON_SCENARIO = {
  title: "Who gets the visible work?",
  intro: "Using the same scenario across every lesson makes comparisons more meaningful.",
  situation: [
    "A supervisor repeatedly gives high-visibility assignments to employees they describe as “polished,” “confident” and “ready to represent the team.”",
    "A Black employee points out that they receive a lot of technical and behind-the-scenes work but fewer chances to present to leadership. In a team discussion, a colleague interrupts and says, “Everything doesn't have to be about race.”",
    "Later, the employee tells the supervisor, “I want the assignments reviewed, and I'm concerned that raising this will hurt my opportunities.”",
  ],
  matters: [
    "The interruption and dismissal.",
    "The employee's concern about consequences for raising the issue.",
    "The criteria used for assignments.",
    "The history of how opportunities have been allocated.",
    "Support and development, offered without assuming a deficit.",
    "Any reporting obligations that apply.",
  ],
  note: "The leader must address each of these matters, not collapse them into a personality dispute. The responses in each lesson illustrate tendencies and choices. They are not scripts that predict how every person associated with a style would act.",
};

export const CONDUCIVE_GROUPS: readonly { id: ConduciveGroup; title: string; body: string }[] = [
  { id: "foundation", title: "Strongest foundation", body: "Inclusive and ethical practices combined with explicit structural-equity analysis." },
  { id: "contributor", title: "Strong contributors", body: "Participative decision-making, supported delegation, coaching, servant leadership and shared leadership." },
  { id: "conditional", title: "Strong when the direction and reasons are explicit", body: "Transformational, adaptive and situational approaches, when equity outcomes and the reasons for any differences are stated and reviewable." },
  { id: "support", title: "Important implementation supports", body: "Directive decisions when necessary, transparent procedures and transactional follow-through." },
  { id: "higher-risk", title: "Higher-risk patterns", body: "Obedience-based authoritarianism, passive avoidance, dependence on one personality, and any approach that punishes challenge." },
];

export const CONDUCIVE_SUMMARY = [
  "There is no reliable universal percentage or single best label. What follows is a curriculum judgment about patterns of behavior, not a ranking of people.",
  "The deciding question is whether the combination of behaviors produces accessible participation, fair opportunity, accountable decisions and changes to barriers, not whether the leader chooses an appealing label.",
];

export const RACE_SECTION = {
  intro: [
    "Race should never be used to predict a person's leadership style or competence. It belongs in the analysis of how leadership is recognized, limited, evaluated and experienced.",
    "Each part below gives a question to ask, an example of what it can look like at work, and what an institution can do.",
  ],
  parts: [
    {
      id: "legitimacy",
      title: "Leadership legitimacy",
      question: "Does similar behavior get a similar reading?",
      checks: [
        "Directness is praised in one leader and penalized in another.",
        "Some leaders must show more warmth to be seen as credible.",
        "Errors are treated as individual mistakes for some people but as evidence of a group's incapacity for others.",
        "Familiarity is confused with leadership potential.",
      ],
      example: "Two supervisors each push back firmly on a deadline in a leadership meeting. One, who is white, is described afterward as “standing up for the team.” The other, who is Black, is described as “combative.” Nobody compared the two descriptions.",
      institution: "Compare how similar behavior is described in evaluations and promotion discussions. Ask evaluators to tie judgments to specific, job-related behavior.",
    },
    {
      id: "advocacy-cost",
      title: "The cost of equity advocacy",
      question: "Who pays a price for advocating for equity?",
      checks: [
        "Research by Hekman and colleagues found that nonwhite and female leaders could receive poorer evaluations when they engaged in diversity-valuing behavior.",
        "This identifies a real organizational risk. It does not establish that every evaluator or workplace responds this way.",
      ],
      example: "A manager of color regularly raises questions about who gets development opportunities. A peer who raises the same questions less often is described as “a strong advocate.” The manager of color is described as “focused on one issue.”",
      institution: "Do not tell marginalized leaders to advocate less. Instead, give executives explicit ownership of equity commitments, use transparent evaluation criteria, review vague competence judgments, share responsibility for advocacy, and protect against retaliation and selective penalties.",
    },
    {
      id: "accumulated-advantage",
      title: "Opportunity and accumulated advantage",
      question: "Did everyone have a chance to meet the standard?",
      checks: [
        "Evaluate both the selection standard and the chance to demonstrate it.",
        "“Experience presenting to executives” may look neutral. Leaders should ask who has historically received presentation assignments and preparation.",
      ],
      example: "In the common scenario, the Black employee has done essential behind-the-scenes work for years. When a leadership role opens, “experience presenting to leadership” is listed as a requirement. The requirement rewards the very pattern being questioned.",
      institution: "Before using an experience requirement, check who has had the chance to gain that experience. Provide equal access to the assignments and preparation that build it.",
    },
    {
      id: "intersectionality",
      title: "Intersectionality and context",
      question: "Whose experience is being treated as the whole story?",
      checks: [
        "Race intersects with disability, gender, language, class, role, employment status and other conditions.",
        "Do not assume that racial groups are all the same inside, or that one person can speak for everyone who shares an identity.",
      ],
      example: "A team asks its only Latina staff member to review a notice “for the Latino community.” She is a third-generation Minnesotan who does not read Spanish, and families who speak Spanish, Mam and Q'anjob'al are all affected.",
      institution: "Ask the people affected directly, through accessible and paid channels where appropriate. Do not treat one colleague as a representative of a whole community.",
    },
  ],
};

export const LIFECYCLE = {
  intro: "A strong response to the common scenario combines approaches in sequence. Methods change from stage to stage, but dignity, access, fair process and accountability do not. That is what sophisticated flexibility looks like.",
  stages: [
    { id: "immediate", stage: "Immediate response", behavior: "Stop the dismissal and establish expectations.", styles: ["ethical", "directive"], contribution: "Ethical plus bounded directive", example: "In the meeting: “Let's pause. Raising a question about fairness is welcome here. We will not dismiss it. I'll follow up on the substance separately.”" },
    { id: "concern", stage: "Concern handling", behavior: "Follow appropriate procedures and protect against adverse treatment.", styles: ["procedural", "ethical"], contribution: "Procedural plus accountable", example: "Privately, the same day: “Thank you for raising this. There will be no adverse treatment for it. Here is the process that applies, and here is what I will do next.”" },
    { id: "inquiry", stage: "Inquiry", behavior: "Hear relevant perspectives and examine evidence.", styles: ["inclusive", "participative"], contribution: "Inclusive plus participative", example: "The supervisor gathers the assignment records for the last two years and offers team members a private way to share how they learn about opportunities." },
    { id: "diagnosis", stage: "Diagnosis", behavior: "Examine criteria, power and the history of opportunity.", styles: ["transformative"], contribution: "Transformative", example: "The supervisor asks how “polished” became a criterion, who decided, who has received preparation and sponsorship, and what the records show." },
    { id: "redesign", stage: "Redesign", behavior: "Develop alternatives with the people affected.", styles: ["shared", "adaptive-situational"], contribution: "Shared plus adaptive", example: "A small cross-role group, with time set aside, drafts job-related criteria and a visible rotation, and tests them for one quarter." },
    { id: "support", stage: "Individual support", behavior: "Offer development without presuming a deficit.", styles: ["servant", "coaching"], contribution: "Servant plus coaching", example: "“If you'd like more presentation experience, I'll help line up real opportunities and preparation. That's your choice, and it's separate from the review.”" },
    { id: "implementation", stage: "Implementation", behavior: "Assign owners, resources and deadlines.", styles: ["transactional"], contribution: "Transactional", example: "The supervisor names who maintains the rotation, sets a start date, and schedules a review in three months." },
    { id: "sustainability", stage: "Sustainability", behavior: "Embed transparent practices and review their effects.", styles: ["procedural", "shared"], contribution: "Procedural plus distributed", example: "The criteria are written into the team's procedures. The rotation is reviewed every six months by the group, not just the supervisor." },
  ],
};

export const RUBRIC = {
  intro: "Use this rubric to look at a response, not a person. It never produces a score about anyone's character, personality, identity or likelihood of acting fairly.",
  criteria: [
    { id: "problem", title: "Identified the actual problem", strong: "Names each matter separately, such as conduct, allocation and fear of consequences.", weak: "Treats everything as one personality conflict.", question: "What, exactly, needs a response?" },
    { id: "formal", title: "Distinguished disagreement from a formal concern", strong: "Recognizes when something belongs in an authorized process.", weak: "Handles a possible formal concern as a team discussion or a vote.", question: "Does anything here need an authorized process?" },
    { id: "power", title: "Recognized power and access", strong: "Notices who decides, who benefits and who carries risk.", weak: "Treats everyone as equally able to speak up and be heard.", question: "Who has power here, and who carries the risk?" },
    { id: "assumptions", title: "Avoided unsupported assumptions", strong: "Checks evidence before concluding the process was fair or unfair.", weak: "Assumes the answer, or assumes a deficit in the person who raised the issue.", question: "What am I assuming without evidence?" },
    { id: "rights", title: "Preserved relevant rights and procedures", strong: "Protects against retaliation, respects privacy and follows applicable processes.", weak: "Asks for private details, promises secrecy it cannot keep, or skips a required step.", question: "What rights and procedures apply?" },
    { id: "action", title: "Chose an actionable response", strong: "Commits to specific steps that can actually be taken.", weak: "Offers only reassurance or values language.", question: "What will actually happen next?" },
    { id: "responsibility", title: "Assigned responsibility", strong: "Names who is responsible, without handing the burden to the person harmed.", weak: "Leaves it unclear, or makes the person who raised the concern fix it.", question: "Who owns each step?" },
    { id: "followup", title: "Planned follow-up", strong: "Sets a date and says what evidence of improvement will be checked.", weak: "Ends with “let me know if anything else comes up.”", question: "When will we check, and what will we look at?" },
  ],
  limits: "Do not use any part of this pathway to produce a racial-equity leadership probability, diagnose a personality type, or rank real leaders from their reflections. Do not infer intent, honesty, diagnosis or neurotype from silence, tone, eye contact or communication style.",
};

export const CAPSTONE = {
  statement: "“We are an inclusive team. Everyone has the same opportunity. If you want more visibility, speak up more.”",
  tasks: [
    "Identify unsupported claims.",
    "Identify the burden shifted to the employee.",
    "Separate the conduct concern from the allocation concern.",
    "Write a response using ethical, inclusive, directive and participative behaviors.",
    "Specify what evidence is needed.",
    "Propose a transparent allocation process.",
    "State what follow-up would demonstrate improvement.",
  ],
  analysis: [
    { title: "Unsupported claims", body: "“We are an inclusive team” and “everyone has the same opportunity” are stated as facts, but no one has looked at the evidence. The employee's concern is exactly that opportunity has not been the same." },
    { title: "The burden shifted", body: "“Speak up more” makes the employee responsible for fixing an allocation pattern the supervisor controls. It also ignores that, when the employee did speak up, a colleague dismissed them." },
    { title: "Two separate concerns", body: "The conduct concern is the interruption and dismissal in the team discussion. The allocation concern is how visible assignments are distributed. Each needs its own response." },
    { title: "Evidence needed", body: "Who received high-visibility assignments over a set period, how they were offered, what criteria were used, and who received preparation or sponsorship." },
    { title: "A transparent allocation process", body: "Post high-visibility opportunities in one place with job-related criteria. Use a rotation or open selection. Offer preparation to anyone who wants it. Review the pattern on a set schedule." },
    { title: "Follow-up that would show improvement", body: "A date to report back to the employee. A review after one or two quarters of who is receiving visible work. A check that no one has been treated worse for raising the concern." },
  ],
  stronger: "“I hear two concerns: access to visible assignments and what happened when you raised the issue. I will follow the appropriate response process. I will also review the criteria and assignment history with the authorized partners, rather than assume the process has been fair. We will clarify what opportunities require, how people can access them, and what support is available. I will explain the next steps and follow up by an agreed date.”",
  outcome: "That is the central learning outcome for this pathway: choosing a combination of behaviors that addresses the conflict, preserves appropriate procedures, examines inequitable conditions and leads to observable change.",
};

export const PATHWAY_SOURCES: readonly { title: string; href: string }[] = [
  { title: "Greenleaf Center: servant leadership", href: "https://greenleaf.org/what-is-servant-leadership/" },
  { title: "Hekman and colleagues: diversity-valuing behavior and leader evaluations", href: "https://doi.org/10.5465/amj.2014.0538" },
  { title: "Skogstad and colleagues: the effects of passive laissez-faire leadership", href: "https://doi.org/10.1037/1076-8998.12.1.80" },
  { title: "Randel and colleagues: inclusive leadership, belonging and uniqueness", href: "https://doi.org/10.1016/j.hrmr.2017.07.002" },
  { title: "Shields: transformative leadership and equity", href: "https://eric.ed.gov/?id=EJ898247" },
  { title: "Bass: transformational leadership", href: "https://doi.org/10.1016/0090-2616%2890%2990061-S" },
  { title: "Edmondson: psychological safety and learning in teams", href: "https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Organizational_Learning_and_Change/Edmondson_1999_Psychological_safety.pdf" },
  { title: "U.S. Equal Employment Opportunity Commission: retaliation", href: "https://www.eeoc.gov/retaliation" },
];

export const STYLE_GROUP_LABEL: Record<ConduciveGroup, string> =
  Object.fromEntries(CONDUCIVE_GROUPS.map(group => [group.id, group.title])) as Record<ConduciveGroup, string>;
