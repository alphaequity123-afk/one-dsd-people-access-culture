import type { LeadershipStyleSlug } from "@/components/leadership-style-video";

type LeadershipApproach = {
  id: LeadershipStyleSlug;
  name: string;
  description: string;
  possibleUse: string;
  watchFor: string;
};

export const culturalLeadershipApproaches: readonly LeadershipApproach[] = [
  {
    id: "servant",
    name: "Servant leadership",
    description: "A leader centers the growth, needs and well-being of the people they serve and support.",
    possibleUse: "Listen to staff and people affected, remove barriers, and make it easier for others to contribute.",
    watchFor: "Listening without sharing decisions or changing resources can leave the same power imbalance in place. Support does not replace a leader's responsibility to act.",
  },
  {
    id: "authoritarian",
    name: "Autocratic and authoritarian leadership",
    description: "A leader concentrates decisions and direction. Writers use these terms in overlapping ways; authoritarian approaches may also emphasize obedience and control.",
    possibleUse: "A clearly identified decision-maker may need to act quickly in an emergency or when an immediate safety rule applies.",
    watchFor: "If used as the default, concentrated control can exclude people affected, discourage speaking up, and make inequitable rules harder to challenge. Explain the decision and reopen participation when possible.",
  },
  {
    id: "laissez-faire",
    name: "Laissez-faire leadership",
    description: "A leader leaves substantial discretion with others. It is different from intentional delegation with agreed support and accountability.",
    possibleUse: "Experienced people may need room to decide how to carry out work within clear responsibilities and resources.",
    watchFor: "An absence of direction or support can leave barriers, conflicts or inequitable workloads unresolved. Check who has authority, resources and a way to raise concerns.",
  },
  {
    id: "transformational",
    name: "Transformational leadership",
    description: "A leader works with others around a shared direction and encourages learning, motivation and change.",
    possibleUse: "Connect a service or workplace improvement to a clear purpose and invite people to shape how it happens.",
    watchFor: "Inspiring language is not evidence that the change is accessible or equitable. Ask who shaped the vision, who carries the work, and whether conditions actually changed.",
  },
  {
    id: "transformative",
    name: "Transformative leadership",
    description: "An equity-centered approach that examines power and challenges structures that sustain exclusion. It is related to, but not interchangeable with, transformational leadership.",
    possibleUse: "Examine a policy or routine with people affected, share decision-making, and change the rules or resources that create barriers.",
    watchFor: "Do not treat a statement of values as structural change. Identify authority, accountability, evidence and what people experiencing the process say has changed.",
  },
  {
    id: "charismatic",
    name: "Charismatic leadership",
    description: "A leader influences others through compelling communication, vision and personal presence.",
    possibleUse: "A clear and motivating message can help bring attention and energy to a shared concern.",
    watchFor: "Persuasion can make it harder to question a leader or check evidence. Make room for disagreement, shared authority and accessible ways to participate.",
  },
  {
    id: "democratic",
    name: "Democratic and participatory leadership",
    description: "A leader involves others in shaping decisions and shares authority in ways that fit the work.",
    possibleUse: "Explain what is open to change, include people affected early, and return to them with what happened to their input.",
    watchFor: "Inviting people to a meeting is not the same as sharing power. Budget time, interpreting and accessibility, compensate community expertise when appropriate, and be honest about limits.",
  },
];

type LeadershipLesson = {
  id: string;
  title: string;
  question: string;
  outcomes: readonly string[];
  reading: readonly string[];
  scenario: string;
  practice: readonly string[];
  check: string;
};

