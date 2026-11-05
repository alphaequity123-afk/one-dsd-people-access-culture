import { getInstrument as getToolkitInstrument } from "@/lib/consultant-toolkit/instrument";
import type { GuidanceLink, Instrument, InstrumentId, InstrumentQuestion, InstrumentStage } from "@/lib/analysis/contract";
import { anyKeywordMatches } from "@/lib/analysis/keywords";

// The six instruments behind the staff "Analyze a document" workspace.
//
// Every question here is a plain-language prompt the answer service works
// through against the material a person supplies. Nothing in this file is
// shown with a status label, and every guidance link points at a page that
// exists in this program (the test next to this file checks the filesystem).

function question(id: string, prompt: string, help?: string): InstrumentQuestion {
  return help ? { id, prompt, help } : { id, prompt };
}

// Guidance links shared across instruments. Keywords are lowercase words or
// phrases; a gap answer containing any of them as a whole word or phrase gets
// the link. Keep single words specific: every gap answer mentions "the sources",
// so that word alone would attach a link to every gap.
const LINKS = {
  countyMap: (why: string): GuidanceLink => ({
    keywords: ["county", "population", "population share", "data", "figures", "demographic", "race", "ethnicity", "share of people"],
    label: "Minnesota county map",
    href: "/community-outreach/county-map",
    why,
  }),
  countyAgencies: (why: string): GuidanceLink => ({
    keywords: ["county agency", "county agencies", "county office", "local agency", "county contact"],
    label: "County agency directory",
    href: "/community-outreach/county-agencies",
    why,
  }),
  organizations: (why: string): GuidanceLink => ({
    keywords: ["organization", "organizations", "partner", "partners", "community group", "community groups", "advocacy", "cultural"],
    label: "Organizations on record",
    href: "/community-outreach/organizations",
    why,
  }),
  providers: (why: string): GuidanceLink => ({
    keywords: ["provider", "providers", "licensed", "center for independent living", "workforce", "capacity", "designated agency"],
    label: "Providers and designated agencies",
    href: "/community-outreach/providers",
    why,
  }),
  howTheSystemConnects: (why: string): GuidanceLink => ({
    keywords: ["lead agency", "lead agencies", "referral", "referrals", "case management", "case manager", "managed care", "tribal nation arrangement"],
    label: "How the system connects",
    href: "/community-outreach/how-the-system-connects",
    why,
  }),
  plan: (why: string): GuidanceLink => ({
    keywords: ["engagement", "listening session", "outreach", "compensation", "hear back", "report back", "interpreter", "language", "translation"],
    label: "Plan an engagement and report back",
    href: "/community-outreach/plan",
    why,
  }),
  sources: (why: string): GuidanceLink => ({
    keywords: ["no source", "no sources", "not sourced", "unsourced", "cited source", "source of the data", "source of the figures", "traced to a source", "undated", "not dated", "date of the data", "where the figures come from", "dashboard"],
    label: "Where the figures come from",
    href: "/community-outreach/sources",
    why,
  }),
  communities: (why: string): GuidanceLink => ({
    keywords: ["community", "communities", "how people differ", "within the community", "dialect", "immigrant", "refugee"],
    label: "Minnesota communities",
    href: "/minnesota-communities",
    why,
  }),
  equityReview: (why: string): GuidanceLink => ({
    keywords: ["equity review", "review tool", "alternatives", "burdens and benefits", "follow-through"],
    label: "Equity review tools",
    href: "/equity-review",
    why,
  }),
  structural: (why: string): GuidanceLink => ({
    keywords: ["who decides", "responsible", "authority", "decision rights", "review date", "accountable", "accountability", "process owner"],
    label: "Structural equity analysis",
    href: "/equity-review/structural",
    why,
  }),
  workingGroupPlan: (why: string): GuidanceLink => ({
    keywords: ["working group", "task force", "advisory council", "statute", "enacting law", "crosswalk", "checkpoint", "open meeting"],
    label: "Plan a legislatively required working group",
    href: "/equity-review/working-group-plan",
    why,
  }),
  equityToolkit: (why: string): GuidanceLink => ({
    keywords: ["toolkit", "equity analysis", "root cause", "unintended consequence", "disparity", "disparities", "intersecting"],
    label: "Equity Analysis Toolkit lesson",
    href: "/learn/equity-toolkit",
    why,
  }),
  communityConnections: (why: string): GuidanceLink => ({
    keywords: ["trust", "relationship", "relationships", "first contact", "introduce", "before you reach out"],
    label: "Community connections lesson",
    href: "/learn/community-connections",
    why,
  }),
  rightPerson: (why: string): GuidanceLink => ({
    keywords: ["who to contact", "right person", "which office", "who handles", "where to send", "contact for help", "who can answer"],
    label: "Find the person or area responsible",
    href: "/support/right-person",
    why,
  }),
  accessChecks: (why: string): GuidanceLink => ({
    keywords: ["interpreter", "interpretation", "language", "translation", "translated", "format", "formats", "large print", "braille", "american sign language", "captions", "plain language", "effective communication", "accessible"],
    label: "Language and access checks",
    href: "/library/ja-access-checks",
    why,
  }),
  tribalReferral: (why: string): GuidanceLink => ({
    keywords: ["tribal", "tribe", "tribes", "tribal nation", "tribal nations", "native american", "american indian", "consultation", "government-to-government"],
    label: "Tribal consultation and referral",
    href: "/learn/tribal-referral",
    why,
  }),
};

