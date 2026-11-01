"use client";

import Link from "next/link";
import { useId, useState } from "react";

/** Only supply links resolved as available in the caller's requested scope. */
export type JourneyResource = { title: string; href: string };

type Step = { id: string; title: string; question: string; guidance: string; practices: string[]; resourceIds: string[] };
type Start = "work" | "community";
type Path = "service" | "workplace";

const ownCulture: Step = {
  id: "own-culture", title: "Begin with your own culture",
  question: "What do your background, your profession and this agency treat as normal, and what might that lead you to notice, expect or take for granted?",
  guidance: "This comes first on every path, whatever your background. Everyone works from inside a culture, including people whose culture is treated as the default, and DHS, DSD and each profession have cultures of their own. Starting here is a well-argued foundation, not a proven cause of better work, and completing a course alone does not prove better outcomes. Ask what you may be missing and stay open to correction.",
  practices: [
    "Name the worlds you belong to: family, faith, profession, interests, and the DHS, DSD, county or provider world you work in, along with disability or Deaf communities if those are yours.",
    "For a few days, watch for your own culture in small talk, in advertising and in how you plan your day. It is the hardest culture to see.",
    "Catch the moment when pressure leads you to assume others want what you want. Intake, a deadline and a crisis are the usual places.",
    "Privately, name which worlds you find hardest to work with, including ages, professions and beliefs. Fear and prejudice can be named and worked through. Nobody needs to see this.",
    "If you lead people, ask newcomers what you have stopped noticing. Being told to speak openly and directly is itself one culture's habit.",
  ],

  resourceIds: ["/minnesota-communities/american", "/minnesota-communities/minnesota", "/minnesota-communities/european-american", "/learn/intercultural/curriculum"],
};

const drive = (path: Path): Step => ({
  id: "drive", title: "Check what is driving you",
  question: "Do you want to do this, why does it matter here, and how confident do you feel?",
  guidance: "Consider what matters to you and the people affected before you plan. Energy and confidence can change over time. Pick the source that could help today: interest in the work itself, what it brings to your team and the mission, or confidence that you can do it. Someone else may need a different one.",
  practices: [
    path === "service"
      ? "Say in one sentence why the cultural side of this notice, meeting or plan matters to the people it reaches."
      : "Say in one sentence why the cultural side of this hiring step, conversation or team habit matters to the team and its work.",
    "If you feel unsure, build confidence with some history, someone who can coach you and a small first step. If you feel very sure, slow down. Dwelling on mistakes can freeze you, and overconfidence does harm too.",
    "If a hard stretch has worn you down, do not read that as lost commitment. Budget cuts, slow change and carrying other people's stories can lower anyone's energy. Talk with someone you trust before you judge yourself.",
    "Recover on purpose. Time with what is familiar is fine, and rest gets you back to the work. The risk comes when rest turns into avoiding anything unfamiliar.",
    "If you lead people, ask how to move the load, especially from staff of color and disabled staff, and not only how one person can cope with it.",
  ],

  resourceIds: ["/learn/intercultural/curriculum", "/areas/culture-trust"],
});

const context: Step = {
  id: "context", title: "Explore context with care",
  question: "What community history, experience or source could help you ask a better question?",
  guidance: "A brief provides context for learning. It cannot tell you what an individual believes, needs or prefers. Check the source and its date, then ask the person rather than making an assumption.",
  practices: [
    "Ask how past harm shapes the way people see this agency today, including harm by institutions that served disabled people. You may be meeting that history when you walk in.",
    "Ask what is happening in the wider world that could reach this work, such as immigration policy, a war or prices. Treat it as a prompt to ask, never as an assumption about how a person is affected.",
    "Remember that facts alone can lead to overconfidence and stereotypes. Listen and check what matters to the person.",
  ],

  resourceIds: ["/minnesota-communities", "/learn/intercultural/curriculum"],
};

