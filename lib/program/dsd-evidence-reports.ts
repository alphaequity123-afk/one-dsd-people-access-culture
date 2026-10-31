export type EvidenceReportSlug = "dhs-landscape" | "minnesota-government";
export type EvidenceReportSection = {
  id: string;
  title: string;
  paragraphs: string[];
  points?: { title: string; body: string }[];
};
export type EvidenceReport = {
  slug: EvidenceReportSlug;
  title: string;
  sourceTitle: string;
  subtitle: string;
  author: string;
  dateLabel: string;
  summary: string;
  scope: string;
  caution: string;
  sourceHref: string;
  downloadHref: string;
  introduction: string[];
  sections: EvidenceReportSection[];
  actions: { title: string; body: string }[];
  questions: string[];
  related: { href: string; title: string; description: string }[];
  sourceNotes?: { title: string; body: string; href: string; linkLabel: string }[];
};

export const DHS_LANDSCAPE_REPORT: EvidenceReport = {
  slug: "dhs-landscape",
  title: "DHS equity landscape and climate",
  sourceTitle: "DHS Equity Landscape and Climate Report: From Hearts and Minds to Institutional and Structural Equity",
  subtitle: "Connecting learning and commitment with decisions, resources, and everyday work.",
  author: "Gary Banks, Equity and Inclusion Operations Consultant",
  dateLabel: "Publication date not stated in the report",
  summary: "Examine how DHS can connect existing equity work with service design, workforce practices, public spending, community influence, and evidence of improvement.",
  scope: "An observational assessment and set of recommendations for DHS, with a strategy for the One DHS resource platform.",
  caution: "The report's recommendations are proposals, not approved DHS policy or confirmed implementation commitments. Check the relevant current agency sources before using its institutional, legal, fiscal, or program details in a decision.",
  sourceHref: "/one-dsd/evidence/source/dhs-landscape",
  downloadHref: "/documents/program-evidence/dhs-equity-landscape.txt",
  introduction: [
    "The report begins with an opportunity: connect and strengthen equity work already present in DHS. It recognizes policy commitments, practical tools, service modernization, community relationships, and workforce initiatives as foundations for further work.",
    "Its central question is whether those foundations change the conditions people experience. In this report, climate includes how decisions are made, whose knowledge counts, how burdens are distributed, and whether employees and communities can see a response to what they contribute.",
  ],
  sections: [
    {
      id: "findings", title: "What the report observes",
      paragraphs: ["The report distinguishes individual intentions from the effects of a process. A committed employee may still work within unclear instructions, limited authority, inaccessible materials, or a service handoff that leaves someone without help. Learning matters, but it cannot resolve every condition on its own."],
      points: [
        { title: "A better front door is only one part of access", body: "The report uses MNbenefits to discuss the whole service journey: application, verification, notices, referral, renewal, and appeal. It recommends measuring repeated requests, waiting, comprehension, and completed handoffs, alongside the convenience of an initial application." },
        { title: "Participation needs a visible response", body: "Listening can improve understanding. The report asks whether participation also changes a decision, design, budget, or evaluation. It proposes accessible, compensated partnerships and a record of what changed, what did not, and why." },
        { title: "Analysis needs an owner and a decision", body: "Completing an equity tool is not evidence that its findings influenced the work. The report recommends recording the response to an identified concern, the person with authority to act, the resources needed, and the point at which the decision will be reviewed." },
      ],
    },
    {
      id: "framework", title: "Four connected levels of equity work",
      paragraphs: ["The report's framework connects personal development with changes in how work is organized. Each level addresses a different question; none replaces the others."],
      points: [
        { title: "Hearts and Minds", body: "What do people understand, notice, and practice in relationships? Learning, reflection, cultural humility, trust, and leadership example help people examine assumptions and work across differences." },
        { title: "Organizational practice", body: "How do teams make decisions and deliver services? Clear workflows, structured decisions, coaching, accessible tools, realistic workloads, and feedback turn learning into daily practice." },
        { title: "Institutional design", body: "What do policies, budgets, contracts, technology, and governance make easier or harder? The report proposes review points, clear decision rights, assigned resources, and corrective action where the design produces avoidable barriers." },
        { title: "Structural conditions", body: "How do history, power, income, geography, disability, language, and intersecting identities shape opportunities and outcomes? This level examines relationships across organizations and asks whether the rules themselves need to change." },
      ],
    },
    {
      id: "recommendations", title: "The changes the report recommends",
      paragraphs: ["The recommendations are intended to complement existing leadership and program expertise. They describe possible institutional reforms, with ownership and evidence requirements that would need to be agreed before implementation."],
      points: [
        { title: "Connect governance to decisions", body: "A proposed Equity Operations Council would maintain a shared view of priority issues. Formal decision reviews would connect analysis to approval, revision, a limited pilot, escalation, or a decision not to proceed." },
        { title: "Redesign service journeys and make access reliable", body: "The report pairs end-to-end service mapping with language and disability access standards, accessible documents, human assistance, and a process for correcting repeated access failures." },
        { title: "Align evidence and responsibilities", body: "Shared data definitions, privacy protections, and measures of burden and outcomes would support management action. A proposed DHS–DCYF operating agreement would clarify responsibilities and handoffs as work moves across agencies." },
        { title: "Examine workforce and spending practices", body: "The report recommends reviewing hiring, development, acting assignments, promotion, pay, retention, and accommodations. Its procurement recommendations address barriers faced by smaller providers, payment timing, meaningful contract value, and the communities actually reached." },
        { title: "Build participation, evidence, and continuity into the work", body: "Paid lived expertise and community-defined outcomes would sit alongside administrative and research evidence. Recurring resources, contracts, operating routines, and continuity plans would help useful changes survive staff and leadership transitions." },
      ],
    },
    {
      id: "implementation", title: "Two proposed learning and implementation paths",
      paragraphs: [
        "For the One DHS platform, the executive update recommends a bounded 90-day learning pilot: establish a baseline, test staff journeys together, offer a governed resource collection, and decide whether to continue, revise, or stop. This is a recommendation for evaluation, not a confirmed pilot schedule.",
        "For broader institutional change, the report outlines a separate 36-month sequence: establish ownership and resources; map and design changes; pilot and learn; expand approaches that work; then build them into recurring operations. The proposed timing depends on authority, capacity, affected people's participation, and evidence from each phase.",
        "The platform is presented as a way to make trusted material easier to find and use while connecting people with consultation when needed. Content ownership, review dates, accessibility, privacy, and sustainable support are conditions for adoption, not benefits that a website automatically creates.",
      ],
    },
    {
      id: "progress", title: "What would count as progress",
      paragraphs: [
        "The report recommends measures tied to experience and decisions: time to useful guidance, comprehension, successful service handoffs, reduced repeated effort, access at the point of need, fair development opportunities, and documented responses to community input.",
        "Page views, training completion, meetings, translated documents, and completed analyses can show activity. They do not establish improved outcomes by themselves. The report asks teams to define a baseline, consider who benefits and who still faces barriers, review unintended effects, and identify who can respond.",
      ],
    },
  ],
  actions: [
    { title: "Choose one decision you can influence", body: "Start with a meeting, handoff, notice, tool, or recurring process. State its purpose and identify who has authority over the part you want to examine." },
    { title: "Follow the experience through the process", body: "Describe the steps people encounter and where effort, delay, or uncertainty accumulates. Compare your assumptions with available evidence and perspectives from people affected." },
    { title: "Connect learning with a practical change", body: "Use the Equity Analysis Toolkit to consider alternatives and participation. Discuss needed support and approvals rather than treating a recommendation as an assignment already agreed." },
    { title: "Decide what to observe", body: "Record a feasible next step, the responsible role, and a review question in a private practice plan. Look for changes in experience or decisions, and revisit the approach if it does not help." },
  ],
  questions: [
    "Where does a person's effort increase because of the process rather than the purpose of the work?",
    "What would show that learning or community input changed a decision?",
    "Who can act on a finding, and what support would make that action possible?",
  ],
  related: [
    { href: "/operationalizing-equity", title: "Operationalizing equity", description: "Connect equity questions with everyday decisions and practices." },
    { href: "/learn/equity-toolkit", title: "Equity Analysis Toolkit", description: "Explore the toolkit and its learning companion." },
    { href: "/my-work/plan", title: "Your practice plans", description: "Keep a private working plan for one practical change." },
    { href: "/support/right-person", title: "Find support for your work", description: "Find the person or office who can help with your work." },
  ],
};

