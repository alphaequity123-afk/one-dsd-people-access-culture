/**
 * Skills a person can build through the program, as a fifth way into the collection.
 * A skill describes what a course or practice helps with. It never describes a person:
 * nothing here records, counts, or infers anything about anyone.
 */
import tagged from "./skill-courses.json";

export type Skill = { id: string; title: string; summary: string; group: string; /** Words used to find close matches beyond the tagged courses. */ phrase: string };

const INTERCULTURAL = "Understanding culture, including your own";
const PEOPLE = "Leading and supporting people";
const COMMUNICATION = "Communicating so people can take part";
const DECISIONS = "Decisions, evidence and change";
const LASTING = "Building access and fairness that last";

export const SKILLS: readonly Skill[] = [
  { id: "own-culture", group: INTERCULTURAL, title: "Know your own culture", summary: "Seeing the habits, values and expectations you bring, and where you learned them.", phrase: "cultural values worldview own culture identity ethnocentrism norm" },
  { id: "observe-interpret", group: INTERCULTURAL, title: "Separate what you saw from what you assumed", summary: "Describing what happened before deciding what it means.", phrase: "assumptions bias observation interpretation evidence impression" },
  { id: "shift-perspective", group: INTERCULTURAL, title: "See it from another position", summary: "Working out how the same situation looks to someone else.", phrase: "perspective intercultural difference acceptance understanding" },
  { id: "adapt-behavior", group: INTERCULTURAL, title: "Adapt how you work with people", summary: "Changing how you communicate, meet or decide so it works across difference.", phrase: "adaptation adapt communication styles intercultural practice" },
  { id: "bridge", group: INTERCULTURAL, title: "Help people understand each other", summary: "Helping colleagues, partners and processes work across difference.", phrase: "bridge dialogue cultural broker mediation across difference" },
  { id: "purpose-accountability", group: PEOPLE, title: "Lead with purpose and answer for it", summary: "Being clear about who your work is for, and owning what it does.", phrase: "accountability ethics purpose responsibility repair leadership" },
  { id: "inclusive-teams", group: PEOPLE, title: "Build a team where everyone can contribute", summary: "Hiring, welcoming and running a team so different people are heard and belong.", phrase: "inclusive team hiring belonging supervision culture climate" },
  { id: "develop-others", group: PEOPLE, title: "Open opportunity and develop others", summary: "Making growth, stretch work and advancement visible and reachable.", phrase: "mentoring sponsorship career development opportunity advancement" },
  { id: "coach-feedback", group: PEOPLE, title: "Coach and give useful feedback", summary: "Giving feedback about the work, and asking what would help.", phrase: "coaching feedback performance supervision conversation" },
  { id: "listen-inquire", group: COMMUNICATION, title: "Listen and ask good questions", summary: "Asking instead of assuming, and hearing the answer.", phrase: "listening questions inquiry stay interview engagement hear" },
  { id: "accessible-communication", group: COMMUNICATION, title: "Communicate plainly and accessibly", summary: "Writing and speaking so people can understand and act, in the language and format they use.", phrase: "plain language accessible communication language access interpreter notice" },
  { id: "facilitate", group: COMMUNICATION, title: "Run meetings and conversations that include people", summary: "Planning and leading discussions with more than one way to take part.", phrase: "facilitation meeting discussion dialogue inclusive meetings" },
  { id: "conflict-repair", group: COMMUNICATION, title: "Work through conflict and repair harm", summary: "Staying fair and steady in a disagreement, and making things right afterward.", phrase: "conflict repair harm microaggressions respectful workplace resolution" },
  { id: "evidence", group: DECISIONS, title: "Use evidence with care", summary: "Reading data honestly, noticing what it hides, and saying what it cannot show.", phrase: "data evidence measurement outcomes disparities evaluation" },
  { id: "equity-analysis", group: DECISIONS, title: "Look at a decision through an equity lens", summary: "Asking who is affected, who decides and what the options cost, before the decision is made.", phrase: "equity analysis toolkit decision policy review impact" },
  { id: "lead-change", group: DECISIONS, title: "Lead a change well", summary: "Bringing people along, and returning to tell them what happened.", phrase: "change management implementation redesign leading change" },
  { id: "partner", group: DECISIONS, title: "Work in partnership with the people affected", summary: "Engaging communities and partners while their input can still shape the outcome.", phrase: "community engagement partnership co-design stakeholders outreach" },
  { id: "build-access", group: LASTING, title: "Build access in from the start", summary: "Designing work so access is already there, without anyone having to ask.", phrase: "accessibility accommodation barriers disability inclusion access" },
  { id: "govern-resource", group: LASTING, title: "Direct resources and oversight fairly", summary: "Budgets, contracts, rules and oversight that carry fairness with them.", phrase: "governance budget resources contracts procurement oversight" },
  { id: "continuity", group: LASTING, title: "Share knowledge and prepare what comes next", summary: "Making sure important work can be carried by more than one person.", phrase: "succession continuity knowledge transfer onboarding transition" },
  { id: "sustain-culture", group: LASTING, title: "Keep a fair culture going", summary: "Turning good practice into how the work is done, so it lasts when people change.", phrase: "culture sustain workplace values lasting practice" },
];

/** Courses tagged to each skill. A first pass from titles; see the note in the data file. */
export const SKILL_COURSES = tagged.skills as Record<string, string[]>;
export const SKILL_TAG_BASIS: string = tagged.basis;
