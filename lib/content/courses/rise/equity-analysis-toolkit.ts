import type { RiseBlock, RiseCourse, RiseLine } from "./types";

/**
 * DHS Equity Analysis Toolkit, rebuilt as a Rise course (owner, 2026-11-27). It follows the six-step DHS 2023
 * Equity Analysis Toolkit and Scan Guide exactly as the live analysis tool does (lib/consultant-toolkit/instrument.ts):
 * Preparation, then 1 Set desired results and outcomes, 2 Data, 3 Engaging communities, 4 Benefits and burdens,
 * 5 Implementation, 6 Accountability, communication and evaluation of results. The recurring cast plays one DHS team
 * working a change through every step (named by role, voiced by their approved voices); Kelly (C3) narrates.
 * Enriched with current practice: Minnesota's enterprise Equity Analysis Tool, lessons from government equity-impact
 * work, King County's Equity Impact Review, and current small-numbers data guidance. Each lesson connects to the
 * analysis tool, and the engagement and results lessons to the Minnesota Communities briefs.
 */
const P = "/images/courses/equity-analysis-toolkit/";
const img = (name: string, alt: string) => ({ src: `${P}${name}.webp`, alt });
const cast = (n: number, role: string, alt: string) => ({ src: `/images/cast/C${n}.webp`, alt, role });
export const TOOLKIT_TOOL = "/equity-review/toolkit";
const OVERVIEW = "/learn/equity-toolkit";
const BRIEFS = "/minnesota-communities";

/* The team. Roles only, never names; each role is played by one cast member in their own voice. */
const PM = { cast: 2, role: "Program manager" };
const DIRECTOR = { cast: 4, role: "Division director" };
const EQUITY = { cast: 5, role: "Equity director" };
const COUNTY = { cast: 6, role: "County services supervisor" };
const BUDGET = { cast: 7, role: "Budget analyst" };
const ANALYST = { cast: 8, role: "Management analyst" };
const ENGAGE = { cast: 1, role: "Community engagement specialist" };
const say = (who: { cast: number; role: string }, text: string): RiseLine => ({ ...who, text });
const person = (who: { cast: number; role: string }) => cast(who.cast, who.role, `${who.role}, a member of the team in this course.`);
const work = (step: string, text: string, also?: { label: string; href: string }[]): RiseBlock =>
  ({ kind: "useAtWork", tool: "DHS Equity Analysis Toolkit", step, href: TOOLKIT_TOOL, text, also });

