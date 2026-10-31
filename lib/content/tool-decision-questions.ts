/**
 * Questions placed where each tool asks for a decision. Each set is written for its own
 * tool; the shared ideas (own culture, other explanations, disability and intersection,
 * and the book's four capabilities) are worked into that tool's steps rather than
 * repeated as one block.
 *
 * `source` credits the part of Livermore a question grows from, and is absent when the
 * question is these applications' own. `note` states the limit of the book for this tool.
 * Questions stay in our own words: no table or list of his is reproduced.
 */
export type ToolDecisionQuestionSet = {
  title: string;
  moments: readonly { when: string; question: string; source?: string }[];
  note?: string;
};

export const TOOL_DECISION_QUESTIONS = {
  "equity-toolkit": {
    title: "Where to stop and ask in an analysis",
    moments: [
      { when: "Before you start", question: "Why does this decision matter to the mission, and what is standing in the way? If you can only say that an analysis is required, stop there and find the reason.", source: "Ch. 3, Drive, about p. 50; ch. 9, about pp. 200 and 204" },
      { when: "When you describe the decision", question: "Whose normal is built into this proposal: your team's, the agency's or your profession's? What would look strange about it to someone outside DHS? Have you stayed with the problem long enough before moving to answers?", source: "Ch. 2, about p. 42; ch. 8, about p. 194" },
      { when: "When you consider who may be affected", question: "A difference shows up in the record. Next to any cultural explanation, what else could explain it: a schedule, transport, a cost, an agency rule? What is our own system assuming? How will this land differently across the units and professions who carry it out?", source: "Ch. 4, Knowledge, about pp. 74 and 95" },
      { when: "When you ask people for input", question: "Have you told them what their input will do: gauge reactions or shape the decision? Whose view counts for more, and do they know that?", source: "Ch. 8, about p. 195" },
      { when: "When you compare approaches", question: "Follow each approach to the point where disability, language, race and income meet. Who does its design fail there? Look at the approach, and do not add up one person's identities." },
      { when: "When you decide what would have to change", question: "Who has been doing the adapting so far? Name the process you could change: a form, an appointment or no-show rule, interpreter scheduling, who counts as a contact or natural support. That says more than a better tone in the same process.", source: "Ch. 7, Action, about p. 168; ch. 8, about p. 188; ch. 9, about pp. 214-16" },
      { when: "When the timeline or fairness is challenged", question: "Is a grant or legislative timeline shorter than the problem? If staff object to a targeted approach, what fairness value are they holding, and how will you answer it honestly?", source: "Ch. 5, about pp. 110-11 and 116-18" },
    ],
    note: "The Toolkit stays the required process. The book adds questions only and does not address it.",
  },
  "equity-toolkit-practice": {
    title: "Before you save your analysis",
    moments: [
      { when: "As you write your starting question", question: "Did you write it from the agency's side of the desk? Try writing it the way someone receiving the notice or service would ask it. Stay with the problem a little longer before you move to options.", source: "Ch. 8, about p. 194" },
      { when: "Before you record a barrier as cultural", question: "Have you listed more than one explanation? Have you checked the shift pattern, the bus route, the fee and the rule that sets the deadline? Record what you checked, and keep culture on the list if it still belongs there.", source: "Ch. 4, Knowledge, about p. 74" },
      { when: "When you trace a cause back to an agency rule", question: "Ask yourself why the rule works this way, then why again. Keep asking yourself; asking other people why can put them on the defensive.", source: "Ch. 6, Strategy, about p. 145" },
      { when: "Before you settle on an option", question: "Which parts of your options come from a law, and which are only how this agency has always done it? Would the option work for someone who uses a screen reader and reads Spanish? Whose input will shape it, and have you told them so?", source: "Ch. 8, about p. 195" },
    ],
  },
  "clas-learn": {
    title: "Questions to carry into the standards",
    moments: [
      { when: "When you read about communication", question: "What does your own working culture treat as clear: a formal letter, a phone call, reading on your own? Which of those would you have to give up for this standard to mean something here? Some people want the action list and others want the full reasons, so can you offer both?", source: "Chs. 1 and 2, about pp. 15 and 46" },
      { when: "When you read about language", question: "A word can honor from one person and offend from another. Who have you asked about the words you use, including disability language, where people's own preferences differ?", source: "Ch. 4, Knowledge, about pp. 82-85" },
      { when: "When you read about workforce preparation", question: "What is your team being prepared to notice about its own habits, not only about the people it serves? Are slower speech, plain words, repeated key points and written summaries taught as access for everyone?", source: "Ch. 7, Action, about pp. 157-58" },
      { when: "When you read about community participation", question: "Are disabled people in these communities part of the conversation, or do disability and culture go to two separate meetings?" },
      { when: "When you think about local practice", question: "What must stay the same statewide, and where can a county or lead agency work in its own way? Rights do not vary.", source: "Ch. 9, about pp. 216-17" },
    ],
    note: "The book never discusses CLAS. The standards keep their own authority, and the book supplies only practice detail.",
  },
  "clas-plan": {
    title: "Questions for this worksheet",
    moments: [
      { when: "As you describe the service and the people it reaches", question: "What does this service assume a person already has or can do: a phone, a predictable schedule, comfort calling a state agency? What do its forms and notices assume about the reader? Which of those assumptions come from your own working culture?", source: "Ch. 1, about p. 8" },
      { when: "As you list changes to consider", question: "Before you settle on a language or culture change, what else is in the way: the hours the line is staffed, the trip to the office, a fee, a rule that requires a form in person? Plan for those alongside it. Who has been adapting so far, the service or the people using it?", source: "Ch. 7, Action, about p. 168" },
      { when: "As you plan a notice of change", question: "What does a vague notice do to people who depend on this service? What exactly changes, when, and who can they ask?", source: "Ch. 5, about p. 105" },
      { when: "As you plan communication access", question: "For someone who is Deaf and uses ASL, are you planning language access and cultural relations together, or sending them to different offices? Have you set one standard with several ways to meet it, sent materials early and offered several ways to respond?", source: "Ch. 8, about pp. 187-88 and 191-92" },
      { when: "As you plan how you will know people understood", question: "Asking whether someone follows does not check anything. If the explanation does not land, then what will you do differently? Write that plan down as an if-then sentence, without names.", source: "Ch. 6, Strategy, on planning; ch. 7, about p. 158. The if-then form is these applications'" },
      { when: "As you decide what to examine afterward", question: "Will your evidence show how the change works for people who are both disabled and speak another language, or will they disappear into two separate counts? Some days later, can people tell you the next steps in their own words, in any way they communicate? That checks your explanation, not them.", source: "Ch. 6, Strategy, about pp. 140-41" },
    ],
    note: "The book never discusses CLAS. The standards keep their own authority, and the book supplies only practice detail.",
  },
  "community-engagement": {
    title: "Questions for your engagement plan",
    moments: [
      { when: "Before you begin", question: "What larger purpose is bringing you here, and are you ready to learn as well as to deliver? If you came only to explain a decision, say so.", source: "Ch. 3, Drive, about pp. 65-67" },
      { when: "Before you set the agenda", question: "Who set it, and who controls the money and how what you hear is interpreted? What do your agency's meeting habits, such as daytime, online and formal, make hard for people? Have you sent the purpose and agenda early, said what the input will do and offered several ways to give it?", source: "Ch. 8, about pp. 191-92 and 195" },
      { when: "When you plan the time", question: "Does your plan count time for building relationships, or only for getting results? If people do not come, then what will you change about the invitation before you try again?", source: "Ch. 5, about pp. 106-9; ch. 6, Strategy, on planning. The if-then form is these applications'" },
      { when: "When you walk in", question: "What is on the wall, who was invited, who really decides, and whose interests are at stake? Who cannot get into this room, hear what is said or read what is handed out?", source: "Ch. 6, Strategy, about p. 139" },
      { when: "When few people come or speak", question: "Before you decide people are not interested, list more than one explanation: shifts, the trip, unpaid time, child care, a rule about who may attend, what happened when people spoke up before, the power your agency holds. What does your invitation assume? Silence can mean many things, so make room for reflection and for debate.", source: "Ch. 2, about p. 46; ch. 4, about p. 74; ch. 7, about p. 160" },
      { when: "When you ask questions", question: "Do your questions presume an answer? Ask what you are missing, not whether anything is missing.", source: "Ch. 8, about pp. 181-82" },
      { when: "When you choose whom to hear", question: "Are disabled people from this community in the room? Who is left out if community groups and disability groups are only heard separately? If someone is helping you understand this community, are you learning from them what to ask? Is their time treated as work, and are you careful not to let one person stand for everyone?", source: "Ch. 6, Strategy, about pp. 146-47, on choosing a guide, whose main value is teaching you what to ask. Treating a guide's time as work, not letting one person stand for everyone, and hearing disabled people and community groups together are these applications' own." },
      { when: "After you decide", question: "Have you gone back to tell people what was decided, what changed because of them, and what you cannot share?", source: "Ch. 8, about pp. 196-97" },
    ],
    note: "The book writes about input within teams, not about power over agendas or money, so those questions are these applications' own. Tribal Nations are governments. Tribal matters go to the Office of Indian Affairs and the DHS Tribal offices, and none of these practices is a model for that relationship.",
  },
  "access-checks": {
    title: "Questions as you work through these checks",
    moments: [
      { when: "When you choose a default format", question: "Who is the default format comfortable for? Would you have picked it if your team did not already work this way? What does it assume about the reader? Clear means different things to different people, so can you offer plain language, Easy Read, ASL and more detail for those who want it?", source: "Ch. 1, about p. 8; chs. 1 and 2, about pp. 15 and 46" },
      { when: "When you write or present", question: "Which acronyms and DSD or DHS terms shut people out? Have you slowed down, used short sentences, repeated key points, added visuals and a written summary, and arranged captions and interpreters?", source: "Ch. 5, about pp. 112-14; ch. 7, Action, about pp. 157-58" },
      { when: "When you send something ahead", question: "Does it give enough notice for an interpreter, a screen reader, someone who needs more time to read or someone on shift? Does it say what you need from people, and offer several ways to respond?", source: "Ch. 8, about pp. 191-92" },
      { when: "When someone does not use what you offered", question: "Notice your first reaction before you respond. Before you treat it as their preference, check: did the offer arrive in time, did it take extra steps, did it cost them anything, did a rule limit it? Does your deadline treat other uses of time as laziness?", source: "Ch. 5, about p. 115; ch. 6, Strategy, about pp. 137-38" },
      { when: "When several needs come together", question: "Does your plan hold when one person needs an interpreter, captions and a ride, or does each arrangement assume the others are not needed? Is there one standard with several ways to meet it, or one way that everyone else must adapt to?", source: "Ch. 8, about pp. 187-88" },
    ],
    note: "The book says nothing on accessibility, so every link to it here is these applications' own reading of a general point.",
  },
  "person-centered": {
    title: "Questions when you use these frameworks",
    moments: [
      { when: "Before you meet", question: "What might you be assuming about this person, what might they be assuming about you, and what in the setting could explain this? Do not guess at what they want; prepare options for language, format, who is present and how they decide, and let them choose.", source: "Ch. 6, Strategy, about pp. 130-32, on assumptions running both ways and what in the setting could explain this. His planning questions go on to speculate about a person's values. Offering options and letting the person choose, rather than guessing, are these applications' own." },
      { when: "When you are short on time", question: "Pressure makes it easy to assume people want what you would want. If you feel rushed, then what is the one check you will still make with this person?", source: "Ch. 2, about p. 42; ch. 6, Strategy, on planning. The if-then form is these applications'" },
      { when: "When you open a planning conversation", question: "What does your own training treat as a good outcome: living alone, paid work, making decisions by yourself? Ask what this person wants, how they decide and with whom, and how they would like to use this time. Be ready to drop your plan when they show you another way. Ask what you are missing, not whether anything is missing.", source: "Ch. 5, about pp. 98-101; ch. 6, Strategy, about pp. 141-42; ch. 8, about pp. 181-82" },
      { when: "When family speaks first", question: "Notice before you respond. Have you heard from the person directly? Who is in the room can change what can be said, so can you offer time alone? Do not impose individualism on them, and do not let culture become a reason to speak for them.", source: "Ch. 1, about pp. 9-11, on who is in the room; ch. 6, Strategy, about pp. 137-38, on noticing before you respond. Offering time alone, and the warning against both failures, imposing individualism and using culture to speak for someone, are these applications' own." },
      { when: "When an answer may be shaped by your role", question: "You hold real power over services, and it filters what reaches you. Change how and by whom you ask: more time, a private option, several ways to answer, a chance to say it again later. Never conclude that the person cannot say.", source: "Ch. 2, about p. 46, on position filtering what reaches you. Changing how you ask, and never concluding the person cannot say, are these applications' own." },
      { when: "When you check that the person's voice was heard", question: "Is there one standard with several ways to meet it: speech, AAC, writing, an interpreter or a chosen supporter?", source: "Ch. 8, about pp. 187-88" },
      { when: "When someone declines a service", question: "What else could explain this: the schedule, the ride, the cost, an eligibility rule? What does the service assume a person will put up with?" },
      { when: "When what they want runs into a rule", question: "Is it truly a legal duty or a right, or only how this service usually works? What reaches their goal? If you cannot change it, say so plainly and say what you can offer. Rights are lines that do not move.", source: "Ch. 7, Action, about pp. 167-69, on how firm a rule is, what best reaches the goal and making up for what you cannot adapt. Rights as lines that do not move are these applications' own." },
      { when: "When you close", question: "Some days later, can the person tell you the next steps in their own words, in any way they communicate? That checks your explanation, not them.", source: "Ch. 6, Strategy, about pp. 140-41" },
    ],
    note: "The book does not cover person-centered practice. A group fact can give you a question to ask. It never tells you what to expect of this person. Livermore accepts group tendencies as a possible starting point and has doubts about asking people what they want (ch. 1, about pp. 20-22; ch. 5, about p. 124). These applications differ: asking stays the rule. If an answer seems unclear or shaped by your role, change how you ask, and do not doubt the person.",
  },
  idi: {
    title: "Questions before you use the IDI",
    moments: [
      { when: "Before you take it or offer it", question: "What do you want to understand about your own culture, and who will debrief with you? It can be used for development and group planning only. On its own an assessment does little. What coaching and follow-through will go with it?", source: "Ch. 9, about p. 212" },
      { when: "When you plan with group results", question: "What might someone be tempted to do with these results, and how will you stop them being used in hiring, ranking or performance?" },
      { when: "When a result seems to explain a conflict", question: "Have you looked at workload, schedules and team rules before deciding orientation is the issue? A result never defines a person of color's experience." },
      { when: "When a result falls or surprises someone", question: "Have you talked with the person first? Budget cuts, slow change and carrying other people's stories can wear anyone down. Who could take on some of that load?", source: "Ch. 3, Drive, about pp. 50-53. Asking who could take on the load is these applications' addition; he plans for the person's own coping." },
    ],
    note: "The book names the IDI once, as an awareness and readiness tool, and says nothing about its orientations. The IDI has five orientations; Integration, the sixth used here, comes from Bennett's DMIS and these applications' own use. Keep the IDI and CQ® apart: no comparison of scores, and neither in hiring, ratings or promotion.",
  },
  "minnesota-communities": {
    title: "Questions to bring to these briefs",
    moments: [
      { when: "Before you open a brief", question: "What does your own culture, and the way your team and DHS work, treat as normal in this decision? What question from your work are you bringing, and why does it matter here? Which worlds do you belong to: family, faith, profession, this agency?", source: "Ch. 1, about pp. 3-4; ch. 3, Drive, about p. 50" },
      { when: "When you worry about getting it wrong", question: "What small step could you take, and who could tell you how it went? Being confused is part of this, and overconfidence does harm too.", source: "Ch. 3, Drive, about p. 57; ch. 6, Strategy, about p. 142" },
      { when: "When a brief seems to explain what you are seeing", question: "Have you also checked the schedule, the ride, the cost and the rule? A brief can give you a better question. It cannot tell you what is true of the person in front of you. Knowledge alone can harden into a stereotype, and no community is a list of traits.", source: "Prologue, about p. xv; ch. 5, about pp. 123-24" },
      { when: "When you read about history and current events", question: "How might past harm, including by institutions, shape how people see your agency? What in the news could reach this work? Ask about it; do not assume how it affects anyone.", source: "Ch. 2, about pp. 28-29; ch. 4, Knowledge, about pp. 85-87" },
      { when: "When you read about language and customs", question: "Who has told you the words they prefer, and do they apply to you saying them? Respect is not imitation. Are you adapting your process, or only your manners?", source: "Ch. 4, Knowledge, about pp. 82-85; ch. 7, Action, about pp. 166-68" },
      { when: "When you plan for people in a community", question: "Are disabled people in this community in your plan? Who is missed if language, culture and disability access are planned separately?" },
      { when: "If you want to go further", question: "Could a memoir, novel or documentary from the further reading deepen your questions? Check what you take from it against other sources.", source: "Ch. 5, about p. 124" },
    ],
    note: "Credits here refer to how to use a brief. The book is not a source on any community on these pages.",
  },
  lifecourse: {
    title: "Questions when you use this framework",
    moments: [
      { when: "When you start with the vision", question: "Whose picture of a good life is shaping your questions: yours, the system's or the person's? Is paid work being treated as the only picture of a good life? This framework is promising, not proven, so check whether it fits." },
      { when: "When family is part of the plan", question: "How does this person make decisions, and with whom? Has anyone asked them directly, in a way that works for them?" },
      { when: "When you map supports", question: "If a support on the map is not being used, what is in the way: cost, transport, schedule, an eligibility rule? What does the map take for granted? Is there more than one way to reach what the person wants?" },
    ],
    note: "The book does not discuss LifeCourse or disability services. These questions are these applications' own, prompted by two of his points: how being and doing shape what we value (ch. 5, about pp. 114-16), and one standard met in several ways (ch. 8, about pp. 187-88).",
  },
} as const satisfies Record<string, ToolDecisionQuestionSet>;

export type ToolDecisionQuestionKey = keyof typeof TOOL_DECISION_QUESTIONS;

/** Library items that are the working page for one of the frameworks. */
export const RESOURCE_DECISION_QUESTIONS: Readonly<Record<string, ToolDecisionQuestionKey>> = {
  "tool-idi": "idi",
  "tool-lifecourse": "lifecourse",
  "ja-access-checks": "access-checks",
  "lm-disability-rights-and-service-delivery": "person-centered",
};
