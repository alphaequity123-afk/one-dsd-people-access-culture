/**
 * The self-paced leadership journey: how one round works, what each suggested path keeps asking,
 * a steady rhythm, and ways to look back. It organizes what is already in the program. Nobody is
 * enrolled, nothing is assessed, and nothing a person does here is recorded anywhere but their own browser.
 */

export type JourneyStep = { id: "learn" | "reflect" | "apply" | "capture" | "repeat"; title: string; body: string; href: string; link: string };

/** One round. Every path uses the same five steps. */
export const JOURNEY_STEPS: readonly JourneyStep[] = [
  { id: "learn", title: "Learn", body: "Open one short lesson from a path, or one question from the decisions leaders face. Ten to twenty minutes is enough.", href: "/leading/paths", link: "Choose a path" },
  { id: "reflect", title: "Reflect", body: "Write a few honest lines: what happened, why it matters, and what you will do next.", href: "/my-work/reflections", link: "Open your reflection notebook" },
  { id: "apply", title: "Apply", body: "Try one idea in your real work within a week or two. An action plan names the first small step and a date to look back.", href: "/my-work/action-plan", link: "Start an action plan" },
  { id: "capture", title: "Capture", body: "Note what you tried and what changed for the people affected. Keep a decision record when a choice mattered. Download anything you want to keep.", href: "/my-work", link: "See your saved work" },
  { id: "repeat", title: "Repeat", body: "Choose the next lesson, or stay with the same idea and try it in a new moment. Going around more than once is where the growth is.", href: "/leading", link: "Return to the decisions in front of you" },
];

export type PathJourney = {
  /** The question the path keeps asking. */
  question: string;
  /** Something to try in real work while on this path, sized to the role. */
  tryThis: string;
  /** What to keep from it. Kept by the person; nothing is submitted. */
  keep: string;
};

/** Keyed by the path's address. A path without an entry simply shows its courses. */
export const PATH_JOURNEY: Readonly<Record<string, PathJourney>> = {
  "exploring-leadership": {
    question: "What kind of leader do I want to be here?",
    tryThis: "One small change that makes it easier for someone to take part, be heard or get what they need.",
    keep: "A short note on what you tried and what you noticed.",
  },
  "program-leads": {
    question: "How do I move a program, policy or project forward fairly when the people involved do not report to me?",
    tryThis: "One change to a process that crosses teams, worked out with the people it affects.",
    keep: "Who was involved, what changed, and how you will know whether it helped.",
  },
  "first-year": {
    question: "How do I build a team where people are treated fairly and can do their best work?",
    tryThis: "One change to how your team meets, shares work or gives feedback, with a simple before and after.",
    keep: "What you saw before, what you changed, and what you saw afterward.",
  },
  experienced: {
    question: "Whose ways of working does my team run on, and what would I change?",
    tryThis: "A change you have put off: how stretch work is shared, how conflict is handled, or how honest feedback reaches you.",
    keep: "What made it hard, what you did anyway, and what you would do differently.",
  },
  "managers-of-managers": {
    question: "How do I back my supervisors and keep decisions consistent across teams?",
    tryThis: "One pattern across your teams to look at with evidence, and one practice to make consistent.",
    keep: "What the evidence showed, what it could not show, and what you asked your supervisors to do.",
  },
  "senior-leaders": {
    question: "What can only I change, and what will still be in place after me?",
    tryThis: "One rule, measure or resource decision that removes a barrier, and one person whose growth you will back.",
    keep: "The decision and its reasons, and what you are leaving in place for the people who come next.",
  },
};

/** A week that fits inside real work. */
export const WEEKLY_RHYTHM: readonly { what: string; time: string }[] = [
  { what: "One short lesson", time: "20 to 30 minutes" },
  { what: "A few lines of reflection", time: "10 to 15 minutes" },
  { what: "Trying it in work you already do", time: "45 to 90 minutes" },
  { what: "A conversation with someone you trust, if you want one", time: "30 minutes" },
];

/** One way to pace a path. Any path can be taken faster, slower or in a different order. */
export const SIX_WEEKS: readonly { week: number; learn: string; reflect: string; apply: string }[] = [
  { week: 1, learn: "Choose a path and open its first lesson", reflect: "Write where you are starting from", apply: "Pick one thing to work on" },
  { week: 2, learn: "The next lesson", reflect: "Look back on last week's lesson", apply: "Take a first small step" },
  { week: 3, learn: "The next lesson", reflect: "Write about one moment that mattered", apply: "Keep going, and adjust" },
  { week: 4, learn: "A lesson that goes deeper, if you want one", reflect: "Talk it through with someone, if you choose", apply: "Ask the people affected what they noticed" },
  { week: 5, learn: "The next lesson, or a scenario", reflect: "Look back on what you tried", apply: "Write down what changed" },
  { week: 6, learn: "The last lesson you chose", reflect: "Look back on the whole path", apply: "Decide what you will keep doing, and what comes next" },
];