const otherExplanations = (path: Path): Step => ({
  id: "other-explanations", title: "Look beyond one explanation",
  question: "Can you name more than one explanation for this: schedule, transport, cost, an agency rule? What does our own system assume?",
  guidance: path === "service"
    ? "Ask this alongside what you learned about culture, not instead of it. A missed appointment can involve a shift change, a bus route and a family's way of deciding, all at once. Check what you can act on, and name anything the service itself is asking of people. Consider more than one possible explanation and ask the people involved."
    : "Ask this alongside what you know about culture, not instead of it. Someone quiet in a meeting may also be new, on a different shift, working through an interpreter or watching how speaking up has gone for others. Ask what the job design, the meeting format and the rules assume about how people work. Consider more than one possible explanation and ask the people involved.",
  practices: [
    "Sort each explanation. Is it something most people would do anywhere? Something learned in a shared culture? Something about this one person? Then keep going. Is it what the system does: shifts, transport, cost, rules? Is it disability or access?",
    "Sorting gives you something to ask or something to change. It does not tell you what is true of a person, so ask them.",
    path === "service"
      ? "Look at any deadline or no-show rule. Does it treat other uses of time as laziness? Check the shift, the bus, the cost and the rule first."
      : "Silence can mean many things: thinking, habit, what everyone already knows, fear of being judged, or a different idea of what speaking up means. Make room for quiet reflection and for lively debate.",
  ],

  resourceIds: path === "service" ? ["/learn/equity-toolkit/curriculum", "/library/ja-access-checks"] : ["/practice/gp-4", "/areas/culture-trust"],
});

const adapt = (path: Path): Step => ({
  id: "adapt", title: "Decide who adapts, and how",
  question: "Here, do you adapt, hold your ground or work out something new, and who has been doing the adapting so far?",
  guidance: "Start with who always does the adapting. Consider who has the power to change the process. The institution and people with more power should take responsibility for making participation accessible.",
  practices: [
    "Adapt when it moves you toward the goal and crosses no line. Keep the value and change how, when and where. Do not imitate; heavy copying reads as insincere.",
    path === "service"
      ? "Hold your ground on rights, safety, legal duties and ethics rules. These do not move, and no weighing of options can trade them away. Say plainly what you cannot do, and then what you can offer instead."
      : "Hold your ground on rights, safety, accommodation duties and the same job standard for everyone. These do not move. Say plainly what you cannot do, and then what you can offer instead. Keeping a different view on purpose can also be the reason you are in the room.",
    path === "service"
      ? "Create something new when neither side's habit should win. Agree one standard with several ways to meet it. \"The person's voice is heard\" can be met through speech, AAC, writing, an interpreter or a chosen supporter."
      : "Create a new norm when neither side's habit should win. A norm is an agreed way of working, and nobody is asked to change their values. \"Everyone contributes\" can be met by speaking, by writing before or after, or by talking one to one. No one is asked to disclose a disability to set it.",
    path === "service"
      ? "Adapt the process before the manners. A changed deadline, form, appointment rule or interpreter schedule says more than careful etiquette, and an agency apology does not replace changing the practice."
      : "Adapt the process before the manners. A changed meeting time, deadline, agenda notice or leave rule says more than careful etiquette, and an apology does not replace changing the practice.",
  ],

  resourceIds: path === "service" ? ["/learn/equity-toolkit", "/practice/clas"] : ["/practice/gp-4", "/areas/culture-trust"],
});

const plan = (path: Path): Step => ({
  id: "plan", title: "Plan, notice, check",
  question: "What is the hard moment most likely to be, and if it comes, what will you do?",
  guidance: "Plan before, notice what happens during the interaction, and check afterward what worked. Put your plan into two or three if-then sentences. This page has nowhere to type them and stores nothing; keep names and case details out of any notes of your own.",
  practices: path === "service"
    ? [
      "If a relative answers first, then I will thank them, turn back to the person in the way they communicate, and offer time alone.",
      "If the person agrees very quickly, then I will offer more time and another way to answer, and will not treat that yes as the end of it.",
      "If I notice I have already decided why something happened, then I will check the shift, the bus, the cost and the rule before I say anything.",
      "Before you go in, ask what you might be assuming about them, what they might be assuming about you, and what in the setting could explain this. Keep it to your assumptions and the setting. Do not guess at their life.",
      "During the conversation, notice before you respond, and breathe. If the person shows you your plan is wrong, drop it. Asking at the start how they would like to use the time can save you the trouble.",
    ]
    : [
      "If a colleague goes quiet, then I will not read that as agreement or disinterest, and I will offer writing afterward or a talk one to one.",
      "If my feedback meets silence, then I will stop, ask how they would like to continue, and offer to pick it up another day.",
      "If I catch myself thinking poor fit, then I will write down what the job requires and what I actually saw.",
      "Before you go in, ask what you might be assuming about them, what they might be assuming about you, and what in the team could explain this. Keep it to your assumptions and the setting. Do not guess at their life.",
      "During the conversation, notice before you respond, and breathe. If the person shows you your plan is wrong, drop it. Asking at the start how they would like to use the time can save you the trouble.",
    ],

  resourceIds: path === "service" ? ["/learn/intercultural/curriculum", "/library/ja-access-checks"] : ["/courses/dc-i30-culturally-intelligent-leadership", "/learn/intercultural/curriculum"],
});

