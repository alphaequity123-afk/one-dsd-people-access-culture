import type { PracticeCase, PracticeSource } from "../leadership/practice-types";
import { sources } from "./sources";

// Individually reviewed adaptations of the six branching exercises. Original
// cross-agency material and its research citations remain in the source JSON.
export const dsdLeadershipIntroduction = "Leadership helps create the conditions for people with disabilities to be heard, take part and pursue what matters to them. These fictional DSD situations bring that responsibility into everyday decisions about guidance, staffing, partnerships and support. Choose a situation that interests you. Try either path, consider what it reveals and return to explore another approach. The examples are invitations to reflect, not accounts of actual employees or service recipients.";

export const dsdLeadershipSources: PracticeSource[] = [
  {id:"dsd-tribal",title:sources.tribal.title,url:sources.tribal.url,finding:"Minnesota law establishes government-to-government consultation responsibilities for state agencies.",limit:"A community engagement exercise does not fulfill those responsibilities. Use the applicable agency consultation process and responsible Tribal relations staff.",application:"Clarify when a proposed decision calls for consultation rather than treating a public invitation as a substitute."},
  {id:"dsd-person",title:sources.person.title,url:sources.person.url,finding:"DHS describes practice that starts with what matters to the person and supports a meaningful life in the community.",limit:"This guidance informs the learning examples. The examples do not establish an individual's eligibility or replace the requirements that apply to a particular service.",application:"Ask whose priorities shaped the goal and how the person can correct the team's understanding."},
  {id:"dsd-communication",title:sources.communication.title,url:sources.communication.url,finding:"DOJ explains that effective communication depends on both the person's communication needs and the circumstances.",limit:"A learning exercise cannot determine the aid or service appropriate to an individual situation. Follow the applicable access process and involve the person.",application:"Follow a question through to an answer the person can receive, understand and respond to."},
  {id:"dsd-accommodation",title:sources.accommodation.title,url:sources.accommodation.url,finding:"EEOC guidance addresses reasonable accommodation in employment, including access to employment benefits and privileges.",limit:"Use the guidance with current law and the agency's HR and accommodation processes. A supervisor should not make an unsupported legal determination from this exercise.",application:"Plan usable learning opportunities and arrange individual access support through the appropriate process without disclosing private information."},
];

