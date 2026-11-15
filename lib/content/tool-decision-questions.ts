/** Questions at decision points for applying cultural understanding to practical work. */
export type ToolDecisionQuestionSet = {
  title: string;
  moments: readonly { when: string; question: string; source?: string }[];
  note?: string;
};

export const TOOL_DECISION_QUESTIONS = {
  "equity-toolkit": {
    title: "Where to stop and ask in an analysis",
    moments: [
      { when: "Before you start", question: "Why does this decision matter to the mission, and what is standing in the way? If you can only say that an analysis is required, stop there and find the reason." },
      { when: "When you describe the decision", question: "Whose normal is built into this proposal: your team's, the agency's or your profession's? What would look strange about it to someone outside DHS? Have you stayed with the problem long enough before moving to answers?" },
      { when: "When you consider who may be affected", question: "A difference shows up in the record. Next to any cultural explanation, what else could explain it: a schedule, transport, a cost, an agency rule? What is our own system assuming? How will this land differently across the units and professions who carry it out?" },
      { when: "When you ask people for input", question: "Have you told them what their input will do: gauge reactions or shape the decision? Whose view counts for more, and do they know that?" },
      { when: "When you compare approaches", question: "Follow each approach to the point where disability, language, race and income meet. Who does its design fail there? Look at the approach, and do not add up one person's identities." },
      { when: "When you decide what would have to change", question: "Who has been doing the adapting so far? Name the process you could change: a form, an appointment or no-show rule, interpreter scheduling, who counts as a contact or natural support. That says more than a better tone in the same process." },
      { when: "When the timeline or fairness is challenged", question: "Is a grant or legislative timeline shorter than the problem? If staff object to a targeted approach, what fairness value are they holding, and how will you answer it honestly?" },
    ],
    note: "The Toolkit remains the required process; follow current guidance and the person or area responsible.",
  },
  "equity-toolkit-practice": {
    title: "Before you save your analysis",
    moments: [
      { when: "As you write your starting question", question: "Did you write it from the agency's side of the desk? Try writing it the way someone receiving the notice or service would ask it. Stay with the problem a little longer before you move to options." },
      { when: "Before you record a barrier as cultural", question: "Have you listed more than one explanation? Have you checked the shift pattern, the bus route, the fee and the rule that sets the deadline? Record what you checked, and keep culture on the list if it still belongs there." },
      { when: "When you trace a cause back to an agency rule", question: "Ask yourself why the rule works this way, then why again. Keep asking yourself; asking other people why can put them on the defensive." },
      { when: "Before you settle on an option", question: "Which parts of your options come from a law, and which are only how this agency has always done it? Would the option work for someone who uses a screen reader and reads Spanish? Whose input will shape it, and have you told them so?" },
    ],
  },
  "clas-learn": {
    title: "Questions to carry into the standards",
    moments: [
      { when: "When you read about communication", question: "What does your own working culture treat as clear: a formal letter, a phone call, reading on your own? Which of those would you have to give up for this standard to mean something here? Some people want the action list and others want the full reasons, so can you offer both?" },
      { when: "When you read about language", question: "A word can honor from one person and offend from another. Who have you asked about the words you use, including disability language, where people's own preferences differ?" },
      { when: "When you read about workforce preparation", question: "What is your team being prepared to notice about its own habits, not only about the people it serves? Are slower speech, plain words, repeated key points and written summaries taught as access for everyone?" },
      { when: "When you read about community participation", question: "Are disabled people in these communities part of the conversation, or do disability and culture go to two separate meetings?" },
      { when: "When you think about local practice", question: "What must stay the same statewide, and where can a county or lead agency work in its own way? Rights do not vary." },
    ],
    note: "Follow the National CLAS Standards and applicable requirements for the work.",
  },
  "clas-plan": {
    title: "Questions for this worksheet",
    moments: [
      { when: "As you describe the service and the people it reaches", question: "What does this service assume a person already has or can do: a phone, a predictable schedule, comfort calling a state agency? What do its forms and notices assume about the reader? Which of those assumptions come from your own working culture?" },
      { when: "As you list changes to consider", question: "Before you settle on a language or culture change, what else is in the way: the hours the line is staffed, the trip to the office, a fee, a rule that requires a form in person? Plan for those alongside it. Who has been adapting so far, the service or the people using it?" },
      { when: "As you plan a notice of change", question: "What does a vague notice do to people who depend on this service? What exactly changes, when, and who can they ask?" },
      { when: "As you plan communication access", question: "For someone who is Deaf and uses ASL, are you planning language access and cultural relations together, or sending them to different offices? Have you set one standard with several ways to meet it, sent materials early and offered several ways to respond?" },
      { when: "As you plan how you will know people understood", question: "Asking whether someone follows does not check anything. If the explanation does not land, then what will you do differently? Write that plan down as an if-then sentence, without names." },
      { when: "As you decide what to examine afterward", question: "Will your evidence show how the change works for people who are both disabled and speak another language, or will they disappear into two separate counts? Some days later, can people tell you the next steps in their own words, in any way they communicate? That checks your explanation, not them." },
    ],
    note: "Follow the National CLAS Standards and applicable requirements for the work.",
  },
  "community-engagement": {
    title: "Questions for your engagement plan",
    moments: [
      { when: "Before you begin", question: "What larger purpose is bringing you here, and are you ready to learn as well as to deliver? If you came only to explain a decision, say so." },
      { when: "Before you set the agenda", question: "Who set it, and who controls the money and how what you hear is interpreted? What do your agency's meeting habits, such as daytime, online and formal, make hard for people? Have you sent the purpose and agenda early, said what the input will do and offered several ways to give it?" },
      { when: "When you plan the time", question: "Does your plan count time for building relationships, or only for getting results? If people do not come, then what will you change about the invitation before you try again?" },
      { when: "When you walk in", question: "What is on the wall, who was invited, who really decides, and whose interests are at stake? Who cannot get into this room, hear what is said or read what is handed out?" },
      { when: "When few people come or speak", question: "Before you decide people are not interested, list more than one explanation: shifts, the trip, unpaid time, child care, a rule about who may attend, what happened when people spoke up before, the power your agency holds. What does your invitation assume? Silence can mean many things, so make room for reflection and for debate." },
      { when: "When you ask questions", question: "Do your questions presume an answer? Ask what you are missing, not whether anything is missing." },
      { when: "When you choose whom to hear", question: "Are disabled people from this community in the room? Who is left out if community groups and disability groups are only heard separately? If someone is helping you understand this community, are you learning from them what to ask? Is their time treated as work, and are you careful not to let one person stand for everyone?" },
      { when: "After you decide", question: "Have you gone back to tell people what was decided, what changed because of them, and what you cannot share?" },
    ],
    note: "Tribal Nations are governments. Follow the Office of Indian Affairs and the DHS offices responsible for Tribal relationships and consultation.",
  },
  "access-checks": {
    title: "Questions as you work through these checks",
    moments: [
      { when: "When you choose a default format", question: "Who is the default format comfortable for? Would you have picked it if your team did not already work this way? What does it assume about the reader? Clear means different things to different people, so can you offer plain language, Easy Read, ASL and more detail for those who want it?" },
      { when: "When you write or present", question: "Which acronyms and DSD or DHS terms shut people out? Have you slowed down, used short sentences, repeated key points, added visuals and a written summary, and arranged captions and interpreters?" },
      { when: "When you send something ahead", question: "Does it give enough notice for an interpreter, a screen reader, someone who needs more time to read or someone on shift? Does it say what you need from people, and offer several ways to respond?" },
      { when: "When someone does not use what you offered", question: "Notice your first reaction before you respond. Before you treat it as their preference, check: did the offer arrive in time, did it take extra steps, did it cost them anything, did a rule limit it? Does your deadline treat other uses of time as laziness?" },
      { when: "When several needs come together", question: "Does your plan hold when one person needs an interpreter, captions and a ride, or does each arrangement assume the others are not needed? Is there one standard with several ways to meet it, or one way that everyone else must adapt to?" },
    ],
    note: "Ask people what access works for them and follow applicable accessibility and language-access requirements.",
  },
  "person-centered": {
    title: "Questions when you use these frameworks",
    moments: [
      { when: "Before you meet", question: "What might you be assuming about this person, what might they be assuming about you, and what in the setting could explain this? Do not guess at what they want; prepare options for language, format, who is present and how they decide, and let them choose." },
      { when: "When you are short on time", question: "Pressure makes it easy to assume people want what you would want. If you feel rushed, then what is the one check you will still make with this person?" },
      { when: "When you open a planning conversation", question: "What does your own training treat as a good outcome: living alone, paid work, making decisions by yourself? Ask what this person wants, how they decide and with whom, and how they would like to use this time. Be ready to drop your plan when they show you another way. Ask what you are missing, not whether anything is missing." },
      { when: "When family speaks first", question: "Notice before you respond. Have you heard from the person directly? Who is in the room can change what can be said, so can you offer time alone? Do not impose individualism on them, and do not let culture become a reason to speak for them." },
      { when: "When an answer may be shaped by your role", question: "You hold real power over services, and it filters what reaches you. Change how and by whom you ask: more time, a private option, several ways to answer, a chance to say it again later. Never conclude that the person cannot say." },
      { when: "When you check that the person's voice was heard", question: "Is there one standard with several ways to meet it: speech, AAC, writing, an interpreter or a chosen supporter?" },
      { when: "When someone declines a service", question: "What else could explain this: the schedule, the ride, the cost, an eligibility rule? What does the service assume a person will put up with?" },
      { when: "When what they want runs into a rule", question: "Is it truly a legal duty or a right, or only how this service usually works? What reaches their goal? If you cannot change it, say so plainly and say what you can offer. Rights are lines that do not move." },
      { when: "When you close", question: "Some days later, can the person tell you the next steps in their own words, in any way they communicate? That checks your explanation, not them." },
    ],
    note: "A group fact can suggest a question, but it never tells you what to expect of an individual. Ask the person and adjust how you ask when needed.",
  },
  idi: {
    title: "Questions before you use the IDI",
    moments: [
      { when: "Before you take it or offer it", question: "What do you want to understand about your own culture, and who will debrief with you? It can be used for development and group planning only. On its own an assessment does little. What coaching and follow-through will go with it?" },
      { when: "When you plan with group results", question: "What might someone be tempted to do with these results, and how will you stop them being used in hiring, ranking or performance?" },
      { when: "When a result seems to explain a conflict", question: "Have you looked at workload, schedules and team rules before deciding orientation is the issue? A result never defines a person of color's experience." },
      { when: "When a result falls or surprises someone", question: "Have you talked with the person first? Budget cuts, slow change and carrying other people's stories can wear anyone down. Who could take on some of that load?" },
    ],
    note: "The IDI has five orientations. Integration, the sixth used here, comes from Bennett’s developmental model and this program’s own use; it is not an IDI orientation. Never use assessment results for hiring, ratings or promotion.",
  },
  "minnesota-communities": {
    title: "Questions to bring to these briefs",
    moments: [
      { when: "Before you open a brief", question: "What does your own culture, and the way your team and DHS work, treat as normal in this decision? What question from your work are you bringing, and why does it matter here? Which worlds do you belong to: family, faith, profession, this agency?" },
      { when: "When you worry about getting it wrong", question: "What small step could you take, and who could tell you how it went? Being confused is part of this, and overconfidence does harm too." },
      { when: "When a brief seems to explain what you are seeing", question: "Have you also checked the schedule, the ride, the cost and the rule? A brief can give you a better question. It cannot tell you what is true of the person in front of you. Knowledge alone can harden into a stereotype, and no community is a list of traits." },
      { when: "When you read about history and current events", question: "How might past harm, including by institutions, shape how people see your agency? What in the news could reach this work? Ask about it; do not assume how it affects anyone." },
      { when: "When you read about language and customs", question: "Who has told you the words they prefer, and do they apply to you saying them? Respect is not imitation. Are you adapting your process, or only your manners?" },
      { when: "When you plan for people in a community", question: "Are disabled people in this community in your plan? Who is missed if language, culture and disability access are planned separately?" },
      { when: "If you want to go further", question: "Could a memoir, novel or documentary from the further reading deepen your questions? Check what you take from it against other sources." },
    ],
    note: "Use community briefs for context and better questions, not to predict what is true of an individual.",
  },
  lifecourse: {
    title: "Questions when you use this framework",
    moments: [
      { when: "When you start with the vision", question: "Whose picture of a good life is shaping your questions: yours, the system's or the person's? Is paid work being treated as the only picture of a good life? This framework is promising, not proven, so check whether it fits." },
      { when: "When family is part of the plan", question: "How does this person make decisions, and with whom? Has anyone asked them directly, in a way that works for them?" },
      { when: "When you map supports", question: "If a support on the map is not being used, what is in the way: cost, transport, schedule, an eligibility rule? What does the map take for granted? Is there more than one way to reach what the person wants?" },
    ],
    note: "Use the person’s own vision and choices, and check whether the framework fits the situation.",
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
