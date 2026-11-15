import type { ScenarioFamily } from "./leadership-styles-pathway-types";

/**
 * Seven scenario families. Every situation is fictional, every line of dialogue is
 * original, and no scenario describes a real person, unit, complaint or decision.
 * Responses illustrate tendencies and choices. They are not scripts that predict
 * how anyone associated with a style would act.
 */
export const LEADERSHIP_SCENARIO_FAMILIES: readonly ScenarioFamily[] = [
  {
    id: "advancement",
    family: "Assignment and advancement opportunities",
    title: "The acting lead",
    situation: [
      "A unit needs someone to serve as acting lead for three months while the regular lead is on leave. The manager mentions the opening in a hallway conversation and offers it to a staff member they describe as “a natural fit.”",
      "Staff who work an evening schedule, a staff member who works fully remote, and a staff member returning from medical leave never hear about it. One of them, a Hmong American employee with eight years in the unit, asks the manager how the choice was made. The employee adds that acting roles have often led to permanent promotions in this unit.",
    ],
    matters: [
      "How the opportunity was announced, and who could not have known about it.",
      "What criteria were used, and whether they were job-related.",
      "The history of who has received acting roles and later promotions.",
      "Whether the selection followed the applicable human resources and selection process.",
      "Support for people who want to prepare for future acting roles.",
    ],
    formal: "Acting assignments and promotions may be covered by human resources rules, bargaining agreements and selection procedures. The manager should check with the person or area responsible for human resources before changing or defending the decision. A team conversation can improve future practice, but it cannot replace that process.",
    responses: [
      { slug: "directive", kind: "harmful", quote: "“I needed someone fast and I picked the person I knew could do it. That's my call.”", analysis: "The manager owns the decision but uses authority to close the question. “Someone I knew” is the very pattern being asked about." },
      { slug: "procedural", kind: "stronger", quote: "“You're right to ask. I'm going to check with human resources about what process applies to acting roles. Going forward, I'll post every acting opportunity in one place, with the criteria and a deadline everyone can meet.”", analysis: "The manager uses process to make the opportunity visible and reviewable. Checking the applicable process protects both the employee and the person selected." },
      { slug: "servant", kind: "harmful", quote: "“I'm sorry you missed this one. Let's make a development plan so you're ready next time.”", analysis: "Support is offered before anyone checks whether the employee was ever given a fair chance. Readiness was not the problem; awareness and access were." },
      { slug: "transformative", kind: "stronger", quote: "“Let's look at the last five years of acting roles: who got them, how they were offered, and who was later promoted. If informal offers have shaped who advances, we need to change that.”", analysis: "The leader looks at the pattern behind one decision. The review uses records the unit already has and does not presume the answer." },
      { slug: "transactional", kind: "stronger", quote: "“Every acting role will be posted for at least five working days, with criteria. We will track who applies and who is selected, and review it every six months.”", analysis: "This makes the commitment concrete and measurable. It works best together with the review of past patterns." },
    ],
    combination: [
      "Thank the employee and confirm there will be no adverse treatment for asking.",
      "Check the applicable human resources process before deciding anything about the current assignment.",
      "Review the history of acting roles and promotions with the authorized partners.",
      "Post future opportunities in one place, with job-related criteria and a deadline that works for every schedule.",
      "Offer preparation to anyone who wants it, without assuming who needs it.",
      "Report back to the team on what changed, and follow up with the employee by an agreed date.",
    ],
    discuss: [
      "What does “a natural fit” mean, and who has historically been seen that way?",
      "Which staff schedules or circumstances make hallway announcements a barrier?",
      "What would tell you, a year from now, that access to acting roles has improved?",
    ],
  },
  {
    id: "accessible-meetings",
    family: "Accessible meetings and accommodation routing",
    title: "The all-staff meeting",
    situation: [
      "A division holds a hybrid all-staff meeting. A Deaf staff member requested American Sign Language interpreting two weeks earlier. The interpreters were not booked. Live captions are turned off because “they slow down the platform.” A manager suggests sending meeting notes afterward.",
      "In the same week, a different staff member tells their supervisor they are having trouble with long video meetings because of a disability and asks whether they could join some meetings by phone or get materials in writing. The supervisor is unsure what to do and asks the team what they think.",
    ],
    matters: [
      "The missed interpreting request, which is an access failure for a request already made.",
      "Captions, which are a basic access feature for many people.",
      "The accommodation conversation, which belongs in the reasonable accommodation process, not a team discussion.",
      "The privacy of the staff member who disclosed a disability.",
      "Meeting practices that create the same barriers again and again.",
    ],
    formal: "Reasonable accommodation requests follow the agency's established process. A supervisor should not put the request to coworkers or make assumptions about whether a disability is real. Connect the person promptly with the designated decision-maker, explain who needs the information to handle the request, and protect it from unnecessary disclosure. Supporting information belongs in the authorized process. Meanwhile, address access barriers within your authority; a team vote does not decide an individual request.",
    responses: [
      { slug: "participative", kind: "harmful", quote: "“Let's ask the team whether we should allow phone-in options for meetings.”", analysis: "The supervisor turns one person's accommodation request into a group decision and exposes a private disclosure. Participation is the wrong tool here." },
      { slug: "procedural", kind: "stronger", quote: "“Thank you for telling me. I'll connect you with the accommodation process today and keep what you've shared private. In the meantime, I'll send written materials ahead of our meetings for everyone.”", analysis: "The supervisor routes the request correctly, protects privacy and makes an immediate change that helps everyone without singling anyone out." },
      { slug: "directive", kind: "stronger", quote: "“From now on, captions are on for every meeting we host, and interpreter requests are confirmed in writing within two working days. If they can't be confirmed, the meeting moves.”", analysis: "Directive authority is used well: it sets a clear access floor and makes the consequence of a missed request fall on the meeting, not on the Deaf staff member." },
      { slug: "laissez-faire", kind: "harmful", quote: "“The notes will go out after. Let me know if anything else comes up.”", analysis: "The leader leaves the barrier in place and puts the work of following up on the person who was excluded." },
      { slug: "inclusive", kind: "stronger", quote: "“You should have had full access to this meeting, and you didn't. I'm sorry. Before the next meeting, I'll confirm interpreting with you, and we'll make sure the recording is captioned and interpreted.”", analysis: "The leader names the exclusion plainly, apologizes without excuses and commits to a specific fix with a date." },
    ],
    combination: [
      "Acknowledge the missed interpreting request directly to the Deaf staff member and fix it for the next meeting.",
      "Turn on captions as the default for every meeting.",
      "Route the second staff member's request to the accommodation process the same day, and keep it private.",
      "Share materials ahead of time and in accessible formats for everyone.",
      "Assign one person or area responsible for confirming access requests, with a deadline.",
      "Check back with both staff members on whether the changes worked.",
    ],
    discuss: [
      "Why is a team vote the wrong way to handle an accommodation request?",
      "Which access features could become the default so fewer people need to ask?",
      "Who is responsible for confirming interpreting in your work, and by when?",
    ],
  },
  {
    id: "community-input",
    family: "Community input that conflicts with leadership preferences",
    title: "The listening sessions",
    situation: [
      "A program is redesigning how families learn about a new support option. Leadership prefers a short online survey and the original launch date. In listening sessions, Somali and Latino families, and several disability advocates, ask for in-person sessions in the evening, with interpreters, and for the notice to be rewritten in plain language before launch.",
      "Meeting their requests would delay the launch by six weeks. A senior leader says, “We heard them, but we can't let a few voices hold up the whole program.”",
    ],
    matters: [
      "Whether the community input can still change the decision, or whether the decision was already made.",
      "The cost of the delay compared with the cost of launching a notice families cannot use.",
      "Who decides, and how the decision will be explained to the people who gave input.",
      "Whether the people who gave input were offered compensation or support for their time.",
    ],
    formal: "The Aging and Disability Services Administration (ADSA) Outreach and Engagement Guide helps staff plan engagement, access and reporting back. The Department of Human Services (DHS) Equity Policy and the Equity Analysis Toolkit are existing agency requirements for examining how a decision affects people. Any Tribal consultation or coordination process that applies must also be followed.",
    responses: [
      { slug: "charismatic", kind: "harmful", quote: "“I know these families. I've worked with them for years. Trust me, they'll be glad we launched on time.”", analysis: "The leader's personal relationship replaces what families actually said. Their input is overruled by the leader's confidence." },
      { slug: "participative", kind: "stronger", quote: "“Here is what we heard, and here is what we can change. We can rewrite the notice in plain language and add two evening sessions with interpreters. The launch date can move three weeks, not six. We will come back to you in a month with what happened.”", analysis: "The leader is honest about limits, shows how input changed the decision and commits to reporting back." },
      { slug: "transactional", kind: "harmful", quote: "“We held the required number of listening sessions. That box is checked.”", analysis: "Completion is measured, not influence. The sessions happened, but nothing changed because of them." },
      { slug: "transformative", kind: "stronger", quote: "“If our process only works for families who can fill out an online survey in English, the process is the barrier. Let's ask what it would take for these families to shape the next phase from the start.”", analysis: "The leader turns one conflict into a change in how the program engages from now on." },
      { slug: "shared", kind: "stronger", quote: "“Let's invite two of the community members to join the design group, with pay for their time, and give the group authority over the notice wording.”", analysis: "Community members get real authority, not only a listening session. Paying for their expertise recognizes it as work." },
    ],
    combination: [
      "Tell participants plainly what can and cannot change before asking for input.",
      "Use the Equity Analysis Toolkit to compare the effects of launching now with the effects of a short delay.",
      "Make the changes that are possible, and explain the ones that are not.",
      "Offer accessible, interpreted options and compensation for community expertise where appropriate.",
      "Report back to participants on what their input changed, by an agreed date.",
    ],
    discuss: [
      "When is a delay the more equitable choice?",
      "How do you tell people honestly what their input can change?",
      "What does “a few voices” mean when those voices represent the families most affected?",
    ],
  },
  {
    id: "provider-access",
    family: "Provider or service-access barriers",
    title: "The online intake form",
    situation: [
      "A contracted provider changes its intake process. Families must now complete an English-only online form and upload a photo ID before anyone will talk with them. Within two months, referrals from families in Greater Minnesota and from immigrant families drop sharply.",
      "Staff disagree. Some say the contract allows the provider to set its own intake process. Others say families are being turned away before anyone hears their needs.",
    ],
    matters: [
      "The access barrier for families, which is the central problem.",
      "What the contract says, and what authority the program has to require changes.",
      "Whether the drop in referrals is real and who is affected most.",
      "Language access and disability access requirements that apply to the service.",
      "The working relationship with the provider.",
    ],
    formal: "The person or area responsible for the contract decides what can be required of the provider. Language access and accessibility obligations are existing requirements and are not optional because a contract is silent. Staff should raise the barrier through the contract channel rather than negotiate privately with the provider.",
    responses: [
      { slug: "procedural", kind: "harmful", quote: "“The contract lets them set their own intake. Nothing we can do.”", analysis: "Compliance with the contract is treated as the end of the question, even though families are being turned away." },
      { slug: "directive", kind: "stronger", quote: "“I'm raising this with the contract manager today. Until it's resolved, our staff will help any family who calls us complete intake by phone.”", analysis: "The leader acts within their authority right away and protects families while the formal question is worked out." },
      { slug: "transformative", kind: "stronger", quote: "“Let's find out who is being screened out and why. Then let's make language and disability access part of every contract renewal, not just this one.”", analysis: "The leader moves from one provider's problem to the contract rules that let it happen." },
      { slug: "servant", kind: "stronger", quote: "“Let's ask a few families and community organizations what happened when they tried the new form, and what would have helped.”", analysis: "The leader starts with the experience of the people affected. This works best paired with someone who can change the contract." },
      { slug: "laissez-faire", kind: "harmful", quote: "“That's between the provider and the families.”", analysis: "The leader steps back from a barrier the program is responsible for. Families with the least access carry the cost." },
    ],
    combination: [
      "Protect families now with an alternative way to complete intake.",
      "Raise the barrier through the person or area responsible for the contract.",
      "Gather evidence on who is affected, protecting privacy.",
      "Ask families and community organizations what would help.",
      "Build language and disability access into future contract terms.",
      "Follow up on referral numbers by group, where privacy allows, and report what changed.",
    ],
    discuss: [
      "When a contract is silent, what obligations still apply?",
      "What could your program do this week to protect families, before the contract question is resolved?",
      "How would you know whether access improved?",
    ],
  },
  {
    id: "scarce-resources",
    family: "Scarce resources and competing priorities",
    title: "One budget, two needs",
    situation: [
      "A division has a small one-time budget. One team wants to translate a widely used notice into several more languages. Another team wants to fund training for staff on serving families with disabilities. Both are worthwhile. There is enough money for one.",
      "The two team leads are friendly, but the disagreement has become tense. Each believes the other is not taking the needs of the families they serve seriously.",
    ],
    matters: [
      "Clear criteria for choosing between worthwhile options.",
      "Evidence about who would benefit and who would be left out under each option.",
      "Whether there are other funding sources or a way to phase both.",
      "The working relationship between the two teams.",
    ],
    formal: "DHS Equity Policy sets requirements for applying an equity lens to budget work; the official Equity Analysis Toolkit supports that review. First confirm any existing language-access, accessibility, or other obligations with the responsible office; a choice between proposed projects does not suspend those duties. The person with budget authority decides among the available lawful options. The Toolkit structures the comparison rather than deciding the answer.",
    responses: [
      { slug: "charismatic", kind: "harmful", quote: "“Let's go with training. I've seen how powerful it can be.”", analysis: "The decision follows the leader's enthusiasm, not criteria or evidence about who benefits." },
      { slug: "participative", kind: "stronger", quote: "“Let's agree on the criteria first, before we argue about the options. Then both teams can make their case against the same criteria.”", analysis: "Agreeing on criteria first turns a contest between people into a comparison of options." },
      { slug: "transformative", kind: "stronger", quote: "“Under each option, who benefits, who carries the cost, and who gets left out? Let's look at whether one option reaches families who have had the least access.”", analysis: "The leader makes the distribution of benefits and burdens the center of the decision." },
      { slug: "directive", kind: "stronger", quote: "“I'll make the decision by Friday using the criteria we agreed on. I'll explain my reasons in writing, and I'll look for funding for the other option next year.”", analysis: "A decision is made on time, with reasons, and the option not chosen is not forgotten." },
      { slug: "laissez-faire", kind: "harmful", quote: "“You two work it out between yourselves.”", analysis: "The leader leaves a budget decision they are responsible for to an informal contest. The team with more influence wins." },
    ],
    combination: [
      "Name the decision-maker and the deadline.",
      "Agree on criteria before comparing options.",
      "Use the Equity Analysis Toolkit to compare effects on different groups.",
      "Look for ways to phase or partly fund both.",
      "Decide, explain the reasons in writing, and keep the other need on record.",
      "Check the results and revisit the decision next budget cycle.",
    ],
    discuss: [
      "Why should criteria come before the comparison?",
      "How do you keep a choice between two worthwhile needs from becoming a contest between two teams?",
      "What makes a decision explainable to the team that did not get the funding?",
    ],
  },
  {
    id: "change-disagreement",
    family: "Staff disagreement during organizational change",
    title: "The new case model",
    situation: [
      "Two units are merging, and leadership introduces a new model for assigning cases. Many longtime staff say the model ignores what they know about the families they serve. Some newer staff like it.",
      "An African American staff member raises detailed concerns in a meeting about how the model will affect families who rely on a consistent worker. Afterward, a manager describes her as “not a team player” in a conversation with other leaders.",
    ],
    matters: [
      "The substance of the concerns about the model.",
      "The label applied to the staff member who raised them, and whether it could become adverse treatment.",
      "How the change is being carried out and who is affected most.",
      "Whether staff have real influence over the details of the change.",
    ],
    formal: "If labeling a staff member for raising concerns leads to worse assignments, evaluations or opportunities, it may become retaliation. Concerns about retaliation should go to the person or area responsible for responding to them. The change itself can be shaped through normal leadership channels.",
    responses: [
      { slug: "transformational", kind: "harmful", quote: "“Change is hard. We need everyone on board with the vision.”", analysis: "Disagreement is recast as resistance. The concerns, and the label, go unexamined." },
      { slug: "adaptive-situational", kind: "stronger", quote: "“We'll start the new model as planned for most cases, but we'll test it carefully for families who rely on a consistent worker. In eight weeks we'll review what we learned with staff.”", analysis: "The leader moves ahead while treating the concern as information to test, with a time limit and a review." },
      { slug: "ethical", kind: "stronger", quote: "“Raising detailed concerns is part of the job. I'm not going to accept anyone being labeled for doing it, and I'll make sure it doesn't affect anyone's assignments or evaluations.”", analysis: "The leader addresses the label directly and protects the staff member from adverse treatment." },
      { slug: "authoritarian", kind: "harmful", quote: "“The decision has been made. People who can't support it should think about whether this is the right place for them.”", analysis: "Disagreement is punished with an implied threat. The people who raised concerns, and others who share them, go silent." },
      { slug: "shared", kind: "stronger", quote: "“Let's form a small group of longtime and newer staff with authority over the rollout details, and let it report to leadership every two weeks.”", analysis: "The people closest to the work get real influence over how the change happens." },
    ],
    combination: [
      "Treat concerns as information and take the substance seriously.",
      "Address the “not a team player” label directly and protect against any adverse treatment.",
      "Test the model where the concerns are strongest, with a time limit.",
      "Give staff real authority over rollout details.",
      "Report back on what was learned and what changed.",
    ],
    discuss: [
      "How can you tell resistance to change from a real problem with the change?",
      "Who is most likely to be labeled for raising concerns, and why?",
      "What would show staff that disagreement is safe during this change?",
    ],
  },
  {
    id: "leader-repair",
    family: "A leader's own mistake and repair",
    title: "Credit and names",
    situation: [
      "At a leadership briefing, a manager presents an analysis and credits the wrong staff member. The two staff members are both Southeast Asian American, and the manager has confused their names before.",
      "The staff member who did the analysis hears about it later from a colleague. They say nothing to the manager, but tell a coworker, “It's not the first time.”",
    ],
    matters: [
      "The credit for the work, which needs to be corrected where it was given.",
      "The repeated name confusion and what it signals to both staff members.",
      "Whether the staff member feels safe raising it.",
      "What the manager will do differently.",
    ],
    formal: "Correct the credit and address the repeated name confusion. Repair does not replace any applicable reporting or response obligation when the conduct raises a concern about race or national origin. Use the authorized process rather than deciding that an apology settles the concern. Do not ask the staff member to reassure the manager.",
    responses: [
      { slug: "charismatic", kind: "harmful", quote: "“I'm terrible with names. Everyone knows that about me!”", analysis: "The response treats a repeated mistake as a charming quirk and avoids its effect on professional recognition. The example calls for examining the pattern; it does not establish the manager's motive." },
      { slug: "ethical", kind: "stronger", quote: "“I credited the wrong person for your analysis, and I've confused your names before. That's not acceptable, and I'm sorry. I've corrected the credit with everyone who was at the briefing.”", analysis: "The manager names the mistake specifically, takes responsibility without excuses and corrects it where the harm happened." },
      { slug: "servant", kind: "stronger", quote: "“Is there anything else you'd like me to do to set this right? You don't need to answer now.”", analysis: "The manager offers the staff member a voice in the repair without putting them on the spot." },
      { slug: "directive", kind: "harmful", quote: "“It was an honest mistake. Let's not make a big deal of it.”", analysis: "The manager decides how much the mistake matters. The person harmed is told how to feel about it." },
      { slug: "procedural", kind: "stronger", quote: "“From now on, every analysis I present will list the author on the first page, and I'll check names before any briefing.”", analysis: "The manager turns a personal apology into a practice that prevents the same harm." },
    ],
    combination: [
      "Acknowledge the specific mistake promptly, privately first, with no excuses.",
      "Correct the credit with the same people who heard it wrong.",
      "Name the pattern, not only the one incident.",
      "Change a practice so it does not happen again.",
      "Do not ask the staff member for reassurance or forgiveness.",
      "Follow up later to see whether trust has been restored, and accept it if it takes time.",
    ],
    discuss: [
      "What separates an apology from a repair?",
      "Why is “I'm terrible with names” not a neutral statement in this situation?",
      "What makes it safe for a staff member to tell a leader about a mistake like this?",
    ],
  },
];