type Revision = Omit<PracticeCase,"id"|"competency"|"articleIds">;
const revisions: Record<string,Revision> = {
  "leading-self": {
    title:"When a concern about access feels personal",
    scenario:"You helped prepare a DSD guide for people exploring employment supports. At a team meeting, a colleague says, “A person using a screen reader could not find where to ask for help.” You remember the care that went into the guide, and the comment stings. The team plans to share it with county and Tribal nation partners tomorrow. The colleague has permission to describe the barrier, without sharing the person's identity. There is still time to listen and decide what needs attention.",
    decisionPrompt:"How will you make room for the concern while helping the team decide what to do next?",start:"opening",
    steps:[
      {id:"opening",prompt:"The team is waiting for a response. Where do you begin?",choices:[
        {label:"Thank the colleague and ask them to show the part of the guide that caused difficulty.",feedback:"The colleague demonstrates that the contact information sits inside an image. The visual review did not reveal the problem. The team now has a specific barrier to investigate, without asking anyone to disclose a person's service history.",next:"repair"},
        {label:"Arrange a short conversation immediately after the meeting and pause distribution until the concern is understood.",feedback:"A quieter conversation may make it easier to examine the problem together. Explain the pause to the team and set a decision time today, so the concern does not disappear into a private conversation.",next:"follow-up"},
      ]},
      {id:"repair",prompt:"The team can correct the contact text today. What else needs attention?",choices:[
        {label:"Ask the content owner and accessibility specialist to check the corrected route before release.",feedback:"The team can verify whether someone can find and use the contact information. A repair to this image does not establish that the entire guide is accessible. Agree how the remaining content will be checked and how people can obtain usable information meanwhile.",next:"finish"},
        {label:"Prepare an accessible contact section while the owner decides whether the full guide is ready to share.",feedback:"People may need the information before the full review is finished. An interim section can help if it reaches the same audience and provides a usable way to ask questions. Keep a named owner and date for the complete review.",next:"finish"},
      ]},
      {id:"follow-up",prompt:"The colleague says they were unsure whether it was welcome to question a nearly finished guide. What would help?",choices:[
        {label:"Acknowledge that concern and agree how staff can raise access barriers during future reviews.",feedback:"An invitation matters more when people see a response. Return to the team with the change, who will check it and what remains unresolved. Keep the person's private information out of the update.",next:"finish"},
        {label:"Offer to bring the barrier to the content owner and report the outcome to the colleague today.",feedback:"Taking responsibility can help move the repair forward. Follow through on the promised update, then discuss a route that does not depend on one person's availability when the next concern arises.",next:"finish"},
      ]},
    ],
    debrief:"The guide was meant to open a door to employment information. Hearing that it created a barrier can be uncomfortable, especially after careful preparation. A useful response makes room for that feeling while bringing attention back to the person trying to use the information. The colleague's account is an opportunity to improve both the guide and the way the team welcomes concerns.",
    reflection:["What did the colleague actually say, and what meaning did you add?","How will the person who raised the barrier learn what changed?"],
    smart:"Before the next guide is distributed, I will review its contact route with the content owner and an accessibility colleague, record any unresolved barrier and confirm who will follow up. I will share the outcome with the colleague who raised the concern.",
    pdsa:{plan:"Choose one draft guidance page and predict how someone using a keyboard would find help.",do:"Try that route with the appropriate reviewer. Use a fictional question rather than private service information.",study:"Compare the intended route with what the review revealed. Separate what was checked from what remains unknown.",act:"Correct the barrier within the team's authority, seek any needed approval and check the route again."},
    roles:{aspiring:"Ask a clarifying question and help document the access barrier without identifying the person.",supervisor:"Make time to respond and ensure the colleague receives an answer.",senior:"Ensure publication decisions include ownership, accessibility expertise and a way to respond when a barrier is reported."},
    sources:["dsd-communication","perspective","review","pdsa","smart"],
  },
  "leading-others": {
    title:"Making room to grow as a leader",
    scenario:"A DSD team needs someone to lead a short project improving partner guidance. One colleague regularly presents at meetings. Another has strong experience resolving confusing instructions and has asked for written preparation materials because of an access need. The second colleague rarely volunteers for meetings arranged at short notice. As the supervisor, you want the project to succeed and the opportunity to help someone grow. The assignment starts next week.",
    decisionPrompt:"How can you learn who is ready without confusing visibility with ability?",start:"opening",
    steps:[
      {id:"opening",prompt:"How will you introduce the opportunity?",choices:[
        {label:"Describe the responsibilities, invite interest across the team and provide a clear response window.",feedback:"Colleagues can decide whether the opportunity fits their interests. Include a usable way to ask about access support. Check the applicable assignment and selection process with HR before making commitments.",next:"evidence"},
        {label:"Ask HR about an interim arrangement while opening the longer assignment to interested colleagues.",feedback:"An interim arrangement may protect continuity if it is permitted. State its limits clearly; otherwise, introductions and early decisions may make the longer appointment seem settled before others can participate.",next:"support"},
      ]},
      {id:"evidence",prompt:"Two colleagues express interest. What will help you compare relevant experience?",choices:[
        {label:"Use a realistic guidance problem and a consistent way to consider each person's reasoning, with access arrangements.",feedback:"A relevant example can reveal how someone identifies a barrier and works with others to resolve it. Consider the actual responsibilities and arrange access through the appropriate process. A quick spoken answer is not automatically evidence of better judgment.",next:"finish"},
        {label:"Discuss previous examples and ask each person what they contributed and learned.",feedback:"Past experience offers useful evidence. It also reflects who received earlier opportunities. If someone has had fewer chances, consider a comparable demonstration allowed by the selection process rather than treating the missing opportunity as lack of ability.",next:"finish"},
      ]},
      {id:"support",prompt:"The interested colleague asks whether preparation materials will arrive before project meetings. How do you respond?",choices:[
        {label:"Discuss what would make participation usable and involve the appropriate accommodation contact as needed.",feedback:"The conversation can identify practical arrangements without requiring the colleague to explain private information to the team. Confirm who will provide materials and when. Keep selection decisions focused on the role's requirements.",next:"finish"},
        {label:"Begin sending the agenda and draft guidance to everyone in advance, then check privately whether more support is needed.",feedback:"Advance materials may improve meetings for several colleagues. A broadly useful change does not necessarily meet this person's individual access needs. Keep the individual conversation and applicable accommodation process available.",next:"finish"},
      ]},
    ],
    debrief:"A leadership opportunity can strengthen both the team and a colleague's sense of belonging. Fair consideration depends on relevant evidence and a usable way to participate. Do not assume that communication style, a disability or an accommodation request tells you how well someone can lead. Assignment rules, essential responsibilities and individual access arrangements still matter.",
    reflection:["Whose experience was easy to see, and whose contribution required a closer look?","What support will continue after selection so the successful colleague can contribute?"],
    smart:"Before the next development assignment, I will confirm the selection process with HR, describe the responsibilities and response window, and check that interested staff can access the materials and assessment. After selection, I will agree how support and feedback will continue.",
    pdsa:{plan:"Review one draft opportunity notice and predict what a colleague would need to decide whether to express interest.",do:"Ask a willing reviewer to find the responsibilities, deadline and access contact without sharing medical information.",study:"Note what was clear and what required insider knowledge. Check whether the available preparation time is realistic.",act:"Revise the notice and confirm the process before using it. Ask afterward whether the promised materials and support arrived."},
    roles:{aspiring:"Describe a skill you hope to develop and ask what experience would help you demonstrate it.",supervisor:"Provide relevant criteria, usable preparation and sustained support.",senior:"Review whether development opportunities and accessible training reach staff across roles, locations and schedules."},
    sources:["dsd-accommodation","review","pdsa","smart"],
  },
  "leading-the-organization": {
    title:"When a quick referral leaves a question unanswered",
    scenario:"A DSD director is reviewing a proposed expansion of a partner inquiry process. The dashboard shows that questions about disability employment supports move to the right team faster. Yet a disability organization reports that some people still do not know who will answer them. A forwarded question counts as complete in the dashboard, and the record does not show whether the person received a reply in a usable format. Funding decisions are due Friday.",
    decisionPrompt:"What would help you judge whether the faster process is helping people?",start:"opening",
    steps:[
      {id:"opening",prompt:"Which question will you bring to the review?",choices:[
        {label:"Can the receiving teams trace a small authorized sample from the first question to a usable answer?",feedback:"The review distinguishes forwarding from responding. Some records may lack an outcome even when someone replied. Keep unknown outcomes visible and use the approved systems and permissions for any review.",next:"measure"},
        {label:"Can the partner describe the barriers people have chosen to share, without providing private case information?",feedback:"The partner describes someone receiving another phone number after asking for a written reply. That account identifies an access question to investigate. It does not establish how common the problem is or what every person prefers.",next:"test"},
      ]},
      {id:"measure",prompt:"The records do not establish every outcome. How will you describe the funding choice?",choices:[
        {label:"Propose a limited trial with an owner who will check both response time and whether replies are usable.",feedback:"A bounded trial can help the director learn before expanding. Include the receiving teams and people who use different communication methods. Explain what will happen for anyone the trial cannot adequately support.",next:"finish"},
        {label:"Report the improvement in routing and the unanswered service questions separately.",feedback:"The decision maker can see which claim the evidence supports. Assign follow-up resources and a review date so the unresolved access question remains part of the decision after the budget discussion ends.",next:"finish"},
      ]},
      {id:"test",prompt:"The team suggests asking about a preferred reply method. What needs to happen next?",choices:[
        {label:"Check with the receiving teams how the requested methods can be supported before testing the question.",feedback:"An invitation to state a preference needs a workable response. Agree how staff arrange communication support and what happens when the requested method requires coordination beyond the first team.",next:"finish"},
        {label:"Invite people with disabilities to review a proposed confirmation message and follow-up route.",feedback:"People may identify confusing language or an unusable contact option before it is released. Arrange accessible participation, explain which decisions remain open and report how the feedback shaped the next version.",next:"finish"},
      ]},
    ],
    debrief:"A referral can be an important step toward an answer. It is not the same as the person being able to use that answer to make a decision about employment or support. Leadership can make that distinction visible in measures, resources and team responsibilities. A partner's account helps identify a question; careful follow-up helps establish its extent.",
    reflection:["What does the dashboard let the director conclude, and what does it leave unknown?","How could someone report a problem if the usual phone route is inaccessible to them?"],
    smart:"Within four weeks, I will agree with the receiving teams how to distinguish a referral, a confirmed reply and an unknown outcome in a small authorized review. I will bring the findings and one proposed improvement to the funding decision maker.",
    pdsa:{plan:"Define a usable reply and an unknown outcome with the receiving team. Predict what the current records can establish.",do:"Review a permitted sample in approved systems; use only aggregate, non-identifying observations in this exercise.",study:"Compare the routing measure with confirmed outcomes and gaps. Ask which communication routes the sample may miss.",act:"Revise the measure or handoff and decide what further evidence is needed before expansion."},
    roles:{aspiring:"Follow a fictional inquiry and identify where responsibility becomes unclear.",supervisor:"Agree how the receiving team confirms a next step and arranges communication support.",senior:"Resource the follow-up and make uncertainty part of the expansion decision."},
    sources:["dsd-communication","dsd-person","review","pdsa","smart"],
  },
  "leading-outside-the-organization": {
    title:"An invitation people can trust",
    scenario:"A disability-led organization has helped a DSD team invite people to discuss access to employment information. The invitation promises a chance to shape the approach. Two days before the gathering, the team learns that the current technology contract limits changes to the website this year. The content, outreach methods and ways to request help remain open. Several people have arranged transportation or communication support to attend. The partner needs to know what the conversation can genuinely influence.",
    decisionPrompt:"How will you respect people's time and preserve a meaningful opportunity to contribute?",start:"opening",
    steps:[
      {id:"opening",prompt:"What will you do before the gathering?",choices:[
        {label:"Talk with the partner now, explain the constraint and decide together whether to revise or reschedule the session.",feedback:"The partner wants people to have a choice about attending with the revised purpose. Agree how to reach participants in usable formats and retain the promised access arrangements if the session proceeds.",next:"scope"},
        {label:"Ask the contract owner what is fixed while informing the partner that the advertised scope needs clarification.",feedback:"Checking the constraint may reveal options or a future decision point. Do not leave the partner waiting for certainty. Say what is known, when clarification is expected and how participants will hear the answer before giving more time.",next:"options"},
      ]},
      {id:"scope",prompt:"A participant says the employment information assumes everyone can make a phone call. How will that shape the discussion?",choices:[
        {label:"Ask what would make the information usable and whether the person wants their suggestion shared with the decision maker.",feedback:"The person describes wanting a written question route and time to review a reply with a chosen supporter. This is one person's preference. Explore other needs without asking them to speak for everyone with a disability.",next:"finish"},
        {label:"Offer an accessible way to add ideas after the session, with a named contact and response date.",feedback:"More time can help people consider what they want to share. Check that the follow-up method is usable and that contributions arriving later will still influence the decision. Otherwise the invitation creates another barrier.",next:"finish"},
      ]},
      {id:"options",prompt:"The team can try one additional contact route this quarter. How will you discuss the choice?",choices:[
        {label:"Explain the available resources and invite participants to propose and compare approaches.",feedback:"Participants may suggest an option the team had not considered. Discuss who could use each approach, who might still be excluded and who has authority to approve the trial. Return with the decision and reasons.",next:"finish"},
        {label:"Bring two feasible starting options and keep a clear route for evaluating participants' alternatives.",feedback:"Concrete options can make discussion easier. They should not quietly close the decision. Assign someone to investigate alternatives and explain when the group will hear what is possible.",next:"finish"},
      ]},
    ],
    debrief:"People bring expertise from navigating services, finding employment and arranging daily support. A trustworthy invitation explains where that expertise can change a decision. Honest limits can coexist with meaningful participation when staff return with what changed, what did not and why. Community engagement also has a different purpose from government-to-government Tribal consultation; one does not stand in for the other.",
    reflection:["What would a participant reasonably expect from the invitation?","Whose participation depends on access arrangements, timing or a way to contribute outside the meeting?"],
    smart:"Before the next engagement session, I will agree with the partner on an open decision, known constraints, accessible participation arrangements and a response date. I will provide the decision and reasons through the agreed channels by that date.",
    pdsa:{plan:"Ask a partner to review what a draft invitation says people can influence.",do:"Compare their understanding with the decision owner's actual authority and check participation arrangements.",study:"Identify unclear promises and costs or access barriers the invitation overlooked.",act:"Revise the invitation before sending it and check afterward that participants received the promised response."},
    roles:{aspiring:"Help make the invitation and follow-up understandable and usable.",supervisor:"Protect staff time for access arrangements and responding to contributions.",senior:"Clarify decision authority, make space for alternatives and explain the final choice."},
    sources:["dsd-person","dsd-communication","dsd-tribal","olmstead","perspective","pdsa","smart"],
  },
  "getting-work-done": {
    title:"Keeping people visible when the team is stretched",
    scenario:"A DSD team has more partner guidance questions than it can answer this week. Some concern people preparing for a change in support; others ask how to find employment information. A few requests have moved into a shared inbox without the agreed reply method. The same staff are reviewing an inaccessible attachment before a planned distribution. Everyone wants to help, and the supervisor needs to set a realistic plan without letting a forwarded question disappear.",
    decisionPrompt:"How can the team protect important commitments and make delays visible?",start:"opening",
    steps:[
      {id:"opening",prompt:"Where will you begin the planning conversation?",choices:[
        {label:"Review time-sensitive obligations and promises with the team before assigning the available time.",feedback:"The review finds a promised reply and a request missing its next owner. Follow current procedures for urgent issues and required timelines. A team planning exercise cannot authorize delaying an obligation.",next:"coverage"},
        {label:"Ask the attachment owner what can be made usable now and what review remains before distribution.",feedback:"A bounded repair may prevent more people encountering the same barrier. It still competes for staff time. Make that trade-off visible and agree who will resolve any conflict with time-sensitive obligations.",next:"capacity"},
      ]},
      {id:"coverage",prompt:"What will help staff keep track of questions they cannot finish today?",choices:[
        {label:"Use the authorized system to record the next owner, expected action and agreed contact arrangements.",feedback:"The receiving colleague can see what needs to happen without relying on memory. Confirm missing information through the proper route and share only what is needed. Keep private case details out of this learning exercise.",next:"finish"},
        {label:"Ask another team to accept a defined set of questions and confirm the handoff.",feedback:"A specific agreement is more useful than an unacknowledged forward. Check that the receiving team has the authority, information and access support to respond. Until responsibility is accepted, the original team needs a clear next step.",next:"finish"},
      ]},
      {id:"capacity",prompt:"The team can reserve a short review period for the attachment. How will you make it useful?",choices:[
        {label:"Agree which barrier the review will address and who can decide whether the attachment is ready.",feedback:"A focused review helps staff use limited time well. Record what was and was not checked, then arrange a usable way to obtain the information while unresolved barriers are addressed.",next:"finish"},
        {label:"Meet today's required commitments and seek an owner for the attachment decision before distribution.",feedback:"This protects immediate obligations but leaves the access concern unresolved. Escalate the competing demands early enough for the responsible leader to decide; do not let a missed review become an accidental release decision.",next:"finish"},
      ]},
    ],
    debrief:"A full inbox can make it hard to see the person waiting behind each question. Clear ownership and realistic commitments help colleagues support one another and help people know what happens next. Leadership also involves bringing capacity conflicts to someone who can resolve them, rather than asking staff or people seeking support to absorb the consequences silently.",
    reflection:["Which requests become less visible when they move between teams or communication channels?","What can the team decide, and what needs a policy, accessibility or management decision?"],
    smart:"During the next two planning meetings, I will review a small permitted set of handoffs for a next owner and contact commitment. I will bring one recurring gap and a proposed improvement to the person responsible for the process.",
    pdsa:{plan:"Choose one routine handoff and predict whether the receiving colleague can identify the next action.",do:"Check a fictional example or an authorized record in the approved system, keeping private details out of learning notes.",study:"Compare the two teams' understanding and note where contact arrangements or responsibility became unclear.",act:"Agree a small improvement within the team's authority and check the next handoff before extending it."},
    roles:{aspiring:"Notice and raise an unclear handoff before a question loses its next owner.",supervisor:"Set realistic priorities, protect required commitments and seek help with capacity conflicts.",senior:"Resolve competing demands and check whether a faster internal process has shifted effort to people seeking support."},
    sources:["dsd-communication","review","pdsa","smart"],
  },
  "leading-with-deai": {
    title:"Letting the person's priorities lead",
    scenario:"During a DSD training session with service partners, you facilitate a fictional planning conversation. The person in the example wants their cousin involved when comparing support options and uses a communication device. A participant playing the professional wants to protect the person's freedom to speak. As the person prepares a reply, another participant turns to the cousin for an answer. The exercise offers a chance to explore how good intentions can affect whose voice guides a plan.",
    decisionPrompt:"How will you help the group notice the person's choices about support, pace and participation?",start:"opening",
    steps:[
      {id:"opening",prompt:"The cousin begins to answer. What would you model?",choices:[
        {label:"Return attention to the person and ask how they would like people to take turns.",feedback:"With time to respond, the person asks the cousin to explain two terms and then wants to answer personally. Chosen support and control over the conversation can coexist. The person's communication method does not tell the group what they can decide.",next:"support"},
        {label:"Offer a choice of a joint conversation, private time or another way to respond.",feedback:"The person chooses private time for one question and asks the cousin to return for the options discussion. Make those choices usable without treating family involvement or a request for privacy as a problem in itself.",next:"privacy"},
      ]},
      {id:"support",prompt:"A participant suggests writing “live alone” as the goal. How do you explore it?",choices:[
        {label:"Ask what a good week would look like and what the person hopes to change.",feedback:"The person describes choosing when friends visit and having reliable weekend support. Living alone was someone else's interpretation. Check the wording with the person rather than substituting a professional idea of independence.",next:"finish"},
        {label:"Offer concrete examples to compare and invite the person to add an option that is missing.",feedback:"Examples can help make a broad question understandable. They can also narrow the discussion to familiar arrangements. Leave time for the person's own priorities and identify who could explore an option that needs more information.",next:"finish"},
      ]},
      {id:"privacy",prompt:"In private, the person says they want to remain in their current home. What happens when the cousin returns?",choices:[
        {label:"Ask what may be shared and how the person would like to communicate it.",feedback:"The person chooses to explain the goal, then asks the cousin to help compare practical supports. Follow the person's choices and the applicable privacy process; do not promise confidentiality beyond what that process allows.",next:"finish"},
        {label:"Offer a way to prepare the preferred wording before the joint conversation resumes.",feedback:"Preparing wording can reduce the effort of repeating an important point. Let the person choose the method and correct it. Do not assume a recording is wanted or appropriate; use the applicable consent and information-handling process.",next:"finish"},
      ]},
    ],
    debrief:"Person-centered practice begins with a life the person values. That life may include family, community, culture and interdependence in ways a professional did not anticipate. The training helps partners examine a meeting habit; DSD can also examine whether its guidance, forms and expectations leave room for the same choices. Real planning must account for applicable rights, consent and decision-making arrangements without assuming that disability removes a person's voice.",
    reflection:["Which assumption shaped the first response: speaking quickly, answering alone or equating independence with living alone?","What would need to change in the meeting or guidance so the person's preferred pace is possible?"],
    smart:"In the next partner learning session, I will use a fictional example to practise offering choices about support and communication. I will ask participants to identify one change to facilitation or guidance and return to discuss what they learned from trying it.",
    pdsa:{plan:"Use a fictional exercise to predict whether the person can choose support, pace and a way to correct the goal.",do:"Invite a willing colleague to choose preferences for the fictional character. Do not ask them to imitate a disability or disclose personal experiences.",study:"Compare the goal recorded with the goal the character expressed. Discuss which meeting conditions made correction easier.",act:"Adjust one feature of the conversation or guidance and try a different set of preferences."},
    roles:{aspiring:"Practise asking about preferences and allowing time for a response.",supervisor:"Support facilitators to examine the moment a professional's assumption displaced the person's account.",senior:"Review whether guidance, schedules and documentation support individual choices, and assign ownership to barriers across teams."},
    sources:["dsd-person","dsd-communication","perspective","metacognition","pdsa","smart"],
  },
};

export function dsdLeadershipCases(originals: PracticeCase[]): PracticeCase[] {
  return originals.map(item => revisions[item.id] ? {...item,...revisions[item.id]} : item);
}
