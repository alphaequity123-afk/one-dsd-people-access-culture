// A reusable plan for a legislatively required working group, with the Waiver
// Case Management Advisory Working Group (2026 to 2027) as the worked example.
// The charge comes from the statute, read on 2026-11-05. The workplan, topic
// method, recommendation record and checkpoints are program-authored practice
// informed by a Department of Human Services planning draft (November 2026).
// Proposed dates and assignments are planning choices for confirmation, not
// statutory requirements.

export const WORKING_GROUP_PLAN_CHECKED = "2026-11-05";

export const LAW = {
  title: "2026 Session Law, chapter 121, article 9, sections 53 and 54",
  url: "https://www.revisor.mn.gov/laws/2026/0/Session+Law/Chapter/121/",
  section53: "Section 53: Waiver Case Management Advisory Working Group. Effective July 1, 2026.",
  section54: "Section 54: direction to the commissioner to evaluate case management reimbursement rates and lead agency duties, develop an updated payment methodology, consider the working group's recommendations, and report by December 15, 2028. Effective July 1, 2027.",
};

export const CHARGE = {
  purpose: "The commissioner of human services convenes the working group to evaluate and make recommendations on the quality, workforce sustainability, accountability and long-term stability of case management for people who get services through the disability waivers, the Elderly Waiver, Alternative Care and Essential Community Supports.",
  membership: [
    "Representatives of the Department of Human Services",
    "Lead agencies",
    "Contracted waiver case management providers",
    "Waiver case managers with current direct service responsibilities",
    "People receiving waiver services, or their family members or advocates",
    "Disability advocacy organizations",
    "The Minnesota Disability Law Center",
    "Representatives of culturally specific or Tribal communities",
    "Workforce representatives with experience in human services",
  ],
  membershipNote: "Members are appointed by the commissioner, with at least 30 percent living or working outside the seven-county metropolitan area. Members may receive compensation and expense reimbursement under Minnesota Statutes, section 15.059, subdivision 3.",
  meetings: "The first meeting was due no later than August 1, 2026. The group meets at least monthly, under the open meeting law (chapter 13D), and may meet by telephone or interactive technology. The Department of Human Services provides staff and administrative support to convene the group, facilitate its meetings and prepare the final report.",
  duties: [
    "Evaluate the impact of current funding levels, workforce capacity, administrative requirements and caseload expectations on service delivery and quality outcomes.",
    "Examine accountability and oversight mechanisms and grievance processes across delivery models.",
    "Review available data on workforce vacancies, turnover, compensation and service access.",
    "Identify barriers to maintaining high-quality and culturally responsive case management services.",
    "Examine case management training requirements and core competencies.",
    "Evaluate client transfer and service continuity processes.",
    "Develop recommendations, including potential legislative or administrative changes, for a stable, accountable and high-quality waiver case management system that supports person-centered planning and informed choice.",
  ],
  report: "By September 1, 2027, the commissioner submits a report of the group's findings and recommendations to the chairs and ranking minority members of the legislative committees with jurisdiction over human services policy and finance. The group expires when the report is submitted.",
  scopeBoundary: "The working group assesses funding pressures and improvements. The separate section 54 evaluation, due December 15, 2028, develops the payment methodology and modeled rates, and must consider this group's recommendations. The group should hand questions about rates to that evaluation rather than model rates itself.",
  commonLens: "Consider person-centered planning, informed choice, cultural responsiveness, access and regional differences in every topic. Compare county, shared county, Tribal Nation, managed care and contracted arrangements rather than treating one model as the default.",
};

export type Period = { period: string; work: string; milestone: string };
export const ROADMAP: Period[] = [
  { period: "November to December 2026", work: "Launch, baseline, funding and administration", milestone: "Charter and evidence plan" },
  { period: "January to March 2027", work: "Workforce, oversight, quality and access", milestone: "Findings and initial options" },
  { period: "April to May 2027", work: "Training, transfers and continuity", milestone: "Topic recommendations" },
  { period: "June to July 2027", work: "Integrate, prioritize, review the full draft", milestone: "Revised report and member positions" },
  { period: "August 2027", work: "Confirm findings, finalize and submit", milestone: "Ready before the September 1 deadline" },
];

export type Meeting = { number: number; month: string; focus: string; output: string };
export const MEETINGS: Meeting[] = [
  { number: 1, month: "November 2026", focus: "Charge, charter, delivery models, evidence inventory", output: "Agreed workplan and data request" },
  { number: 2, month: "December 2026", focus: "Funding, administrative work, caseloads", output: "Pressure points and initial options" },
  { number: 3, month: "January 2027", focus: "Vacancies, turnover, compensation, access", output: "Workforce findings and data gaps" },
  { number: 4, month: "February 2027", focus: "Oversight, accountability, grievances", output: "Comparison of models and gaps" },
  { number: 5, month: "March 2027", focus: "Quality and cultural responsiveness", output: "Barriers and draft improvements" },
  { number: 6, month: "April 2027", focus: "Training requirements and competencies", output: "Competency and support options" },
  { number: 7, month: "May 2027", focus: "Transfers and service continuity", output: "Continuity safeguards" },
  { number: 8, month: "June 2027", focus: "Integrated options and complete draft report", output: "Priorities, tradeoffs, draft feedback" },
  { number: 9, month: "July 2027", focus: "Revised recommendations and feasibility", output: "Positions and unresolved issues" },
  { number: 10, month: "August 2027", focus: "Final findings and recommendation review", output: "Final record and submission package" },
];

