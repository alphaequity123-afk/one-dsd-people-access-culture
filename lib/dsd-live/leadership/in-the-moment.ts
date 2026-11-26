/**
 * "In the moment": a short, realistic situation on a leadership style page. The reader chooses a response and sees how
 * it is likely to land with staff and with fair service. Responses get feedback; people are never scored, and nothing
 * the reader chooses is kept (owner decisions 2026-11-22).
 */
export type MomentResponse = {
  id: string;
  text: string;
  /** How well this response fits the moment, shown as plain words, never a score. */
  fit: "strong" | "partial" | "risky";
  feedback: string;
  staff: string;
  service: string;
};
export type InTheMoment = {
  situation: string;
  question: string;
  responses: MomentResponse[];
  reflection: string;
  tryThisWeek: string;
};

export const IN_THE_MOMENT: Record<string, InTheMoment> = {
  "authoritarian": {
    situation: "In a team meeting, a newer colleague questions your plan to change how waiver requests are reviewed. They point out it could slow responses for people who rely on interpreters. The room goes quiet, and your own manager is listening.",
    question: "How do you respond?",
    responses: [
      { id: "move-on", text: "Remind the team that the decision has been made, and move to the next agenda item.", fit: "risky", feedback: "It ends the discussion, but it teaches everyone that raising a concern is risky. The interpreter delay will surface later, from the people it affects.", staff: "Others learn that silence is safer than candor.", service: "People who rely on interpreters may wait longer, with no one inside raising it." },
      { id: "welcome", text: "Thank them for raising it, ask what they've seen, and agree to check the effect on interpreter requests before the change goes ahead.", fit: "strong", feedback: "You keep your authority and use it well. The concern becomes useful information, and the whole team sees that candor is welcome.", staff: "People learn that speaking up is valued, even when it's uncomfortable.", service: "The delay is caught before it reaches the people it would affect." },
      { id: "offline", text: "Say you'll take it offline, and talk with them privately after the meeting.", fit: "partial", feedback: "It's better than shutting the concern down, but moving it out of the room signals it wasn't welcome there.", staff: "One colleague is heard; the rest of the team stays quiet.", service: "The issue may be addressed, if you follow through." },
    ],
    reflection: "When someone disagrees with you in front of others, what do you feel first, and what do you do with that feeling?",
    tryThisWeek: "This week, when someone raises a concern, I'll thank them before I respond, and ask one question to understand it.",
  },
  "directive": {
    situation: "A system outage means that notices about a service change must go out by phone today. Your team has never made calls at this scale, and people are anxious about getting it wrong.",
    question: "How do you lead the next hour?",
    responses: [
      { id: "plan", text: "Set a clear plan: who calls whom, a short script with an interpreter line, and a check-in every hour. Tell the team it's a temporary approach, and that you'll plan the next one together.", fit: "strong", feedback: "In a crisis, clear direction steadies people. Naming it as temporary, and inviting input next time, keeps it from becoming a habit.", staff: "Staff feel steady and clear, and their experience is respected.", service: "People get timely, consistent information, including those who need an interpreter." },
      { id: "control", text: "Write every call script yourself, and ask staff to check each call with you before moving on.", fit: "risky", feedback: "Close control slows everything down, and it tells experienced staff that you don't trust their judgment.", staff: "Experienced people end up waiting for instructions.", service: "The people called last hear about the change late." },
      { id: "goal-only", text: "Tell the team the goal, and let them work out how to reach everyone.", fit: "partial", feedback: "It respects their skill, but in a crisis without a plan, calls get duplicated or missed.", staff: "Some people thrive, and others struggle without a shared plan.", service: "Some people are called twice, and others not at all, including those who need an interpreter." },
    ],
    reflection: "Which of your directions this month were truly needed, and which were habit?",
    tryThisWeek: "This week, I'll name one decision I usually make alone, and ask the team how they would approach it.",
  },
  "transactional": {
    situation: "Your unit is measured on how many assessments are completed each month. One colleague's numbers are lower, and you learn why: she spends extra time arranging interpreters and accessible formats so people can take part fully.",
    question: "What do you do?",
    responses: [
      { id: "speed-up", text: "Remind her of the target, and ask her to speed up.", fit: "risky", feedback: "The number improves, but the care that makes assessments fair is lost. The team learns that access work doesn't count.", staff: "The care in the job goes unseen and unrewarded.", service: "People who need interpreters or accessible formats are rushed or left out." },
      { id: "excuse", text: "Quietly excuse her from the target this month.", fit: "partial", feedback: "It's kind, but it treats access work as an exception rather than part of the job, and the measure that hid it stays the same.", staff: "She's protected, while everyone else still feels the pressure.", service: "Her cases benefit; nothing changes for anyone else." },
      { id: "measure", text: "Recognize the access work openly, and propose adding it to how the unit measures quality, alongside the count.", fit: "strong", feedback: "Clear expectations stay, but now they reward the work that makes assessments fair.", staff: "Care becomes visible and valued across the team.", service: "Access becomes the standard, not one person's extra effort." },
    ],
    reflection: "What important work on your team doesn't show up in any measure?",
    tryThisWeek: "This week, I'll name one piece of unmeasured work out loud, and thank the person who does it.",
  },
  "procedural": {
    situation: "A person applying for services missed a paperwork deadline. The reminder letter went to an old address after they moved into supported housing. The rule says late applications go to the back of the queue.",
    question: "What do you do?",
    responses: [
      { id: "apply", text: "Apply the rule, and call the person to explain what happened and how to reapply.", fit: "partial", feedback: "It's consistent and courteous, but the person pays for a process failure that wasn't theirs.", staff: "Staff see consistency, and learn not to question a rule even when it misfires.", service: "The person waits longer because the system had the wrong address." },
      { id: "quiet", text: "Move the application up quietly, without recording why.", fit: "risky", feedback: "It's kind in the moment, but undocumented exceptions look like favoritism, and the address problem stays hidden.", staff: "Staff can't tell which rules really apply.", service: "It's unfair to others waiting, and the cause is never fixed." },
      { id: "exception", text: "Use the exception the rules allow, document why, and flag the address problem so it's fixed for everyone.", fit: "strong", feedback: "Rules exist to be fair. A documented exception keeps both consistency and fairness, and fixing the cause protects the next person.", staff: "Staff see that rules are there to serve people.", service: "The person keeps their place, and others are protected from the same mistake." },
    ],
    reflection: "Which of your procedures has a hidden cost for people whose lives don't fit the form?",
    tryThisWeek: "This week, I'll look at one rule we enforce, and ask who it is hardest on.",
  },
  "charismatic": {
    situation: "You gave an inspiring talk to the division about making every notice plain language by spring. Three months later, little has changed, and staff are quietly skeptical.",
    question: "What do you do next?",
    responses: [
      { id: "honest", text: "Acknowledge the gap honestly, name what got in the way, and commit to one small, visible first step, with a date and someone responsible.", fit: "strong", feedback: "Honesty about the gap rebuilds trust, and a concrete first step turns the vision into work people can see.", staff: "Your credibility returns because your words match your actions.", service: "The first plain-language notices actually go out." },
      { id: "again", text: "Give another rousing talk to rebuild momentum.", fit: "risky", feedback: "Words without follow-through deepen the skepticism. Trust falls further than it rose.", staff: "Energy fades into cynicism.", service: "Notices stay hard to read." },
      { id: "report", text: "Ask managers to report progress on the plain-language goal at every meeting.", fit: "partial", feedback: "Accountability helps, but without resources or a plan, reporting becomes pressure rather than progress.", staff: "Managers feel blamed instead of equipped.", service: "Change is slow and uneven." },
    ],
    reflection: "Where has your message run ahead of the support behind it?",
    tryThisWeek: "This week, I'll pick one promise I've made, share an honest update, and name one next step.",
  },
  "transformational": {
    situation: "Your team has taken up a new person-centered planning approach with real enthusiasm. Now another big change is coming, and two of your most committed people seem exhausted.",
    question: "How do you lead into the next change?",
    responses: [
      { id: "vision", text: "Share an inspiring vision for the new change, and ask everyone to rise to it.", fit: "risky", feedback: "Inspiration on top of exhaustion leads to burnout, often among the most committed people.", staff: "The people who care most wear out first.", service: "Quality slips while everyone is stretched." },
      { id: "rest", text: "Give the two exhausted colleagues time off, then move ahead as planned.", fit: "partial", feedback: "Rest helps them, but the pace stays the same, and the strain moves to others.", staff: "Relief for two people, more strain for the rest.", service: "The risk of mistakes rises during the change." },
      { id: "pace", text: "Talk openly about pace, ask what the team needs to finish current work well, and stage the new change so no one carries both.", fit: "strong", feedback: "The purpose stays, and people are protected. Staging the change keeps growth sustainable.", staff: "People feel valued, not used up.", service: "Quality holds through both changes." },
    ],
    reflection: "Who on your team is carrying the most change right now, and do they know you see it?",
    tryThisWeek: "This week, I'll ask one person what they would stop doing if they could, and help make that possible.",
  },
  "transformative": {
    situation: "Data shows that people whose first language isn't English are approved for a support service at much lower rates. Some managers feel the data is accusing them.",
    question: "What do you do?",
    responses: [
      { id: "system", text: "Share the data as a system problem, not individual blame, and work with managers to trace where in the process the gap appears and what to change.", fit: "strong", feedback: "Naming the pattern, with practical tools, equips managers to redesign the process rather than defend themselves.", staff: "Managers feel equipped, not blamed.", service: "The process that produces the gap gets fixed." },
      { id: "explain", text: "Present the data, and ask each manager to explain their unit's numbers.", fit: "partial", feedback: "Naming the gap matters, but asking people to defend numbers puts them on guard, and doesn't show them what to change.", staff: "Managers feel accused and become defensive.", service: "Change is slow while people argue about the numbers." },
      { id: "wait", text: "Hold off on sharing the data until it has been studied further.", fit: "risky", feedback: "The delay protects comfort, not people. The gap continues while the data sits on a shelf.", staff: "The hard conversation is avoided.", service: "Unequal approvals continue for people who need the service." },
    ],
    reflection: "When you name an unfair result, do people walk away equipped, or blamed?",
    tryThisWeek: "This week, I'll take one gap I know about, and map the step in the process where it might begin.",
  },
  "adaptive-situational": {
    situation: "Two colleagues are new to reviewing provider contracts. One has a background in purchasing. The other recently came from direct support work and speaks two languages that several providers use.",
    question: "How do you support them?",
    responses: [
      { id: "ask", text: "Ask each of them what they know, what they find hard and what support they'd like, then pair them so each can teach the other.", fit: "strong", feedback: "Support fits their real readiness rather than assumptions, and both kinds of expertise are used.", staff: "Both colleagues grow, and each feels their knowledge counts.", service: "Contract reviews benefit from front-line and language insight." },
      { id: "same", text: "Give both the same training, and check in monthly.", fit: "partial", feedback: "It's fair on paper, but one size fits neither of them well.", staff: "One is underused, and the other may struggle quietly.", service: "Learning is slower than it needs to be." },
      { id: "split", text: "Give the colleague with the purchasing background the complex contracts, and the other colleague the simple ones.", fit: "risky", feedback: "It matches visible experience, but it may hold back the colleague whose strengths don't fit the usual picture of contract work.", staff: "One colleague is held back by an assumption.", service: "Reviews miss language and front-line insight." },
    ],
    reflection: "Whose readiness do you assume, and whose do you ask about?",
    tryThisWeek: "This week, I'll ask one person on my team what support they want, instead of deciding for them.",
  },
  "participative": {
    situation: "You're asking the team for input on a new intake process. In the meeting, the same three people do almost all the talking.",
    question: "What do you do?",
    responses: [
      { id: "call-on", text: "Call on the quieter people by name.", fit: "partial", feedback: "It's well meant, but being put on the spot can silence people further.", staff: "Some feel uncomfortable or exposed.", service: "A few more views surface." },
      { id: "structure", text: "Offer more ways to contribute: a quick written round before discussion, small pairs, and a way to add ideas afterward. Then explain how you'll decide.", fit: "strong", feedback: "Structured input lets quieter voices and different communication styles be heard, and explaining the decision keeps trust.", staff: "Everyone has a real way to take part.", service: "Intake is designed with more perspectives." },
      { id: "go", text: "Go with the ideas from the discussion, since everyone had a chance to speak.", fit: "risky", feedback: "Open discussion isn't the same as an equal voice. The loudest views become the decision.", staff: "Quieter people disengage.", service: "The new process has blind spots." },
    ],
    reflection: "Whose ideas tend to shape your decisions, and whose rarely reach you?",
    tryThisWeek: "This week, I'll try one new way for people to contribute before a decision.",
  },
  "laissez-faire": {
    situation: "You've left your team to sort out case assignments among themselves. Now you hear that newer staff and those working remotely are getting the hardest cases.",
    question: "What do you do?",
    responses: [
      { id: "note", text: "Send a note asking everyone to be fair with assignments.", fit: "partial", feedback: "It shows you're aware, but without a process nothing really changes.", staff: "The same people keep carrying the most.", service: "Nothing changes for the people being served." },
      { id: "leave", text: "Let them work it out, since they're professionals.", fit: "risky", feedback: "Without guidance, informal power decides, and those with the least insider knowledge carry the most.", staff: "The least-connected staff are overloaded.", service: "The hardest cases go to the least-supported staff." },
      { id: "step-in", text: "Step in: set a clear, open approach to assignments with the team, and check it regularly for fairness.", fit: "strong", feedback: "Leadership is needed here. Clear criteria protect everyone, especially those with the least influence.", staff: "Assignments feel fair, and the load is shared.", service: "Cases are matched to the support people need." },
    ],
    reflection: "Where has your hands-off approach left a gap that someone else is filling?",
    tryThisWeek: "This week, I'll check one area I've left to the team, and ask who it is working for.",
  },
  "empowering": {
    situation: "You want to hand someone the lead on a community listening session. Two colleagues are interested: one you've worked with for years, and a newer colleague from the community the session will reach.",
    question: "What do you do?",
    responses: [
      { id: "support", text: "Offer it to the newer colleague, with clear goals, resources and a check-in, and invite the experienced colleague to support them.", fit: "strong", feedback: "Real authority with real support develops a new leader, and brings community connection into the room.", staff: "Both colleagues grow, and the team sees trust extended fairly.", service: "The session is better connected to the people it serves." },
      { id: "familiar", text: "Give it to the colleague you know well, since you trust their work.", fit: "partial", feedback: "It feels safe, but trust extended only to familiar people holds others back, and misses relevant community knowledge.", staff: "The newer colleague is overlooked.", service: "The session is less connected to the community." },
      { id: "step-back", text: "Hand it to the newer colleague, and step back entirely.", fit: "risky", feedback: "Handing over authority without support sets someone up to struggle.", staff: "The newer colleague may feel overwhelmed and alone.", service: "The session is put at risk." },
    ],
    reflection: "Who do you trust with real decisions, and why them?",
    tryThisWeek: "This week, I'll hand one real decision to someone I don't usually delegate to, with clear support.",
  },
  "shared": {
    situation: "Several colleagues have stepped up to lead parts of an accessibility project, on top of their regular work. One tells you she's stretched thin, and her leadership work isn't in anyone's job description.",
    question: "What do you do?",
    responses: [
      { id: "thank", text: "Thank her warmly, and encourage her to keep going.", fit: "risky", feedback: "Appreciation without relief turns shared leadership into hidden extra work, often for the same people.", staff: "Burnout builds among the most willing.", service: "The project stalls when people run out of energy." },
      { id: "visible", text: "Make the leadership work visible: recognize it, adjust workloads, and write it into roles and reviews.", fit: "strong", feedback: "Shared leadership lasts when the work is seen and resourced.", staff: "People feel valued, and the load becomes sustainable.", service: "The project keeps moving." },
      { id: "reassign", text: "Reassign her project tasks to someone else.", fit: "partial", feedback: "It relieves her, but it takes away her leadership instead of supporting it.", staff: "She loses an opportunity she valued.", service: "Continuity is lost partway through." },
    ],
    reflection: "What leadership work happens on your team that no one officially owns?",
    tryThisWeek: "This week, I'll name one person's unofficial leadership, and talk with them about how to recognize it.",
  },
  "servant": {
    situation: "A colleague tells you the new case-notes system is hard to use with a screen reader. You've already helped her find workarounds several times.",
    question: "What do you do?",
    responses: [
      { id: "workaround", text: "Keep helping her with workarounds, as you always have.", fit: "partial", feedback: "It's caring, but the barrier stays, for her and for anyone else who uses assistive technology.", staff: "She feels supported, but the problem isn't solved.", service: "The barrier remains for everyone who meets it." },
      { id: "ask-others", text: "Suggest she ask colleagues for help when she's stuck.", fit: "risky", feedback: "It shifts the burden to her and her colleagues, and leaves the system as it is.", staff: "She carries the extra effort.", service: "Nothing changes." },
      { id: "fix", text: "With her agreement, raise it as an accessibility issue and push for a fix, while supporting her in the meantime.", fit: "strong", feedback: "Removing barriers means fixing systems, not only helping individuals.", staff: "She's supported now, and the problem gets solved.", service: "The system becomes usable for everyone." },
    ],
    reflection: "Which barriers are you helping people work around that you could help remove?",
    tryThisWeek: "This week, I'll take one recurring workaround, and raise it as a problem to fix.",
  },
  "ethical": {
    situation: "Your rule is that everyone presents a case summary at the weekly meeting. A colleague who is Deaf has said the fast pace of spoken discussion makes it hard to take part, even with an interpreter.",
    question: "What do you do?",
    responses: [
      { id: "same", text: "Keep the rule the same for everyone, because that's what fairness means.", fit: "risky", feedback: "Treating everyone the same can mean treating people unfairly. An equal rule can carry an unequal cost.", staff: "Your colleague is excluded from full participation.", service: "The team loses her insight on cases." },
      { id: "excuse", text: "Excuse her from presenting.", fit: "partial", feedback: "It removes the barrier by removing her voice.", staff: "She's sidelined from an important part of the work.", service: "Her insight is lost." },
      { id: "format", text: "Keep the same expectation, and change the format: written summaries shared beforehand, a slower pace, and turn-taking agreed with her and the interpreter.", fit: "strong", feedback: "The same values, applied fairly: everyone contributes, and the format makes that possible.", staff: "Everyone takes part fully.", service: "Decisions draw on the whole team's knowledge." },
    ],
    reflection: "Where does applying the same rule to everyone create unequal results?",
    tryThisWeek: "This week, I'll look at one team routine, and ask who it is hardest for.",
  },
  "inclusive": {
    situation: "Your team meetings feel warm and friendly. But you notice the same people's ideas get acted on, and colleagues who work in the field rarely shape decisions.",
    question: "What do you do?",
    responses: [
      { id: "influence", text: "Change how decisions are made: rotate who sets the agenda, gather field input before meetings, and show how it shaped the outcome.", fit: "strong", feedback: "Inclusion means influence. Changing the structure lets everyone shape the results.", staff: "Field colleagues gain real influence.", service: "Decisions are grounded in what happens in the field." },
      { id: "welcome", text: "Make a point of welcoming field colleagues warmly at every meeting.", fit: "partial", feedback: "Warmth matters, but welcome alone doesn't change who influences decisions.", staff: "They feel included, but still have little say.", service: "Field insight is still missing from decisions." },
      { id: "assume", text: "Assume field colleagues are happy, since no one has complained.", fit: "risky", feedback: "Silence isn't agreement. People with the least influence often feel least able to say so.", staff: "Field colleagues disengage.", service: "Decisions have blind spots." },
    ],
    reflection: "Who on your team feels welcome, but has little say?",
    tryThisWeek: "This week, I'll ask one person whose ideas rarely shape decisions what they would change.",
  },
  coaching: {
    situation: "A colleague on your team has been asked to lead the monthly check-in with service providers for the first time. Two days before, they tell you they're worried. They have never run a meeting with outside partners, and one provider is known for pushing back hard. You have twenty minutes free this afternoon.",
    question: "What do you do with those twenty minutes?",
    responses: [
      {
        id: "take-over",
        text: "Offer to run this meeting yourself so they can watch and learn, and let them lead the next one.",
        fit: "risky",
        feedback: "It protects this meeting, but it quietly tells your colleague you're not sure they can do it. The chance to grow passes, and the next first time will feel just as hard.",
        staff: "Relief today, and a little less confidence tomorrow. Others may notice who gets trusted with stretch work.",
        service: "Providers get a smooth meeting, but your team's capacity to lead these conversations doesn't grow.",
      },
      {
        id: "ask-questions",
        text: "Spend the time asking questions: what would a good meeting look like to them, what worries them most, and how might they respond if the provider pushes back. Then agree on one thing they'll try, and a short conversation afterward.",
        fit: "strong",
        feedback: "This is coaching at its best. Your questions draw on what your colleague already knows, the plan is theirs, and the conversation afterward turns the meeting into learning, whatever happens in the room.",
        staff: "Your colleague leaves with a plan they own and the knowledge that you're behind them.",
        service: "A better-prepared lead listens well, so providers' concerns are more likely to be heard and acted on.",
      },
      {
        id: "send-script",
        text: "Send them a detailed script and last month's agenda, and tell them to stick to it.",
        fit: "partial",
        feedback: "Clear direction can steady someone the first time. But a script won't prepare them for pushback, and it doesn't draw on their own strengths or judgment.",
        staff: "Clarity, but little room to grow, and they may freeze when the meeting goes off script.",
        service: "A rigid script can leave providers' real concerns unanswered.",
      },
    ],
    reflection: "Coaching time is a resource. Who on your team usually gets twenty minutes like this from you, and who doesn't?",
    tryThisWeek: "This week, I'll offer one coaching conversation to someone I don't usually coach, and I'll ask three questions before I give any advice.",
  },
};