// 1. Equity analysis: the Department of Human Services 2023 toolkit, scan track.
const toolkitScan = getToolkitInstrument("scan");
const equityAnalysisStages: InstrumentStage[] = [
  {
    id: "preparation",
    title: "Preparation",
    description: "Who is doing the analysis, who is affected, and which perspectives are still missing.",
    questions: toolkitScan.preparation.map(item => question(item.id, item.prompt, item.help || undefined)),
  },
  ...toolkitScan.stages.map((stage, index) => ({
    id: stage.id,
    title: stage.title,
    description: `Step ${index + 1} of the six-step method.`,
    questions: stage.questions.map(item => question(item.id, item.prompt, item.help || undefined)),
  })),
];

const equityAnalysis: Instrument = {
  id: "equity-analysis",
  title: "Equity analysis",
  whatToUpload: "Upload or paste a proposal, decision memo, budget request or draft analysis that a team wants to examine for its effect on different groups of people.",
  intro: "This instrument walks the supplied material through the six steps of the Department of Human Services equity analysis: results and outcomes, data, engaging communities, benefits and burdens, implementation, and accountability. It separates what the document shows from what it leaves open, so the team can see where evidence, engagement or a responsible role is still missing.",
  basis: "Department of Human Services Equity Analysis Toolkit and Scan Guide, Equity Policy companion document (2023)",
  stages: equityAnalysisStages,
  guidance: [
    LINKS.countyMap("County figures by race and county give the population and service data the data step asks for."),
    LINKS.communities("Community pages describe how people differ within a community and which organizations are on record."),
    LINKS.organizations("Organizations connected with this work are one place to start when affected people have not been involved."),
    LINKS.plan("The engagement planner covers what people can influence, language and access, compensation and reporting back."),
    LINKS.structural("The structural analysis records who decides, who is responsible and when the change is reviewed."),
    LINKS.equityToolkit("The lesson explains each of the six steps and what a complete answer looks like."),
    LINKS.sources("Every figure in this program is dated and traced to its source; use the same discipline for the document's data."),
    LINKS.tribalReferral("A decision that could affect Tribal Nations needs government-to-government consultation, not only outreach."),
  ],
};

