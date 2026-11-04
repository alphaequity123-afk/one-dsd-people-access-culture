import type { StyleLesson } from "./leadership-styles-pathway-types";

/**
 * Sixteen leadership-style lessons. Every scenario is fictional and every line of
 * dialogue is original teaching material. The equity judgments are qualitative
 * curriculum judgments, not validated probabilities or predictions about a person.
 */
export const LEADERSHIP_STYLE_LESSONS: readonly StyleLesson[] = [
  {
    slug: "authoritarian",
    name: "Authoritarian leadership",
    tagline: "Compliance over challenge",
    group: "higher-risk",
    legacyVideo: "authoritarian",
    definition: [
      "In this pathway, authoritarian leadership means a leader keeps authority by demanding obedience, limiting challenge and attaching consequences to disagreement. It overlaps with autocratic decision-making. The defining feature here is how the leader treats disagreement.",
      "A leader can be firm, set clear rules and make final decisions without being authoritarian. The line is crossed when questions are treated as disloyalty and people learn that speaking up costs them something.",
    ],
    isNot: [
      "It is not the same as making a quick decision in an emergency.",
      "It is not the same as holding people to a clear, fair standard.",
      "It is not a personality type. Anyone can slip into this pattern under pressure, and anyone can change it.",
    ],
    stronger: {
      quote: "“The concern needs an appropriate response. There should be no adverse treatment for raising it. I will follow the relevant process and review how assignments are allocated.”",
      why: "This keeps the useful part of the pattern, which is clarity, and drops the intimidation. The leader must then act in line with the statement. Words alone do not change what people have learned about the cost of speaking up.",
    },
    harmful: {
      quote: "“I decide who represents this team. Stop making accusations and focus on your work.”",
      why: "The conflict may disappear from meetings, but the problem remains. Employees learn that raising an equity concern can threaten their standing. The leader might also ban interruptions, but if the employee still cannot question assignment decisions, the response protects order rather than fair influence.",
    },
    conflict: {
      title: "Two caseworkers argue about a new case",
      situation: "Two caseworkers argue in front of the team about who should take a complex new case. One says the other always gets the easier ones. The leader is under deadline pressure.",
      tendency: "The leader ends the argument by ruling: “Enough. I'll assign it. No more discussion.” The argument stops. The question of how cases are assigned is never answered, and both people learn not to raise workload concerns again.",
      stronger: "The leader sets a clear boundary on how the disagreement happens, then makes the decision rule visible: “We won't settle this by arguing in front of the team. I'll assign this case today using our caseload criteria. This week I'll share those criteria with everyone, and you can question them.”",
    },
    promotes: [
      "Clear rules can stop harmful conduct quickly, such as repeated interruptions or demeaning comments.",
      "A firm leader can refuse to let a powerful person bend a rule for their own benefit.",
    ],
    undermines: [
      "Voice becomes conditional on pleasing the person in charge.",
      "Employees with less institutional protection carry greater risk when they speak.",
      "The leader's own idea of “professionalism” becomes impossible to question.",
      "Silenced complaints can be mistaken for a better team climate.",
    ],
    race: "When challenge is punished, the people most exposed are often those already carrying more risk: employees of color, newer or temporary staff, disabled staff, and people whose communication style differs from the leader's. A concern about race becomes one more thing that is unsafe to say. Research from the Center for Creative Leadership on why managers derail describes authoritarian managers as ruling through fear and centralizing decisions. Obedience is not a sound sign of effective leadership.",
    swot: {
      strengths: ["Clear authority and immediate direction.", "Fast decisions when time is short."],
      weaknesses: ["Information gets filtered because challenge feels unsafe.", "Decisions rest on one person's view."],
      opportunities: ["Replace obedience-based control with bounded direction and decisions that can be reviewed.", "Keep clarity while inviting challenge."],
      threats: ["Retaliation and concealed problems.", "Dependence on one person's judgment.", "Equity concerns that never surface until they become formal complaints."],
    },
    helpsWhen: [
      "Its one useful element, clear direction, helps in a true emergency, when the direction is short, explained and reviewed afterward.",
      "Harmful conduct must stop right now, and authority is used to stop the conduct, not to stop questions.",
    ],
    avoidWhen: [
      "Someone raises an equity, access or discrimination concern.",
      "The leader's own decisions are the subject of the concern.",
      "The problem is complex and needs information from many people.",
      "As a standing way to run a team.",
    ],
    complements: [
      { slug: "ethical", why: "Puts principled limits on how authority is used." },
      { slug: "procedural", why: "Makes decisions reviewable instead of personal." },
      { slug: "participative", why: "Restores voice once the immediate issue is handled." },
    ],
    safeguards: [
      "Say plainly that no one will be treated worse for raising a concern, and then make sure that is true.",
      "Explain decisions and how people can question them.",
      "Send formal concerns to the person or area responsible, not through your own personal judgment.",
      "Ask a trusted colleague to tell you when people have stopped raising problems.",
    ],
    assessment: { label: "Low compatibility as a sustained approach", text: "Firm standards are valuable. Suppressing disagreement is not necessary to enforce them." },
    practice: {
      situation: "You notice that no one on your team has raised a concern in three months. In the last meeting where someone did, you cut them off to stay on the agenda.",
      steps: [
        "Write down what someone might reasonably fear would happen if they raised a concern with you.",
        "Draft two sentences for your next meeting that invite challenge and promise no adverse treatment.",
        "Name one decision you made alone that you could explain and open to questions.",
        "Plan how you will check, in a month, whether people are raising concerns again.",
      ],
    },
    review: [
      "What is the difference between a firm standard and a ban on disagreement?",
      "In the common scenario, what would show the employee that raising a concern is safe: words, or actions? Which actions?",
      "Which part of this pattern, if any, is worth keeping?",
    ],
  },
  {
    slug: "directive",
    name: "Autocratic or directive leadership",
    tagline: "Centralized decisions",
    group: "support",
    definition: [
      "The leader keeps decision authority. Unlike the authoritarian pattern, the leader may still consult people and allow respectful disagreement.",
      "The key question is what the authority is used for. A directive leader can use authority to investigate and correct a problem, or to close off inquiry. Those are very different leaders, even though both make the decision themselves.",
    ],
    isNot: [
      "It is not the same as refusing to listen.",
      "It is not permission to skip a required process because a decision feels urgent.",
      "It is not a reason to keep temporary authority forever.",
    ],
    stronger: {
      quote: "“I will address the interruption and start the appropriate review. Before the next assignment decision, we will use explicit job-related criteria.”",
      why: "The leader acts quickly and takes responsibility. The authority is used to open a review, not to end one.",
    },
    harmful: {
      quote: "“I know the assignments have been fair. We're moving on.”",
      why: "The leader uses authority to close the question without looking at any evidence. The difference between the two responses is whether authority is used to investigate and correct, or to shut down inquiry.",
    },
    conflict: {
      title: "A notice deadline and a translation gap",
      situation: "A program team cannot agree whether to delay a notice to providers so it can be translated. The deadline is in two days. Half the team says the deadline matters most. The other half says the families who most need the notice will not be able to read it.",
      tendency: "A directive leader breaks the deadlock by deciding. The risk is deciding from the leader's own habits, for example releasing in English only because that is how it has always been done.",
      stronger: "“I'm making the call. The notice goes out on time with a short message, in the languages we most often receive requests for, that says how to get help. Full translations follow within ten business days. I own this decision. In a month we will check whether anyone missed something because of it, and we will change our timeline for the next notice.”",
    },
    promotes: [
      "Directive authority can remove a clear barrier promptly, for example by funding interpreting or stopping a harmful practice.",
      "It makes responsibility visible: people know who decided and whom to ask.",
    ],
    undermines: [
      "When evidence and review are missing, one person's assumptions shape everyone's opportunities.",
      "People affected by the decision may never be asked.",
      "A pattern of quick decisions can turn into a pattern of exclusion.",
    ],
    race: "Perceptions of authority are not race-neutral. The same firm decision may be called “decisive” from one leader and “aggressive” or “difficult” from another. Do not assume the same behavior gets the same reading from every evaluator. When directive authority is used well, it can open a review of opportunity rather than protect a pattern no one has examined.",
    swot: {
      strengths: ["Speed.", "Clear, identifiable responsibility."],
      weaknesses: ["Limited perspectives.", "Reliance on the leader's judgment."],
      opportunities: ["Authorize resources quickly.", "Stop an established harmful practice."],
      threats: ["Temporary centralized authority becomes permanent exclusion.", "The leader's blind spots become the team's policy."],
    },
    helpsWhen: [
      "Something harmful must stop now.",
      "A decision is overdue and the delay itself is causing harm.",
      "Resources need to be authorized by someone with the authority to authorize them.",
    ],
    avoidWhen: [
      "The problem's causes are unclear and need inquiry.",
      "Long-term policy is being designed for people who have not been heard.",
      "The decision falls outside the leader's actual authority.",
    ],
    complements: [
      { slug: "participative", why: "Brings in the people affected once the urgent step is taken." },
      { slug: "transformative", why: "Diagnoses whether the pattern behind the problem is structural." },
      { slug: "procedural", why: "Keeps the decision reviewable." },
    ],
    safeguards: [
      "Explain the decision and its boundaries.",
      "Seek relevant information before deciding when you can.",
      "Keep a way for people to challenge and review the decision.",
      "Revisit the effects of the decision.",
      "Separate urgent action from long-term policy design.",
    ],
    assessment: { label: "Conditional", text: "Valuable for immediate action. Not enough by itself to diagnose complex inequities." },
    practice: {
      situation: "Your team's shared calendar shows that only staff who work standard daytime hours have been offered training slots this quarter. You have the authority to change the schedule.",
      steps: [
        "Write the decision you can make today, in one or two sentences.",
        "List what you do not yet know and who could tell you.",
        "Say how you will explain the decision and how people can question it.",
        "Set a date to check the effect and name what you will look at.",
      ],
    },
    review: [
      "What separates using authority to investigate from using it to close a question?",
      "Which of the five safeguards is easiest for you to skip under pressure?",
      "When should a directive decision be handed back to a broader process?",
    ],
  },
  {
    slug: "participative",
    name: "Democratic or participative leadership",
    tagline: "Meaningful input",
    group: "contributor",
    legacyVideo: "democratic",
    definition: [
      "People affected by a decision help shape it. Participation does not have to mean everyone agrees or the majority votes. It means people's input can change the result.",
      "Good participation is honest about limits: what people can influence, what is fixed, who decides, and how input will be used.",
    ],
    isNot: [
      "It is not a vote on someone's rights or needs.",
      "It is not collecting input after the decision is made.",
      "It is not the same as holding one meeting that some people cannot attend.",
    ],
    stronger: {
      quote: "“I will handle the reported concern through the appropriate process. Separately, the team can help clarify assignment requirements and identify barriers to getting opportunities.”",
      why: "The leader keeps the concern in the right process and uses participation for what it is good at: shared design. The leader also offers individual ways to give input, not just a public discussion.",
    },
    harmful: {
      quote: "“Let's vote on whether assignments have been fair.”",
      why: "This makes a person's concern depend on their colleagues' approval. The people who benefited from the current pattern get a vote on whether it was fair.",
    },
    conflict: {
      title: "Moving the team meeting",
      situation: "Staff disagree about moving the weekly team meeting from in person to hybrid. Some staff with long commutes or caregiving duties want a hybrid option. Others say the meeting works better in one room.",
      tendency: "A participative leader brings the team into the decision. The risk is a simple majority vote, where the people facing access barriers are outvoted.",
      stronger: "The leader sets the boundary first: “Everyone on this team must be able to take part fully. That part is not up for a vote. Within that, help me design the format.” The leader offers a private way to give input, decides, and then reports back on how the input shaped the result.",
    },
    promotes: [
      "Participation can surface information that leaders lack.",
      "People are more likely to trust and carry out a decision they helped shape.",
      "It can move influence toward the people closest to the problem.",
    ],
    undermines: [
      "Majority preferences can end up defining fairness.",
      "More confident speakers can dominate.",
      "Employees may feel they must disclose painful experiences in public.",
      "The person raising a concern can become responsible for persuading everyone else.",
    ],
    race: "Attendance does not equal influence. In many workplaces, people of color are a smaller share of any group, so a majority process can repeat the pattern being questioned. Offer ways to contribute that do not require public disclosure, and track whose input actually changes decisions.",
    swot: {
      strengths: ["Broader knowledge.", "Stronger ownership of the result."],
      weaknesses: ["Slower decisions.", "Unequal participation."],
      opportunities: ["Co-design transparent criteria.", "Build accessible ways to take part."],
      threats: ["Performative consultation.", "Majority domination."],
    },
    helpsWhen: [
      "The people affected know things the leader does not.",
      "The decision will only work if people carry it out willingly.",
      "There is real room to change the result.",
    ],
    avoidWhen: [
      "The question is someone's right, accommodation or formal complaint.",
      "The decision is already made. Say so instead.",
      "Participation would require people to disclose private experiences in public.",
    ],
    complements: [
      { slug: "procedural", why: "Keeps formal concerns in the right channel." },
      { slug: "inclusive", why: "Makes participation accessible and safe." },
      { slug: "transactional", why: "Turns the agreed design into owners and deadlines." },
    ],
    safeguards: [
      "State what participants can influence.",
      "State what is not negotiable.",
      "State who decides.",
      "Explain how input will change the result.",
      "Offer accessible alternatives to speaking in a group.",
    ],
    assessment: { label: "High potential when participation is accessible and consequential", text: "Much weaker when leaders collect input without sharing influence." },
    practice: {
      situation: "Your unit is updating its process for approving training requests. You plan a listening session.",
      steps: [
        "Write the five safeguard statements for this decision: what can change, what cannot, who decides, how input is used, and other ways to take part.",
        "Name two groups whose input you are least likely to hear in a single meeting, and how you will reach them.",
        "Decide how and when you will report back what changed.",
      ],
    },
    review: [
      "Why is a vote the wrong tool for an equity concern?",
      "What is the difference between attendance and influence?",
      "How would participants know their input mattered?",
    ],
  },
  {
    slug: "servant",
    name: "Servant leadership",
    tagline: "Support and growth",
    group: "contributor",
    legacyVideo: "servant",
    definition: [
      "The leader puts the growth, well-being and independence of the people they serve first.",
      "Robert Greenleaf's description of servant leadership asks whether the people served become freer and more independent, and whether the least privileged benefit or are further deprived. That second question makes servant leadership an equity question, not only a kindness question.",
    ],
    isNot: [
      "It is not avoiding conflict to keep people comfortable.",
      "It is not deciding for people what they need.",
      "It is not giving up the leader's responsibility to act.",
    ],
    stronger: {
      quote: "“I want to understand what has limited your access to these assignments. You should not have to solve the allocation problem yourself. I will review the process and discuss what support would be useful.”",
      why: "The leader combines individual support with institutional responsibility. The employee is supported, and the process is examined.",
    },
    harmful: {
      quote: "“I'm sorry you feel excluded. How can I help you become more confident?”",
      why: "This assumes the employee's confidence caused the problem before anyone has reviewed the process. The opportunities themselves may have been unevenly distributed.",
    },
    conflict: {
      title: "The informal interpreter",
      situation: "A newer staff member who speaks Karen is asked, informally, to interpret on every call with Karen-speaking families. A longer-serving colleague says it is “just helping out.” The newer staff member is falling behind on their own work and says so quietly.",
      tendency: "A servant leader listens closely and wants to support both people. The risk is smoothing things over to keep harmony, for example by thanking the newer staff member and asking them to keep helping.",
      stronger: "The leader treats the extra work as real work. They stop routing interpreting to staff unless it is a recognized part of the job, arrange professional interpreting through the usual process, recognize the work already done, and adjust the newer staff member's workload. Then they ask both colleagues what support they need.",
    },
    promotes: [
      "Better support, mentoring and access to resources.",
      "Attention to people the organization tends to overlook.",
      "Trust that makes it easier to raise problems.",
    ],
    undermines: [
      "“Helping” can become paternalistic, with the leader defining what someone needs.",
      "Harmony can take priority over confronting exclusion.",
      "Kindness can stand in for changes to authority and resources.",
    ],
    race: "Do not assume an employee needs development because they have received fewer opportunities. When a Black employee or another employee of color is offered “confidence” support in response to an allocation concern, the message is that the problem lives in them. The strongest servant leadership shares power and confronts inequity. The weakest offers sympathy without changing conditions.",
    swot: {
      strengths: ["Listening, support and trust.", "Development of people."],
      weaknesses: ["Conflict avoidance.", "Paternalistic definitions of need."],
      opportunities: ["Remove practical barriers.", "Broaden people's independence."],
      threats: ["Kindness substitutes for changes to authority and resources."],
    },
    helpsWhen: [
      "People need practical support to take part fully.",
      "Trust has been damaged and needs rebuilding.",
      "Development opportunities have been uneven and need to be widened.",
    ],
    avoidWhen: [
      "Harmful conduct needs a firm, timely response.",
      "Support would replace a review of the process.",
      "The leader would be deciding what someone needs without asking them.",
    ],
    complements: [
      { slug: "transformative", why: "Asks why the barrier exists, not only how to help someone around it." },
      { slug: "ethical", why: "Adds the firmness to confront harm." },
      { slug: "coaching", why: "Turns support into skill-building the person asked for." },
    ],
    safeguards: [
      "Ask what support would help instead of assuming.",
      "Pair individual support with a review of the process.",
      "Name harmful conduct even when it is uncomfortable.",
      "Check whether your support is reaching the least privileged people on your team.",
    ],
    assessment: { label: "Moderate to high potential", text: "Its strongest version shares power and confronts inequity. Its weakest offers sympathy without changing conditions." },
    practice: {
      situation: "A staff member tells you they never seem to hear about stretch projects until someone else has already been chosen.",
      steps: [
        "Write a first response that offers support without assuming a skill gap.",
        "List how stretch projects are currently announced and chosen.",
        "Name one change to the process and one form of support you could offer if the person wants it.",
      ],
    },
    review: [
      "Greenleaf asks whether the least privileged benefit. How would you check that on your team?",
      "When does support become paternalism?",
      "What would make servant leadership confront a problem instead of soothing it?",
    ],
  },
  {
    slug: "charismatic",
    name: "Charismatic leadership",
    tagline: "Mobilizing through personal influence",
    group: "higher-risk",
    legacyVideo: "charismatic",
    definition: [
      "The leader builds commitment through personal presence, storytelling, confidence and emotional connection.",
      "Charisma can bring energy and attention to a neglected issue. The risk is that the work depends on the person rather than on clear criteria and shared ownership.",
    ],
    isNot: [
      "It is not one kind of personality or one way of speaking.",
      "It is not proof that a leader's decisions are fair.",
      "It is not a substitute for evidence.",
    ],
    stronger: {
      quote: "“Our commitments mean little if opportunity depends on an informal impression of who looks ready. We will make the criteria visible and review the process.”",
      why: "The leader uses personal influence to generate attention and support for a fair process, not for themselves.",
    },
    harmful: {
      quote: "“You know how committed I am to inclusion. Trust me.”",
      why: "The issue becomes the leader's reputation instead of the employee's experience. Trust is asked for in place of a review.",
    },
    conflict: {
      title: "A question in the chat",
      situation: "A popular division leader announces a new community partnership at an all-staff meeting. A staff member asks in the chat whether community members were consulted. The room goes quiet.",
      tendency: "The leader answers with a moving story about why the partnership matters. The question is treated as negativity. Others who had the same question decide not to ask.",
      stronger: "“That's a fair question, and thank you for asking it here. The honest answer is that we talked with two organizations but not with families directly. We will share what consultation happened and add a way for families to shape the next phase. If you have other questions, here is how to send them, with or without your name.”",
    },
    promotes: [
      "Charisma can mobilize resources and attention for neglected priorities.",
      "A compelling message can help people see why equity work matters.",
    ],
    undermines: [
      "Charisma can reward familiarity, dominant communication norms or loyalty.",
      "Criticism can be treated as disloyalty.",
      "Progress can disappear when the leader leaves.",
    ],
    race: "Challenge the assumption that charisma has one appearance. Quiet, reflective, accented or less performative leadership should not be treated as less credible. When “presence” or “polish” decides who leads, people who share the leader's background and style tend to be chosen, and the pattern repeats.",
    swot: {
      strengths: ["Energy and visibility."],
      weaknesses: ["Dependence on one person.", "Openness to flattery."],
      opportunities: ["Sponsor neglected priorities."],
      threats: ["Criticism becomes disloyalty.", "Progress disappears with the leader."],
    },
    helpsWhen: [
      "An important issue needs attention and resources quickly.",
      "People need a clear, motivating explanation of why a change matters.",
    ],
    avoidWhen: [
      "Decisions about people's opportunities are being made.",
      "Someone questions the leader's own decisions.",
      "The work needs to last beyond one person.",
    ],
    complements: [
      { slug: "procedural", why: "Transparent criteria replace impressions." },
      { slug: "shared", why: "Distributed ownership keeps progress alive after the leader leaves." },
      { slug: "ethical", why: "Independent feedback and accountability check personal influence." },
    ],
    safeguards: [
      "Use transparent criteria for decisions about people.",
      "Get independent feedback, including anonymous options.",
      "Distribute ownership of the work.",
      "Plan for succession so progress does not depend on you.",
    ],
    assessment: { label: "Variable and fragile", text: "Useful for mobilization. Unreliable as the foundation for fair decisions." },
    practice: {
      situation: "You are known as an inspiring speaker. You realize that most of the people you have sponsored for leadership roles remind you of yourself at their stage.",
      steps: [
        "List the qualities you have used, formally or informally, to judge who is “ready.”",
        "For each one, ask whether it is job-related or a matter of style.",
        "Name one opportunity you will open through a visible process instead of a personal invitation.",
      ],
    },
    review: [
      "What is the difference between using influence for a fair process and asking people to trust you?",
      "How would you know whether people feel safe questioning you?",
      "What would keep your priorities alive if you left tomorrow?",
    ],
  },
  {
    slug: "transformational",
    name: "Transformational leadership",
    tagline: "Shared purpose and change",
    group: "conditional",
    legacyVideo: "transformational",
    definition: [
      "The leader motivates people around a vision, challenges existing practice and supports people's development.",
      "Transformational leadership can make major redesign possible. But transformation is not equitable by itself. The direction of the change, and who carries its costs, matter.",
    ],
    isNot: [
      "It is not the same as transformative leadership, which centers power and structural inequity.",
      "It is not a demand for unity that silences disagreement.",
      "It is not a promise without a plan.",
    ],
    stronger: {
      quote: "“This concern exposes a gap between our stated values and how we distribute opportunities. We need to change the process, not simply reassure people.”",
      why: "The leader then sets up a change effort with an owner, resources and follow-up. The vision is tied to a concrete change in how opportunity is distributed.",
    },
    harmful: {
      quote: "“We all need to unite behind our vision and stop focusing on differences.”",
      why: "Unity becomes a demand to suppress disagreement. The employee's concern is recast as a threat to the team's purpose.",
    },
    conflict: {
      title: "A thirty-day goal",
      situation: "A unit adopts a new vision: every family gets a decision within 30 days. Staff who serve families who need interpreters say the timeline will push those families to the back of the line.",
      tendency: "The leader rallies the team behind the goal and treats the concern as resistance to change.",
      stronger: "The leader builds the equity outcome into the vision itself: “Thirty days for every family, including families who need an interpreter.” The unit tracks the timeline separately for families who need language or disability access, funds the interpreting needed to meet it, and asks the staff who raised the concern to help shape the rollout.",
    },
    promotes: [
      "A shared purpose can carry a team through hard change.",
      "Leaders who challenge existing practice can open old habits to review.",
      "Investment in people's development can widen who is ready to lead.",
    ],
    undermines: [
      "Overpromising, with too little attention to who carries the work of change.",
      "Vision-driven pressure can suppress inconvenient evidence.",
      "Change can improve performance for most people while leaving some further behind.",
    ],
    race: "Ask who helped define the vision, who bears the burdens of carrying it out, who is allowed to challenge its assumptions, and whether the change improves opportunity or only organizational performance. A vision built without the people most affected can move faster for some groups and slower for others, including people of color and families who need language access.",
    swot: {
      strengths: ["Purpose and motivation.", "Openness to innovation."],
      weaknesses: ["Overpromising.", "Too little attention to implementation burdens."],
      opportunities: ["Redesign how opportunity is allocated.", "Raise leadership expectations."],
      threats: ["Vision-driven pressure suppresses inconvenient evidence."],
    },
    helpsWhen: [
      "A team needs to commit to a significant change.",
      "Old practices need to be challenged openly.",
      "The vision includes explicit equity outcomes.",
    ],
    avoidWhen: [
      "A concern is being dismissed as resistance.",
      "The vision has not been tested with the people most affected.",
      "There are no resources to deliver what is promised.",
    ],
    complements: [
      { slug: "transformative", why: "Sets the direction of change toward fairer structures." },
      { slug: "transactional", why: "Turns the vision into owners, deadlines and follow-through." },
      { slug: "participative", why: "Lets affected people shape the vision." },
    ],
    safeguards: [
      "Write equity outcomes into the vision, with measures.",
      "Name who carries the work of change and give them time and resources.",
      "Treat concerns as information, not resistance.",
      "Report results honestly, including for groups the change may leave behind.",
    ],
    assessment: { label: "Moderate to high potential with explicit equity outcomes", text: "Inspiration alone is not enough." },
    practice: {
      situation: "You are drafting a one-sentence vision for your unit's next year.",
      steps: [
        "Write the vision.",
        "Ask: who would find this vision easiest to reach, and who hardest? Rewrite it so the hardest-to-reach group is named in the outcome.",
        "Name the resources, owner and measure that would make the rewritten vision real.",
      ],
    },
    review: [
      "What is the difference between transformational and transformative leadership?",
      "Who helped define the vision in your work?",
      "How can a leader tell the difference between resistance and a real problem?",
    ],
  },
  {
    slug: "transformative",
    name: "Transformative or equity-centered leadership",
    tagline: "Changing structures",
    group: "foundation",
    legacyVideo: "transformative",
    definition: [
      "In this pathway, transformative leadership explicitly examines power, inequitable assumptions, institutional arrangements and the distribution of benefits and burdens.",
      "It does not presume the answer. It investigates criteria, history, authority and effects, and then changes the rules and resources that create barriers.",
    ],
    isNot: [
      "It is not the same as transformational leadership.",
      "It is not treating a structural explanation as already proven.",
      "It is not strong language without workable change.",
    ],
    stronger: {
      quote: "“We need to examine how ‘polished’ became a selection criterion, who has benefited from that definition, and whether access to preparation and sponsorship has been equitable.”",
      why: "The leader turns the conflict into an inquiry into structure. Possible actions include replacing vague judgments with job-related criteria, making opportunities visible, providing equitable preparation and support, clarifying who decides and how decisions are reviewed, and handling the reported conduct through the appropriate channels.",
    },
    harmful: {
      quote: "“This is obviously systemic racism, and anyone who questions that is part of the problem.”",
      why: "It may name a real concern, but it treats a finding as proven before inquiry, shuts out people who could help, and offers no workable change. The failure mode of this approach is substituting strong rhetoric for careful inquiry and follow-through.",
    },
    conflict: {
      title: "Incomplete documentation",
      situation: "A data review shows that Black and American Indian applicants to a support program are denied more often for “incomplete documentation.” Two managers argue. One says staff just follow the rules. The other says the rule is biased.",
      tendency: "A transformative leader treats the rule itself as a legitimate subject of review, instead of choosing between “the rule is fine” and “the rule is racist.”",
      stronger: "The leader asks: Where did this documentation rule come from? Which documents are hardest to get, and for whom? What help do applicants get, and when? Who can change the rule? The leader involves applicants and community partners, and follows the Tribal consultation and coordination processes that apply to work affecting American Indian applicants. Then the team tests a change, such as accepting more kinds of documents or giving help earlier, and checks the results.",
    },
    promotes: [
      "Makes racism and institutional power legitimate subjects of analysis, not optional side topics.",
      "Targets durable rules and resource decisions, not only individual behavior.",
      "Connects concerns from individuals to patterns across the organization.",
    ],
    undermines: [
      "Can provoke backlash if it moves faster than the evidence.",
      "Can stall when there is no authority or budget to change anything.",
      "Can become rhetoric without operational follow-through.",
    ],
    race: "This approach names race and institutional power directly. That is its strength. It also needs discipline: findings require careful inquiry, and actions need authority and resources. Alignment with equity goals is not evidence of effectiveness.",
    swot: {
      strengths: ["Directly addresses systems and power."],
      weaknesses: ["Demands analysis, coalition-building and implementation work."],
      opportunities: ["Change durable rules and resource allocation."],
      threats: ["Backlash.", "Unsupported claims.", "Weak operational follow-through."],
    },
    helpsWhen: [
      "A pattern of unequal results keeps returning.",
      "A “neutral” rule may be producing unequal burdens.",
      "Individual fixes have not changed outcomes.",
    ],
    avoidWhen: [
      "It would replace an urgent, immediate response to harm. Do both.",
      "The conclusion is being announced before the inquiry.",
    ],
    complements: [
      { slug: "procedural", why: "Embeds changes so they outlast turnover." },
      { slug: "participative", why: "Brings affected people into the diagnosis and redesign." },
      { slug: "transactional", why: "Assigns owners, resources and deadlines to the changes." },
    ],
    safeguards: [
      "Investigate before concluding.",
      "Pair analysis with someone who has authority to change the rule.",
      "Involve the people affected in the diagnosis.",
      "Plan the operational steps and resources, not only the message.",
    ],
    assessment: { label: "High alignment with equity goals", text: "But alignment is not evidence of effectiveness. Findings still need careful inquiry, and actions need authority and resources." },
    practice: {
      situation: "Your unit uses the phrase “strong communicator” when choosing who represents the team to partners.",
      steps: [
        "Write down what the phrase means in practice. What behaviors count?",
        "Ask who has historically been described this way and who has not.",
        "Draft a job-related criterion to replace it, and a way for everyone to prepare to meet it.",
        "Name who has authority to adopt the change.",
      ],
    },
    review: [
      "What does it mean to investigate a structure without presuming the answer?",
      "Why is “the rule is fine” versus “the rule is racist” a false choice?",
      "What turns analysis into durable change?",
    ],
  },
  {
    slug: "laissez-faire",
    name: "Laissez-faire leadership",
    tagline: "Absence of necessary action",
    group: "higher-risk",
    legacyVideo: "laissez-faire",
    definition: [
      "In this pathway, passive laissez-faire leadership means avoiding decisions, feedback or intervention when they are needed. It is not simply allowing people independence.",
      "Research has associated this passive pattern with workplace stress, bullying and psychological distress. These are associations, not proof that every low-intervention leader causes harm.",
    ],
    isNot: [
      "It is not intentional delegation with agreed support and accountability. That is empowering leadership.",
      "It is not trust in an experienced team that has what it needs.",
    ],
    stronger: {
      quote: "“You raised this with me, and it is mine to act on. I will look at how assignments have been made and get back to you by Friday with what I found and what happens next.”",
      why: "The correction is simple: take responsibility, set a date and follow up. Low interference is fine for routine work. It is not fine when someone reports a barrier.",
    },
    harmful: {
      quote: "“You're all professionals. Work it out.”",
      why: "The leader leaves the employee to negotiate with colleagues while keeping control over assignments. A related version is “My door is always open,” followed by no review, no boundary and no follow-up.",
    },
    conflict: {
      title: "Two colleagues stop speaking",
      situation: "Two staff stop speaking to each other after a disagreement over shared work. Others start working around them. Deadlines slip.",
      tendency: "The leader hopes it will resolve on its own. Over time, informal alliances decide who gets information and help.",
      stronger: "The leader names the effect on the work, meets with each person, sets clear expectations for how they will work together, and checks in on a set date. If either person describes conduct that may need a formal response, the leader routes it to the person or area responsible.",
    },
    promotes: [
      "In a team that already works well, low interference can leave room for initiative.",
    ],
    undermines: [
      "Unresolved conflict and unclear responsibility.",
      "Informal hierarchy decides who gets access and protection.",
      "Concerns go unanswered.",
    ],
    race: "When formal authority withdraws, informal networks control access. Those networks often follow existing lines of race, language, tenure and social comfort. Employees with less influence may carry more of the burden of getting information, recognition or protection. Silence does not leave a situation neutral. It leaves existing arrangements in place.",
    swot: {
      strengths: ["Low interference can leave room for initiative in teams that already work well."],
      weaknesses: ["Unresolved conflict.", "Unclear responsibility."],
      opportunities: ["Turn low micromanagement into supported delegation."],
      threats: ["Informal hierarchy.", "Exclusion.", "Unanswered concerns."],
    },
    helpsWhen: [
      "Its useful element, room for initiative, helps experienced people do routine work within clear responsibilities and resources.",
    ],
    avoidWhen: [
      "Someone reports a barrier, conflict or concern.",
      "Responsibility is unclear.",
      "Some people have much less informal access than others.",
    ],
    complements: [
      { slug: "empowering", why: "Turns hands-off into supported independence." },
      { slug: "directive", why: "Provides the decision that is missing." },
      { slug: "transactional", why: "Adds follow-up dates and clear expectations." },
    ],
    safeguards: [
      "Set a response date whenever someone raises a concern.",
      "Make responsibilities explicit.",
      "Check who is getting information and who is not.",
      "Do not mistake silence for agreement.",
    ],
    assessment: { label: "Low when a barrier or conflict requires action", text: "Independence is useful only when the conditions for exercising it are supported." },
    practice: {
      situation: "A staff member mentioned a concern to you two weeks ago in passing. You have not followed up.",
      steps: [
        "Write what you will say when you follow up, including what you will do and by when.",
        "Decide whether the concern needs a formal process, and if so, who is responsible for it.",
        "Set one habit that will keep this from happening again, such as a weekly list of open concerns.",
      ],
    },
    review: [
      "What is the difference between giving people independence and leaving them alone with a problem?",
      "Who gains when a leader stays silent?",
      "What does “my door is always open” promise, and what does it leave out?",
    ],
  },
  {
    slug: "empowering",
    name: "Empowering or delegative leadership",
    tagline: "Supported independence",
    group: "contributor",
    definition: [
      "The leader shares authority while providing resources, clarity, support and accountability.",
      "Delegation can widen influence and build people's skills. It can also shift burdens without real power. The difference is whether the people given responsibility also get authority, time and protection.",
    ],
    isNot: [
      "It is not handing off a problem and walking away.",
      "It is not giving the person who raised a concern the job of fixing it.",
    ],
    stronger: {
      quote: "“The team can help design a more transparent assignment process. I remain responsible for addressing the concern, making sure the process is appropriate, and providing the resources to carry it out.”",
      why: "The employee who raised the concern is not given the job of fixing inequity because they raised it. The leader shares the design work and keeps the responsibility.",
    },
    harmful: {
      quote: "“You raised it, so why don't you lead a group to fix the assignment process?”",
      why: "This places the burden of the fix on the person who reported the problem, usually on top of their regular work, without authority, time or protection.",
    },
    conflict: {
      title: "A plan overruled",
      situation: "A team is asked to redesign how it schedules home visits. The leader hands the work to three staff. Two weeks later, their plan is overruled by a manager who was never told the group had any authority.",
      tendency: "Delegation without clear decision rights turns into wasted effort and lost trust.",
      stronger: "Before delegating, the leader writes down what the group can decide, what needs approval and from whom, what time they have, and when they will check in. The leader tells the manager in advance and backs the group when its decisions are questioned.",
    },
    promotes: [
      "Distributes meaningful authority.",
      "Builds skills and visibility for more people.",
      "Uses the judgment of people closest to the work.",
    ],
    undermines: [
      "Uneven preparation means some people succeed and others are set up to struggle.",
      "Responsibility without resources becomes abandonment.",
    ],
    race: "Not every employee starts with equal access to networks or informal sponsorship. Before delegating, check whether people have the relevant information, decision authority, time and support, access to influential partners, and protection when their decisions are challenged. Without these, delegation can fall hardest on employees of color who are already asked to do extra equity work.",
    swot: {
      strengths: ["Ownership.", "Professional judgment."],
      weaknesses: ["Uneven preparation.", "Unclear boundaries."],
      opportunities: ["Distribute meaningful authority."],
      threats: ["Responsibility without resources becomes abandonment."],
    },
    helpsWhen: [
      "People closest to the work know how to improve it.",
      "There is time, support and real authority to share.",
    ],
    avoidWhen: [
      "The task is the leader's own responsibility, such as responding to a concern.",
      "The people delegated to have no time or authority.",
    ],
    complements: [
      { slug: "coaching", why: "Prepares people to use the authority well." },
      { slug: "transactional", why: "Sets check-ins and accountability." },
      { slug: "shared", why: "Extends delegation into lasting shared leadership." },
    ],
    safeguards: [
      "Write down decision rights before delegating.",
      "Give time and resources, not just responsibility.",
      "Back people when their decisions are challenged.",
      "Keep responsibility for anything that is yours to answer.",
    ],
    assessment: { label: "High potential with equitable support", text: "Not all employees start with equal access to networks or informal sponsorship." },
    practice: {
      situation: "You want to delegate the planning of your unit's next community listening session.",
      steps: [
        "Write the decision rights: what the group decides, what needs your approval, what is fixed.",
        "List the time, budget and contacts the group will need.",
        "Name what you will do if someone senior questions the group's plan.",
      ],
    },
    review: [
      "What five things should people have before you delegate to them?",
      "When does delegation become abandonment?",
      "Why should the person who raised a concern not automatically be put in charge of fixing it?",
    ],
  },
  {
    slug: "transactional",
    name: "Transactional leadership",
    tagline: "Expectations and consequences",
    group: "support",
    definition: [
      "The leader sets standards, monitors performance, and uses recognition, rewards or corrective responses.",
      "Transactional practices can make equity commitments concrete. They are only as fair as the standards they enforce.",
    ],
    isNot: [
      "It is not proof of fairness because a form was completed.",
      "It is not equal counts without regard to the job or people's interests.",
    ],
    stronger: {
      quote: "“Future assignments will use defined criteria. We will review whether the process is followed and whether access actually improves.”",
      why: "This makes the commitment concrete and checks results, not only completion.",
    },
    harmful: {
      quote: "“From now on, everyone gets exactly two presentations a year. Done.”",
      why: "This sets an equal count without considering whether presentations fit each role or what employees want. A weak version also measures only whether a form was filled out.",
    },
    conflict: {
      title: "Who hears about extra hours",
      situation: "Some staff are always offered extra paid hours. Others never hear about them. A staff member who cares for a parent says the offers always come by text late in the day.",
      tendency: "The leader sets a rule and tracks compliance. The risk is a rule like “first to reply gets the hours,” which rewards whoever can answer fastest.",
      stronger: "The leader posts openings in one place with a reasonable response window, uses a rotation, and tracks who is offered hours and who accepts them by schedule type. The leader reviews whether “available on short notice” is really required, since it may disadvantage caregivers.",
    },
    promotes: [
      "Clarity and follow-through.",
      "Makes equity responsibilities part of normal expectations.",
      "Creates records that can be reviewed.",
    ],
    undermines: [
      "A biased standard can be enforced very consistently.",
      "Narrow targets invite gaming or surface-level compliance.",
      "Incentives can reward the wrong things.",
    ],
    race: "Consistency matters, but a biased standard can be enforced consistently. For example, rewarding “visibility” may disadvantage people repeatedly given essential behind-the-scenes work. In the common scenario, that is exactly the Black employee's situation. Both the criterion and the chance to meet it need review.",
    swot: {
      strengths: ["Clarity.", "Follow-through."],
      weaknesses: ["Narrow targets.", "A compliance mindset."],
      opportunities: ["Make equity responsibilities concrete."],
      threats: ["Gaming.", "Surface-level completion.", "Inequitable incentives."],
    },
    helpsWhen: [
      "A change has been agreed and needs owners, deadlines and tracking.",
      "Commitments have been made but not kept.",
    ],
    avoidWhen: [
      "It would be the only source of judgment about what is fair.",
      "The measure counts activity rather than results.",
    ],
    complements: [
      { slug: "transformative", why: "Checks whether the standard itself is fair." },
      { slug: "participative", why: "Lets affected people help set the measures." },
      { slug: "procedural", why: "Makes the standards transparent and reviewable." },
    ],
    safeguards: [
      "Check the standard before enforcing it.",
      "Measure results, not only completion.",
      "Look at results by group where privacy allows.",
      "Watch for gaming and unintended effects.",
    ],
    assessment: { label: "Moderate as a supporting approach", text: "Strong for implementation discipline. Weak as the only source of equity judgment." },
    practice: {
      situation: "Your unit has agreed to make development opportunities more visible.",
      steps: [
        "Write one measure of completion and one measure of results.",
        "Name one way the measure could be gamed and how you would notice.",
        "Set an owner, a deadline and a review date.",
      ],
    },
    review: [
      "How can a consistent standard still be unfair?",
      "What is the difference between measuring completion and measuring results?",
      "In the common scenario, what would a fair measure of improvement look like?",
    ],
  },
  {
    slug: "procedural",
    name: "Bureaucratic or procedural leadership",
    tagline: "Rules and reviewability",
    group: "support",
    definition: [
      "The leader relies on formal criteria, documentation, roles and established processes.",
      "Written criteria can reduce arbitrary decisions. But a process can be followed perfectly and still produce unfair results if nobody examines where it came from, who carries its burdens and what its effects are.",
    ],
    isNot: [
      "It is not “no rule was broken, so there is nothing to examine.”",
      "It is not documentation in place of fairness.",
    ],
    stronger: {
      quote: "“We will follow the required concern-response process and, separately, review whether assignment criteria are clear and appropriate.”",
      why: "The leader uses process for what it does well: protecting the employee's concern and making the review traceable. The leader also treats the process itself as open to improvement.",
    },
    harmful: {
      quote: "“No rule was broken, so there is nothing to examine.”",
      why: "A process can be formally compliant and still need improvement. This response treats compliance as the end of the question.",
    },
    conflict: {
      title: "Training videos without captions",
      situation: "A Deaf staff member raises a concern that required training videos have no captions. A manager responds that the vendor contract does not require captions.",
      tendency: "The leader points to the contract and stops there.",
      stronger: "The leader recognizes that accessibility obligations are existing requirements, whatever a contract says. The leader routes the concern to the person or area responsible for accessibility, arranges captions or another accessible version now, and makes sure future contracts include captioning. The leader also follows up with the staff member about any training deadline they could not meet.",
    },
    promotes: [
      "Consistency and continuity.",
      "Decisions that can be reviewed and challenged.",
      "Safeguards that survive staff turnover.",
    ],
    undermines: [
      "Rigidity and excessive procedural burden.",
      "Documentation can substitute for fairness.",
      "Old rules can keep old inequities in place.",
    ],
    race: "Procedures can preserve inequity if nobody examines their origins, burdens or effects. Ask who wrote the rule, who it was designed around, and who finds it hardest to meet. A rule that seems neutral can fall more heavily on people of color, disabled people or people who need language access.",
    swot: {
      strengths: ["Consistency.", "Continuity.", "Reviewability."],
      weaknesses: ["Rigidity.", "Excessive procedural burden."],
      opportunities: ["Build safeguards that survive turnover."],
      threats: ["Documentation substitutes for fairness."],
    },
    helpsWhen: [
      "A formal concern needs a protected, traceable response.",
      "A good change needs to last beyond the people who made it.",
      "Arbitrary discretion has caused unequal treatment.",
    ],
    avoidWhen: [
      "A rule is being used to end a conversation about fairness.",
      "Following the procedure would delay an urgent access fix.",
    ],
    complements: [
      { slug: "transformative", why: "Examines where rules came from and whom they burden." },
      { slug: "adaptive-situational", why: "Allows justified flexibility." },
      { slug: "inclusive", why: "Keeps the people affected in view." },
    ],
    safeguards: [
      "Treat compliance as the minimum, not the answer.",
      "Review the effects of key procedures on different groups.",
      "Keep procedures as simple as they can be.",
      "Name the person or area responsible for each process.",
    ],
    assessment: { label: "Conditional", text: "Necessary infrastructure, but not enough protection against unfair results." },
    practice: {
      situation: "Your unit has a written checklist for approving staff to attend conferences.",
      steps: [
        "Read the checklist and ask who wrote it and when.",
        "Identify one item that could be harder for some staff to meet.",
        "Propose one change and say who has authority to approve it.",
      ],
    },
    review: [
      "When is “we followed the process” a full answer, and when is it not?",
      "How can a procedure protect equity? How can it preserve inequity?",
      "Which procedure in your work most needs a fresh look?",
    ],
  },
  {
    slug: "coaching",
    name: "Coaching or developmental leadership",
    tagline: "Building capability",
    group: "contributor",
    definition: [
      "The leader uses feedback, reflection, practice and support to strengthen people's skills.",
      "Coaching can widen opportunity. It can also become assimilation training, which helps employees conform to dominant preferences instead of questioning those preferences.",
    ],
    isNot: [
      "It is not a replacement for fixing the process.",
      "It is not teaching people to raise concerns more quietly.",
    ],
    stronger: {
      quote: "“We will review the opportunity process. Separately, if you want to build presentation experience, let's identify meaningful opportunities and support.”",
      why: "The leader keeps the process review and the development offer separate, and the development is the employee's choice.",
    },
    harmful: {
      quote: "“Let's work on how you raise concerns so people don't react badly.”",
      why: "This shifts attention away from the dismissal and the allocation process, and toward the employee's delivery.",
    },
    conflict: {
      title: "“Too emotional”",
      situation: "A supervisor gives an employee who is Latina feedback that she is “too emotional” in meetings, after she pushed back on a policy affecting families who speak Spanish.",
      tendency: "The coaching focuses on tone. She is coached to “tone it down,” and the policy concern is lost.",
      stronger: "The leader separates the content of her concern from the judgment about her style. The leader checks whether the same intensity from other colleagues gets the same label, takes the policy concern seriously on its merits, and offers coaching on influence only if she wants it.",
    },
    promotes: [
      "Individualized support and skill-building.",
      "Wider readiness for advancement.",
    ],
    undermines: [
      "Coaching can go to favorites.",
      "Structural problems can be recast as personal deficits.",
      "Some people get development; others get only correction.",
    ],
    race: "Watch who receives developmental investment and who receives only corrective feedback. Labels such as “too emotional,” “abrasive” or “not polished” have often been applied unevenly to women of color and other employees whose style differs from the dominant one. Coaching should widen the range of accepted styles, not narrow it.",
    swot: {
      strengths: ["Individualized support.", "Skill-building."],
      weaknesses: ["Depends on the coach's judgment and available time."],
      opportunities: ["Broaden readiness and access to advancement."],
      threats: ["Favoritism.", "Structural problems reframed as personal deficits."],
    },
    helpsWhen: [
      "Someone asks for development.",
      "Development opportunities have been uneven and need widening.",
      "The process has been reviewed or is being reviewed at the same time.",
    ],
    avoidWhen: [
      "It would replace correcting a process or conduct problem.",
      "The feedback is about style rather than job-related performance.",
    ],
    complements: [
      { slug: "servant", why: "Starts with what the person wants." },
      { slug: "transformative", why: "Checks whether the expected style is itself the problem." },
      { slug: "empowering", why: "Gives people real chances to use new skills." },
    ],
    safeguards: [
      "Keep process review separate from individual development.",
      "Check who gets developmental investment on your team.",
      "Make feedback specific, job-related and about behavior.",
      "Let the person choose whether to take up coaching.",
    ],
    assessment: { label: "Moderate to high potential", text: "When access is fair and coaching adds to, rather than replaces, organizational correction." },
    practice: {
      situation: "Look back at the last three pieces of developmental feedback you gave.",
      steps: [
        "For each, note whether it was about job-related results or about style.",
        "Note who received developmental opportunities and who received correction.",
        "Rewrite one style-based comment as specific, job-related feedback.",
      ],
    },
    review: [
      "When does coaching become assimilation training?",
      "In the common scenario, why must the presentation offer be separate from the process review?",
      "How would you know whether your coaching is distributed fairly?",
    ],
  },
  {
    slug: "adaptive-situational",
    name: "Adaptive and situational leadership",
    tagline: "Responding to conditions",
    group: "conditional",
    definition: [
      "These approaches overlap in practice but are not the same. Situational leadership adjusts direction and support to the task and the person's relevant needs. Adaptive leadership helps a group learn its way through problems whose causes or solutions are uncertain, which may require changes in assumptions and relationships.",
      "Both separate what needs immediate action from what needs inquiry.",
    ],
    isNot: [
      "It is not “it depends,” used to avoid deciding.",
      "It is not different standards for different people without a reason that can be stated and reviewed.",
      "It is not an open-ended learning process while harm continues.",
    ],
    stronger: {
      quote: "“We can immediately stop dismissive interruptions while we look into the assignment pattern. We will test a clearer process and revise it using evidence and employee feedback.”",
      why: "The leader acts now on the conduct and treats the allocation question as something to learn about, with a test and a review.",
    },
    harmful: {
      quote: "“It depends on the situation. Let's see how things play out.”",
      why: "Context becomes a reason to delay. The interruption goes unaddressed and the allocation question drifts.",
    },
    conflict: {
      title: "Two people, one policy change",
      situation: "After a policy change, two staff need very different support. One is new and wants step-by-step direction. The other is experienced but disagrees with the change and says it will hurt families in rural areas.",
      tendency: "A situational leader gives more direction to the new staff member and more room to the experienced one. The risk is treating the experienced person's disagreement as a support need instead of information.",
      stronger: "The leader gives each person the support they need, which is the situational part, and treats the disagreement as a possible signal, which is the adaptive part. The leader asks for evidence about rural families, tests the concern, and reports what was learned.",
    },
    promotes: [
      "Flexibility can address different barriers.",
      "Learning from evidence can improve interventions.",
    ],
    undermines: [
      "Flexibility can hide favoritism.",
      "“Context” can excuse unequal standards or delayed action.",
    ],
    race: "The fairness question is not whether every employee receives the same support. It is whether differences are relevant, justified, accessible and reviewable. Unexplained flexibility tends to favor people who are already trusted, which can follow lines of race and familiarity.",
    swot: {
      strengths: ["Responsiveness.", "Learning."],
      weaknesses: ["Perceived inconsistency.", "Broad discretion."],
      opportunities: ["Tailor support.", "Improve interventions over time."],
      threats: ["“Context” becomes an excuse for unequal standards or delayed action."],
    },
    helpsWhen: [
      "People need different kinds of support to do the same work.",
      "The causes of a problem are unclear and need testing.",
    ],
    avoidWhen: [
      "Harmful conduct is known and needs a response now.",
      "Differences in treatment cannot be explained.",
    ],
    complements: [
      { slug: "ethical", why: "Keeps standards steady while methods change." },
      { slug: "procedural", why: "Makes reasons for differences reviewable." },
      { slug: "shared", why: "Brings more people into the learning." },
    ],
    safeguards: [
      "State the reason for any difference in treatment.",
      "Act now on known harm; learn about the rest.",
      "Set a time limit on any test, with a review.",
    ],
    assessment: { label: "Moderate to high potential when reasons are explicit", text: "Known harmful conduct should not be left unresolved while a leader runs an open-ended learning process." },
    practice: {
      situation: "You have given one staff member extra flexibility on deadlines and another none.",
      steps: [
        "Write the reason for the difference in one sentence.",
        "Ask whether the reason is relevant, justified, accessible to others in the same situation, and reviewable.",
        "If it fails any of these, decide what to change.",
      ],
    },
    review: [
      "What is the difference between situational and adaptive leadership?",
      "When does “context” become an excuse?",
      "Which parts of the common scenario need action now, and which need learning?",
    ],
  },
  {
    slug: "shared",
    name: "Shared or distributed leadership",
    tagline: "Authority across roles",
    group: "contributor",
    definition: [
      "Leadership responsibilities and influence are spread across people with relevant expertise and experience.",
      "Shared leadership brings neglected knowledge into decisions. Representation without authority, however, becomes tokenism.",
    ],
    isNot: [
      "It is not an advisory group that has no decision power.",
      "It is not extra unpaid work for the same few people.",
    ],
    stronger: {
      quote: "“A cross-role group can help redesign how opportunities are allocated. Its scope, decision authority, time and relationship to final approval will be explicit.”",
      why: "The leader still keeps responsibility for concerns that need formal authority. The group gets real influence and the time to use it.",
    },
    harmful: {
      quote: "“We've formed an equity team. They'll meet monthly and send us recommendations.”",
      why: "There is no stated authority, no time set aside and no commitment to respond. The group becomes more meetings without influence.",
    },
    conflict: {
      title: "A recommendation ignored",
      situation: "A cross-role workgroup recommends changing how interpreter requests are approved. Months pass. Senior leaders never respond.",
      tendency: "Members conclude that shared leadership was for show, and the people who volunteered stop volunteering.",
      stronger: "The charter sets a response date for every recommendation. Leaders accept, change or decline each one in writing, with reasons. Members have time set aside for the work, and their contributions are recognized in performance conversations.",
    },
    promotes: [
      "Brings in knowledge from people closest to the work and the community.",
      "Builds continuity beyond any one leader.",
      "Shares agenda-setting, not only advice.",
    ],
    undermines: [
      "Coordination costs and unclear accountability.",
      "Unpaid equity labor.",
      "Advisory groups with no decision power.",
    ],
    race: "Do not rely disproportionately on employees of color to educate colleagues, repair culture and design reforms in addition to their regular work. When those employees are asked, they need authority, time and recognition, and the responsibility for results must stay with leaders.",
    swot: {
      strengths: ["Distributed expertise.", "Continuity."],
      weaknesses: ["Coordination costs.", "Diffuse accountability."],
      opportunities: ["Share agenda-setting and real influence."],
      threats: ["Unpaid equity labor.", "Advisory groups with no decision power."],
    },
    helpsWhen: [
      "The problem crosses roles and units.",
      "People with relevant experience have not had decision influence.",
    ],
    avoidWhen: [
      "A formal concern needs one accountable decision-maker.",
      "There is no time or authority to share.",
    ],
    complements: [
      { slug: "empowering", why: "Supplies support and resources." },
      { slug: "procedural", why: "Writes the charter and response rules." },
      { slug: "adaptive-situational", why: "Supports learning across the group." },
    ],
    safeguards: [
      "Write a charter: scope, authority, time, and how decisions get approved.",
      "Set a response date for every recommendation.",
      "Recognize the work in performance conversations.",
      "Watch for the same people being asked again and again.",
    ],
    assessment: { label: "High potential when power and resources are genuinely shared", text: "Low value when “shared leadership” means extra meetings without influence." },
    practice: {
      situation: "You are forming a group to improve how your unit communicates with families.",
      steps: [
        "Draft a three-line charter: what the group decides, what it recommends, and when leaders must respond.",
        "Name how members' time will be protected.",
        "Check whether the same people are on every group like this, and why.",
      ],
    },
    review: [
      "What separates shared leadership from tokenism?",
      "Who carries unpaid equity labor where you work?",
      "What would make a recommendation impossible to ignore?",
    ],
  },
  {
    slug: "ethical",
    name: "Ethical leadership",
    tagline: "Principled conduct and accountability",
    group: "foundation",
    definition: [
      "Ethical leadership emphasizes principled conduct, fair treatment, consistent standards and accountability.",
      "Its danger is assuming that a leader's good intentions or personal integrity prove that the institution is fair. A fair person can run an unfair process without knowing it.",
    ],
    isNot: [
      "It is not “I'm a good person, so this must be fair.”",
      "It is not applying standards only to people the leader is not close to.",
    ],
    stronger: {
      quote: "“The concern deserves a fair response. We need to address the dismissive interaction, protect appropriate reporting, and review how opportunity is distributed.”",
      why: "The leader names all three matters and commits to each. Fairness here is something the leader does, not something the leader claims.",
    },
    harmful: {
      quote: "“I'm a fair person, and I've never treated anyone differently. I don't see what there is to review.”",
      why: "The leader offers personal integrity as evidence about the process. It is not. The assignment history may show a pattern the leader never intended.",
    },
    conflict: {
      title: "A high performer's comments",
      situation: "A manager learns that a high-performing staff member has been making comments about a coworker's accent. The high performer is close to the manager and is leading an important project.",
      tendency: "The temptation is to handle it lightly or wait until the project ends.",
      stronger: "The manager applies the same standard that would apply to anyone. The manager addresses the conduct, follows the authorized process for reporting and responding to it, protects the coworker from retaliation, and does not ask the coworker to smooth things over.",
    },
    promotes: [
      "Clear attention to fairness, voice and accountability.",
      "Consistent standards that apply to powerful people too.",
    ],
    undermines: [
      "Can stay interpersonal and aspirational.",
      "Personal integrity can be mistaken for institutional fairness.",
    ],
    race: "Ethical leadership must reach beyond intentions to outcomes. A leader can sincerely believe they treat everyone the same while assignment, promotion or discipline patterns differ by race. Accountability means looking at those patterns and acting on them.",
    swot: {
      strengths: ["Clear attention to fairness and accountability."],
      weaknesses: ["Can remain interpersonal and aspirational."],
      opportunities: ["Connect daily conduct to decisions and institutional outcomes."],
      threats: ["Good intentions conceal unchanged access to power and resources."],
    },
    helpsWhen: [
      "Standards are being applied unevenly.",
      "Conduct needs a firm, fair response.",
      "Trust needs to be rebuilt through consistent action.",
    ],
    avoidWhen: [
      "It is used to defend the leader's reputation instead of examining a process.",
    ],
    complements: [
      { slug: "inclusive", why: "Adds belonging and contribution to fairness." },
      { slug: "transformative", why: "Extends fairness from conduct to structures." },
      { slug: "directive", why: "Supplies a bounded, timely decision when conduct must stop." },
    ],
    safeguards: [
      "Look at patterns, not only intentions.",
      "Apply standards to people close to you.",
      "Protect people who report concerns.",
      "Be open about your own mistakes.",
    ],
    assessment: { label: "High potential as an everyday foundation", text: "Structural impact depends on whether fairness extends to resources, opportunity, authority and measurable change." },
    practice: {
      situation: "Think of a standard you hold your team to, such as meeting deadlines or professional conduct.",
      steps: [
        "Recall the last three times the standard was not met. How did you respond each time?",
        "Ask whether your response differed by who was involved.",
        "Write one commitment that would make your response more consistent.",
      ],
    },
    review: [
      "Why is personal integrity not evidence that a process is fair?",
      "How do you apply standards to people you are close to?",
      "What does accountability look like after a fair-minded leader finds an unfair pattern?",
    ],
  },
  {
    slug: "inclusive",
    name: "Inclusive leadership",
    tagline: "Belonging and full contribution",
    group: "foundation",
    definition: [
      "Inclusive leadership emphasizes belonging, contribution and valuing differences without requiring people to assimilate.",
      "Research on inclusive leadership, including work by Randel and colleagues, highlights belonging and being valued for one's uniqueness. Central behaviors include support, justice and equity, shared decision-making, encouraging diverse contributions, and helping people contribute fully.",
    ],
    isNot: [
      "It is not a friendly climate that leaves opportunity unchanged.",
      "It is not asking everyone to fit one preferred style.",
      "It is not “we're one big family,” used to avoid talking about differences.",
    ],
    stronger: {
      quote: "“People should be able to contribute without having to resemble one preferred leadership style. Let's look at how presentation opportunities are shared and what preparation people get.”",
      why: "The leader connects belonging to opportunity. Inclusion here means more than warmth. It means access to the work that leads to advancement.",
    },
    harmful: {
      quote: "“We're all one big family here. Let's not divide ourselves into groups.”",
      why: "This treats naming a pattern as the problem. It asks the employee to give up a legitimate concern for the sake of harmony.",
    },
    conflict: {
      title: "Last-minute documents",
      situation: "In planning meetings, the same three people do most of the talking. A staff member who uses a screen reader says shared documents are posted minutes before meetings, in formats she cannot read in advance.",
      tendency: "A leader focused only on climate thanks her and encourages everyone to “speak up more.”",
      stronger: "The leader sends materials in accessible formats at least two days ahead, rotates who facilitates, offers ways to contribute in writing before and after the meeting, and keeps track of whose ideas are adopted.",
    },
    promotes: [
      "Belonging without assimilation.",
      "More people contributing fully.",
      "Shared decision-making in daily work.",
    ],
    undermines: [
      "Can stay at the level of climate and good feelings.",
      "Positive climate language can hide unchanged access to power and resources.",
    ],
    race: "A team can feel friendly while opportunities remain inequitable. Inclusion that matters for racial equity reaches decisions: who presents, who is sponsored, whose ideas are adopted and who is promoted. Leaders should not ask people of color to adjust their style to fit in as the price of belonging.",
    swot: {
      strengths: ["Clear attention to voice and contribution."],
      weaknesses: ["Can remain interpersonal and aspirational."],
      opportunities: ["Connect daily treatment to decisions and institutional outcomes."],
      threats: ["Positive climate language conceals unchanged access to power and resources."],
    },
    helpsWhen: [
      "Some people are contributing much less than they could.",
      "Meetings, documents or routines have access barriers.",
      "Differences in style are being treated as differences in ability.",
    ],
    avoidWhen: [
      "It would replace a formal response to reported discrimination or harassment.",
    ],
    complements: [
      { slug: "ethical", why: "Adds standards and accountability." },
      { slug: "transformative", why: "Extends inclusion to structures and resources." },
      { slug: "participative", why: "Turns belonging into shared decisions." },
    ],
    safeguards: [
      "Share materials in accessible formats and ahead of time.",
      "Offer more than one way to contribute.",
      "Track whose ideas are adopted and who gets visible work.",
      "Connect climate to opportunity and outcomes.",
    ],
    assessment: { label: "High potential as an everyday foundation", text: "Structural impact depends on whether inclusion extends to resources, opportunity, authority and measurable change." },
    practice: {
      situation: "Look at your last month of team meetings.",
      steps: [
        "Note who spoke most and whose ideas were adopted.",
        "Note when materials were shared and in what formats.",
        "Choose two changes to try for the next month and how you will tell if they helped.",
      ],
    },
    review: [
      "What is the difference between inclusion and equity?",
      "How could a team feel friendly and still be inequitable?",
      "What would inclusion look like in who gets visible work?",
    ],
  },
];