const followThrough = (guidance: string, practices: string[], resourceIds: string[]): Step => ({
  id: "reflection", title: "Reflect and follow through",
  question: "What will you try, who can take the next step, and how will you know whether it helped?",
  guidance, practices,

  resourceIds,
});

const checkAfterward = (who: string) => [
  `Some days later, ask ${who} to tell you the next steps in their own words, spoken, written, through AAC or with someone they choose. It checks your explanation, not them.`,
  "Tell people what was decided, and say what you cannot share. Quiet rollouts leave some people out.",
  "Compare what happened with what you expected, and talk it over with someone you trust. A private journal can help; keep names and case details out of it. Nothing here is stored.",
  "Ask who will tell you whether it helped them. Your own sense of progress, or finishing a course, does not show that anything changed for them.",
];

const serviceSteps: Step[] = [
  ownCulture,
  drive("service"),
  {
    id: "person", title: "Begin with the person",
    question: "What does the person want to achieve, and what would make the next conversation or decision workable for them?",
    guidance: "Ask the person about their goals, choices and preferred support, and how they make decisions and with whom. Hear from them directly, even if family speaks first. Clarify what is open for a decision and who has authority. Use a general example when learning here. A group fact can give you a question to ask. It never tells you what to expect of this person.",
    practices: [
      "Before you meet, do not guess; offer. Prepare options for language, format, who is present and how they prefer to decide, then let the person choose.",
      "Who is in the room shapes what can be said. Family, an interpreter or a provider being there may change it, so offer a private option.",
      "Your power over services filters what reaches you. If an answer may be shaped by that, change how and by whom the question is asked: more time, several ways to answer, a chance to say it again later. Never conclude that the person cannot say.",
      "Be clear about which decisions are yours, which need input and which you cannot make. The person's own decisions are theirs.",
    ],

    resourceIds: ["/courses/ipe-04-person-centered-systems", "/library/tool-lifecourse"],
  },
  context,
  otherExplanations("service"),
  {
    id: "disability-intersection", title: "Bring in disability and where experiences meet",
    question: "How does this work for someone at the point where disability, language, race, age and income meet?",
    guidance: "Disability is part of every community. Do not assume how anyone identifies, and do not add up a person's identities. Look at the rule, form or process and ask who it fails when these things come together. For Deaf people who use ASL, language access and cultural relations come together, and nobody should have to choose between them.",
    practices: [
      "Before you read silence, eye contact, flat affect, pacing or a speech difference as cultural, consider disability and access.",
    ],

    resourceIds: ["/courses/dc-l14-disability-justice-and-intersectionality", "/courses/ipe-04-person-centered-systems"],
  },
  {
    id: "access", title: "Make access possible",
    question: "What language, format, communication support or other accommodation does the person prefer?",
    guidance: "Ask what works for the person, check the options you can offer, and follow applicable requirements for language access and accessibility. CLAS offers a way to consider culturally and linguistically appropriate services.",
    practices: [
      "Clear means different things to different people. Some want the action list and some want the reasons, so offer plain language, Easy Read, ASL or layered information.",
      "Slow down, drop idioms, repeat key points, use short sentences and visuals, leave pauses and give a written summary. Add captions and interpreters. This is access for everyone.",
      "\"Do you follow?\" does not check anything. Build in a way to see what actually landed.",
      "Send information early, say what you need from people, and offer several ways to respond.",
    ],

    resourceIds: ["/practice/clas", "/library/ja-access-checks"],
  },
  {
    id: "participation", title: "Include the people affected",
    question: "Whose perspective is needed while there is still an opportunity to shape the work?",
    guidance: "Explain the purpose and what can be influenced. Ask about a useful and accessible way to participate, and follow the appropriate process for the situation. Observe the existing direction for Native American individuals, communities and Tribal Nations.",
    practices: [
      "Say what the input will do. Is it to hear reactions, or to shape the decision? Whose view will count for more?",
      "Assume the picture reaching you is partial. People hold back for many reasons, including the power an agency has over them.",
    ],

    resourceIds: ["/learn/community-connections"],
  },
  {
    id: "decision", title: "Examine the decision",
    question: "What is being decided, who might be affected differently, and what level of review applies?",
    guidance: "Check current DHS policy and the Equity Analysis Toolkit user guide, and consult the responsible office or your equity director about what applies. The Toolkit supports the required process. The decision workspace can help you prepare; use the required official process for review and documentation. A brief learning check does not replace a required review. Compare options and identify what you still need to learn. Leaders can bring the same questions to policy, program and resource decisions.",
    practices: [
      "The less familiar the setting, the slower you should be to settle on a judgment. Pause and consider what information may be missing.",
      "Compare your plan with what you would usually do, and ask someone who knows the setting to read it.",
      "Separate what you can decide alone, what needs input, and what is not yours to decide.",
    ],

    resourceIds: ["/learn/equity-toolkit", "/learn/equity-toolkit/practice", "/learn/equity-toolkit/curriculum"],
  },
  {
    id: "supports", title: "Consider supports together",
    question: "What strengths, relationships, community resources, technology or eligible supports could help the person move toward their own goal?",
    guidance: "When it fits the situation, Charting the LifeCourse offers ways to consider a person's vision and the supports they choose. Check any resource before suggesting it; do not assume it is available or right for this person.",
    practices: [
      "Ask whose picture of a good life is shaping the plan, and whether there is more than one way to get there. Paid work and living alone are one picture among several.",
    ],

    resourceIds: ["/library/tool-lifecourse"],
  },
  adapt("service"),
  plan("service"),
  followThrough(
    "Make the next step clear and return to the person or people affected. If you have an IDI development plan, you may choose a relevant goal for your own learning; you can use this collection without taking an assessment or sharing results.",
    checkAfterward("the person"),
    ["/library/tool-idi", "/learn/equity-toolkit", "/learn/intercultural/curriculum"],
  ),
];