export const TOPIC_METHOD = [
  { when: "Before the meeting", what: "Send a short evidence summary, a comparison across delivery models, the data limitations, and two or three decision questions at least one week ahead, in accessible formats and in the languages members use." },
  { when: "During the meeting", what: "Review the evidence, hear lived and practice experience, compare explanations, and test possible improvements. A suggested 120 minutes: 10 on prior findings, 20 on evidence, 25 on member and lived experience, 45 on options and tradeoffs, 15 on recommendation review, 5 on next steps." },
  { when: "After the meeting", what: "Document findings, draft recommendations, agreement and differing views. Give every evidence gap an owner and a due date." },
  { when: "Across the workplan", what: "Use targeted subgroups when needed, bring their findings back to the full group, and update the statutory-duty crosswalk every month." },
];

export type TopicPlan = { duty: string; title: string; month: string; evidence: string; discussion: string; approach: string; output: string; note: string };
export const TOPICS: TopicPlan[] = [
  { duty: "Duty 1", title: "Funding, administration and caseloads", month: "December 2026",
    evidence: "Funding and reimbursement descriptions, task inventories, caseload definitions, supervision and travel demands, and available cost information.",
    discussion: "How do resources and administrative duties affect time with people? How do complexity, geography and delivery arrangements change workload?",
    approach: "Compare the same core functions across models. Separate service tasks from lead agency administration and identify overlapping requirements.",
    output: "Findings on workload and funding pressures, options to simplify requirements, and questions for the separate rate evaluation.",
    note: "Gather baseline data at launch. Do not infer reimbursement adequacy from caseload size alone. A task inventory is enough unless formal process mapping is separately agreed." },
  { duty: "Duties 1 and 3", title: "Workforce capacity and service access", month: "January 2027",
    evidence: "Available vacancy, turnover, compensation, caseload, assignment-delay and service-access data, with reporting periods and definitions.",
    discussion: "Where do workforce shortages affect access or continuity? Which recruitment and retention conditions vary across models and regions?",
    approach: "Distinguish delays in assigning a case manager from shortages of other services. Examine differences by program, geography and population where the data allow.",
    output: "Workforce and access findings, recruitment and retention options, and a documented list of data limitations.",
    note: "Use available data first. Distinguish headcount from full-time-equivalent measures, and salary from total compensation. Do not promise a statewide survey or causal findings without agreed scope and sufficient evidence." },
  { duty: "Duty 2", title: "Oversight, accountability and grievances", month: "February 2027",
    evidence: "Current oversight tools, contracts, monitoring findings, grievance procedures, and available complaint or resolution themes.",
    discussion: "Who is accountable for quality in each model? Can a person find help, raise a concern, get a response and see follow-through?",
    approach: "Compare accountability and escalation pathways using a shared scenario. Distinguish service grievances from appeal rights and other remedies.",
    output: "A comparison of responsibilities and gaps, plus options for clearer oversight, resolution and transparency.",
    note: "Invite department oversight staff, lead agencies, contracted providers, advocates and ombudsman perspectives as appropriate. Use de-identified examples. Describe existing grievance and appeal protections accurately." },
  { duty: "Duty 4", title: "Quality and cultural responsiveness", month: "March 2027",
    evidence: "Participant and family experiences, existing quality findings, language-access information, and culturally specific and Tribal perspectives.",
    discussion: "What prevents people from receiving responsive support? How do language, culture, disability and location affect choice and participation?",
    approach: "Test the earlier funding, workforce and oversight findings against lived experience. Identify barriers within policy, practice and service availability.",
    output: "Prioritized barriers, draft quality improvements, and candidate measures of participant experience and access.",
    note: "Begin accessible engagement at launch rather than waiting until this topic. Offer several ways to contribute. Do not treat a small number of experiences as a statewide prevalence estimate." },
  { duty: "Duty 5", title: "Training requirements and competencies", month: "April 2027",
    evidence: "Qualification and training requirements, onboarding practices, supervision, continuing education, and competency tools.",
    discussion: "What must a case manager know and be able to do? Which supports help staff apply policy, coordinate services and support informed choice?",
    approach: "Compare required training with practice needs across programs and models. Consider training access, protected time and cost.",
    output: "Proposed core competencies, priorities for training and supervision, and implementation responsibilities.",
    note: "Research requirements early, then use the earlier findings to identify real competency gaps. Preserve necessary program-specific expertise while considering a shared core." },
  { duty: "Duty 6", title: "Transfers and service continuity", month: "May 2027",
    evidence: "Existing transfer requirements, handoff tools, participant notices, available timeliness information, and de-identified scenarios.",
    discussion: "What happens when a case manager leaves, an agency changes or a person moves? Who owns each handoff and checks that support continues?",
    approach: "Walk through transfers across the relevant models. Identify gaps in responsibility, information exchange, communication and follow-up.",
    output: "Continuity safeguards, clearer handoff responsibilities, and proposed monitoring or administrative improvements.",
    note: "Coordinate with broader continuity-of-care work without assuming this group owns every service-transition policy. Assess consent, privacy and data-sharing requirements before proposing information exchange." },
  { duty: "Duty 7", title: "Recommendation development", month: "Ongoing from December, integrated June to August 2027",
    evidence: "The findings, evidence and member positions recorded for every earlier topic.",
    discussion: "Which changes are worth recommending, who would act on them, and what would show they worked?",
    approach: "Keep a recommendation record from the first topic onward. Review feasibility before prioritizing. Identify legislative changes separately from administrative actions.",
    output: "Prioritized actions with rationale, limitations and differing views, ready for the report.",
    note: "Agreement, concerns, alternative positions and the reasons for each are recorded using the group's agreed decision process. Unanimity is not required for a useful report." },
];

