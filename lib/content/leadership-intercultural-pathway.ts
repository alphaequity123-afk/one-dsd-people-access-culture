import type { CoursePack } from "./courses/source-types";

export const LEADERSHIP_LIFECYCLE_CONTEXTS = [
  { id: "recruitment", title: "Recruitment and selection", stage: "interview" },
  { id: "onboarding", title: "Onboarding and belonging", stage: "onboard" },
  { id: "supervision", title: "Everyday supervision", stage: "everyday" },
  { id: "development", title: "Development and opportunity", stage: "develop" },
  { id: "retention", title: "Retention and transitions", stage: "retain" },
] as const;

export type LeadershipLifecycleContext = typeof LEADERSHIP_LIFECYCLE_CONTEXTS[number]["id"];
export type LeadershipInterculturalStage = {
  id: string;
  title: string;
  focus: string;
  objectives: [string, string, string];
  courseIds: readonly string[];
  applications: Record<LeadershipLifecycleContext, string>;
  example: string;
  reflection: string;
};

/** Curated links to complete published courses, never a replacement course pack. */
export const LEADERSHIP_INTERCULTURAL_PATHWAY: readonly LeadershipInterculturalStage[] = [
  {
    id: "perspectives",
    title: "Understanding cultural perspectives",
    focus: "Build a foundation for recognizing cultural differences, examining your own assumptions, and understanding how colleagues experience the same workplace differently.",
    objectives: [
      "Separate an observed behavior from the meaning you initially give it.",
      "Identify a familiar workplace expectation and consider whose perspective it reflects.",
      "Prepare a respectful question that could improve your understanding of another person's experience.",
    ],
    courseIds: ["intercultural-competence-without-a-score", "cultural-humility-vs-checklist", "what-minimization-does-in-dhs-work", "equity-centered-leadership", "gc-new-supervisor-inclusive-leadership"],
    applications: {
      recruitment: "Notice when confidence, eye contact, or a familiar career path is being treated as evidence of capability. Return to the job-related criterion and the applicant's actual response.",
      onboarding: "Identify expectations a new colleague is supposed to discover alone, including how questions are raised, decisions are explained, and help is requested.",
      supervision: "Distinguish a useful contribution from a preferred communication style. Ask what helps a colleague contribute before interpreting quieter participation.",
      development: "Examine who receives invitations and recognition. Consider whose interests or capabilities may be overlooked when opportunity depends on visibility or familiarity.",
      retention: "Listen for differences in employee experience without assuming everyone needs the same support or that a departure has one explanation.",
    },
    example: "A new colleague sends thoughtful questions after meetings. Before interpreting this as reluctance to participate, the supervisor considers what the meeting format rewards and asks when and how questions are easiest to raise.",
    reflection: "Which of my expectations felt neutral until I considered someone else's experience?",
  },
  {
    id: "adaptation",
    title: "Adapting leadership across differences",
    focus: "Practice shifting perspective and adjusting communication, feedback, participation, and support in response to differences people describe. Check the effect of the adjustment with them.",
    objectives: [
      "Compare two ways to approach a leadership situation from different cultural perspectives.",
      "Prepare an adjustment to communication or participation based on a stated preference or need.",
      "Use feedback to decide whether to keep, revise, or reconsider that adjustment.",
    ],
    courseIds: ["acceptance-in-dhs-work", "idi-adaptation", "intercultural-conflict-styles", "cq-leading-multicultural-teams", "di-inclusive-supervision-and-team-culture", "equity-centered-leadership"],
    applications: {
      recruitment: "Use consistent, job-related questions and criteria while working with the appropriate hiring partners to make participation accessible. Examine evidence rather than requiring one style of self-presentation.",
      onboarding: "Agree on several ways to ask questions, receive explanations, and check understanding. Adjust the welcome using the new colleague's feedback.",
      supervision: "Ask about feedback preferences, prepare clear work-related examples, and check how the conversation was understood. Give people more than one way to contribute to team decisions.",
      development: "Agree on mentoring, work time, access, and feedback around a learning opportunity. Adapt the support to the person's goals rather than expecting them to follow your own path.",
      retention: "Follow a listening conversation with an agreed action and a return conversation. Ask whether the response improved the employee's experience.",
    },
    example: "The supervisor shares the meeting question in advance and welcomes a written response before deciding. After two meetings, the supervisor asks whether this helped the new colleague contribute and adjusts the approach together.",
    reflection: "What changed in my approach after I understood another perspective, and what did their feedback reveal?",
  },
  {
    id: "systems",
    title: "Applying intercultural practice across systems",
    focus: "Carry perspective-taking and adaptation into team practices, policies, resources, and decision processes. Work with affected colleagues and the responsible partners to test improvements and sustain what helps.",
    objectives: [
      "Trace how a workplace process may favor one cultural expectation or form of participation.",
      "Develop an improvement with affected perspectives, clear responsibilities, and appropriate partners.",
      "Compare the intended effect with the employee experience and propose a next adjustment.",
    ],
    courseIds: ["equity-inclusion-leadership-and-systems", "accessibility-as-leadership-responsibility", "cq-leading-multicultural-teams", "gc-career-pathways-succession", "dsd-leading-system-change"],
    applications: {
      recruitment: "Review how role requirements, outreach, selection criteria, and access work together. Bring a proposed change to the responsible hiring and HR partners with the evidence behind it.",
      onboarding: "Use feedback from new and established colleagues to improve welcome practices across teams. Make informal knowledge and routes for support easier to find.",
      supervision: "Review recurring patterns in assignments, voice, recognition, and support. Make expectations and decisions clearer while allowing appropriate differences in how people contribute.",
      development: "Make development opportunities and their criteria visible. Examine who can actually take part, what support is available, and how mentoring and knowledge transfer broaden access.",
      retention: "Use appropriate aggregate feedback about employee experience to improve continuity and transitions. Review whether the response helped without treating a course completion as evidence of organizational change.",
    },
    example: "Several colleagues describe difficulty raising questions during onboarding. Leaders and staff revise the shared welcome process, clarify points of contact, and ask the next group what became clearer and what still needs attention.",
    reflection: "What did individual experience reveal about the process, and who needs to help shape and review the improvement?",
  },
];

/** The scoped published collection is the only authority for visible destinations. */
export function resolveLeadershipPathwayCourses(stage: LeadershipInterculturalStage, published: readonly CoursePack[]): CoursePack[] {
  const available = new Map(published.map(pack => [pack.course.id, pack]));
  return stage.courseIds.flatMap(id => {
    const pack = available.get(id);
    return pack ? [pack] : [];
  });
}