const workplaceSteps: Step[] = [
  ownCulture,
  drive("workplace"),
  {
    id: "colleague", title: "Begin with the people doing the work",
    question: "What do the people affected say would help them contribute, and what is actually open to change?",
    guidance: "Ask rather than assume, and do not expect one colleague to speak for a group. Use a general example when learning here. Complaints, investigations and discipline about a named person belong with Employee Culture, Human Resources or the civil-rights office, not this guide.",
    practices: [
      "Learn from what people choose to tell you, then check it against other sources. Knowing facts about a faith or a background matters less than noticing whether a difference affects whether someone feels safe at work.",
      "Your position filters what reaches you. Assume the picture is partial, and offer more than one way to tell you.",
    ],

    resourceIds: ["/areas/culture-trust", "/practice/gp-4"],
  },
  {
    ...context,
    question: "What history or experience could help you ask a better question about this team or process?",
    guidance: "A brief gives context for learning. It cannot tell you what a colleague believes, needs or prefers, and it should never shape a decision about them. Check the source and its date, then ask.",
    practices: [
      "Ask how past harm shapes the way people see this agency and its promises, including harm by institutions that served disabled people.",
      "Ask what is happening in the wider world that could reach this team, such as immigration policy, a war or prices. Treat it as a prompt to ask, never as an assumption about how a colleague is affected.",
      "Remember that facts alone can lead to overconfidence and stereotypes. Listen and check what matters to the person.",
    ],
  },
  otherExplanations("workplace"),
  {
    id: "disability-intersection", title: "Bring in disability and where experiences meet",
    question: "How does this practice work for a colleague at the point where disability, race, language, age and caregiving meet?",
    guidance: "Look at the practice, not the person. Do not add up a colleague's identities or assume how anyone identifies. Ask who a process fails when these things come together, and whether asking for an accommodation carries a cost for some people that it does not carry for others.",
    practices: [
      "Before you read silence, eye contact, flat affect, pacing or a speech difference as cultural, or as a performance problem, consider disability and access.",
    ],

    resourceIds: ["/courses/dc-l14-disability-justice-and-intersectionality", "/courses/dc-l62-reasonable-accommodation-the-supervisor-s-role"],
  },
  {
    id: "hiring", title: "Hiring",
    question: "What does this role actually require, and which of your criteria are habit or a picture of who has done it before?",
    guidance: "Test what the work requires, plan accessible outreach and structured interviews, and look at results with your Human Resources partner. Do not use intercultural assessment results to rank applicants or make hiring and promotion decisions.",
    practices: [
      "When you hear poor fit, ask what was actually observed. It may only mean someone works differently from the people already here.",
      "Do not score eye contact, presence or how much feeling someone shows. Each reads differently with culture and also with autism, blindness, Deaf communication or anxiety. Test what the work requires.",
      "Saying people do not apply leaves the process off the hook. Look at the hiring system, at why people leave, and at who is left out of information and decisions once they join.",
      "Ask Human Resources which rules apply to anonymous résumé screening, diverse panels, pay gap checks and floating holidays, and build accommodation into each stage.",
    ],

    resourceIds: ["/practice/gp-6", "/courses/dc-l53-reducing-bias-in-hiring-and-selection", "/areas/workforce"],
  },
  {
    id: "supervision", title: "Supervision",
    question: "How do your own expectations about feedback, deference, time and speaking up shape how you read a colleague's work?",
    guidance: "Separate what you observed from what you assumed. Ask how a person prefers to get feedback, keep the standard clear and the same for everyone, and check whether you are giving some people more detail or more benefit of the doubt than others.",
    practices: [
      "For a hard talk, find the energy to hear both sides, understand the issue, plan the talk, and adjust as it goes. Think further ahead when power and race are part of the feedback.",
      "Keep the value and change how, when and where. Rights and safety are values that stay.",
      "Requests, apologies and praise can carry different meanings. Most published leadership advice also carries one culture's habits, so filter it, including this.",
      "Check your own form and your own eye. Does the appraisal favor self-direction? Are you marking down someone who leaves early for family, or whose pace reflects a disability?",
    ],

    resourceIds: ["/courses/dc-i30-culturally-intelligent-leadership", "/courses/dc-l58-fair-and-bias-aware-performance-reviews"],
  },
  {
    id: "development", title: "Development",
    question: "Who hears about stretch assignments, mentoring and promotion, and who has to ask?",
    guidance: "Look at how opportunities are actually offered, and what time, access and sponsorship they take. Growth may mean greater contribution in a current role as well as interest in advancement.",
    practices: [
      "Difference shows most in informal time, where people drift back to the familiar. Who gets invited, and can everyone get to and take part in the event?",
      "A move between a county, a provider and the state is a cultural move too. Help people read the new setting, and accept that leaving can be a fair choice.",
      "Ask why people leave, and who is left out of information and decisions after they join.",
    ],

    resourceIds: ["/courses/dc-l57-equitable-access-to-stretch-assignments-and-prom", "/courses/dc-l59-mentoring-and-sponsorship-across-difference"],
  },
  {
    id: "belonging", title: "Belonging",
    question: "Who can disagree here, ask for what they need, or make a mistake without paying more for it than others do?",
    guidance: "Ask people what would make participation possible rather than assuming what works for everyone, and act on what you hear. Belonging is built in everyday practice, not by a course or a statement.",
    practices: [
      "Do not treat bias as someone else's issue. It is everywhere, and not everyone can see it from where they sit.",
      "Safety and honest disagreement need each other. Too much harmony costs honesty, and \"just being honest\" can cover for dismissing someone. Respect is not agreement.",
      "A word can honor from one person and offend from another. Ask, including about disability language, and work on words and on the system together.",
      "Allow no jokes aimed at any group, including disabled people.",
      "Notice who carries the extra work: the stories, the training, being the person everyone comes to. Ask whether the same people are always the ones adapting.",
    ],

    resourceIds: ["/practice/gp-4", "/areas/culture-trust"],
  },
  adapt("workplace"),
  plan("workplace"),
  followThrough(
    "Make the next step clear, name who owns it and return to the people affected. Leaders can bring these same questions to workforce decisions and workplace culture. If you have an IDI development plan, you may choose a relevant goal for your own learning; you can use this collection without taking an assessment or sharing results.",
    checkAfterward("the colleague"),
    ["/library/tool-idi", "/areas/workforce", "/learn/intercultural/curriculum"],
  ),
];