// 2. Policy, process or service change.
const policyReview: Instrument = {
  id: "policy-review",
  title: "Policy, process or service change",
  whatToUpload: "Upload or paste a policy, procedure, bulletin, service change notice or decision memo, with any data or engagement notes that support it.",
  intro: "This instrument examines a change in policy, process or service the way the program's policy, process and service equity review does. It asks who is affected and who is left out, what evidence and whose experience support the change, which alternatives were compared, how people will reach and understand the change, and who decides, who is responsible and how people hear back.",
  basis: "Policy, process, and service equity review in this program, with the Department of Human Services Equity Analysis Toolkit and Scan Guide (2023)",
  stages: [
    {
      id: "affected",
      title: "Who is affected",
      description: "Who uses this, who is excluded, and how people differ within a community.",
      questions: [
        question("affected-1", "What is the change, and who uses or is subject to the policy, process or service it changes?", "Name the people and the situations, not only the program. Note where the document stays general."),
        question("affected-2", "Who is excluded by the change, or by the eligibility rules, steps or timelines it sets?", "Include people who could not use the service before and people who leave partway through a process."),
        question("affected-3", "Does the document show how people differ within the communities it affects, by race, ethnicity, language, disability, age, county or income?", "A single label for a community hides differences in language, immigration history, disability and place."),
      ],
    },
    {
      id: "evidence",
      title: "Evidence",
      description: "What data and whose experience support the change, and how recent they are.",
      questions: [
        question("evidence-1", "What data does the document use to describe the current situation, and is each figure dated and traced to a source?", "Look for the year, the source and the group the figure describes. An undated figure is a gap."),
        question("evidence-2", "Whose experience informed the change, and how was it gathered?", "Listening sessions, complaints, appeals, case reviews and advisory councils are all experience. Note when none is cited."),
        question("evidence-3", "What does the document say about causes of the differences it describes, and what does it leave unexplained?", "A difference in figures is not an explanation. Separate documented causes from assumptions."),
      ],
    },
    {
      id: "alternatives",
      title: "Alternatives",
      description: "Options compared, with their burdens and benefits.",
      questions: [
        question("alternatives-1", "Which options were compared before this change was chosen, including leaving things as they are?", "A document that presents one option without alternatives has not compared burdens and benefits."),
        question("alternatives-2", "For each option, who gains and who carries a new burden, such as more steps, more documents, more travel or more waiting?", "Burdens often fall on people with the least time, transport, language access or paperwork."),
        question("alternatives-3", "What unintended effects does the document anticipate, and how would the change be adjusted if they occur?"),
      ],
    },
    {
      id: "access",
      title: "Access and language",
      description: "Plain language, interpretation, formats, timing and place.",
      questions: [
        question("access-1", "Is the change written in plain language that the affected people can act on, and does it say what a person must do and by when?"),
        question("access-2", "What does the document plan for interpretation, translation, alternative formats and effective communication for people with disabilities?", "Name the languages and formats. A general promise of language access is not a plan."),
        question("access-3", "Where and when will people encounter the change, and does that match how they already reach the service, such as a county office, a provider, a case manager or a website?"),
      ],
    },
    {
      id: "decision",
      title: "Decision rights and follow-through",
      description: "Who decides, who is responsible, the review date, and how people hear back.",
      questions: [
        question("decision-1", "Who makes the final decision on this change, and under what authority?", "Name the role or area responsible, not an individual."),
        question("decision-2", "Who is responsible for carrying out each part of the change, and what resources are assigned?"),
        question("decision-3", "When will the change be reviewed, what will be measured, and who will see the results?", "A review date and a measure turn a plan into something that can be checked."),
        question("decision-4", "How will affected people and the organizations that took part hear what changed, what did not, and why?"),
      ],
    },
  ],
  guidance: [
    LINKS.countyMap("County figures by race, county and program give a comparison point for the people the document describes."),
    LINKS.communities("Community pages show how people differ within a community and which organizations are on record."),
    LINKS.organizations("Organizations connected with this work can be asked how they would like to take part."),
    LINKS.plan("The engagement planner covers what participants can influence, access, compensation and reporting back."),
    LINKS.accessChecks("The access checks list the interpretation, translation and format questions to settle before a notice goes out."),
    LINKS.structural("The structural analysis records decision rights, a responsible role and a review date."),
    LINKS.equityReview("The review tools hold the full policy, process and service equity review and its guides."),
    LINKS.rightPerson("When the document does not say who handles a step, this page helps find the person or area responsible."),
    LINKS.tribalReferral("A change that could affect Tribal Nations needs consultation handled separately from outreach."),
  ],
};

