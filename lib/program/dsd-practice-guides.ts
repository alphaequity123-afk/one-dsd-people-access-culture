export type PracticeGuide = {
  slug: string;
  title: string;
  purpose: string;
  summary: string;
  introduction: string;
  steps: { title: string; body: string; question: string }[];
  example: string;
  review: string;
  resources: { title: string; href: string; purpose: string }[];
};

/** Program-authored applications of the existing published collection; original resources stay intact. */
export const practiceGuides: PracticeGuide[] = [
  {
    slug: "inclusive-meetings",
    title: "Make participation more accessible",
    purpose: "Before a meeting or team conversation",
    summary: "Prepare ways for people to contribute, understand the decision, and hear what happens next.",
    introduction: "A meeting can invite people into a decision while still making it difficult for them to contribute. Examine the invitation, materials, format, and follow-up together. Use the access checks to prepare for the people involved, without assuming that everyone needs the same approach.",
    steps: [
      { title: "Clarify what people can influence", body: "State the purpose of the conversation and which choices remain open. Explain who will make the decision and how contributions will be considered. Give people enough context to decide how they want to participate.", question: "What could change because of this conversation?" },
      { title: "Prepare more than one way to contribute", body: "Share accessible materials in advance and explain how to request communication support. Consider the meeting space, timing, language, and technology. Offer a way to contribute before or after the discussion when that fits the decision.", question: "Who might find the current format difficult to use, and how will you check?" },
      { title: "Make room for different perspectives", body: "Allow time to think before asking for responses. Invite contributions without requiring personal disclosure or asking one colleague to speak for a whole community. Clarify unfamiliar terms and check whether your summary reflects what people intended.", question: "Which perspectives have you heard, and which remain missing?" },
      { title: "Close the loop", body: "Share a brief account of what was heard, what will happen next, and who is responsible. Explain decisions that differed from participants’ suggestions. Ask what would make the next conversation more usable.", question: "How will people learn what their contribution influenced?" },
    ],
    example: "A team is revising its monthly meeting. Before choosing a new format, the facilitator shares the decision questions, offers written input, and checks access needs. The team tries one change and asks participants whether they had a usable way to contribute.",
    review: "Look for evidence about participation and influence, rather than relying only on attendance. Record what people could use, what remained difficult, and what you would adjust next time.",
    resources: [
      { title: "Access checks before a meeting, outreach, or session", href: "/library/ja-access-checks", purpose: "Work through language, communication, timing, space, and participation needs." },
      { title: "Language access checklist", href: "/library/ja-language-access-checklist", purpose: "Review the existing guidance when language support is part of the preparation." },
      { title: "Intercultural learning", href: "/learn/intercultural", purpose: "Examine assumptions and practice adapting communication." },
    ],
  },
  {
    slug: "clearer-processes",
    title: "Make a process easier to use",
    purpose: "When revising a form, notice, or workflow",
    summary: "Examine the steps people face and prepare a change grounded in their experience.",
    introduction: "A process may be familiar to the team that designed it and difficult for someone using it for the first time. Begin with the task people need to complete. Examine the instructions, required steps, and points where people must seek help or repeat information.",
    steps: [
      { title: "Describe the task from the user’s perspective", body: "Write down what a person is trying to accomplish and the steps they currently face. Separate a confirmed requirement from a local habit or assumption. Identify who can explain requirements that remain unclear.", question: "What must a person understand or provide before they can move forward?" },
      { title: "Examine the points of difficulty", body: "Review unclear wording, repeated requests, inaccessible formats, and steps that require extra time or technology. Use general observations and voluntary feedback. Keep identifying case information out of a working practice plan.", question: "Where do people pause, need help, repeat work, or leave the process?" },
      { title: "Compare reasonable changes", body: "Consider several responses rather than settling immediately on a new form. You might clarify an instruction, remove an unnecessary step, or offer another usable format. Use the Equity Analysis Toolkit to consider different effects and the appropriate decision process.", question: "Which option addresses the difficulty, and what new burden might it create?" },
      { title: "Review the proposed version", body: "Ask someone outside the design team to explain the next step using the instructions alone. Check the document with the plain language and accessibility guidance. Confirm any necessary approval before changing a live process.", question: "What can a person now do more easily, and what remains uncertain?" },
    ],
    example: "A team notices repeated questions about the same instruction. It rewrites the instruction to name the action, responsible role, and next step. Colleagues unfamiliar with the process review both versions and describe what they would do.",
    review: "Compare the original difficulty with what people report and demonstrate after the change. A shorter document is useful when people can understand what it means and take the next step. Look for evidence of that understanding.",
    resources: [
      { title: "Plain language and accessible documents checklist", href: "/library/ja-plain-language", purpose: "Review wording, structure, links, images, forms, and document checks." },
      { title: "Questions about the steps, time, and effort a process requires", href: "/library/ja-process-burden", purpose: "Consider the effort a process asks of the people using it." },
      { title: "Equity Analysis Toolkit", href: "/learn/equity-toolkit", purpose: "Examine the decision, alternatives, participation, and possible effects." },
    ],
  },
  {
    slug: "review-a-change",
    title: "Find out what changed in practice",
    purpose: "After trying a different approach",
    summary: "Connect an action with observations, acknowledge uncertainty, and choose the next adjustment.",
    introduction: "Completing a course, holding a conversation, or revising a document shows that an activity occurred. To understand its value, examine what people did or experienced afterward. A useful review includes evidence that challenges the original expectation as well as evidence that supports it.",
    steps: [
      { title: "Return to the purpose", body: "Describe the difficulty you hoped to address and the action you tried. Keep the scope specific enough to examine. If the original aim was broad, identify one practical change that could contribute to it.", question: "What did you expect to become different, and for whom?" },
      { title: "Separate the activity from its effects", body: "Record what was produced or completed, then identify what changed in use. Attendance, downloads, and completed documents can describe activity. They do not establish improved access, understanding, or trust on their own.", question: "What observation goes beyond showing that the activity happened?" },
      { title: "Consider the evidence and its limits", body: "Compare observations with feedback from people affected. Consider who was not represented and other changes that could explain the result. Describe what remains uncertain without using the review to rate individual colleagues.", question: "What supports your interpretation, and what might lead you to reconsider it?" },
      { title: "Agree on the next adjustment", body: "Decide what to continue, revise, or stop within the relevant decision process. Identify the role responsible for the next action and when to review it. Return useful findings to those who contributed.", question: "What is the smallest useful next step supported by what you learned?" },
    ],
    example: "After offering written input before a team discussion, a facilitator reviews whether people used the option and whether their concerns influenced the discussion. More responses alone do not establish inclusion; the review also asks whose ideas were considered and what remained difficult.",
    review: "Keep a brief observation in your private reflection, or update a practice plan. Preserve the distinction between what you observed, how you interpreted it, and what you still need to understand.",
    resources: [
      { title: "Measurement planning worksheet", href: "/practice/measurement", purpose: "Connect an intended change with practical questions about evidence." },
      { title: "Practice reflection", href: "/program/reflection", purpose: "Record a private observation and the next step it suggests." },
      { title: "How the program works", href: "/program/model", purpose: "Find learning, tools, and reflection that support the work you want to develop." },
    ],
  },
];