/** On a community start, context moves ahead of the people step. Own culture stays first and the energy check second. */
function orderSteps(path: Path, start: Start): Step[] {
  const steps = path === "workplace" ? workplaceSteps : serviceSteps;
  return start === "community" ? [steps[0], steps[1], steps[3], steps[2], ...steps.slice(4)] : steps;
}

const pathIntro: Record<Path, Record<Start, string>> = {
  service: {
    work: "Think of a general service situation, such as a notice, a meeting, a support plan, or a program or resource change. Keep names and case details out of this activity.",
    community: "Choose a brief that is relevant to the people this service reaches. Then return here to connect the context to a practical question. Keep names and case details out of this activity.",
  },
  workplace: {
    work: "Think of a general workplace situation, such as a hiring step, a supervision conversation, a development opportunity or how a team works together. Keep names and personnel details out of this activity.",
    community: "Choose a brief that helps you think about your team or a hiring or development practice. It describes context, never a colleague. Then return here. Keep names and personnel details out of this activity.",
  },
};

/** A private, optional guide. It collects no written details and stores no answers. */
export function CulturalIntelligenceWorkJourney({ resources, title = "Connect learning to your work" }: { resources: JourneyResource[]; title?: string }) {
  const instanceId = useId();
  const [path, setPath] = useState<Path>("service");
  const [start, setStart] = useState<Start | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const orderedSteps = orderSteps(path, start ?? "work");
  const current = orderedSteps[stepIndex];
  const links = current.resourceIds.flatMap(href => resources.filter(resource => resource.href === href));

  return <section aria-labelledby={`${instanceId}-title`} className="space-y-5 rounded-xl border border-line p-6">
    <h3 id={`${instanceId}-title`} className="text-2xl font-semibold">{title}</h3>
    <p>Choose what the work is about and where to begin. This optional guide brings your own culture, the people affected and relevant tools into the same work question. Nothing you choose here is saved; if you leave or reload the page, choose again.</p>
    <p>Use what you learn in everyday conversations and choices, and work directly with the people and communities affected by a decision. Learning and community briefs do not replace that engagement, or the everyday work of a welcoming, inclusive workplace.</p>

    <fieldset className="space-y-2">
      <legend className="font-semibold">What is the work about?</legend>
      <label className="flex items-start gap-3"><input type="radio" name={`${instanceId}-path`} checked={path === "service"} onChange={() => { setPath("service"); setStepIndex(0); }} /> <span>Services, programs and the people we serve</span></label>
      <label className="flex items-start gap-3"><input type="radio" name={`${instanceId}-path`} checked={path === "workplace"} onChange={() => { setPath("workplace"); setStepIndex(0); }} /> <span>The workplace: hiring, supervision, development and belonging</span></label>
    </fieldset>
    <fieldset className="space-y-2">
      <legend className="font-semibold">Where would you like to begin?</legend>
      <label className="flex items-start gap-3"><input type="radio" name={`${instanceId}-start`} checked={start === "work"} onChange={() => { setStart("work"); setStepIndex(0); }} /> <span>Start with a situation or decision in my work</span></label>
      <label className="flex items-start gap-3"><input type="radio" name={`${instanceId}-start`} checked={start === "community"} onChange={() => { setStart("community"); setStepIndex(0); }} /> <span>Start by exploring a community or cultural brief</span></label>
    </fieldset>
    {start && <div className="space-y-4" aria-live="polite">
      <p>{pathIntro[path][start]}</p>
      <p className="text-sm">Step {stepIndex + 1} of {orderedSteps.length}</p>
      <h4 className="text-xl font-semibold">{current.title}</h4>
      <p className="font-semibold">{current.question}</p>
      <p>{current.guidance}</p>
      <div><p className="font-semibold">Try this</p><ul className="mt-2 list-disc space-y-2 pl-5">{current.practices.map(practice => <li key={practice}>{practice}</li>)}</ul></div>

      {links.length > 0 && <div><p className="font-semibold">Explore a relevant resource</p><ul className="mt-2 space-y-2">{links.map(resource => <li key={resource.href}><Link className="underline" href={resource.href}>{resource.title}</Link></li>)}</ul></div>}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="rounded-lg border border-line px-4 py-2" disabled={stepIndex === 0} onClick={() => setStepIndex(index => index - 1)}>Previous</button>
        <button type="button" className="rounded-lg border border-line px-4 py-2" disabled={stepIndex === orderedSteps.length - 1} onClick={() => setStepIndex(index => index + 1)}>Next</button>
      </div>
    </div>}

  </section>;
}