// 3. Program, service design or home and community-based services material.
const programAnalysis: Instrument = {
  id: "program-analysis",
  title: "Program or service design",
  whatToUpload: "Upload or paste a program description, service design, waiver material, provider guidance or dashboard extract for home and community-based services or a related program.",
  intro: "This instrument follows the program's home and community-based services equity review. It asks what the program is for and who it serves, who actually gets the service compared with the population, how much choice people have in planning, whether providers and workforce can deliver it, how lead agency and county arrangements shape access, and what is measured.",
  basis: "Home and community-based services equity review in this program, with the Department of Human Services public dashboards on service use by county and race",
  stages: [
    {
      id: "purpose",
      title: "Purpose and people served",
      description: "What the program is for and who it is meant to reach.",
      questions: [
        question("purpose-1", "What does the document say the program or service is for, and what results does it intend for the people who use it?"),
        question("purpose-2", "Who is the program meant to serve, and how does the document describe them by disability, age, race, ethnicity, language and county?", "Note where the description stops at a program name or an eligibility category."),
      ],
    },
    {
      id: "service-access",
      title: "Service access",
      description: "Who gets the service, compared with population share.",
      questions: [
        question("service-access-1", "Who receives the service, by race, ethnicity, language, disability and county, according to the document?", "Dated figures with a source are evidence. Estimates and impressions are not."),
        question("service-access-2", "How does the share of people receiving the service compare with each group's share of the county or state population?", "A group that is a smaller share of people served than of the population points to a question about access, not a conclusion about demand."),
        question("service-access-3", "What steps stand between a person and the service: eligibility, assessment, waiting lists, referral, enrollment or provider availability?"),
        question("service-access-4", "Where does the document explain differences in access, and where does it only describe them?"),
      ],
    },
    {
      id: "choice",
      title: "Participant choice and person-centered planning",
      description: "How much say people have in what they receive and from whom.",
      questions: [
        question("choice-1", "How do people choose services, settings and providers, and what information do they get in their language and format to make that choice?"),
        question("choice-2", "Does the planning process start from what the person wants, and does the document show how plans change when a person's situation changes?"),
        question("choice-3", "What happens when a person disagrees with an assessment, a plan or a decision, and how do they find help?", "Look for appeal rights, grievance steps and a named contact or area."),
      ],
    },
    {
      id: "capacity",
      title: "Provider and workforce capacity",
      description: "Whether the people and organizations needed to deliver the service exist where people live.",
      questions: [
        question("capacity-1", "Which providers deliver the service, and does the document show where they are and whether they are taking new people?", "Provider lists by county and licensed capacity are evidence; a statewide count alone is not."),
        question("capacity-2", "What does the document say about workforce vacancies, turnover, pay and the languages and cultural backgrounds of staff?"),
        question("capacity-3", "Which culturally specific, Tribal or rural providers are part of the service, and what supports their participation?"),
      ],
    },
    {
      id: "arrangements",
      title: "Lead agency and county arrangements",
      description: "How county, Tribal Nation, managed care and contracted arrangements shape delivery.",
      questions: [
        question("arrangements-1", "Which lead agencies, counties, Tribal Nations or managed care organizations deliver or oversee the service, and how do their arrangements differ?"),
        question("arrangements-2", "How does a person get referred into the service and moved between agencies, and who is responsible at each handoff?"),
      ],
    },
    {
      id: "measures",
      title: "Measures and results",
      description: "What is measured, how it is reported, and who acts on it.",
      questions: [
        question("measures-1", "What measures does the document use for access, quality and participant experience, and are they broken down by race, ethnicity, language, disability and county?"),
        question("measures-2", "Who sees the results, how often, and what happens when a measure shows a difference between groups?"),
        question("measures-3", "What data is missing or not comparable, and does the document say how that limits its conclusions?"),
      ],
    },
  ],
  guidance: [
    LINKS.countyMap("The county map shows the share of people receiving home and community-based services by race and county beside county population."),
    LINKS.sources("Every county figure is dated and traced to its public dashboard or census source."),
    LINKS.providers("Providers and designated agencies by county show who can deliver the service where people live."),
    LINKS.howTheSystemConnects("This page explains lead agency types, division roles and referral paths."),
    LINKS.countyAgencies("The county agency directory lists all 87 counties and the shared agencies."),
    LINKS.communities("Community pages carry dated figures and the organizations on record for each community."),
    LINKS.equityReview("The review tools hold the full home and community-based services equity review, its guides and its companion."),
    LINKS.tribalReferral("Services for Tribal Nations run through their own arrangements and consultation."),
  ],
};