type MomentChange = { situation?: string; question?: string; reflection?: string; tryThisWeek?: string; responses?: Record<string, Partial<Omit<MomentResponse, "id" | "fit">>> };

/**
 * One DHS versions of the situations that are specific to Disability Services Division work (owner decision 2026-11-22:
 * One DHS gets DHS situations). Every other situation already fits both applications.
 */
const DHS_CHANGES: Record<string, MomentChange> = {
  coaching: {
    situation: "A colleague on your team has been asked to lead the monthly check-in with county partners for the first time. Two days before, they tell you they're worried. They have never run a meeting with partners outside DHS, and one county lead is known for pushing back hard. You have twenty minutes free this afternoon.",
    responses: {
      "ask-questions": { text: "Spend the time asking questions: what would a good meeting look like to them, what worries them most, and how might they respond if the county lead pushes back. Then agree on one thing they'll try, and a short conversation afterward.", service: "A better-prepared lead listens well, so county partners' concerns are more likely to be heard and acted on, and residents feel the difference." },
      "take-over": { service: "County partners get a smooth meeting, but your team's capacity to lead these conversations doesn't grow." },
      "send-script": { service: "A rigid script can leave partners' real concerns unanswered." },
    },
  },
  authoritarian: {
    situation: "In a team meeting, a newer colleague questions your plan to change how eligibility reviews are scheduled. They point out it could slow responses for people who rely on interpreters. The room goes quiet, and your own manager is listening.",
  },
  transactional: {
    situation: "Your unit is measured on how many applications are processed each month. One colleague's numbers are lower, and you learn why: she spends extra time arranging interpreters and accessible formats so people can complete the process fully.",
  },
  transformational: {
    situation: "Your team has taken up a new trauma-informed approach to working with the public with real enthusiasm. Now another big change is coming, and two of your most committed people seem exhausted.",
  },
  "adaptive-situational": {
    situation: "Two colleagues are new to reviewing grant agreements with community organizations. One has a background in finance. The other recently came from front-line work in a county office and speaks two languages that several grantees use.",
    responses: {
      split: { text: "Give the colleague with the finance background the complex agreements, and the other colleague the simple ones.", feedback: "It matches visible experience, but it may hold back the colleague whose strengths don't fit the usual picture of grant work." },
      ask: { service: "Grant reviews benefit from front-line and language insight." },
    },
  },
};

function applyChange(moment: InTheMoment, change?: MomentChange): InTheMoment {
  if (!change) return moment;
  const { responses, ...rest } = change;
  return {
    ...moment,
    ...rest,
    responses: moment.responses.map(r => ({ ...r, ...(responses?.[r.id] ?? {}) })),
  };
}

export const momentFor = (slug: string, unit: "dhs" | "dsd" = "dsd"): InTheMoment | undefined => {
  const moment = IN_THE_MOMENT[slug];
  return moment && unit === "dhs" ? applyChange(moment, DHS_CHANGES[slug]) : moment;
};
