export type ProgramResource = { title: string; href: string; description: string };
export type LogicStage = {
  slug: string; label: string; model: string; question: string; introduction: string;
  explanation: string; resources: ProgramResource[]; reflection: string;
};

export const logicStages: LogicStage[] = [
  {
    slug: "what-informs", label: "What informs our work", model: "Inputs",
    question: "What informs our work?",
    introduction: "One DSD People, Access and Culture connects learning, practical resources and informed action to help Disability Services Division staff make their work and workplace more equitable. It brings policy, evidence, staff knowledge and community perspectives into decisions about disability services, policies and employee experience. Choose resources relevant to your responsibility, involve people affected by the work, and return to what happened after an approach was used.",
    explanation: "Begin with evidence and the experience of people affected by the work. A community brief can help you prepare for a conversation, but it cannot speak for a person. Applicable law, approved policy and delegated authority guide decisions. People's knowledge and professional judgment help us apply them to the situation at hand.",
    resources: [
      { title: "Program charter", href: "/program-foundation", description: "Connect the program’s purpose, responsibilities, operating principles and authority boundaries with the work you prepare." },
      { title: "Requirements and review evidence", href: "/practice/requirements", description: "Identify applicable requirements and sources, prepare supporting evidence and make the responsible review visible." },
      { title: "Unequal Starting Points: Seeing Advantages You Did Not Have to Earn", href: "/courses/div-f01-white-privilege", description: "Examine unearned racial advantages while recognizing effort, hardship, and individual variation." },
      { title: "Microaggressions: Recognition, Intent, and Impact", href: "/courses/div-f02-microaggressions", description: "Recognize everyday identity-based messages and practice proportionate responses, repair, and follow-through." },
      { title: "Sound Judgment in Everyday Decisions", href: "/courses/sf-unconscious-bias-everyday-decisions", description: "Separate observations from assumptions, check familiar explanations, and review everyday decision practices." },
      { title: "Checking Assumptions in Everyday Decisions", href: "/courses/div-f05-implicit-bias-iat", description: "Learn how quick judgments enter decisions, and use shared criteria, a second reader and written reasons to keep decisions fair." },
      { title: "About the program", href: "/about", description: "Understand the purpose of One DSD and how learning connects with practical work in the division." },
      { title: "DHS equity policy", href: "/equity-policy", description: "Read the policy context for considering equity in workforce, policy, program, and service decisions." },
      { title: "Minnesota Communities", href: "/minnesota-communities", description: "Explore community histories, perspectives, and service context while keeping individual experience in view." },
      { title: "Understanding DHS", href: "/understanding-dhs", description: "Find organizational context and responsibilities that can help you identify the appropriate source of guidance." },
      { title: "Program orientation", href: "/start#new-to-dsd", description: "Learn how the program connects personal development, professional practice, and participation with colleagues." },
    ],
    reflection: "What do we already know, and whose perspective would help us understand the situation more fully?",
  },
  {
    slug: "practice", label: "Put equity into practice", model: "Activities",
    question: "What do we do with what we know?",
    introduction: "Learning can help us examine a familiar practice, consider another perspective, or improve a decision that is still open. Choose an activity that fits your purpose. You might reflect on your own experience, prepare a team conversation, or plan a change in how work is done.",
    explanation: "Operationalizing equity means making equity part of how work is designed, decided, resourced, carried out, and reviewed. Begin with a concrete question, involve people who experience the effects, and compare reasonable alternatives. You can enter at any point and return as the situation develops.",
    resources: [
      { title: "Applicable ADSA implementation steps", href: "/program/implementation", description: "Where an action step applies, connect it with an adaptable work product, participation and evidence of results. Equity work also extends beyond these steps." },
      { title: "Operationalizing equity", href: "/operationalizing-equity", description: "Connect equity with everyday decisions, participation, resources, and responsibility for following through." },
      { title: "Work through a decision", href: "/learn/equity-toolkit/practice#toolkit-draft", description: "Start with a real question, bring in relevant tools, compare options, and save your analysis in My Work." },
      { title: "Equity Analysis Toolkit", href: "/learn/equity-toolkit", description: "Explore the toolkit, watch a worked example, and find guidance for your decision." },
      { title: "Your practice plans", href: "/my-work/plan", description: "Connect learning with a decision, prepare a next step, and return to private drafts saved on this device." },
      { title: "Make participation more accessible", href: "/practice-guides/inclusive-meetings", description: "Prepare a meeting or conversation with usable ways to contribute and a clear return to participants." },
      { title: "Make a process easier to use", href: "/practice-guides/clearer-processes", description: "Review a form, notice, or workflow from the perspective of the people using it." },
      { title: "Intercultural learning", href: "/learn/intercultural", description: "Examine assumptions, make room for different experiences, and adapt communication through reflection and practice." },
      { title: "Guided practice", href: "/practice", description: "Work through a realistic situation and develop a practical response that you can review or refine." },
      { title: "Learning pathways", href: "/learn/paths", description: "Follow a question through relevant learning, practical choices, and reflection on what happens next." },
      { title: "One DSD Team", href: "/one-dsd/team", description: "Connect shared inquiry with agreed work, clear responsibilities, and a return to the people who contributed." },
      { title: "Amplify Equity", href: "/one-dsd/amplify", description: "Explore opportunities for learning, conversation, and practical contributions with colleagues." },
      { title: "Leadership development", href: "/one-dsd/leadership", description: "Consider how leadership practices influence participation, development opportunities, and organizational culture." },
    ],
    reflection: "What is open to change, and how can affected people influence the options before a decision is settled?",
  },
  {
    slug: "resources", label: "Tools and resources", model: "Outputs",
    question: "What can we use or produce?",
    introduction: "Find courses, community references, and practical tools that help you prepare for your work. You might develop a draft analysis, revise a conversation plan, or find a resource to share with colleagues. Choose what fits the situation, then consider how you will use it and what you hope it will help you understand.",
    explanation: "Use the complete learning collection for substantive study, or choose a tool when you need to prepare a particular piece of work. Keep original policy and source material alongside your interpretation. A completed document records what was produced; it does not, by itself, establish an improvement.",
    resources: [
      { title: "Learning and resources", href: "/learn", description: "Browse the complete learning collection, including courses, reading, and resources connected with your work." },
      { title: "Resource library", href: "/library", description: "Find reference materials, practical guidance, and available downloads for individual or team use." },
      { title: "Toolkit practice", href: "/learn/equity-toolkit/practice", description: "Prepare an equity analysis with questions about evidence, participation, alternatives, and review." },
      { title: "Complete equity review tools", href: "/equity-review", description: "Review a policy, process, or service change independently, using the general, HCBS, or structural analysis workspace." },
      { title: "Structural equity analysis", href: "/equity-review/structural", description: "Trace a process barrier, examine decision rights and evidence, and plan a change with a responsible role and a review date." },
      { title: "My work", href: "/my-work", description: "Return to your saved work and reflections, and continue an analysis or learning activity." },
    ],
    reflection: "What have we produced, who will use it, and what would show that it helped them do the work?",
  },
  {
    slug: "progress", label: "Review progress", model: "Outcomes",
    question: "What changed in practice?",
    introduction: "Look back at a course, conversation, or decision and consider what happened afterward. What did people do differently, and how did others experience the change? Draw on observations and feedback to understand what helped, what remained difficult, and what you would try next.",
    explanation: "Consider whether participation became more accessible, a decision reflected a wider range of experience, or colleagues could apply learning in another situation. Feedback may also show that an approach needs to change. These observations support program improvement; they are not ratings of individual staff.",
    resources: [
      { title: "Record an observation", href: "/program/reflection", description: "Keep a private note about a change, the evidence you observed, and what you would retain or revise." },
      { title: "DSD planning and progress", href: "/one-dsd/planning", description: "Explore division-specific planning and reporting within ADSA; use the applicable responsibilities and measures in your own setting." },
      { title: "Find out what changed in practice", href: "/practice-guides/review-a-change", description: "Distinguish a completed activity from a change in experience, and consider the evidence and its limits." },
      { title: "Return to your work", href: "/my-work", description: "Reopen an analysis or practice plan to record what happened, what remains uncertain, and what you would change." },
      { title: "Find support", href: "/support", description: "Identify guidance or another perspective when the result raises a question that needs further consideration." },
      { title: "Review applicable ADSA equity goals", href: "/learn/equity-toolkit/goals", description: "Where the ADSA plan applies, connect observations with its goals. Other administrations retain their own responsibilities and plans." },
    ],
    reflection: "What evidence supports the change we describe, and what remains uncertain or needs another perspective?",
  },
  {
    slug: "impact", label: "Lasting change", model: "Impact",
    question: "What should improve over time?",
    introduction: "The long-term purpose is to help DSD staff make equity part of everyday work and workplace practice. Shared responsibility and informed decisions help sustain that work. Progress should be visible in access to opportunity, workplace participation, service experiences, and trust. These intended changes require evidence over time; taking part in the program does not establish them.",
    explanation: "Lasting change depends on more than the application. Leadership, staff participation, resources, and the people affected by decisions all contribute. The program supports that work by connecting knowledge with action and preserving what is learned, so useful practices can continue beyond a single project or person.",
    resources: [
      { title: "Equity Strategic Framework", href: "/equity-framework", description: "Connect immediate work with broader priorities, responsibilities, and conditions that support sustained practice." },
      { title: "DSD programs and services", href: "/one-dsd/programs", description: "Connect sustained equity practice with the division’s services, responsibilities and relationships." },
      { title: "ADSA equity goals", href: "/learn/equity-toolkit/goals", description: "Explore the ADSA plan in its administration and division context; confirm which goals and responsibilities apply to your work." },
      { title: "Review what is changing", href: "/program/progress", description: "Return to the evidence, acknowledge its limits, and identify the next adjustment in practice." },
    ],
    reflection: "Which useful practices are becoming part of ordinary work, and what support will help them continue?",
  },
];

export function stageForPath(path: string): LogicStage | undefined {
  const stage = logicStages.find(item => path === `/program/${item.slug}`);
  if (stage) return stage;
  // Match the most specific destination first; toolkit pages sit inside /learn.
  return logicStages.flatMap(item => item.resources.map(resource => ({ item, href: resource.href })))
    .sort((a, b) => b.href.length - a.href.length)
    .find(entry => path === entry.href || path.startsWith(`${entry.href}/`))?.item;
}
