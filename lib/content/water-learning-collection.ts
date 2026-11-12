export {
  WATER_RESOURCE_COLLECTION_PATH as WATER_COLLECTION_HREF,
  WATER_RESOURCE_COLLECTION_TITLE as WATER_COLLECTION_TITLE,
} from "@/lib/learning/water-resource-collection";
export const WATER_COLLECTION_CASE = "North Crossing, a fictional public-service office, sends this appointment notice: “Your intake appointment is set for Tuesday at 10. Contact us if you need to change it.” You’ll revise the notice and the steps people take to get help or reschedule without losing their place.";

export const WATER_COLLECTION_OUTCOMES = [
  "Recognize cultural assumptions in everyday work.",
  "Communicate clearly across differences.",
  "Change everyday practices that unintentionally create barriers.",
];

type CollectionStep = {
  title: string;
  minutes: number;
  idea: string;
  caseUpdate: string;
  essay: string[];
  briefChapter: string;
  tools?: { href: string; label: string }[];
  activities: string[];
  output: string;
  check: string;
};

export const WATER_COLLECTION_STEPS: CollectionStep[] = [
  {
    title: "Notice what feels normal",
    minutes: 60,
    idea: "The essay invites us to notice familiar routines. The American and Minnesota briefs widen the view by showing variation within each place. The toolkit starts with a decision and the people it affects. Use that starting point to ask which parts of North Crossing’s service feel obvious because the team already knows how it works.",
    caseUpdate: "The North Crossing team knows which Tuesday the notice means, where intake happens, and how to reach scheduling. The message leaves those details open to the reader.",
    essay: ["why-look-at-our-own-culture", "who-minnesotans-are-majority-and-change", "values-under-the-surface"],
    briefChapter: "people-and-place",
    tools: [{ href: "/learn/equity-toolkit/curriculum/01", label: "Start with a decision and the people it affects" }],
    activities: [
      "Read the notice once as a person new to the office. Write the next action you think it asks you to take. Mark which words led you to that answer.",
      "Map four steps from receiving the notice to attending or rescheduling. For each, list a piece of knowledge or a resource the office assumes the reader already has.",
      "Find one passage in each culture brief that complicates a simple story about what people in a place share. Write how each passage changes one question you would ask about the notice.",
      "Choose one assumption from your map. Put the observation, your interpretation, and the evidence you would look for on separate lines.",
    ],
    output: "An assumption log with four steps, two reading connections, and one question you can test.",
    check: "Can someone else tell what you actually observed and what still needs checking?",
  },
  {
    title: "Make the next step clear",
    minutes: 65,
    idea: "Warmth can help people feel welcome. Clear instructions help them act. The essay’s discussion of indirect communication and the two briefs’ accounts of daily life help us ask which parts of a message depend on local habits, time, or relationships. Use the toolkit’s approach to comparing options to test how well each version explains the next step.",
    caseUpdate: "A colleague suggests adding “Please call if this is inconvenient.” Another wonders whether people will know that rescheduling is welcome and that asking for help can be part of the process.",
    essay: ["minnesota-nice-decoded", "other-threads-welcome-faith-gender-and-class"],
    briefChapter: "family-home-and-daily-life",
    tools: [{ href: "/learn/equity-toolkit/curriculum/05", label: "Compare options and tradeoffs" }],
    activities: [
      "Underline phrases that leave the action or timing open. Name the information a person needs to decide whether they can attend.",
      "Write a short notice with a full date, time, location, a way to confirm or reschedule, and a clear invitation to request language or access support. Use fictional contact details or role names.",
      "Read the new notice aloud. Mark any step that still requires someone to guess. Ask a colleague, or review it yourself as a fresh reader, using two prompts: What would you do next? Where would you get help?",
      "Revise one sentence based on that check. Write a second version of the next step for a different communication channel, such as a phone script.",
    ],
    output: "A revised appointment notice, a second-channel version, and two questions for checking understanding.",
    check: "Would a new reader know what they can choose, what to do next, and how to reach help?",
  },
  {
    title: "Understand the history behind trust",
    minutes: 65,
    idea: "The essay connects everyday Minnesota habits with histories of settlement, civic life and unequal treatment. The two briefs add wider civic context. This history raises questions about who can take part and influence a decision. The toolkit helps you ask for input early and check what the team learns from it.",
    caseUpdate: "The team has an open week to improve the notice. Its usual feedback method is an online survey sent after the wording is final. People who cannot use that survey have fewer chances to shape the change.",
    essay: ["roots-of-mainstream-minnesota-culture", "race-and-racism-in-minnesota-s-history-and-present", "political-culture"],
    briefChapter: "civic-and-political-life",
    tools: [{ href: "/learn/equity-toolkit/curriculum/04", label: "Learn from people and evidence" }],
    activities: [
      "Choose one historical or civic point from the essay and one from each brief. Write each with its source and one question it raises about who has a say in the North Crossing process.",
      "List two possible explanations for low response to the current survey. Describe one thing you could learn to distinguish between them.",
      "Draft a feedback invitation while wording and channels are open. Include a time for feedback, two ways to participate, a way to ask for support, and when the team will report what it learned.",
      "Name a perspective the team may still miss and how it could ask for that input respectfully. Leave a place to record the limits of the feedback.",
    ],
    output: "A short participation plan with an invitation, access choices, and a way to report back.",
    check: "Is there still a decision people can influence when you invite them to respond?",
  },
  {
    title: "Walk through the service from the other side",
    minutes: 70,
    idea: "The essay and both briefs give context for how disability access has changed and where barriers can persist. Use those readings to question a process. Individual preferences, chosen support and access needs belong in the conversation with the person using it.",
    caseUpdate: "The office accepts rescheduling by phone during business hours. Some people may need another channel, an accessible format, or time to involve a supporter of their choice. The team can examine what its current process makes easy or hard.",
    essay: ["how-it-looks-from-outside-the-majority", "disability-history-as-part-of-minnesota-culture"],
    briefChapter: "disability",
    tools: [{ href: "/practice/clas", label: "Plan cultural and language access" }],
    activities: [
      "Trace the current appointment path with three fictional access conditions: a person can receive a text but cannot call during the workday, a person needs an alternate format, and a person wants a trusted supporter to help read the notice.",
      "At each barrier, write what happened in your walkthrough, who had to do extra work, and what choice or support the process could offer. Check one reading connection against the source passage.",
      "Choose two changes within the team’s role to propose. Identify a point where an authorized person would need to confirm a requirement, arrange support or approve a process change.",
      "Draft a short handoff instruction for passing a request from one team to another. Let the person say what help works for them and explain how the receiving team will confirm it followed through.",
    ],
    output: "An access walkthrough and two proposed changes, including a supported handoff.",
    check: "Does your proposal give the person a choice and make clear which part of the process the office owns?",
  },
  {
    title: "Compare choices with the toolkit",
    minutes: 75,
    idea: "A notice can look clear while its underlying process still puts work on the reader. The essay locates culture inside institutions and services. The briefs add context about work and daily constraints. The toolkit helps turn the resulting questions into evidence, options and a decision someone can own.",
    caseUpdate: "In this fictional exercise, 24 notices were sent. After seven days, 16 people had confirmed, four had requested help without confirming, and four had no recorded response. The record shows status at one point in time. The team still needs to learn what people understood and why help remained open.",
    essay: ["culture-inside-institutions", "culture-inside-disability-services"],
    briefChapter: "work-and-the-economy",
    tools: [
      { href: "/learn/equity-toolkit#equity-analysis", label: "Choose the depth of equity analysis" },
      { href: "/practice/requirements", label: "Identify requirements and decision authority" },
    ],
    activities: [
      "Frame the decision in a sentence: which parts of the notice and rescheduling process can the team change, by when, and who can authorize the change?",
      "Record one fact, two plausible explanations and two gaps from the fictional count. Name a feasible way to learn about each gap.",
      "Compare keeping the current process, revising the wording alone, and pairing clearer wording with multiple contact channels and a supported handoff. For each, note who gains, who does more work, what it takes to operate, and what remains uncertain.",
      "Choose one option to recommend for a small trial. Write why it fits the evidence, where you would seek confirmation, and what new information could change your recommendation.",
    ],
    output: "A decision statement, an evidence-and-gap table, and a comparison of three options.",
    check: "Could someone who favors another option see how you reached your recommendation and what might change it?",
  },
  {
    title: "Turn what you learned into a practical change",
    minutes: 85,
    idea: "Reflection helps us notice our habits. Strengths such as care for neighbors and willingness to work together can support a better process when more people have a way to shape it. This final step brings the readings, practice notes and toolkit together into a recommendation that can be tested and revised.",
    caseUpdate: "The North Crossing team is ready to ask the service manager for a small trial. It needs a clear decision, an accessible way to gather feedback, a staff role to follow up on unresolved requests, and a date to review what happened.",
    essay: ["anti-racism-and-equity-work-and-the-debate-about-it", "frameworks-for-reflection", "strengths-to-build-on", "questions-for-reflection"],
    briefChapter: "strengths-and-contributions",
    tools: [
      { href: "/learn/equity-toolkit/practice#worked-example", label: "Walk through the toolkit’s worked example" },
      { href: "/learn/equity-toolkit/practice#toolkit-draft", label: "Prepare your analysis in the toolkit" },
      { href: "/practice/measurement", label: "Plan how to learn from the trial" },
    ],
    activities: [
      "Review the toolkit example and pull together your five earlier outputs. Write a one-page decision brief with the goal, who is affected, what the evidence supports, and which gaps matter.",
      "Include the revised notice and handoff you recommend. Identify who approves the trial, who will help people use the new process, and how people can offer feedback before and during the trial.",
      "Choose two ways to learn from the change. For example, track how many people can explain the next step and how many help requests remain unresolved. Record the time period and the total you are comparing each count with, such as the total number of people who answered the check.",
      "Set a review date and describe what would lead you to keep, revise or stop the trial. Write how you will tell participants what changed and name one practice you can bring to a different routine at work.",
    ],
    output: "A one-page equity decision brief and a short plan for the first trial, review and report-back.",
    check: "Is the next decision clear, and can the people affected see how their feedback will shape what happens?",
  },
];

export const WATER_COLLECTION_PROMPTS = {
  explain: "What do the Water essay and culture briefs help me notice about the assumptions in a short appointment notice? Cite the readings.",
  compare: "Compare what the American and Minnesota Culture briefs say about disability access, then connect one difference to the Equity Analysis Toolkit.",
  practice: "Give me a fictional appointment notice with one unclear next step. Use the Water essay and Equity Analysis Toolkit to help me practice revising it.",
  reflect: "Use the Water essay and the Equity Analysis Toolkit to help me separate evidence, interpretation and open questions when people do not respond to a notice.",
};