// 4. Engagement, listening session or outreach plan.
const engagementPlan: Instrument = {
  id: "engagement-plan",
  title: "Engagement or outreach plan",
  whatToUpload: "Upload or paste an engagement plan, listening session outline, outreach schedule, invitation or report-back draft.",
  intro: "This instrument checks an engagement or outreach plan against the questions the program asks before anyone reaches out: whether a real decision is open, what participants can influence, whose experience is missing, who will be contacted and why, how language, access, timing and compensation are handled, and how people will hear back. It reads the plan for what it settles and what it leaves to chance.",
  basis: "Aging and Disability Services Administration Outreach and Engagement Guide (April 2026), with the community engagement practice in this program",
  stages: [
    {
      id: "decision",
      title: "The decision",
      description: "Whether there is a real decision open and what input can change.",
      questions: [
        question("decision-1", "What decision is still open, who makes it, and when?", "If no decision is open, the plan should say so instead of asking for input."),
        question("decision-2", "What can participants influence, and what can they not?", "People notice when input cannot change anything. The limits should be stated plainly."),
      ],
    },
    {
      id: "people",
      title: "Whose experience",
      description: "Who is affected, who is missing, and who will be contacted.",
      questions: [
        question("people-1", "Whose experience does this decision affect, and whose is missing from the plan?", "Include people who could not use the service or take part before."),
        question("people-2", "Which organizations and which community members will be contacted, and why them?", "No organization speaks for a whole community. The plan should hear from people directly too."),
        question("people-3", "Does the plan show it has read about how people differ within the community, and does it treat figures as context about groups rather than predictions about any one person?"),
        question("people-4", "Could the decision affect Tribal Nations or Native American communities, and if so does the plan keep government-to-government consultation separate from community outreach?"),
      ],
    },
    {
      id: "access",
      title: "Language, access and timing",
      description: "How people will be able to take part.",
      questions: [
        question("access-1", "Which languages and dialects does the plan name, and is an interpreter confirmed for the right one?"),
        question("access-2", "What does the plan provide for plain language, American Sign Language, captions, and written and spoken options?"),
        question("access-3", "How does the plan meet disability access, transportation, broadband, work schedule, caregiving, rural distance and observance needs in its timing and place?"),
      ],
    },
    {
      id: "respect",
      title: "Respect for people's time",
      description: "Compensation, use of what people share, and reporting back.",
      questions: [
        question("respect-1", "What compensation and supports will be offered through approved arrangements, and who will confirm them?"),
        question("respect-2", "How will what people share be used and represented, and can participants review how their words are used and choose how their contributions may be used?"),
        question("respect-3", "How and when will participants hear back about what changed, what did not change and why, in the languages and formats they used?"),
        question("respect-4", "Who will follow up after the engagement, and when?"),
      ],
    },
  ],
  guidance: [
    LINKS.plan("The engagement planner and report-back plan hold the full set of questions this instrument checks."),
    LINKS.communities("Community pages describe how people differ within a community and list organizations on record."),
    LINKS.organizations("Organizations connected with this work, with the date of each recorded connection."),
    LINKS.accessChecks("The access checks cover interpreters, translation, formats and effective communication."),
    LINKS.communityConnections("The lesson covers first contact, trust and what to settle before reaching out."),
    LINKS.countyMap("County figures give context about groups in the county where the engagement takes place."),
    LINKS.tribalReferral("Outreach does not replace government-to-government consultation with Tribal Nations."),
    LINKS.rightPerson("When the plan does not say who confirms compensation or follows up, this page helps find the person or area responsible."),
  ],
};