export const MINNESOTA_GOVERNMENT_REPORT: EvidenceReport = {
  slug: "minnesota-government",
  title: "Equity across Minnesota government",
  sourceTitle: "Diversity, Equity, Inclusion, and Accessibility Across Minnesota State Government",
  subtitle: "A May 2026 research map of statewide functions, agency practices, and shared dependencies.",
  author: "Author not identified in the report",
  dateLabel: "Compiled May 2026",
  summary: "This research report maps statewide and agency equity functions, shared programs, and the risks created by uneven capacity, changing responsibilities, and an evolving legal environment.",
  scope: "Cabinet agencies, the Governor's office, advisory councils, and major civil-rights and procurement bodies, as described in the May 2026 report.",
  caution: "This is a dated research summary, not current legal guidance or a live staff directory. Verify office responsibilities, program rules, legal developments, and contact information with the responsible agency before acting.",
  sourceHref: "/one-dsd/evidence/source/minnesota-government",
  downloadHref: "/documents/program-evidence/minnesota-equity-research.txt",
  sourceNotes: [
    { title: "Direct Care and Treatment", body: "DCT's official November 2025 report places its separation from DHS on July 1, 2025. The original research gives January 1, 2025, an earlier planned date.", href: "https://www.lrl.mn.gov/docs/2025/mandated/251902.pdf", linkLabel: "DCT report on agency rules (PDF)" },
    { title: "Department of Children, Youth, and Families", body: "DCYF launched July 1, 2024. Its transition page describes program and staff transfers scheduled between July 2024 and July 2025. The launch and transfers are distinct events.", href: "https://dcyf.mn.gov/about-us/transition-dcyf", linkLabel: "DCYF transition overview" },
    { title: "Executive Order 23-12", body: "The September 2023 order continues and updates the One Minnesota Council and Governor's Community Council. It does not establish that the Governor's Office of Equity, Opportunity, and Accessibility was created by that order.", href: "https://www.lrl.mn.gov/archive/execorders/23-12.pdf", linkLabel: "Executive Order 23-12 (PDF)" },
    { title: "Federal lawsuit", body: "The Justice Department confirms it filed a challenge to Minnesota employment requirements on January 14, 2026. The announcement describes allegations, not a court ruling. The current case outcome has not been verified here.", href: "https://www.justice.gov/opa/pr/united-states-department-justice-files-lawsuit-against-minnesotas-affirmative-action-regime", linkLabel: "Justice Department filing announcement" },
  ],
  introduction: [
    "The May 2026 report describes equity work as a network of statewide direction, specialized functions, agency practices, and community relationships. It examines who holds responsibilities, what tools and programs connect the work, and where changes in one organization can affect others.",
    "Its method is an open-source review of agency websites, statutory text, executive orders, plans, public reporting, and legal filings. The resulting map is useful for framing questions and locating relevant functions. It does not independently demonstrate how well each program works or establish today's organizational or legal position.",
  ],
  sections: [
    {
      id: "architecture", title: "The statewide structure described in the report",
      paragraphs: ["The report identifies several overlapping layers. Its central observation is that equity-related responsibilities extend beyond a single office or a shared label."],
      points: [
        { title: "Statewide direction and shared tools", body: "The report describes the Governor's equity office, statewide councils, and Minnesota Management and Budget functions as points of coordination. It identifies the Equity Analysis Toolkit and statewide planning resources as shared instruments for agency work." },
        { title: "Agency implementation", body: "Agencies translate broad direction into the work they control: workforce practices, grants, services, public engagement, accessibility, and program design. The report shows variation in how these responsibilities are organized and resourced." },
        { title: "Specialized public responsibilities", body: "The report distinguishes civil-rights enforcement, workforce administration, procurement, accessibility, and advisory functions. Understanding the type of responsibility matters when deciding where a question belongs; an advisory role and a decision-making role are not interchangeable." },
      ],
    },
    {
      id: "connections", title: "Functions that connect agencies",
      paragraphs: ["The following areas summarize the report's map of shared work. They are starting points for locating current guidance, not a determination of which requirement applies to a particular situation."],
      points: [
        { title: "Workforce opportunity and organizational culture", body: "The report links statewide workforce administration with agency hiring, development, retention, accommodations, and employee experience. It describes a range of organizational approaches, from dedicated leadership roles to responsibilities held within human resources or a cross-agency team." },
        { title: "Public spending and provider access", body: "Procurement and grant programs connect equity aims with who can compete for public work and deliver services. The report examines certification, award reporting, provider capacity, and contract requirements while noting that state and federal programs can follow different rules." },
        { title: "Accessibility and service participation", body: "The research brings together digital accessibility, language access, disability inclusion, and public engagement. It treats these as practical parts of service and program design rather than interchangeable names for one office." },
        { title: "Coordination across service systems", body: "The report discusses shared work in health, housing, education, employment, and human services. Reorganizations and handoffs make it especially important to confirm the current owner of a service, dataset, policy, or follow-up action." },
      ],
    },
    {
      id: "agency-patterns", title: "Different agency approaches, related questions",
      paragraphs: ["The agency matrix contains office names, lead roles, programs, and plan notes as reported in May 2026. Selected patterns illustrate the range without treating the matrix as a current directory."],
      points: [
        { title: "Learning and access", body: "The report describes education agencies and Minnesota State connecting equity work with access, student experience, staff development, and program review. A useful comparison asks how learning is linked to decisions that affect participation." },
        { title: "Workforce and economic opportunity", body: "Its examples from employment, labor, commerce, revenue, and veterans services connect internal workforce practices with the populations an agency serves. The presence of a plan or role is a starting point for examining implementation, not proof of an outcome." },
        { title: "Place, infrastructure, and public services", body: "Examples from transportation, housing, natural resources, and environmental agencies show equity questions arising in investment, access, public engagement, and service design. The relevant decision and responsible function depend on the work being considered." },
      ],
    },
    {
      id: "risks", title: "Transitions and risks identified in May 2026",
      paragraphs: [
        "The report describes an evolving federal–state legal environment, changing contractor documents, and the redistribution of functions among DHS, the Department of Children, Youth, and Families, and Direct Care and Treatment. Those descriptions belong to the report's time frame. Its legal timeline does not establish later court outcomes or instructions for today's hiring, contracting, or program decisions.",
        "It also identifies uneven staffing capacity and reliance on individual practitioners. When a role changes or someone leaves, knowledge and relationships can become harder to locate. Changes in terminology can create a similar problem: a function may continue while familiar search terms or document titles no longer lead to it.",
        "For One DSD, the practical lesson is to identify responsibilities and reliable handoffs, keep resource references current, and distinguish confirmed arrangements from an earlier organizational description.",
      ],
    },
    {
      id: "evidence-limits", title: "What this research does and does not show",
      paragraphs: [
        "The report documents a substantial set of publicly described structures and programs. It also identifies gaps in comparative outcome information, internal team performance, and the status of some learning activities. A missing public detail does not prove that an activity is absent; a published initiative does not establish that it achieved its purpose.",
        "Use the complete report to trace its source list and agency comparisons. Before relying on a named office, staffing figure, legal claim, threshold, deadline, or funding amount, check a current primary source and the responsible agency. Keep the date and limits of the evidence visible in any discussion that follows.",
      ],
    },
  ],
  actions: [
    { title: "Start with the decision, then identify the function", body: "Clarify whether the question concerns workforce practice, service access, procurement, public engagement, or another area. This is more useful than looking for an office based only on whether its title includes equity." },
    { title: "Check the current source and owner", body: "Find the agency's current guidance and confirm who is responsible. Note the publication or review date and distinguish a proposal, a dated research finding, and a rule that has been confirmed to apply." },
    { title: "Make the handoff clear", body: "When more than one team is involved, identify the question, the next decision, and the role that can confirm the answer. Avoid treating a link or referral as proof that the matter has been resolved." },
    { title: "Look for evidence of experience and results", body: "Ask what changed for people using the service or working in the organization, whose experience is represented, and what remains uncertain. Use that question to guide learning or consultation." },
  ],
  questions: [
    "Which organization or role has authority over this part of the work?",
    "Is this resource describing a current requirement, an earlier arrangement, or a proposal?",
    "What evidence would show that a shared tool or agency initiative improves the experience of people affected?",
  ],
  related: [
    { href: "/one-dsd/evidence/dhs-landscape", title: "DHS equity landscape and climate", description: "Explore recommendations for connecting learning with institutional change." },
    { href: "/support/directory", title: "DHS offices and guidance", description: "Find relevant support and official resource destinations." },
    { href: "/support/right-person", title: "Find the right person", description: "Consider the role with responsibility for a decision." },
    { href: "/learn/equity-toolkit", title: "Equity Analysis Toolkit", description: "Use a structured approach to a question in your own work." },
  ],
};

export const evidenceReports: readonly EvidenceReport[] = [DHS_LANDSCAPE_REPORT, MINNESOTA_GOVERNMENT_REPORT];
export function getEvidenceReport(slug: string): EvidenceReport | undefined {
  return evidenceReports.find(report => report.slug === slug);
}