export const culturalLeadershipLessons: readonly LeadershipLesson[] = [
  {
    id: "leadership-authority",
    title: "1. Leadership approaches and authority",
    question: "How does the way a decision is made affect the people who live with it?",
    outcomes: [
      "Compare leadership approaches by what a leader does with information, authority and accountability.",
      "Explain the difference between a shared direction and changing structures that exclude people.",
      "Identify when a quick decision is necessary and what participation remains possible.",
    ],
    reading: [
      "Leadership approaches are useful lenses, not personality labels or scores. A leader might make an immediate safety decision, then use a participatory process to examine what happened and what must change. The important questions are who has authority, whose knowledge is considered, which options are open and how the leader answers for the result.",
      "A transformational approach often emphasizes shared purpose and change. Transformative leadership, as described in equity-centered scholarship, specifically examines unequal power and seeks to change structures that sustain exclusion. Neither a compelling vision nor a style label guarantees fairness. Examine the actual choices and effects.",
      "Servant leadership centers service and the well-being of others; it still requires clear responsibility and accountable decisions. Strongly directive approaches can clarify an urgent decision, but an ongoing pattern of control can silence staff. Unstructured withdrawal can leave people without support. Shared leadership requires real influence, not only an invitation to comment.",
    ],
    scenario: "A DSD team must revise a service notice under a short deadline. A supervisor, manager and director each need to clarify which decisions they can make. Immediate safety steps may be necessary, but the notice's format, language and delivery are still open. Some staff propose releasing it immediately; others say people who use the service should help shape it.",
    practice: [
      "List what truly must be decided now, who has that authority and what remains open. Identify any applicable policy or required process rather than inventing an exception.",
      "Compare two possible approaches: a supervisor decides alone, or sets the urgent boundary and shares the remaining design choices. Describe one likely benefit and one risk of each.",
      "Choose a next step that names whose input is needed, how it will affect the decision and when people will hear the result.",
    ],
    check: "How would you know whether people had meaningful influence, rather than being asked to affirm a decision already made?",
  },
  {
    id: "leadership-power-and-access",
    title: "2. Power, intersectionality and disability justice",
    question: "Whose experience is treated as the default, and who must adapt to it?",
    outcomes: [
      "Identify the difference between an individual's experience and a generalization about a group.",
      "Examine how race, gender, disability, language and other circumstances can intersect with institutional rules and power.",
      "Build access and leadership by people affected into the work, rather than adding them after decisions are made.",
    ],
    reading: [
      "A policy, meeting or service can look neutral to the people who designed it while depending on their own assumptions about language, time, mobility, communication, work schedules or family support. Ask who designed the default, who has to work around it and who can change it. Power includes control over an agenda, budget, deadline, access and the final decision.",
      "Intersectionality helps examine how systems affecting race, gender and other dimensions interact; it is not a way to add up a person's identities or predict their needs. Disability justice emphasizes the leadership of people most affected, collective access and the full lives and expertise of disabled people. Ask people what works for them, and do not ask one person to represent an entire community.",
      "Leaders, supervisors, managers and directors should follow applicable accessibility, accommodation, employment and Tribal-relations processes and clarify their respective responsibilities. This learning does not decide an individual request or replace the responsible office. Offer useful ways to participate without asking a person to disclose private medical or personnel information in a public discussion.",
    ],
    scenario: "For the notice, the team proposes one virtual meeting during the workday and an English-only written comment form. A Deaf colleague and community members who use interpreters or cannot attend at that time may encounter different barriers. The team has not yet asked what participation methods would work.",
    practice: [
      "Map the decisions: who sets the agenda, controls the budget, provides language and disability access, decides which feedback is used and communicates the outcome?",
      "List at least three ways the proposed process might create barriers, such as timing, communication format, interpreting, transportation or payment for community expertise. Do not assume any individual needs a particular support.",
      "Plan how to ask affected people which options work, provide alternatives and involve them while decisions can still change. Identify the office or person responsible for each action.",
    ],
    check: "What would change if people most affected could shape the agenda or decision instead of being asked only to react?",
  },
  {
    id: "leadership-speaking-up",
    title: "3. Speaking up, psychological safety and accountability",
    question: "Can people raise a concern, and what does the organization do when they do?",
    outcomes: [
      "Describe psychological safety as a team's experience of speaking up, not a guarantee of comfort or agreement.",
      "Respond to concerns without retaliation, promises of secrecy the leader cannot keep, or pressure to disclose private details.",
      "Separate supportive words from a documented process that people can use and trust.",
    ],
    reading: [
      "People may hesitate to ask a question, report a mistake or challenge a decision when they fear humiliation or consequences. Psychological safety concerns the shared belief that interpersonal risks such as speaking up are possible. Inviting feedback is a beginning; people also notice whether a leader listens, acts, shares credit and responds fairly afterward.",
      "Cultural safety, workplace psychological safety and organizational safety culture are related but different. A person's experience of respect and power, a team's ability to raise concerns, and the organization's systems for reporting and responding each need attention. Do not assume one survey or training session measures all three.",
      "Use existing reporting and accommodation channels when a concern involves a person's rights or safety. Explain what you can keep private, what you must route to an authorized office, and what will happen next. Avoid asking colleagues to make personal disclosures or to carry the work of educating others because of their identities.",
    ],
    scenario: "In a team meeting, a staff member says the notice may be inaccessible and that a previous concern was ignored. A supervisor is worried about the deadline; a manager and director oversee the work and its resources. Another colleague interrupts, saying the meeting is not the place to question the plan.",
    practice: [
      "Practice a response that thanks the person, stops interruption and names an immediate next step without promising confidentiality you cannot guarantee.",
      "Offer more than one accessible way to contribute, including a private route when appropriate. Clarify who will evaluate the concern and when the team will hear back.",
      "Record the process and decision without unnecessary personal details. Afterward, ask whether people could raise concerns and whether the process changed.",
    ],
    check: "What evidence would show that raising a concern changed the response—not just that the supervisor said the door was open?",
  },
  {
    id: "leadership-structural-change",
    title: "4. From stated commitments to organizational change",
    question: "What has to change in rules, resources and shared authority for the commitment to matter?",
    outcomes: [
      "Distinguish a public commitment from a change in policy, resources, decisions and accountability.",
      "Plan a small action with affected people and identify what can be learned from it.",
      "Use evidence carefully without rating individuals or treating a single measure as the whole outcome.",
    ],
    reading: [
      "Organizations can make statements about inclusion while their routines and decision rights remain unchanged. A continuum of anti-racist multicultural organizational development offers one lens for asking whether commitments are reflected in culture, policy and power. Treat any description of where an organization sits as a working perspective to examine with evidence and affected people, not an official diagnosis or a fixed score.",
      "Moving toward an anti-racist, multicultural organization involves more than individual awareness. Examine who influences policy and budgets, who receives opportunities, how accessibility and language supports are funded, and how the organization is accountable to communities it serves. Progress may differ across teams and decisions, and setbacks require attention rather than a declaration of completion.",
      "Look at both process and results. A team can document whether it offered accessible options, paid for needed support, changed a rule and returned to participants. People affected can explain whether those changes made participation or service access more workable. Protect small groups and private records; do not treat an assessment or demographic characteristic as a judgment about a person.",
    ],
    scenario: "The team says it values input and accessibility. Its notice is ready, but interpreters are not funded, comments close before the next community meeting, and no one has been assigned to report back. A supervisor and manager must identify what they can change and what to bring to a director or other responsible decision-maker.",
    practice: [
      "Name one change the team can make, one decision that requires higher authority, and one question that must be shaped with the people affected.",
      "Create a small action plan: responsible person or office, resources and access supports, decision date, how people can respond, and when you will report back.",
      "Choose one process indicator and one way to hear whether the change helped. Say what each measure cannot tell you and how you will protect privacy.",
    ],
    check: "If nothing changed after input was gathered, who would know, who could challenge it, and what would happen next?",
  },
];