export const equityAnalysisToolkit: RiseCourse = {
  id: "dhs-equity-analysis-toolkit",
  title: "DHS Equity Analysis Toolkit",
  eyebrow: "Start here · For all staff",
  summary: "Use the Toolkit while a decision can still change: name who is affected, look at the evidence, hear the people who carry the burden, change the design and plan who follows through.",
  description: [
    "The DHS Equity Analysis Toolkit is a method, not a form. Used before a decision is final, it shows who a change will help, who will carry its costs, and what to change while there is still time. Used after the vote, it only decorates a choice that was already made.",
    "In this course you'll follow one DHS team as it moves county visit requests from the phone to an online form. You'll work through the Toolkit's preparation and its six steps with them, and each lesson ends with a link to the same step in the analysis tool, so you can do it on your own work.",
  ],
  cover: img("cover", "A team works through a proposal together at a table."),
  outcomes: [
    "Explain what the Toolkit is for, and when a full analysis or a scan fits.",
    "Spot the common ways an analysis turns into a cover sheet.",
    "Prepare a team that can see who is affected, and plan for the perspectives it's missing.",
    "Set results and outcomes, read the data behind them and engage the people most affected, using the community briefs.",
    "Weigh benefits and burdens and change the proposal to reduce harm.",
    "Plan implementation that is funded and staffed, and decide how results will be measured, shared and corrected.",
  ],
  sections: [
    {
      title: "Before you start",
      lessons: [
        {
          id: "dhs-equity-analysis-toolkit-1",
          title: "What the Toolkit is for",
          minutes: 9,
          blocks: [
            { kind: "text", paragraphs: [
              "Every week, DHS teams make decisions that will last: a new rule, a budget line, a hiring process, a technology change, a contract, a different way to deliver a service. The Equity Analysis Toolkit is how you check, before the decision is final, who that change will help and who will pay for it.",
              "The key word is before. An analysis done while the work can still change can move the design. The same pages filled in after the vote can only describe a choice that was already made.",
            ] },
            { kind: "image", image: img("l1", "A team reviews a proposal together before a decision.") },
            { kind: "statement", text: "If the decision is already made and the Toolkit is a cover sheet, you are not doing an analysis. You are decorating a choice." },
            { kind: "tabs", heading: "Full analysis or scan?", intro: "Select each tab.", items: [
              { label: "Full analysis", body: "The DHS Equity Policy calls for a formal analysis when an action will have a prolonged or long-term impact and needs leadership approval: policy, budget, hiring, technology, contracts, service delivery. Work through preparation and all six steps." },
              { label: "Equity scan", body: "A shorter, honest version of the same six questions, when current guidance says a scan fits or to check work that already had a full analysis. A short timeline alone doesn't make a scan enough, and a scan is never a blank." },
            ] },
            { kind: "flashcards", heading: "The six steps", intro: "After preparation, the DHS Toolkit has six steps. Turn each card.", cards: [
              { front: "1. Set desired results and outcomes", back: "What the proposal is, the results you want in the community, the outcomes for DHS, and who it affects." },
              { front: "2. Data", back: "What the evidence shows about inequities and their causes, what success would look like, and what's missing." },
              { front: "3. Engaging communities", back: "Who is most affected, how you involved them and what they told you." },
              { front: "4. Benefits and burdens", back: "Who gains, who carries the costs, and how you'll change the proposal to reduce harm." },
              { front: "5. Implementation", back: "The plan: actions, who is responsible, dates and resources, and whether it's funded and staffed." },
              { front: "6. Accountability, communication and evaluation", back: "How you'll measure results, share them with the people affected and correct course." },
            ] },
            { kind: "continue" },
            { kind: "accordion", heading: "Where the Toolkit comes from", intro: "Select each heading.", items: [
              { title: "The DHS guide", body: "The DHS Equity Analysis Toolkit and Scan Guide (2023) is a companion to the DHS Equity Policy. Its six steps follow the method of the Government Alliance on Race and Equity, used by governments across the country." },
              { title: "One approach across state government", body: "Minnesota's enterprise Equity Analysis Tool was built by the Office of Equity, Opportunity, and Accessibility with the Office of Inclusion and equity practitioners from several agencies, DHS among them. It shares the same purpose: find and reduce disparities in decisions, policies, programs and practices." },
              { title: "What works elsewhere", body: "Places that do this well, from King County to the District of Columbia, report the same lessons: start early, use clear guidance on what to include, end with a plain conclusion and its limits, and make someone accountable for what comes next." },
              { title: "What stays with you", body: "You own the analysis of your own work. Your equity director or committee helps you align it. Civil rights, Tribal consultation and labor relations keep their own formal paths; the Toolkit doesn't replace them." },
            ] },
            { kind: "scenario", image: img("l1", "The team at the table."), character: person(DIRECTOR), title: "Meet the team", setup: "A division director wants county visit requests to move from the phone to an online form by October. The program manager leading the change has six weeks.",
              lines: [
                say(DIRECTOR, "We need this live by October. Can we attach the equity form at the end so it doesn't slow us down?"),
                say(PM, "If we attach it at the end, it can't change anything. I'd rather use it now, while we can still adjust the design."),
              ],
              question: "What's the right way to use the Toolkit here?", options: [
                { text: "Fill it in after approval, so the final decision is described accurately.", feedback: "A record written after the decision can explain a choice, but it can't test or change it." },
                { text: "Start now with preparation, and use the six steps to shape the design before October.", feedback: "Right. The Toolkit is most useful while the design can still move.", best: true },
                { text: "Only use it if someone files a complaint.", feedback: "The Toolkit is meant to prevent harm, not to respond after it." },
              ] },
            { kind: "check", question: "A team finishes a hiring process, then attaches a blank Toolkit to the packet. What is this?", options: [
              { text: "Compliance: the form is in the packet." },
              { text: "A cover sheet. The analysis needed to happen while the process could still change.", correct: true },
              { text: "Enough, as long as equity staff sign off." },
            ], right: "The Toolkit is the method before the lock, not a page added after it.", wrong: "A form attached after the decision describes a choice; it doesn't test one. Work through the steps while the work can still move." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Use the Toolkit before a decision is final, while the work can still change.",
              "A full analysis and a scan ask the same six questions; a blank form answers none.",
              "You own the analysis of your work; formal paths stay formal.",
            ] },
            work("Start an analysis", "Pick one piece of work that's still moving and open it in the analysis tool. You'll carry it through the rest of the course.", [{ label: "The Toolkit overview", href: OVERVIEW }]),
          ],
        },
        {
          id: "dhs-equity-analysis-toolkit-2",
          title: "How an analysis turns into a cover sheet",
          minutes: 8,
          blocks: [
            { kind: "text", paragraphs: [
              "Most analyses that fail don't look like failures. They look finished. They say the right words, they arrive on time, and they change nothing.",
              "Knowing the common patterns makes them easy to spot, in other people's packets and in your own.",
            ] },
            { kind: "image", image: img("l2", "Colleagues review a printed packet together.") },
            { kind: "accordion", heading: "Four patterns to watch for", intro: "Select each heading.", items: [
              { title: "The slogan", body: "\"This advances equity for all Minnesotans.\" No groups, no change a person would recognize. If a sentence could fit any project, it isn't analysis." },
              { title: "The blended number", body: "The statewide average improved. But the county, language group or disability group hit first isn't broken out, or there's no breakout at all." },
              { title: "Monitor later", body: "The burden is already visible, and the plan is a dashboard next year. That's a delay, not a change to the proposal." },
              { title: "After the vote", body: "The analysis is written once the decision is made. It may be accurate, but it can no longer shape anything." },
            ] },
            { kind: "statement", text: "\"All Minnesotans will benefit\" is not a finding. It's how a burden stays unnamed." },
            { kind: "continue" },
            { kind: "flashcards", heading: "Turn each card", intro: "Common lines, and what's really going on.", cards: [
              { front: "\"We don't have that data, so we'll skip it.\"", back: "Data gaps are part of step 2. Write what's missing and how you'll get it, or the risk of deciding without it." },
              { front: "\"Engagement was a webinar.\"", back: "Who was in the room? If it was only supervisors, say so. That isn't hearing from the most affected people." },
              { front: "\"Equity staff will catch it.\"", back: "They help you align your analysis. They don't write it for you at the last minute." },
              { front: "\"A scan means we can keep it vague.\"", back: "Shorter, yes. Vague, no. A scan still answers the six questions honestly." },
            ] },
            { kind: "sorting", heading: "Which pattern is this?", intro: "Place each card.", categories: ["The slogan", "The blended number", "Monitor later"], items: [
              { text: "\"This initiative advances equity for all.\"", category: 0 },
              { text: "Statewide average wait improved; no county or language breakout.", category: 1 },
              { text: "\"Burdens will be reviewed after go-live.\"", category: 2 },
              { text: "\"DHS is committed to inclusion\" as the whole analysis.", category: 0 },
              { text: "A phone line in year two instead of keeping the current one now.", category: 2 },
              { text: "Average completion time, all applicants combined.", category: 1 },
            ], done: "Good. Each pattern looks finished; each one leaves the burden unnamed." },
            { kind: "scenario", image: img("l2", "The team reviews a draft."), character: person(ANALYST), title: "The first draft", setup: "The program manager's first draft says the online form \"will improve access for all Minnesotans\" and that \"impacts will be monitored after launch.\"",
              lines: [
                say(ANALYST, "The statewide wait time should drop. That's a good story for the packet."),
                say(COUNTY, "Statewide, maybe. My night staff and the families who call from our lobby aren't in that average."),
              ],
              question: "What's wrong with the draft?", options: [
                { text: "Nothing. Monitoring after launch is a safeguard.", feedback: "If a burden is already visible, monitoring later doesn't move it." },
                { text: "It uses a slogan, a blended number and monitor-later. Name the groups, break out the data and change the proposal now.", feedback: "Exactly. Those three patterns are how a burden stays hidden.", best: true },
                { text: "It needs a stronger equity sentence from Communications.", feedback: "Better wording won't fix missing groups, data or changes." },
              ] },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "A slogan, a blended number and \"monitor later\" can make an empty analysis look finished.",
              "Data gaps belong in the analysis, not outside it.",
              "If any line could fit any project, rewrite it.",
            ] },
            work("Review your draft", "Open your analysis, or the draft or deck that's already moving. Mark any slogan, blended number or monitor-later line, and note what each one avoids naming."),
          ],
        },
        {
          id: "dhs-equity-analysis-toolkit-3",
          title: "Preparation: the team and what it can't see",
          minutes: 8,
          blocks: [
            { kind: "text", paragraphs: [
              "Before step 1, the Toolkit asks about the people doing the analysis. Does the team represent the organization, including the person who owns the process? Does it represent the identities of the people the decision will affect? Which perspectives does it have, and which is it missing?",
              "Then it asks how the team will reach the perspectives it's missing. A team made only of people the decision won't affect will miss the burdens.",
            ] },
            { kind: "image", image: img("l3", "A small team gathers to plan an analysis.") },
            { kind: "process", title: "The four preparation questions", intro: "These come straight from the DHS guide.", steps: [
              { title: "Does the team represent the organization?", body: "Include the process owner and the roles that will carry out the change, such as county staff and the people who answer the phone." },
              { title: "Does it represent the people affected?", body: "Think about the identities of the people the decision will touch, and whether anyone on the team shares that experience." },
              { title: "What perspectives does it have, and what's missing?", body: "Write both down. Missing perspectives are a finding, not a failure." },
              { title: "How will it reach what's missing?", body: "Separate engagement that has actually happened from a plan to engage. Both belong in the analysis; only one is done." },
            ] },
            { kind: "continue" },
            { kind: "statement", text: "Name the work in one sentence, with its approval date. If you can't, the Toolkit has nothing to hold yet." },
            { kind: "scenario", image: img("l3", "The team plans the analysis."), character: person(PM), title: "Who's at the table?", setup: "The program manager lists the analysis team: herself, the division director and the management analyst.",
              lines: [
                say(EQUITY, "Who on this team uses the phone line, or answers it? Who has a county lobby?"),
                say(PM, "No one. I'll add the county services supervisor and our community engagement specialist, and write down that we still haven't heard from callers who need an interpreter."),
              ],
              question: "What should the preparation section say?", options: [
                { text: "The team is complete; it has leadership on it.", feedback: "Leadership matters, but the team can't see the burden without the people who carry it." },
                { text: "Add the roles closest to the change, list the perspectives still missing and how they'll be reached.", feedback: "Right. Preparation sets up everything the six steps can see.", best: true },
                { text: "Skip preparation and go straight to step 1.", feedback: "Without preparation, the analysis inherits the team's blind spots." },
              ] },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Build a team that includes the people closest to the change.",
              "Write down the perspectives you have and the ones you're missing.",
              "Separate engagement that happened from engagement you plan.",
            ] },
            work("Preparation", "Answer the four preparation questions for your work: the team, who it represents, what's missing and how you'll reach it."),
          ],
        },
      ],
    },
    {
      title: "See it: steps 1 to 3",
      lessons: [
        {
          id: "dhs-equity-analysis-toolkit-4",
          title: "Step 1: Set desired results and outcomes",
          minutes: 10,
          blocks: [
            { kind: "text", paragraphs: [
              "Step 1 asks you to describe the proposal, then separate two things. Results are the changes you want in the community. Outcomes are what you want for DHS itself, for its workforce or the people it serves.",
              "It also asks which areas the proposal can affect, which disparity domains it touches, such as health, income, housing, employment or institutional systems, and whether its main effect is inside DHS or outside it.",
            ] },
            { kind: "image", image: img("l4", "Colleagues list the groups a change will affect.") },
            { kind: "twoColumn", columns: [
              { heading: "A community result", text: "Families in greater Minnesota can request a county visit within one day, by phone or online, in their language." },
              { heading: "An organizational outcome", text: "County staff spend less time on missed calls and call-backs." },
            ] },
            { kind: "accordion", heading: "Who is usually missing", intro: "Select each heading.", items: [
              { title: "People the design assumes away", body: "Broadband, a private device, English, daytime hours, an online account. Name the people who don't have those." },
              { title: "The workforce carrying the change", body: "Night staff, county workers, the people who answer the phone. A form they can't complete is an equity question, not only an operations one." },
              { title: "Greater Minnesota and Tribal Nations", body: "A metro webinar doesn't reach a rural county lobby. Tribal Nations are sovereign governments; consultation is its own process." },
            ] },
            { kind: "continue" },
            { kind: "text", heading: "Use the community briefs", paragraphs: [
              "The Minnesota Communities briefs describe dozens of communities in the state: their history here, languages, how people often prefer to connect, and questions worth asking. Read the briefs for the groups your work touches before you write step 1. They help you name groups precisely, such as Karen, Somali, or Deaf and DeafBlind Minnesotans, rather than \"immigrants\" or \"people with disabilities.\"",
              "A brief is a starting point for good questions, not a description of any one person. Use it to see who might be missed, then check with people directly.",
            ] },
            { kind: "scenario", image: img("l4", "The team names results and affected groups."), character: person(ENGAGE), title: "Results for whom?", setup: "The team drafts step 1 for the online form.",
              lines: [
                say(PM, "Most callers will be fine online. I was going to write \"improved access for all Minnesotans.\""),
                say(ENGAGE, "Before we do, let's open the briefs for the communities in those counties. Karen and Somali families, Deaf callers who use relay, and rural households without broadband all reach us by phone today."),
              ],
              question: "What should step 1 say?", options: [
                { text: "Improved access for all Minnesotans.", feedback: "That hides exactly the people who already reach DHS by phone." },
                { text: "A community result, an organizational outcome, and the groups likely to feel the change first, named with help from data and the briefs.", feedback: "Right. Now step 2 knows what data to look for.", best: true },
                { text: "A list of every protected class.", feedback: "A list isn't an analysis. Name who this specific change affects." },
              ] },
            { kind: "sorting", heading: "Result, outcome or a miss?", intro: "Place each card.", categories: ["Community result", "Organizational outcome", "A miss"], items: [
              { text: "Rural families can request a visit within a day, by phone or online.", category: 0 },
              { text: "Fewer missed calls for county staff.", category: 1 },
              { text: "\"All Minnesotans will have better access.\"", category: 2 },
              { text: "Callers who need an interpreter wait no longer than other callers.", category: 0 },
              { text: "Night staff can finish requests on their shared computer.", category: 1 },
            ], done: "Good. Results and outcomes give the rest of the analysis somewhere to land." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Separate community results from organizational outcomes.",
              "Name groups precisely; use the community briefs to see who might be missed.",
              "Include the staff who carry the change.",
            ] },
            work("Step 1: Set desired results and outcomes", "Describe the proposal, its community results and organizational outcomes, and who it affects.", [{ label: "Minnesota Communities briefs", href: BRIEFS }]),
          ],
        },
        {
          id: "dhs-equity-analysis-toolkit-5",
          title: "Step 2: Data",
          minutes: 11,
          blocks: [
            { kind: "text", paragraphs: [
              "Step 2 asks what the evidence shows. Which geographic and program areas does the proposal touch, and who lives and is served there? What do the data say about existing inequities and their causes? What's the story behind the numbers?",
              "It also asks you to define success: how will affected groups be better off if the proposal works, how will you see the change, and how would they be worse off if it doesn't? And it asks about gaps: what's missing, and how you'll get it.",
            ] },
            { kind: "image", image: img("l5", "An analyst reviews group-level data on a screen.") },
            { kind: "statement", text: "A blended statewide number can hide exactly who a process was built for." },
            { kind: "accordion", heading: "Working with small numbers", intro: "Select each heading.", items: [
              { title: "Why small groups get hidden", body: "When a group is small, a count can identify real people. Public agencies protect privacy by suppressing small counts in what they publish, often anything under ten, and sometimes the cells around them so the hidden value can't be worked out." },
              { title: "Small doesn't mean unimportant", body: "Public-health guidance is clear that striking differences in small groups should still be investigated. Combine years, use ranges, or look at the process directly instead of dropping the group." },
              { title: "Say what you did", body: "If you suppressed or combined data, write that down and explain what it can and can't show. Use only data your role is authorized to use, and follow the data steward's rules for sharing it." },
            ] },
            { kind: "continue" },
            { kind: "tabs", heading: "Three kinds of evidence", intro: "Select each tab.", items: [
              { label: "Numbers", body: "Population and service data broken out by race, language, disability, county and other groups you named in step 1. Date each figure and name its source." },
              { label: "Experience", body: "Complaints, appeals, call-backs, case reviews and what people have said in engagement. This is evidence too." },
              { label: "Causes", body: "A difference in numbers isn't an explanation. Separate documented causes from assumptions, and look for the process behind the gap." },
            ] },
            { kind: "scenario", image: img("l5", "The analyst presents data."), character: person(ANALYST), title: "What the numbers show", setup: "The management analyst brings call data to the team.",
              lines: [
                say(ANALYST, "Overall, ninety percent of requests would work online. But in the three greater Minnesota counties, nearly half come by phone, and calls with an interpreter take twice as long."),
                say(PM, "So the people we named in step 1 are the ones most likely to be left on the phone."),
                say(ANALYST, "And for Deaf callers the counts are too small to publish. I'll note that, and we'll ask the relay service how many calls it handled."),
              ],
              question: "How should step 2 be written?", options: [
                { text: "Report the ninety percent; it's the real overall picture.", feedback: "The average hides the counties and callers most affected." },
                { text: "Report the breakouts and the story behind them, note the small-number gap and how it will be filled, and define what success looks like for those groups.", feedback: "Yes. That's honest evidence with its limits stated.", best: true },
                { text: "Leave out Deaf callers because the numbers are too small.", feedback: "Small numbers still matter. Find another way to see the barrier." },
              ] },
            { kind: "check", question: "What do you do when the data you need doesn't exist?", options: [
              { text: "Skip step 2." },
              { text: "Write that it's missing, how you'll get it, or the risk of deciding without it.", correct: true },
              { text: "Use the statewide average instead." },
            ], right: "Data gaps are part of the analysis.", wrong: "Skipping or substituting a blended number hides the gap. Name it." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Break the average apart by the groups in step 1, and tell the story behind it.",
              "Define what success would look like for the people affected.",
              "Protect privacy with small numbers, and still look for the barrier.",
            ] },
            work("Step 2: Data", "Record what the data shows by group, the story behind it, what success looks like and what's missing."),
          ],
        },
        {
          id: "dhs-equity-analysis-toolkit-6",
          title: "Step 3: Engaging communities",
          minutes: 11,
          blocks: [
            { kind: "text", paragraphs: [
              "Step 3 asks who the most affected community members are and how you've involved them in developing the proposal. Then it asks what engagement told you: about benefits and burdens for different groups, and about the factors that create and keep inequity in place.",
              "Good engagement goes to where people are, in the languages and formats they use, at times they can come, and it tells them afterward what changed because of what they said.",
            ] },
            { kind: "image", image: img("l6", "A community listening session in a neighborhood center.") },
            { kind: "statement", text: "If the only people in the room already have the access your proposal assumes, you engaged the wrong room." },
            { kind: "accordion", heading: "Prepare before you go", intro: "Select each heading.", items: [
              { title: "Read the community brief", body: "The briefs describe each community's history in Minnesota, languages, organizations and how people often prefer to be approached. Read them before you plan, so your invitation, timing and format fit." },
              { title: "Prepare for the conversation", body: "The Prepare planner walks you through purpose, what people can influence, access, language, compensation and how you'll report back. The Check your assumptions cards help you notice what you're bringing with you." },
              { title: "Make it accessible", body: "Interpreters and translated materials, ASL and captioning, accessible places and documents, evening options, and a way to respond that isn't online only." },
            ] },
            { kind: "continue" },
            { kind: "tabs", heading: "Formal paths", intro: "Select each tab.", items: [
              { label: "Tribal consultation", body: "Tribal Nations are sovereign governments. When a decision could affect a Nation, consultation is government to government, through Tribal and Urban Indian Relations and the responsible Tribal liaison. It isn't outreach or a stakeholder session." },
              { label: "Civil rights", body: "If an access concern is a civil rights matter, it goes through the civil rights process, not a listening session." },
              { label: "Labor relations", body: "Changes to staff work may involve labor relations. Use that path for those questions." },
            ] },
            { kind: "scenario", image: img("l6", "Preparing a listening session."), character: person(ENGAGE), title: "The lunchtime webinar", setup: "The team held one lunchtime webinar. Twenty county supervisors attended.",
              lines: [
                say(DIRECTOR, "Twenty people came. That's engagement, isn't it?"),
                say(ENGAGE, "We heard supervisors. We haven't heard the families who call from the lobby, Deaf callers or the night staff. I've read the briefs and used the planner; I can set up two sessions with interpreters and an evening time."),
                say(COUNTY, "Come to our lobby on a Tuesday evening. That's when people are there."),
              ],
              question: "How should step 3 be written?", options: [
                { text: "Engagement complete: twenty participants.", feedback: "That describes who came, not who is most affected." },
                { text: "Record who was heard and what they said, name who's still missing, and plan accessible sessions where those people are.", feedback: "Right. Engagement is about the people most affected, not who could make a noon call.", best: true },
                { text: "Skip engagement, since the data is strong.", feedback: "Data shows where; people tell you why and what would help." },
              ] },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Involve the most affected people, where they are.",
              "Read the community brief and prepare before you go.",
              "Tribal consultation, civil rights and labor relations keep their formal paths.",
            ] },
            work("Step 3: Engaging communities", "Record who is most affected, how you involved them, and what they told you about benefits, burdens and causes.", [
              { label: "Minnesota Communities briefs", href: BRIEFS },
              { label: "Prepare for a conversation", href: `${BRIEFS}/prepare` },
              { label: "Check your assumptions", href: `${BRIEFS}/assumptions` },
            ]),
          ],
        },
      ],
    },
    {
      title: "Act on it: steps 4 to 6, and making it real",
      lessons: [
        {
          id: "dhs-equity-analysis-toolkit-7",
          title: "Step 4: Benefits and burdens",
          minutes: 11,
          blocks: [
            { kind: "text", paragraphs: [
              "Step 4 brings the data and engagement together. How will the proposal increase or decrease equity? Who would benefit, and who would carry the burden? What unintended consequences are possible?",
              "Then comes the heart of the Toolkit: how will you change the proposal to correct the harm and strengthen the good? Check that the change still fits the results in step 1, and whether it reaches the root cause or only the symptom.",
            ] },
            { kind: "image", image: img("l7", "A team weighs options for changing a proposal.") },
            { kind: "twoColumn", columns: [
              { heading: "Who benefits", text: "Most callers get faster requests; county staff have fewer missed calls during the day." },
              { heading: "Who carries the burden", text: "Rural households without broadband, callers who need an interpreter, Deaf callers and night staff who share one computer." },
            ] },
            { kind: "statement", text: "A safeguard that lives only in a \"we will monitor\" sentence is not a change to the proposal." },
            { kind: "continue" },
            { kind: "process", title: "From burden to change", intro: "Four questions to get from a burden to a real change.", steps: [
              { title: "Who pays?", body: "Name the group and the cost: time, money, access, dignity or risk." },
              { title: "What would remove it?", body: "A change to the proposal itself, or a complementary strategy, not a promise to watch it." },
              { title: "Does it still fit step 1?", body: "Check the change against the community results you set." },
              { title: "Does it reach the cause?", body: "Ask whether the change addresses why the burden exists, not only how it shows up." },
            ] },
            { kind: "scenario", image: img("l7", "The team decides on the change."), character: person(COUNTY), title: "Keep the phone line?", setup: "The data and the sessions point the same way: the phone is how the most affected people reach DHS.",
              lines: [
                say(COUNTY, "If the phone line goes, families in our lobby lose their way in."),
                say(PM, "Then we change the proposal: keep a staffed phone path, with interpreters and relay, alongside the form."),
                say(DIRECTOR, "Can't we launch online and add the phone back next year if needed?"),
              ],
              question: "What belongs in step 4?", options: [
                { text: "Launch online and monitor for problems.", feedback: "The burden is already visible. Monitoring later doesn't move it." },
                { text: "Keep a staffed phone path with interpreters and relay from launch, and name who benefits and who would have paid.", feedback: "Yes. That's a change to the proposal, not a promise.", best: true },
                { text: "Add an equity sentence to the launch announcement.", feedback: "A sentence doesn't change who carries the cost." },
              ] },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Name both benefits and burdens, and for whom.",
              "Change the proposal; monitoring isn't a change.",
              "Check the change against step 1 and the root cause.",
            ] },
            work("Step 4: Benefits and burdens", "Record who benefits, who is burdened, the unintended consequences, and how you'll change the proposal."),
          ],
        },
        {
          id: "dhs-equity-analysis-toolkit-8",
          title: "Write an impact summary only this proposal could wear",
          minutes: 8,
          blocks: [
            { kind: "text", paragraphs: [
              "Leaders read summaries first. A short impact summary, six to ten sentences, makes your analysis usable: the action, the groups, what the data and engagement showed, the main benefit, the main burden, the change you made and the risk that remains.",
              "Read it out loud. If it could belong to any other project, rewrite it.",
            ] },
            { kind: "image", image: img("l11", "A staff member drafts a short summary.") },
            { kind: "quote", text: "We are moving county visit requests online. Rural households without broadband, people who need an interpreter, Deaf callers and night staff would feel this first. Call data and two lobby sessions show these groups rely on the phone. We will keep a staffed phone path, with interpreters and relay, from launch. The remaining risk is evening coverage.", who: "A summary only this proposal could wear" },
            { kind: "continue" },
            { kind: "sorting", heading: "Specific or a slogan?", intro: "Place each sentence.", categories: ["Specific to this work", "Could fit any project"], items: [
              { text: "Call data shows rural households rely on the phone for nearly half of requests.", category: 0 },
              { text: "This initiative advances equity for all Minnesotans.", category: 1 },
              { text: "We will keep a staffed phone path with interpreters from launch.", category: 0 },
              { text: "DHS is committed to inclusion and access.", category: 1 },
            ], done: "Right. A good summary names this work's people, evidence and change." },
            { kind: "check", question: "What makes an impact summary strong?", options: [
              { text: "It's short and inspiring." },
              { text: "It names the action, groups, evidence, benefit, burden, change and remaining risk.", correct: true },
              { text: "It uses the agency's equity language." },
            ], right: "Specific summaries give leaders something real to decide on.", wrong: "Inspiring language without specifics hides the burden." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Six to ten sentences, specific to this work.",
              "Include the remaining risk; don't hide it.",
              "If it could fit another project, rewrite it.",
            ] },
            work("Summarize your analysis", "Draft a six-to-ten sentence summary from your step 1 to 4 answers and keep it with the analysis."),
          ],
        },
        {
          id: "dhs-equity-analysis-toolkit-9",
          title: "Step 5: Implementation",
          minutes: 10,
          blocks: [
            { kind: "text", paragraphs: [
              "Step 5 turns the changes into a plan. For each strategy, list the actions, the person responsible, a deadline and the resources needed: tools, staffing, budget and partnerships.",
              "Then the guide asks hard questions. Is the plan realistic? Is it funded? Is it staffed? Are there ways to make sure it actually happens? Can you keep collecting data, reporting publicly and engaging the community? If any answer is no, what will you do about it?",
            ] },
            { kind: "image", image: img("l8", "A budget analyst and a program manager review staffing.") },
            { kind: "statement", text: "A strategy without an owner, a date and resources is a hope, not a plan." },
            { kind: "continue" },
            { kind: "flashcards", heading: "The implementation plan", intro: "Turn each card.", cards: [
              { front: "Strategy", back: "How you'll reduce the burden or expand the benefit." },
              { front: "Actions", back: "The strategy broken into specific steps." },
              { front: "Person responsible", back: "A role that owns each action. Roles, not names, if the plan is widely shared." },
              { front: "Deadline and resources", back: "A date for each action, and the tools, staff, budget and partners it needs." },
            ] },
            { kind: "scenario", image: img("l8", "Drafting the plan."), character: person(PM), title: "From change to plan", setup: "The program manager turns the step 4 change into a plan.",
              lines: [
                say(PM, "Strategy: keep a staffed phone path with interpreters and relay. Actions: schedule phone staff, contract interpreters, set up relay routing, update the notices."),
                say(COUNTY, "Who owns each one, and by when? My staff need the schedule before October."),
              ],
              question: "What's missing from the plan so far?", options: [
                { text: "Nothing; the actions are listed.", feedback: "Actions without owners, dates and resources don't happen." },
                { text: "A responsible role, a deadline and the resources for each action.", feedback: "Yes. That's what turns a strategy into a plan.", best: true },
                { text: "A longer description of the strategy.", feedback: "The strategy is clear; the plan needs owners and dates." },
              ] },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Each strategy gets actions, a responsible role, a date and resources.",
              "Ask whether the plan is realistic before calling it done.",
              "The next two lessons check alignment and whether it will last.",
            ] },
            work("Step 5: Implementation", "Write the plan: strategies, actions, responsible roles, deadlines, resources, and what's not yet funded or staffed."),
          ],
        },
        {
          id: "dhs-equity-analysis-toolkit-10",
          title: "Align with your equity director, before the decision",
          minutes: 8,
          blocks: [
            { kind: "text", paragraphs: [
              "Before the decision is final, sit with your administration's equity director or committee. Check that the work and its changes fit the DHS Equity Policy and the strategic plan, in a sentence you could defend.",
              "This is a conversation while the plan can still change, not a copy sent after the packet is done.",
            ] },
            { kind: "image", image: img("l12", "A colleague meets with an equity director.") },
            { kind: "accordion", heading: "What a good alignment conversation covers", intro: "Select each heading.", items: [
              { title: "Fit with the Equity Policy", body: "How the work and its changes match the policy's direction, in plain words." },
              { title: "Fit with the strategic plan", body: "Which goal the work serves, and whether the change supports it." },
              { title: "What else applies", body: "Whether a formal path also applies: civil rights, Tribal consultation or labor relations. Those stay formal." },
            ] },
            { kind: "continue" },
            { kind: "scenario", image: img("l12", "The alignment conversation."), character: person(EQUITY), title: "Before the freeze", setup: "Three weeks before approval, the program manager meets the equity director.",
              lines: [
                say(EQUITY, "The phone path fits the policy's direction. One question: does the online form work with a screen reader?"),
                say(PM, "We haven't tested that. I'll add an accessibility test before launch, with a responsible role and a date."),
              ],
              question: "What made this conversation useful?", options: [
                { text: "It happened before the decision, so a gap could still be fixed.", feedback: "Right. Alignment works when there's still time to act on it.", best: true },
                { text: "The equity director approved the analysis.", feedback: "The equity director helps align it. The decision stays with the person or area responsible." },
                { text: "It was documented after approval.", feedback: "After approval, the gap couldn't have been fixed." },
              ] },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Meet your equity director or committee before the decision is final.",
              "Write how the work fits the Equity Policy and the strategic plan.",
              "Formal paths stay formal.",
            ] },
            work("Implementation", "Add your alignment conversation, and anything it changed, to your plan."),
          ],
        },
        {
          id: "dhs-equity-analysis-toolkit-11",
          title: "Make it last: funding, staffing and data",
          minutes: 8,
          blocks: [
            { kind: "text", paragraphs: [
              "The DHS guide asks whether the plan is realistic, funded, staffed and enforceable, and whether you can keep collecting data, reporting and engaging. This lesson takes those questions seriously, because a change that isn't funded or staffed moves no burden.",
              "If any answer is no, write that down, then change the work or change the date.",
            ] },
            { kind: "image", image: img("l13", "A budget analyst and a program manager review staffing.") },
            { kind: "statement", text: "An unfunded safeguard isn't a safeguard." },
            { kind: "continue" },
            { kind: "scenario", image: img("l13", "Checking the budget."), character: person(BUDGET), title: "Is the phone line funded?", setup: "The budget analyst reviews the plan.",
              lines: [
                say(BUDGET, "The phone path needs two staff for evening coverage. There's money for one until July."),
                say(EQUITY, "Then the plan isn't realistic yet. What changes: the launch date or the coverage?"),
                say(PM, "We'll move the launch to November and cover evenings with the county call center until the second position is funded."),
              ],
              question: "What should the analysis say?", options: [
                { text: "Approve now; a position may open up later.", feedback: "Hope isn't funding. The burden would land first." },
                { text: "State the funding gap, and change the date or the coverage until the plan is real.", feedback: "Yes. That keeps the change honest.", best: true },
                { text: "Announce the phone line as planned for next year.", feedback: "An announcement doesn't staff the line." },
              ] },
            { kind: "check", question: "You promised group-level wait times in step 2, but no one can collect them. What now?", options: [
              { text: "Leave the promise in; someone will figure it out." },
              { text: "Say so, and either fund the data collection or change what you'll measure.", correct: true },
              { text: "Drop evaluation." },
            ], right: "A measure you can't collect can't hold anyone accountable.", wrong: "Unkept data promises hide whether anyone is better off." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Check funding, staffing and ways to make it happen.",
              "Make sure you can keep collecting the data you promised.",
              "If it isn't real yet, change the work or the date.",
            ] },
            work("Implementation", "Answer the guide's resource questions honestly, and record what you'll do about each gap."),
          ],
        },
        {
          id: "dhs-equity-analysis-toolkit-12",
          title: "Step 6: Accountability, communication and evaluation",
          minutes: 10,
          blocks: [
            { kind: "text", paragraphs: [
              "Step 6 asks how you'll know whether the proposal worked. How will impacts be documented and evaluated? Are you getting the outcomes you expected, and do you have a plan to correct course?",
              "It also asks how you'll share the analysis, how you'll keep deepening relationships with the communities involved, and which issues are still unresolved.",
            ] },
            { kind: "image", image: img("l9", "A supervisor sets review dates with a colleague.") },
            { kind: "flashcards", heading: "Three evaluation questions", intro: "The guide suggests these. Turn each card.", cards: [
              { front: "How much did we do?", back: "The quantity: requests handled, sessions held, calls answered by phone and online." },
              { front: "How well did we do it?", back: "The quality: wait times by group, interpreter availability, accessibility test results." },
              { front: "Is anyone better off?", back: "The real question: did the community results in step 1 happen, for the groups you named?" },
            ] },
            { kind: "continue" },
            { kind: "accordion", heading: "Make follow-through real", intro: "Select each heading.", items: [
              { title: "Put dates on it", body: "Who reviews the effect soon after launch, and who reviews the results later? A role and a date for each. \"Leadership will review\" names no one and no when." },
              { title: "Report back", body: "Tell the people who took part what changed because of them, and what didn't and why. This is what builds trust for the next decision." },
              { title: "Keep learning", body: "Places like King County build ongoing learning into their equity reviews: check results, share them with the people affected, and adjust. A plain conclusion with its limits, stating what's still unresolved, helps the next team." },
            ] },
            { kind: "scenario", image: img("l9", "Setting review dates."), character: person(PM), title: "Who follows through?", setup: "The program manager drafts step 6.",
              lines: [
                say(DIRECTOR, "Just write that leadership will review it."),
                say(PM, "I'll put the county services supervisor on the first review in December, our analyst on the results review next fall, and the engagement specialist on reporting back to the lobby sessions in January."),
              ],
              question: "Which is real accountability?", options: [
                { text: "Leadership will review.", feedback: "No role, no date." },
                { text: "Named roles with dates for reviewing effects and results, a report back to the people who took part, and the open issues listed.", feedback: "Yes. Now each promise is someone's task.", best: true },
                { text: "Review as needed.", feedback: "\"As needed\" usually means never." },
              ] },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Measure how much, how well, and whether anyone is better off.",
              "Give each review a role and a date, and report back.",
              "Name what's still unresolved.",
            ] },
            work("Step 6: Accountability, communication and evaluation", "Record how you'll evaluate results, who reviews them and when, how you'll report back, and what's unresolved."),
          ],
        },
        {
          id: "dhs-equity-analysis-toolkit-13",
          title: "Bringing it together, and repairing a miss",
          minutes: 9,
          blocks: [
            { kind: "text", paragraphs: [
              "An analysis is finished when someone who wasn't in the room can read it and know what was found, what changed and what happens next. End with a plain conclusion: what the analysis shows, what's still uncertain and who acts next.",
              "That might mean going ahead with changes, pausing until data or engagement is in place, piloting with the people who carry the burden, or taking the question to a formal path. Taking something to a formal path is the Toolkit working, not failing.",
            ] },
            { kind: "image", image: img("l10", "A team agrees on next steps.") },
            { kind: "continue" },
            { kind: "text", heading: "When an analysis was missed", paragraphs: [
              "Sometimes the work already moved without one. Repair is direct: name the miss, name the groups, restore access now if people lost it, change the proposal or the date, put roles and dates on the follow-up and fix the template so it doesn't happen again.",
              "Don't ask the people who carried the burden to teach the team about it. Restore their access first.",
            ] },
            { kind: "scenario", image: img("l10", "The final conclusion."), character: person(DIRECTOR), title: "The conclusion", setup: "Every step is done. Evening coverage depends on the county call center until July.",
              lines: [
                say(DIRECTOR, "So where do we land?"),
                say(PM, "We go ahead with the online form and the staffed phone path, launching in November. The open risk is evening coverage after July, and our first review is in December."),
              ],
              question: "What makes this a good conclusion?", options: [
                { text: "It's short.", feedback: "Short helps, but what matters is what it says." },
                { text: "It states what's happening, what changed, what's still uncertain and who acts next.", feedback: "Yes. The next person can pick it up and follow through.", best: true },
                { text: "It says the proposal advances equity.", feedback: "That's a slogan, not a conclusion." },
              ] },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "End with a plain conclusion and its limits.",
              "Formal paths are part of the Toolkit working.",
              "Repair a miss by restoring access and fixing the process.",
            ] },
            work("Finish the analysis", "Write your conclusion: what you found, what changed, what's uncertain and who acts next."),
          ],
        },
      ],
    },
    {
      title: "Check your understanding",
      lessons: [
        {
          id: "dhs-equity-analysis-toolkit-14",
          title: "Knowledge check",
          minutes: 6,
          blocks: [
            { kind: "text", paragraphs: ["Six questions across the Toolkit. Each one shows why the answer fits. There's no score, and you can take them as often as you like."] },
            { kind: "check", question: "When should the Toolkit be used?", options: [
              { text: "After approval, to document the decision." },
              { text: "Before the decision is final, while the work can still change.", correct: true },
              { text: "Only after a complaint." },
            ], right: "The Toolkit shapes the work; it doesn't decorate it.", wrong: "After the decision, it can only describe a choice." },
            { kind: "check", question: "What does preparation ask about?", options: [
              { text: "The budget." },
              { text: "Whether the team represents the organization and the people affected, and which perspectives it's missing.", correct: true },
              { text: "The launch date only." },
            ], right: "Preparation decides what the analysis can see.", wrong: "Preparation is about the team and its blind spots." },
            { kind: "check", question: "Step 1 says \"all Minnesotans will benefit.\" What's needed?", options: [
              { text: "Nothing; it's inclusive." },
              { text: "Community results and organizational outcomes, with the affected groups named, using data and the community briefs.", correct: true },
              { text: "A longer values paragraph." },
            ], right: "Named groups let the rest of the analysis see disparities.", wrong: "\"Everyone\" hides who carries the burden." },
            { kind: "check", question: "One lunchtime webinar with supervisors is…", options: [
              { text: "Engagement complete." },
              { text: "A start. Name who's still missing and reach the most affected people where they are.", correct: true },
              { text: "Enough if the data is strong." },
            ], right: "Engaging communities means hearing the people most affected.", wrong: "Supervisors aren't the most affected community members." },
            { kind: "check", question: "\"We'll monitor impacts after launch\" is…", options: [
              { text: "A change to the proposal." },
              { text: "Not a change. Step 4 asks you to change the proposal to reduce the burden.", correct: true },
              { text: "Required by the Toolkit." },
            ], right: "A change to the proposal moves the burden; monitoring doesn't.", wrong: "Monitoring later leaves the burden in place." },
            { kind: "check", question: "The safeguard in step 5 is only partly funded. What's honest?", options: [
              { text: "Approve and hope." },
              { text: "Say so, and change the date or the plan until it's real.", correct: true },
              { text: "Announce it for next year." },
            ], right: "An unfunded safeguard isn't a safeguard.", wrong: "The burden would land before the safeguard." },
            { kind: "note", lead: "You've finished the course.", text: "Open the analysis tool and carry your own work through preparation and all six steps, before its approval date." },
            work("The full analysis", "Start or continue an analysis of your own work."),
          ],
        },
      ],
    },
  ],
  sources: [
    { title: "DHS Equity Policy", href: "https://mn.gov/dhs/assets/equity-policy_tcm1053-646921.pdf", note: "When an equity analysis is required, and the equity lens behind it." },
    { title: "DHS Equity Analysis Toolkit and Scan Guide (2023)", href: OVERVIEW, note: "The six-step DHS method this course follows; the analysis tool keeps the guide's questions." },
    { title: "GARE Racial Equity Toolkit: An Opportunity to Operationalize Equity", href: "https://www.racialequityalliance.org/viewdocument/racial-equity-toolkit-an-opportuni-2", note: "The six-step method the DHS guide follows." },
    { title: "State of Minnesota Equity Analysis Tool (Office of Equity, Opportunity, and Accessibility)", href: "https://mn.gov/oeoa/resources/equity-analysis-toolkit", note: "The enterprise tool built with the Office of Inclusion and agency equity practitioners, DHS among them." },
    { title: "Keeping score: measuring the impacts of policy proposals on racial equity (Brookings)", href: "https://www.brookings.edu/research/keeping-score-measuring-the-impacts-of-policy-proposals-on-racial-equity", note: "Why clear guidance, a plain conclusion with stated limits, and disaggregated data make equity assessments useful." },
    { title: "King County Equity Impact Review", href: "https://www.kingcounty.gov/en/legacy/elected/executive/equity-social-justice/tools-resources", note: "A government equity review process that builds ongoing learning into implementation." },
    { title: "Disaggregating data and assessing inequities (Massachusetts)", href: "https://mass.gov/info-details/disaggregating-data-and-assessing-inequities", note: "Small-number suppression to protect privacy, and why striking differences in small groups should still be investigated." },
  ],
};

/** Each step of the analysis tool, with the lesson that teaches it (tool → lesson connections). */
export const TOOLKIT_STEP_LESSONS = [
  { step: "Preparation", lesson: "dhs-equity-analysis-toolkit-3" },
  { step: "Set desired results and outcomes", lesson: "dhs-equity-analysis-toolkit-4" },
  { step: "Data", lesson: "dhs-equity-analysis-toolkit-5" },
  { step: "Engaging communities", lesson: "dhs-equity-analysis-toolkit-6" },
  { step: "Benefits and burdens", lesson: "dhs-equity-analysis-toolkit-7" },
  { step: "Implementation", lesson: "dhs-equity-analysis-toolkit-9" },
  { step: "Accountability, communication and evaluation", lesson: "dhs-equity-analysis-toolkit-12" },
].map(item => ({ ...item, href: `/courses/dhs-equity-analysis-toolkit/${item.lesson}` }));