// 5. Notice, letter, form or web page.
const plainLanguage: Instrument = {
  id: "plain-language",
  title: "Notice, letter, form or web page",
  whatToUpload: "Upload or paste a notice, letter, form, instruction sheet or web page that people receive or must complete.",
  intro: "This instrument reads a document the way the person receiving it will: what it is for, what the reader must do and by when, whether the wording and structure let them find that out, how a person who needs another language or format gets the same information, and how much the reader must gather or prove. It uses the plain-language practice in this program and the effective communication duties under title II of the Americans with Disabilities Act.",
  basis: "Plain-language practice in this program, with the effective communication requirements of the Americans with Disabilities Act, title II",
  stages: [
    {
      id: "purpose",
      title: "Purpose and reader",
      description: "Who reads it, what they must do, and by when.",
      questions: [
        question("purpose-1", "Who receives this document, and in what situation?", "A person waiting on a benefit reads differently from a provider reading a bulletin."),
        question("purpose-2", "What must the reader do after reading it, and by when?", "If the action and the deadline are not in the first few lines, say so."),
        question("purpose-3", "What happens if the reader does nothing, and does the document say so plainly?"),
      ],
    },
    {
      id: "clarity",
      title: "Clarity",
      description: "Reading level, sentence length, defined terms and acronyms.",
      questions: [
        question("clarity-1", "What reading level is the document written at, and how long are its sentences?", "Count a few sentences. Over 25 words is a sign the sentence carries more than one idea."),
        question("clarity-2", "Which terms, program names and acronyms appear, and is each written in full and explained the first time it is used?"),
        question("clarity-3", "Where does the document use legal or program wording where an everyday word would do?"),
      ],
    },
    {
      id: "structure",
      title: "Structure",
      description: "Headings, order, and what comes first.",
      questions: [
        question("structure-1", "Does the document open with what it is about and what the reader must do, before background or legal text?"),
        question("structure-2", "Do headings and lists let a reader find the parts that apply to them without reading everything?"),
      ],
    },
    {
      id: "access",
      title: "Access",
      description: "Formats, interpretation and translation, contact for help, effective communication.",
      questions: [
        question("access-1", "How does a person who reads another language get this information, and does the document say so in that language?"),
        question("access-2", "What alternative formats are offered, such as large print, braille, audio or accessible electronic files, and how does a person ask for one?"),
        question("access-3", "Does the document give a way to get help, such as a phone number, relay service, or a person or area to contact, with hours?"),
      ],
    },
    {
      id: "burden",
      title: "Tone and burden",
      description: "What the reader must gather or prove, and what happens if they do not.",
      questions: [
        question("burden-1", "What must the reader gather, prove or submit, and does the document say why each item is needed?"),
        question("burden-2", "Does the tone treat the reader as a person owed an explanation, or as a case being processed?", "Look for blame, threats or unexplained demands."),
      ],
    },
  ],
  guidance: [
    LINKS.accessChecks("The access checks list the interpretation, translation, format and effective communication questions to settle."),
    LINKS.plan("The engagement planner covers language, communication and how people hear back."),
    LINKS.rightPerson("When the document does not say who to contact for help, this page helps find the person or area responsible."),
    LINKS.communities("Community pages name the languages and dialects people use and how people differ within a community."),
    LINKS.howTheSystemConnects("Referral paths and lead agency roles help explain who sends the notice and who answers questions about it."),
    LINKS.countyAgencies("County agency contacts for notices that come from or refer to a county."),
    LINKS.tribalReferral("Notices that reach members of Tribal Nations may involve Tribal arrangements and contacts."),
  ],
};