/** Kinds of reflection and the questions that help with each. */
export const REFLECTION_PROMPTS: readonly { kind: string; when: string; questions: readonly string[] }[] = [
  { kind: "After a lesson", when: "A few minutes, the same day.", questions: ["What stood out?", "Why does it matter for the work I do?", "What will I try?"] },
  { kind: "A moment that mattered", when: "When something at work helped or got in the way of fair access or a good team.", questions: ["What happened, as I saw it?", "Who was affected, and how do I know?", "What was my part, and what would I do next time?"] },
  { kind: "After a project or a stretch task", when: "Soon after it ends, while it is fresh.", questions: ["What did the team set out to do?", "What happened?", "Why was there a difference?", "What will the team keep, change or stop?"] },
  { kind: "At the end of a path", when: "When you have finished the lessons you chose.", questions: ["What do I do differently now?", "What have I seen that tells me so?", "What is still hard?", "What comes next?"] },
  { kind: "What I am leaving in place", when: "For leaders who set direction, once or twice a year.", questions: ["What will still be in place after me?", "What barriers remain?", "What will I personally do differently?"] },
];

/** Looking back at the end of a path. Nothing is submitted and nothing is counted. */
export const END_OF_PATH_QUESTIONS: readonly string[] = [
  "Did I open the lessons I chose?",
  "Did I reflect honestly, and more than once?",
  "Did I try at least one idea in my real work?",
  "Can I say what changed, and what I would do next?",
];

/** Places to learn with other people. Every one of them is optional. */
export const LEARNING_WITH_OTHERS: readonly { title: string; body: string; href: string }[] = [
  { title: "Mentoring", body: "Find or offer a mentoring conversation.", href: "/one-dsd/amplify/mentoring" },
  { title: "Amplify Equity", body: "Colleagues who share ideas, materials and gatherings.", href: "/one-dsd/amplify" },
  { title: "Employee resource groups", body: "Groups led by employees, open to join.", href: "/employee-resource-groups" },
  { title: "Team kits", body: "A ready session to run with your own team.", href: "/team-kits" },
  { title: "Team space", body: "Share a decision record with your team, if you choose.", href: "/team-space" },
  { title: "Find the right person", body: "When a question needs a person who can act on it.", href: "/support/right-person" },
];

/**
 * Free courses elsewhere, for anyone who wants more. Each was checked on the provider's own site in
 * November 2026. They are optional, they belong to their providers, and nothing about them is recorded here.
 */
export const LEARNING_ELSEWHERE: readonly { title: string; provider: string; body: string; href: string }[] = [
  { title: "Leadership and Influence", provider: "Federal Emergency Management Agency", body: "A short self-paced course on leading from within, trust, influence and change.", href: "https://training.fema.gov/is/courseoverview.aspx?code=IS-240.c" },
  { title: "Decision Making and Problem Solving", provider: "Federal Emergency Management Agency", body: "A short self-paced course on defining a problem, weighing options and deciding with others.", href: "https://training.fema.gov/is/courseoverview.aspx?code=IS-241.c" },
  { title: "Effective Communication", provider: "Federal Emergency Management Agency", body: "A short self-paced course on listening, plain messages and reaching everyone in a community.", href: "https://training.fema.gov/is/courseoverview.aspx?code=IS-242.c" },
  { title: "Partners in Policymaking online courses", provider: "Minnesota Governor's Council on Developmental Disabilities", body: "Five courses on disability history, self-determination, education, employment and making your case, taught from the experience of people with disabilities and their families.", href: "https://partnersonlinecourses.com/" },
  { title: "Leadership and followership", provider: "The Open University, OpenLearn", body: "About 24 hours over eight weeks on how leaders and the people around them shape each other.", href: "https://www.open.edu/openlearn/education-development/learning/leadership-and-followership" },
  { title: "An introduction to public leadership", provider: "The Open University, OpenLearn", body: "About 9 hours on leading in public service, partnership and creating public value.", href: "https://www.open.edu/openlearn/money-business/an-introduction-public-leadership/" },
  { title: "Three principles of a coaching approach", provider: "The Open University, OpenLearn", body: "About 2 hours on rapport, listening, and summarizing and reflecting back.", href: "https://www.open.edu/openlearn/money-business/leadership-management/three-principles-coaching-approach/content-section-overview" },
  { title: "Exercising Leadership: Foundational Principles", provider: "Harvard University", body: "A self-paced course on leading through change with or without authority, free to take without paying.", href: "https://pll.harvard.edu/course/exercising-leadership-foundational-principles" },
];

export type StartAnswers = { supervises: boolean; guidesProgram?: boolean; firstYear?: boolean; supervisesSupervisors?: boolean; setsDirection?: boolean };

/**
 * A suggested starting path from a person's own answers about their work. It is a suggestion only:
 * every path is open to everyone, and the answers are used on the page and never kept or sent.
 */
export function suggestedPath(answers: StartAnswers): string {
  if (!answers.supervises) return answers.guidesProgram ? "program-leads" : "exploring-leadership";
  if (answers.supervisesSupervisors) return answers.setsDirection ? "senior-leaders" : "managers-of-managers";
  return answers.firstYear ? "first-year" : "experienced";
}