export const RECOMMENDATION_RECORD = [
  { field: "Link", what: "The duty, the finding, the evidence, the intended outcome, and the affected programs or delivery models." },
  { field: "Feasibility", what: "The action owner, the authority needed, resource and system implications, dependencies, likely timing, and a way to assess results." },
  { field: "Member positions", what: "Agreement, concerns, alternative positions and supporting reasons, recorded through the agreed decision process." },
  { field: "Final report", what: "Findings, recommendations, limitations and differing views, with legislative changes identified separately from administrative actions." },
];

export type Checkpoint = { target: string; checkpoint: string; responsibility: string };
export const CHECKPOINTS: Checkpoint[] = [
  { target: "March 31, 2027", checkpoint: "Report outline and statutory-duty coverage review", responsibility: "Staff prepare; the department and members review" },
  { target: "May 31, 2027", checkpoint: "Topic findings and initial recommendations compiled", responsibility: "Staff synthesize; members refine" },
  { target: "June 30, 2027", checkpoint: "Complete first report draft", responsibility: "Members review; the department checks requirements" },
  { target: "July 31, 2027", checkpoint: "Revised draft and documented member positions", responsibility: "Staff revise; members resolve open items" },
  { target: "August 15 to 31, 2027", checkpoint: "Final member review by August 15, revisions and accessibility checks by August 22, submission routing before September 1", responsibility: "Members confirm; the commissioner submits" },
];

export const KICKOFF_DECISIONS = [
  { title: "Charge and charter", what: "Confirm the enacted charge, the included programs and delivery models, member roles, participation supports, and the decision process." },
  { title: "Schedule and evidence", what: "Confirm monthly meetings and subgroup capacity. Assign data owners and agree on how to handle unavailable or noncomparable evidence." },
  { title: "Topic sequence", what: "Review the proposed topics, identify missing perspectives, and confirm the first preparation assignments." },
  { title: "Review and reporting", what: "Approve the recommendation record and the crosswalk format. Confirm member review periods and the department's submission responsibilities." },
];

/** Steps for reusing this plan with a different working group or task force. */
export const REUSE_STEPS = [
  "Read the enacting law and list its purpose, required members, meeting rules, duties, report date and expiry. Quote it; do not paraphrase from a proposal.",
  "Build a statutory-duty crosswalk: one row per duty, with the primary session, the evidence needed and the report output. Update it every month.",
  "Order the topics so earlier findings feed later ones, and put recommendation development across the whole span rather than at the end.",
  "Give every topic the same four parts: evidence, discussion questions, approach, expected output. Add a short note on what not to over-claim.",
  "Set checkpoints that protect the statutory report date, with the last month reserved for member review, accessibility checks and the submitting authority's routing.",
  "Plan participation supports from the first meeting: compensation, languages, interpretation, formats, timing and travel, and several ways to contribute between meetings.",
  "Keep a recommendation record and a positions record from the start, so differing views are documented rather than lost.",
];

/** What this program can supply to the working group's duties. */
export const PROGRAM_SUPPORT = [
  { duties: "Duties 1 and 3", resource: "Minnesota county map: share of people receiving home and community-based services by race and county, earned income, and county population; county agency directory for all 87 counties and the five shared agencies.", href: "/community-outreach/county-map" },
  { duties: "Duty 2", resource: "How the system connects: lead agency types, division roles including lead agency reviews, and referral paths.", href: "/community-outreach/how-the-system-connects" },
  { duties: "Duty 4", resource: "Minnesota community pages with dated figures and organizations on record, and the engagement planner's language and access questions.", href: "/minnesota-communities" },
  { duties: "Duty 5", resource: "Equity Analysis Toolkit and the practice collections.", href: "/learn/equity-toolkit" },
  { duties: "Duty 6", resource: "Providers and designated agencies by county, and Disability Hub MN.", href: "/community-outreach/providers" },
  { duties: "Duty 7", resource: "Equity review tools and the structural equity analysis for drafting recommendations with responsible roles and review dates.", href: "/equity-review" },
];