// 6. Working group, task force or advisory council plan.
const workingGroupPlan: Instrument = {
  id: "working-group-plan",
  title: "Working group or task force plan",
  whatToUpload: "Upload or paste a working group, task force or advisory council plan, charter, workplan or meeting schedule, with the enacting law if the plan does not quote it.",
  intro: "This instrument checks a plan for a legislatively required working group against the practice in this program: whether the plan quotes the enacting law, covers every required member group and the geographic rule, plans participation supports from the first meeting, keeps a duty crosswalk, gives each topic evidence, discussion, approach and output, keeps a recommendation record with feasibility and member positions, and protects the statutory report date. It also checks that the open meeting law is addressed and that Tribal consultation is kept separate from membership.",
  basis: "Plan a legislatively required working group, in this program, drawing on the enacting session law and the Department of Human Services planning practice for the Waiver Case Management Advisory Working Group (2026 to 2027)",
  stages: [
    {
      id: "charge",
      title: "Charge and membership",
      description: "The law, the members, and the rules the plan must meet.",
      questions: [
        question("charge-1", "Does the plan quote the enacting law for its purpose, required members, meeting rules, duties, report date and expiry, rather than paraphrasing from a proposal?", "Quote the statute. A paraphrase can drop a duty or a date."),
        question("charge-2", "Is every member group the law requires covered, and does the plan meet the geographic rule, such as the share of members living or working outside the seven-county metropolitan area?"),
        question("charge-3", "Does the plan address the open meeting law, including notice, public access and meetings by telephone or interactive technology?"),
        question("charge-4", "Is Tribal consultation kept separate from Tribal membership on the group, so that a member seat is not treated as government-to-government consultation?"),
        question("charge-5", "Does the plan state the scope boundary, such as which questions belong to a separate evaluation rather than to this group?"),
      ],
    },
    {
      id: "participation",
      title: "Participation supports",
      description: "What members need from the first meeting onward.",
      questions: [
        question("participation-1", "Are compensation and expense reimbursement planned under the applicable statute from the first meeting, with a named area responsible for confirming them?"),
        question("participation-2", "Are languages, interpretation, accessible formats, meeting timing and travel planned from the first meeting, with several ways to contribute between meetings?"),
        question("participation-3", "Are materials sent at least one week ahead, in accessible formats and in the languages members use?"),
      ],
    },
    {
      id: "workplan",
      title: "Duty crosswalk and topic method",
      description: "How each statutory duty becomes evidence, discussion and output.",
      questions: [
        question("workplan-1", "Is there a statutory-duty crosswalk with one row per duty, the primary session, the evidence needed and the report output, and is it updated every month?"),
        question("workplan-2", "Does each topic have the same four parts: evidence, discussion questions, approach and expected output, with a note on what not to over-claim?"),
        question("workplan-3", "Are topics ordered so earlier findings feed later ones, with recommendation development across the whole span rather than at the end?"),
        question("workplan-4", "Does each evidence gap have an owner and a due date, and are data limitations documented rather than papered over?"),
      ],
    },
    {
      id: "record",
      title: "Recommendation record",
      description: "How recommendations and positions are kept from the start.",
      questions: [
        question("record-1", "Is there a recommendation record that links each recommendation to a duty, a finding, the evidence, the intended outcome and the affected programs or delivery models?"),
        question("record-2", "Does the record assess feasibility: the action owner, the authority needed, resource and system implications, dependencies, timing and a way to assess results?"),
        question("record-3", "Are member positions recorded through an agreed decision process, including agreement, concerns, alternative positions and reasons, with legislative changes identified separately from administrative actions?"),
      ],
    },
    {
      id: "checkpoints",
      title: "Checkpoints and the report date",
      description: "Whether the schedule protects the statutory report.",
      questions: [
        question("checkpoints-1", "Do the checkpoints protect the statutory report date, with a report outline and duty coverage review, compiled findings, a complete first draft and a revised draft each dated?"),
        question("checkpoints-2", "Is the last month before the report date reserved for member review, accessibility checks and the submitting authority's routing?"),
        question("checkpoints-3", "Does each checkpoint name who prepares, who reviews and who confirms?"),
      ],
    },
  ],
  guidance: [
    LINKS.workingGroupPlan("The full plan, with the charge, roadmap, topic method, recommendation record and checkpoints."),
    LINKS.structural("The structural analysis records decision rights, a responsible role and a review date for each recommendation."),
    LINKS.countyMap("County figures by race and county support workforce, access and regional comparisons."),
    LINKS.howTheSystemConnects("Lead agency types, division roles and referral paths for comparing delivery models."),
    LINKS.providers("Providers and designated agencies by county for capacity and continuity questions."),
    LINKS.communities("Community pages and the organizations on record for culturally specific perspectives."),
    LINKS.accessChecks("The access checks cover interpretation, translation and formats for member materials."),
    LINKS.tribalReferral("Tribal consultation is handled separately from membership on the group."),
    LINKS.equityReview("The review tools help draft recommendations with responsible roles and review dates."),
  ],
};

export const INSTRUMENTS: Instrument[] = [
  equityAnalysis,
  policyReview,
  programAnalysis,
  engagementPlan,
  plainLanguage,
  workingGroupPlan,
];

export function getInstrument(id: InstrumentId): Instrument {
  const found = INSTRUMENTS.find(instrument => instrument.id === id);
  if (!found) throw new Error(`Unknown instrument: ${id}`);
  return found;
}

export function instrumentQuestions(id: InstrumentId): InstrumentQuestion[] {
  return getInstrument(id).stages.flatMap(stage => stage.questions);
}

/** Guidance links whose keywords appear in the given text as whole words or phrases (case-insensitive). */
export function matchGuidance(instrument: Instrument, text: string): GuidanceLink[] {
  return instrument.guidance.filter(link => anyKeywordMatches(link.keywords, text));
}
