/**
 * Equity Director toolkit: the owner-supplied inventory of tools that Equity Directors at the Minnesota Department of
 * Human Services can use to carry out equity work across the agency (source:
 * migration/source-materials/equity-director-toolkit-and-leadership-styles-20261103.md, sections 1 to 14).
 *
 * Each resource is written as direct, practical guidance: what it is for, how to use it and its limits. Owner rule: no
 * status labels or classification language on the page. Pages, Ask retrieval and the knowledge graph all read this one
 * file. Nothing here stores what people type.
 */

export const DIRECTOR_TOOLKIT_HREF = "/equity-review/director-toolkit";
export const DIRECTOR_TEMPLATES_HREF = "/equity-review/director-toolkit/templates";
export const DIRECTOR_TOOLKIT_SOURCE_FILE = "lib/content/director-toolkit.ts";
export const DIRECTOR_TOOLKIT_REVIEWED_ON = "2026-11-03";

export type ToolkitItem = {
  name: string;
  /** Who publishes or holds it, when that helps a reader find it. */
  publisher?: string;
  purpose: string;
  use: string;
  limitation?: string;
  /** A fill-in template on the templates page. */
  templateId?: DirectorTemplateId;
  /** The official public address of the resource. */
  url?: string;
  /** A related page on this site. */
  href?: string;
};

export type ToolkitList = { heading: string; items: string[]; note?: string };

export type ToolkitSection = {
  id: string;
  number: number;
  title: string;
  /** The question this area answers, in plain words. */
  question: string;
  intro: string[];
  items: ToolkitItem[];
  lists?: ToolkitList[];
  notes?: string[];
  /** A caution the source states plainly. */
  caution?: string;
  related?: Array<{ label: string; href: string }>;
};

export const DIRECTOR_TOOLKIT_INTRO = {
  title: "Equity Director toolkit",
  lede: "Tools that Equity Directors at the Minnesota Department of Human Services (DHS) can use to carry out People, Access and Culture work across the agency.",
  summary: [
    "These tools connect policy analysis, community engagement, workforce practices, accessibility, language access, procurement and accountability. Equity Directors use them with the staff responsible for those decisions. Training and software support the work; staff still need to act on findings and review the results.",
    "Start with the DHS Equity Policy and the internal DHS Equity Analysis Toolkit. Add the State of Minnesota Equity Analysis Toolkit, and build practical templates around those resources. The DHS Equity Policy requires employees to examine policies, practices, procedures, rules, budgets and decisions through an equity lens. The goal is to reduce disparities and improve access to human services.",
    "This toolkit lists each resource, what it is for, how an Equity Director can use it, and its limits.",
  ],
  privacy: "The app does not autosave or submit your template entries. Copy, download or print them if you need a record, and store that record according to agency requirements. Keep sensitive employee concerns and protected client information out of these templates and out of general-purpose trackers.",
};

export const DIRECTOR_TOOLKIT_SECTIONS: readonly ToolkitSection[] = [
  {
    id: "foundation",
    number: 1,
    title: "Foundation for DHS",
    question: "Which resources should every equity review start from?",
    intro: [
      "Start with what DHS already has. Connect equity reviews to the policy, budget, program and management decisions that are already happening, rather than starting a separate initiative.",
    ],
    items: [
      {
        name: "DHS Equity Policy", publisher: "Minnesota Department of Human Services",
        purpose: "Published agency policy that sets the expectation for equity analysis.",
        use: "Connect equity reviews to existing policy, budget, program and management decisions rather than creating a separate initiative.",
        limitation: "The policy sets the expectation. It does not by itself tell a team how to complete a review; pair it with the toolkits below.",
        url: "https://mn.gov/dhs/assets/equity-policy_tcm1053-646921.pdf", href: "/equity-policy",
      },
      {
        name: "DHS Equity Analysis Toolkit", publisher: "Minnesota Department of Human Services, through the Equity, Diversity and Inclusion InfoLink page",
        purpose: "The internal agency toolkit named in the DHS Equity Policy. It is available through the Equity, Diversity and Inclusion InfoLink page.",
        use: "Get the current approved version and use it as the main agency-specific analysis tool.",
        limitation: "Do not assume it is the same as the statewide toolkit. Always work from the current approved version.",
        href: "/learn/equity-toolkit",
      },
      {
        name: "State of Minnesota Equity Analysis Toolkit: A Quick Guide", publisher: "State of Minnesota, developed with DHS and other agencies",
        purpose: "Published statewide tool developed with participation from DHS and other agencies.",
        use: "Use its seven criteria to structure reviews: impact, partner engagement, data, access, monitoring, resources and accountability.",
        limitation: "It is a statewide companion. The DHS toolkit stays the agency starting point.",
        url: "https://mn.gov/oeoa/resources/equity-analysis-toolkit/",
      },
      {
        name: "Step-by-Step Guide for Applying the State Equity Analysis Tool", publisher: "State of Minnesota",
        purpose: "Published companion that shows how to apply the statewide tool.",
        use: "Help policy teams choose an issue, bring the right people together, examine intended outcomes and develop recommendations they can act on.",
        limitation: "It guides the process. The team still has to gather evidence and make the recommendations.",
      },
      {
        name: "Aging and Disability Services Administration (ADSA) Outreach and Engagement Guide, April 2026", publisher: "Aging and Disability Services Administration",
        purpose: "Internal guide from the Aging and Disability Services Administration (ADSA) for planning outreach and engagement.",
        use: "Use its practices for engagement planning, recruitment, accessibility, communication and reporting.",
        limitation: "It is written for aging and disability work. Check with the person or area responsible before using it elsewhere in DHS.",
      },
      {
        name: "Government Alliance on Race and Equity (GARE) Racial Equity Toolkit and action-planning resources", publisher: "Government Alliance on Race and Equity (outside resource)",
        purpose: "Outside methods designed for government.",
        use: "Add to DHS methods with approaches for institutional change, policy and budget analysis, and action planning with clear accountability.",
        limitation: "It supplements DHS methods; it does not replace the DHS Equity Policy or the DHS toolkit.",
        url: "https://www.racialequityalliance.org/resources/racial-equity-toolkit-opportunity-operationalize-equity/",
      },
      {
        name: "People, Access and Culture Strategic Plan and Resource Tool Suite",
        purpose: "A framework you can adapt for governance, workforce, culture, service access, partnerships and continuous improvement.",
        use: "Use it to design tools for each of those areas, one area at a time.",
        limitation: "Adapt each part with the people responsible for the area that will use it.",
        href: "/equity-framework",
      },
    ],
  },
  {
    id: "policy-program-budget",
    number: 2,
    title: "Policy, program and budget equity tools",
    question: "What will this decision change, for whom, and how will the agency address barriers it can see coming?",
    intro: [
      "These tools answer one central question: what will this decision change, for whom, and how will the agency address barriers it can see coming?",
    ],
    items: [
      {
        name: "Equity impact assessment", publisher: "DHS Equity Analysis Toolkit, with the statewide toolkit as a companion",
        purpose: "Look closely at a decision before it is made. The statewide tool asks teams to identify affected groups, look at evidence broken out by group, check accessibility, set aside resources and name who is accountable for carrying it out.",
        use: "Use the DHS toolkit as the agency starting point and the statewide toolkit as a companion. Record the review using the nine-part assessment record.",
        limitation: "The nine-part record puts the statewide toolkit into practice. Check it against the current approved DHS Equity Analysis Toolkit.",
        templateId: "impact-assessment",
      },
      {
        name: "Equity review intake and triage",
        purpose: "A short intake form that shows which proposals need a fuller review. Suggested triggers include changes to eligibility processes, service access, assessment practices, public communications, grants, procurement and workforce procedures.",
        use: "Screen proposals early so teams apply the existing analysis tools in proportion to the stakes. The ADSA guide names many of these same decision areas as times when engagement matters.",
        limitation: "Triage should help teams use the existing tools in proportion. It must not replace real analysis with a checkbox.",
        templateId: "intake-triage",
      },
      {
        name: "Budget equity worksheet",
        purpose: "For each significant proposal, ask who benefits from the spending, who feels the effects of a cut or service change, what funding is needed for translation, accommodations, accessible technology and participation, which barriers remain unfunded, and which outcomes will show whether the investment improved access.",
        use: "Use it alongside the equity impact assessment for proposals with budget effects. The statewide toolkit includes financial resources, dedicated funding to reduce disparities, staff and training as review criteria.",
        limitation: "Budget decisions stay with the people who hold budget authority.",
        templateId: "budget-worksheet",
      },
      {
        name: "Decision and mitigation log",
        purpose: "Keep a record of findings, changes to make, the decision made, the reasons, the accountable owner and the risks still open.",
        use: "Make decisions visible and traceable, with clear responsibility for approval, carrying out the work and raising concerns.",
        limitation: "Keep entries factual and brief. Leave out names and sensitive details.",
        templateId: "decision-log",
      },
    ],
    related: [
      { label: "Equity Analysis Toolkit companion", href: "/learn/equity-toolkit" },
      { label: "Structural equity analysis", href: "/equity-review/structural" },
    ],
  },
  {
    id: "community-engagement",
    number: 3,
    title: "Community engagement and shared-design tools",
    question: "How do people affected by a decision help shape it before it is final?",
    intro: [
      "DHS already has useful resources. The ADSA guide points to the agency-wide Community Engagement Guide, the DHS Equity Analysis Toolkit and the Community Engagement in Grant-Making guide. It also notes that the grant-making guide was written in 2019 and may need updating for today's context.",
    ],
    items: [
      {
        name: "DHS Community Engagement Guide", publisher: "Minnesota Department of Human Services",
        purpose: "Plan meaningful participation before decisions are final.",
        use: "Produce an engagement plan that names the purpose, who will take part, the timing and how their input will influence the decision.",
        limitation: "A plan on paper is not engagement. Build in accessibility, language support and follow-up from the start.",
        href: "/practice/gp-3",
      },
      {
        name: "ADSA Outreach and Engagement Guide", publisher: "Aging and Disability Services Administration",
        purpose: "Organize trust-building, inclusive outreach, accessible activities, sharing results and tracking.",
        use: "Produce an outreach and engagement plan for the specific decision or effort.",
        limitation: "It is written for aging and disability work. Check with the person or area responsible before using it elsewhere in DHS.",
      },
      {
        name: "Community Engagement in Grant-Making guide", publisher: "Minnesota Department of Human Services",
        purpose: "Look at how communities take part in grant design and related decisions.",
        use: "Produce a documented engagement approach for a grant initiative.",
        limitation: "Written in 2019. Review the older guidance for whether it still applies.",
      },
      {
        name: "Partner and participation map",
        purpose: "Identify affected groups, missing perspectives, trusted organizations and barriers to taking part.",
        use: "Produce a recruitment and relationship plan, shaped by the guide's emphasis on hearing many perspectives.",
        limitation: "It needs relationships and follow-through, not only a list.",
        templateId: "partner-map",
      },
      {
        name: "\"What we heard / what changed\" log",
        purpose: "Link community input to decisions, and explain recommendations that were not adopted.",
        use: "Produce an accessible feedback report and follow-up commitments.",
        limitation: "It only builds trust if people actually receive the report back.",
        templateId: "heard-changed-log",
      },
    ],
    notes: [
      "Make engagement usable, not merely available. Include accessibility, language support, scheduling, ways to take part and resources in the first plan.",
      "For paying or reimbursing participants, settle which agency authority and administrative process applies before making any promises.",
      "The ADSA guide treats purpose, roles, resources, accessibility, recruitment and accountability as planning considerations that depend on each other.",
    ],
    related: [
      { label: "Engagement and report-back plan", href: "/practice/gp-3" },
      { label: "Accessible participation guide", href: "/practice-guides/inclusive-meetings" },
    ],
  },
  {
    id: "tribal-relations",
    number: 4,
    title: "Tribal relations and consultation tools",
    question: "When does a decision call for Tribal consultation, and who leads it?",
    intro: [
      "Tribal consultation needs its own workflow. It is not the same as general community outreach and cannot be swapped for it. DHS's Tribal and Urban Indian Relations function provides guidance for ongoing consultation and program development with Tribal governments and promotes government-to-government relations.",
      "Develop the tools below with the person or area responsible for Tribal and Urban Indian Relations.",
    ],
    items: [
      {
        name: "Tribal and Urban Indian Relations", publisher: "Minnesota Department of Human Services",
        purpose: "Guidance for ongoing consultation and program development with Tribal governments, and promotion of government-to-government relations.",
        use: "Bring this function in early. Its consultation procedures and guidance decide the content of every tool below.",
        limitation: "Equity Directors coordinate with this function; they do not replace it.",
        url: "https://mn.gov/dhs/partners-and-providers/program-overviews/tribal-and-urban-indian-relations/index.jsp",
      },
      {
        name: "Consultation screening checklist",
        purpose: "Screen proposed decisions to see whether consultation is needed.",
        use: "Run it at intake, before timelines are fixed, and share the result with the person or area responsible for Tribal relations.",
        limitation: "A screening tool does not decide whether consultation happens. DHS consultation procedures do.",
        templateId: "tribal-screening",
      },
      {
        name: "Consultation planning record",
        purpose: "Name the issue, the decision timeline, the right contacts and the responsible DHS officials.",
        use: "Keep the plan in one place so the timeline leaves room for real consultation.",
        limitation: "Its content follows DHS consultation procedures and Tribal relations guidance.",
        templateId: "tribal-screening",
      },
      {
        name: "Record of issues, commitments and follow-up",
        purpose: "Record issues raised, commitments made, follow-up and decisions.",
        use: "Track that every commitment gets a response and that the response is shared back.",
        limitation: "Shape it with Tribal relations guidance.",
        templateId: "tribal-screening",
      },
      {
        name: "Separate engagement plan for urban American Indian communities",
        purpose: "Plan engagement with urban American Indian communities where it fits.",
        use: "Keep it separate from government-to-government consultation with Tribal Nations.",
        limitation: "Develop it with the person or area responsible for Tribal and Urban Indian Relations.",
      },
    ],
    notes: [
      "The applicable DHS consultation procedures and Tribal relations guidance decide what goes in these supports.",
      "The statewide equity toolkit separately asks whether Minnesota's 11 Tribal Nations, urban Native populations or agency Tribal liaisons were engaged or notified.",
    ],
    related: [{ label: "Tribal referral and relationships", href: "/learn/tribal-referral" }],
  },
  {
    id: "accessibility",
    number: 5,
    title: "Accessibility and disability inclusion tools",
    question: "Can everyone use what the agency is building, from the first draft to approval?",
    intro: [
      "Accessibility should be part of design and approval, not a final document check. Minnesota's published digital accessibility standard includes the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and Section 508 of the Rehabilitation Act. The WCAG 2.1 update took effect July 1, 2024.",
    ],
    items: [
      {
        name: "Minnesota IT Services (MNIT) accessibility policies, standards, training and implementation resources", publisher: "Minnesota IT Services",
        purpose: "Set requirements and staff responsibilities for digital content and systems.",
        use: "Use the current standard as the baseline for every digital product, form and document.",
        limitation: "Apply the current standard rather than relying on older training references.",
        url: "https://mn.gov/mnit/assets/MinnesotaStateAccessibilityStandard-v.4.0_tcm38-607575.pdf",
      },
      {
        name: "Accessibility Insights for Web", publisher: "Outside testing tool",
        purpose: "Support website accessibility evaluation.",
        use: "Run it as one step in testing a web page or application.",
        limitation: "Include it within a broader testing process.",
      },
      {
        name: "WAVE (Web Accessibility Evaluation Tool) browser extension", publisher: "Outside testing tool",
        purpose: "Find possible accessibility errors and inspect page features.",
        use: "Use it for a quick first look at a page and to show teams where problems are.",
        limitation: "Findings need interpretation and follow-through.",
      },
      {
        name: "axe DevTools browser extension", publisher: "Outside testing tool",
        purpose: "Support repeatable web accessibility testing.",
        use: "Use it for testing that teams can repeat each time content changes.",
        limitation: "Free and paid versions differ. Confirm agency approval before adoption.",
      },
      {
        name: "ANDI (Accessible Name & Description Inspector)", publisher: "Outside testing tool",
        purpose: "Help analysts and designers find accessibility issues and possible fixes.",
        use: "Use it to check how screen readers will announce page elements.",
        limitation: "Use it alongside other evaluation methods.",
      },
      {
        name: "Keyboard testing", publisher: "Testing method",
        purpose: "Check whether people can move through and operate an interface without a mouse.",
        use: "Include it in documented testing.",
        limitation: "Do not rely only on automated scans; keyboard testing must be done by a person.",
      },
      {
        name: "Adobe accessibility checking tools", publisher: "Outside testing tool",
        purpose: "Find possible accessibility problems in Portable Document Format (PDF) files.",
        use: "Check PDFs before they are published, then fix and recheck.",
        limitation: "Treat checking as part of fixing and confirming, not the whole process.",
      },
      {
        name: "Accessible meeting and event checklist",
        purpose: "Cover materials, ways to take part, captioning, interpretation and accommodation requests.",
        use: "Use it when planning any meeting, listening session or public event.",
        limitation: "Build it with agency accessibility specialists and the people who will take part.",
        templateId: "accessibility-review", href: "/practice-guides/inclusive-meetings",
      },
    ],
    notes: [
      "Equity Directors should coordinate this work with accessibility coordinators, Minnesota IT Services, communications, procurement and program owners. The statewide equity toolkit calls for accessibility and other subject-matter expertise in the analysis process.",
    ],
    related: [{ label: "Accessible participation guide", href: "/practice-guides/inclusive-meetings" }],
  },
  {
    id: "language-access",
    number: 6,
    title: "Language access and culturally responsive communication tools",
    question: "Can people who speak languages other than English understand the agency and reach help?",
    intro: [
      "DHS publishes practical language-access resources that can go straight into an implementation toolkit.",
    ],
    items: [
      {
        name: "DHS Limited English Proficiency (LEP) Plan, DHS-4210-ENG", publisher: "Minnesota Department of Human Services",
        purpose: "The agency plan for language assistance.",
        use: "Use it as an operational reference when reviewing language assistance procedures.",
        limitation: "A plan describes procedures; check that people can actually get the help it describes.",
      },
      {
        name: "DHS eDocs translated-document search", publisher: "Minnesota Department of Human Services",
        purpose: "Find existing translated forms and publications by language, document number or keyword.",
        use: "Search here before paying for new translation work.",
        limitation: "A translated document only helps if it is current and people can find it.",
      },
      {
        name: "\"I need a language interpreter\" cards", publisher: "Minnesota Department of Human Services",
        purpose: "Help people tell staff they need an interpreter. DHS lists them as available in 15 languages.",
        use: "Make sure front-line and outreach staff have them and know what to do when someone shows one.",
        limitation: "A card starts the request; staff still need to arrange the interpreter.",
      },
      {
        name: "State interpreter and translation purchasing contracts", publisher: "State of Minnesota",
        purpose: "Buy interpreter and translation services.",
        use: "Arrange services through the applicable procurement process and agency Limited English Proficiency procedures.",
        limitation: "Use the applicable procurement process; the contracts do not replace agency procedures.",
      },
      {
        name: "DHS Language Block guidance", publisher: "Minnesota Department of Human Services",
        purpose: "Review public-facing publications for the required notice of free language assistance.",
        use: "Check every public document against it before release. The published DHS Language Block policy says documents intended for the general public must follow its guidelines.",
        limitation: "The notice tells people help exists; staff must be ready to provide it.",
        url: "https://mn.gov/dhs/assets/language-block-required-documents-available-general-public_tcm1053-646949.pdf",
      },
      {
        name: "Language-access workflow audit",
        purpose: "Follow a person's experience from first contact through application, notices, follow-up and appeals to find gaps.",
        use: "Walk the path step by step and note where language help is missing or hard to reach.",
        limitation: "It needs real service data and the experience of people who use the service.",
        templateId: "language-access-review",
      },
    ],
    notes: [
      "An implementation checklist should look at both translated content and whether people can actually reach staff who are ready to arrange help.",
    ],
    related: [{ label: "Cultural and language access planning", href: "/practice/clas" }],
  },
  {
    id: "workforce",
    number: 7,
    title: "Workforce equity and inclusive management tools",
    question: "Do the agency's hiring, development and retention practices remove barriers that have nothing to do with the work?",
    intro: [
      "A strong set of workforce tools covers structured selection, accessible hiring, open advancement, employee support, and analysis of everything from recruitment through retention.",
    ],
    items: [
      {
        name: "Job-description review checklist",
        purpose: "Look for credentials that are not needed, unclear essential functions, inaccessible wording and requirements unrelated to the work.",
        use: "Review job descriptions with human resources, hiring managers and accessibility specialists.",
        limitation: "Employment changes need the reviews named below before they take effect.",
        templateId: "workforce-review",
      },
      {
        name: "Structured interview guide and scoring rubric",
        purpose: "Check that questions are consistent, criteria are related to the job and the reason for each selection is written down.",
        use: "Work with human resources and hiring managers.",
        limitation: "Get human resources and labor relations review before using it.",
        templateId: "workforce-review", href: "/practice/gp-6",
      },
      {
        name: "Hiring-stage analysis",
        purpose: "Look at patterns from applicant to interview, and from interview to offer.",
        use: "Work with human resources analytics and equity staff.",
        limitation: "Use group-level patterns only; never review individual candidates in a general tracker.",
        templateId: "workforce-review",
      },
      {
        name: "Retention and advancement dashboard",
        purpose: "Look at turnover, promotion, access to development and differences across job categories.",
        use: "Work with human resources, leadership and data staff.",
        limitation: "Small groups need privacy protection.",
        templateId: "workforce-review",
      },
      {
        name: "Accessible onboarding checklist",
        purpose: "Check whether new employees can use required systems, get support and understand expectations.",
        use: "Work with supervisors, human resources and accessibility staff.",
        limitation: "Ask new employees what helped and what did not, and update the checklist.",
        templateId: "workforce-review",
      },
      {
        name: "Mentoring and development access inventory",
        purpose: "Check how open and accessible career-development opportunities are.",
        use: "Work with learning staff and managers.",
        limitation: "Look at who is offered opportunities, not only who takes them.",
        templateId: "workforce-review",
      },
      {
        name: "Employee resource group charter",
        purpose: "Set purpose, leadership support and participation, and protect members from carrying an unfair share of unpaid inclusion work.",
        use: "Work with executive sponsors and employee groups.",
        limitation: "Follow current state employee resource group guidelines.",
        templateId: "workforce-review", href: "/employee-resource-groups",
      },
    ],
    notes: [
      "Use these tools to improve job-related processes and remove barriers that are not needed.",
      "Have human resources, labor relations, affirmative action and legal counsel review employment changes before they take effect, and follow applicable employment requirements.",
    ],
  },
  {
    id: "culture-learning-concerns",
    number: 8,
    title: "Workplace culture, learning and concern-response tools",
    question: "Are people heard, learning in ways that change practice, and able to raise concerns safely?",
    intro: [
      "A useful culture toolkit combines listening to employees, manager practice, applied learning and clear routes for raising concerns. Use all four, rather than treating training completion as the outcome.",
    ],
    items: [
      { name: "Employee climate survey", purpose: "Cover belonging, fairness, voice, trust and accessibility.", use: "Run it on a regular cycle and share results and actions back.", limitation: "Results are group-level only." },
      { name: "Facilitated listening-session guide", purpose: "Hear experiences that a survey cannot capture.", use: "Use trained facilitators and accessible formats.", limitation: "Listening sessions are not a reporting channel for formal complaints." },
      { name: "Inclusive team norms and meeting practices", purpose: "Agree how a team works together and makes room for every voice.", use: "Revisit norms when teams change.", limitation: "Norms help only when the team, including its leader, holds to them.", href: "/practice-guides/inclusive-meetings" },
      { name: "Role-based learning plans", purpose: "Learning plans for managers, policy staff, grant managers, analysts and service teams.", use: "Tie each plan to the decisions that role makes.", limitation: "Completion is not the outcome." },
      { name: "Scenario-based exercises tied to actual work", purpose: "Practice on real situations.", use: "Use cases from the team's own work, with details removed.", limitation: "Remove names and case details." },
      { name: "Follow-up checks", purpose: "Check whether participants changed a practice or process.", use: "Ask a few weeks after learning what changed.", limitation: "Ask what participants tried, what happened and what support they still need. Use their experience of the session to improve the learning as well." },
      { name: "Concern-routing guide", purpose: "Tell informal support apart from formal reporting channels.", use: "Make sure staff know where each kind of concern goes.", limitation: "It routes concerns; it does not resolve formal matters.", href: "/support/right-person" },
    ],
    caution: "Formal discrimination, harassment, retaliation and accessibility matters should go to authorized processes rather than being handled only through dialogue, coaching or learning activities.",
  },
  {
    id: "procurement-grants",
    number: 9,
    title: "Procurement, contracting and grant-making tools",
    question: "Do the agency's purchasing and grant processes open doors or create barriers that are not needed?",
    intro: [
      "Minnesota's Office of Equity in Procurement provides a searchable directory of certified Targeted Group, Economically Disadvantaged and Veteran-Owned businesses. It is a practical resource for finding and reaching out to suppliers.",
    ],
    items: [
      {
        name: "Certified vendor directory", publisher: "Office of Equity in Procurement, State of Minnesota",
        purpose: "Searchable directory of certified Targeted Group, Economically Disadvantaged and Veteran-Owned businesses.",
        use: "Search it before every solicitation and record the outreach.",
        limitation: "Finding vendors is a first step; the solicitation itself must not create barriers that are not needed.",
      },
      {
        name: "State diverse-spend reporting", publisher: "State of Minnesota",
        purpose: "Existing reporting on state spending with diverse businesses.",
        use: "Use it as a baseline for the participation and spending dashboard.",
        limitation: "Reporting shows results; it does not explain the process behind them.",
      },
      {
        name: "Equity Select purchasing policy", publisher: "State of Minnesota",
        purpose: "A published state purchasing policy.",
        use: "Procurement staff should verify its current applicability, conditions and approval requirements for a specific purchase.",
        limitation: "It is not blanket permission for an award.",
      },
      {
        name: "Procurement review package",
        purpose: "Certified vendor directory search, outreach log, review of unnecessary experience, insurance, administrative or submission barriers, accessible solicitation checklist, clear evaluation rubric, record of award decisions, payment-timeliness and vendor-experience review, and a participation and spending dashboard.",
        use: "Apply the package to each significant solicitation.",
        limitation: "Start from the directory and state diverse-spend reporting, and have procurement staff confirm each step fits current procurement rules.",
        templateId: "procurement-grant-review", href: "/practice/gp-10",
      },
      {
        name: "Community Engagement in Grant-Making resource", publisher: "Minnesota Department of Human Services",
        purpose: "Guidance on community participation in grant-making.",
        use: "Use it alongside an equity assessment of the grant process.",
        limitation: "Written in 2019; review it for whether it still applies.",
      },
      {
        name: "Grant-making equity questions",
        purpose: "Ask whether communities helped define the problem, whether application requirements create barriers that are not needed, whether technical assistance is accessible, and whether reporting expectations are proportionate.",
        use: "Answer them during grant design, before the solicitation is released. The ADSA guide names grant design, requests for information, requests for proposals and grantee selection as chances for engagement.",
        templateId: "procurement-grant-review",
      },
    ],
  },
  {
    id: "data-evaluation",
    number: 10,
    title: "Data, evaluation and service-improvement tools",
    question: "Is the evidence leading to a change in practice, not only a disparities dashboard?",
    intro: [
      "The aim is to connect evidence to a change in practice, not simply to produce a disparities dashboard.",
      "For aging and disability work, the ADSA guide identifies these existing data resources.",
    ],
    items: [
      { name: "DHS Aging Data Profiles", publisher: "Minnesota Department of Human Services; identified in the ADSA guide", purpose: "Data profiles on older Minnesotans.", use: "Use as background for aging-related reviews.", limitation: "Profiles describe populations; pair them with program and lived-experience evidence." },
      { name: "Long-Term Services and Supports (LTSS) performance measures", publisher: "Minnesota Department of Human Services; identified in the ADSA guide", purpose: "Performance measures for long-term services and supports.", use: "Use as baseline and trend measures for service reviews.", limitation: "Check definitions and denominators before comparing groups." },
      { name: "LTSS demographic dashboard", publisher: "Minnesota Department of Human Services; identified in the ADSA guide", purpose: "Demographic information on people using long-term services and supports.", use: "Use it to describe who uses services. Assessing who is missing also requires evidence about the population that could use them.", limitation: "Interpret with data-quality checks and community context." },
      { name: "Vulnerable Adult Protection Dashboard", publisher: "Minnesota Department of Human Services; identified in the ADSA guide", purpose: "Data on adult protection.", use: "Use for context on protection-related work.", limitation: "Interpret with care and privacy review." },
      { name: "Minnesota Olmstead Plan progress reports", publisher: "State of Minnesota; identified in the ADSA guide", purpose: "Progress on Minnesota's Olmstead Plan for people with disabilities.", use: "Connect reviews to statewide integration goals.", limitation: "Statewide progress reports may not break out a single program.", url: "https://mn.gov/dhs/general-public/about-dhs/olmstead/" },
      { name: "Internal person-level database dashboard", publisher: "Identified in the ADSA guide", purpose: "An internal dashboard with person-level data.", use: "Use it inside DHS only. Do not give PDFs or screenshots of it to external partners; work with data staff on what can be shared.", limitation: "The ADSA guide states it is internal-only. Do not give PDFs or screenshots of it to external partners; work with data staff on appropriate sharing." },
      { name: "Equity metric definition sheet", purpose: "Set the population, numerator, denominator, period, source, missing data and limits on interpretation.", use: "Fill one in for every measure before reporting it.", templateId: "metric-definition" },
      { name: "Baseline and trend dashboard", purpose: "Show whether access, timeliness, experience and outcomes change over time.", use: "Start from a defined baseline." },
      { name: "Mixed-method evaluation plan", purpose: "Show how administrative data and lived experience will be read together.", use: "Plan both kinds of evidence from the start.", href: "/practice/measurement" },
      { name: "Root-cause review", purpose: "Find which policy, process, communication or resource barriers may contribute to a disparity.", use: "Use it when a measure shows a gap.", href: "/equity-review/structural" },
      { name: "Improvement action tracker", purpose: "Record what will change, who owns the change and when results will be reviewed.", use: "Link every finding to an owned action.", templateId: "action-tracker" },
      { name: "Human Services Performance Management improvement tools", publisher: "Minnesota Department of Human Services, for counties", purpose: "Process-improvement tools DHS publishes for counties.", use: "Use as an additional process-improvement resource.", limitation: "Written for counties; adapt to the agency setting." },
    ],
    caution: "The ADSA guide states that the person-level database dashboard is internal-only. PDFs or screenshots of it should not be given to external partners. Work with data staff on appropriate sharing.",
    lists: [
      {
        heading: "Suggested indicators",
        items: [
          "Application completion and abandonment.",
          "Processing time.",
          "Successful service connection.",
          "Access to requested communication assistance.",
          "Accommodation fulfillment.",
          "Employee retention and advancement.",
          "Community recommendations receiving a documented response.",
          "Procurement participation and payment experience.",
        ],
        note: "Choose indicators that fit the service or process being improved. Read them with suitable denominators, community context, data-quality checks and privacy review. The statewide toolkit calls for evidence broken out by group and clear success measures. Decide what each finding supports: a change, further investigation or continued monitoring.",
      },
    ],
  },
  {
    id: "governance",
    number: 11,
    title: "Governance and implementation tools",
    question: "How do findings become decisions owned by the people with authority to change the system?",
    intro: [
      "Equity Directors need a way to turn findings into operational decisions owned by the people who have authority to change the underlying systems. These management tools help.",
    ],
    items: [
      { name: "Equity governance charter", purpose: "Set sponsorship, scope, membership and decision authority.", use: "Agree it with the executive sponsor first.", limitation: "A charter without decision authority becomes a discussion group." },
      { name: "Responsibility matrix", purpose: "Make clear who approves, advises, carries out, reviews and resolves escalations.", use: "Fill it in for each pilot decision.", limitation: "Name roles, not people.", href: "/support/right-person" },
      { name: "People, Access and Culture activity inventory", purpose: "Find current work, duplication, gaps and chances to share resources.", use: "Build it in the first 30 days.", limitation: "Keep it short enough to stay current." },
      { name: "Unit action-plan template", purpose: "Connect findings to actions, owners, resources, milestones and measures.", use: "One plan per unit or pilot.", limitation: "Every action needs an owner who has the authority to do it.", templateId: "action-tracker" },
      { name: "Decision and risk register", purpose: "Make unresolved barriers and executive decisions visible.", use: "Review it at each leadership review.", limitation: "Keep sensitive employee and client information out of it.", templateId: "decision-log" },
      { name: "Leadership review agenda", purpose: "Review results and decisions needed, not only completed activities.", use: "Put decisions needed at the top of the agenda.", limitation: "Keep the review on results, not on activity counts." },
      { name: "Community feedback commitment tracker", purpose: "Track whether promised follow-up happened.", use: "Check it before every community report-back.", limitation: "Report back on commitments that were not kept, too.", templateId: "action-tracker" },
      { name: "Evidence register", purpose: "Keep the basis for findings, recommendations and claims of progress.", use: "Add the source for every claim of progress.", limitation: "Record where evidence is missing as well as where it exists.", href: "/practice/requirements" },
    ],
    notes: [
      "An Equity Director can coordinate methods and provide analysis. Human resources, program leadership, accessibility specialists, procurement, Tribal relations and other authorized owners keep responsibility for their own operational decisions. Clear decision rights keep this work moving.",
    ],
  },
  {
    id: "digital-organization",
    number: 12,
    title: "How to organize the tools digitally",
    question: "Where should the tools and records live?",
    intro: [
      "Start with the workflows and records, then decide whether existing approved systems can support them. Use existing structures where they can do the job.",
    ],
    items: [],
    lists: [
      {
        heading: "A minimum digital arrangement could include",
        items: [
          "A resource library holding current approved tools and guidance.",
          "An intake register for proposed reviews.",
          "An action tracker with owners, deadlines and evidence.",
          "A decision register.",
          "An engagement and follow-up log.",
          "A restricted analytics workspace.",
          "A separate area for approved public reporting.",
        ],
        note: "Before choosing software, confirm agency accessibility, security, records, procurement and data-handling requirements.",
      },
    ],
    caution: "Keep sensitive employee concerns and protected client information out of general-purpose trackers.",
  },
  {
    id: "first-90-days",
    number: 13,
    title: "First 90 days",
    question: "What should a new Equity Director do first?",
    intro: [
      "Start with a small number of real policies or programs, as the statewide guide advises. Then follow a simple cycle: assess, implement, measure, improve.",
    ],
    items: [],
    notes: [
      "Good pilots could include a public-facing notice or form, a grant solicitation, a hiring process or a service-access workflow. Choose decisions where an operational owner has the authority and capacity to act on the findings.",
    ],
  },
  {
    id: "starter-package",
    number: 14,
    title: "Priority starter package",
    question: "Which 12 items should be assembled first?",
    intro: [
      "For practical deployment, assemble these 12 items first. Start with the three foundational DHS resources, then build the nine operational supports with the people responsible for each area.",
    ],
    items: [],
    notes: [
      "Together, they turn the published policy expectation and the statewide analysis criteria into a repeatable process with evidence, participation, resources and accountability.",
      "Across the Minnesota Department of Human Services, the next step is to connect these instruments to the strategic plan and tool suite in section 1, so each one has an owner, a review date and a place in regular decision-making.",
    ],
  },
];

export type NinetyDayPeriod = { id: string; period: string; actions: string[]; deliverables: string[] };

export const DIRECTOR_FIRST_90_DAYS: readonly NinetyDayPeriod[] = [
  {
    id: "days-1-30", period: "Days 1 to 30",
    actions: ["Get the current approved DHS resources.", "Take stock of existing efforts.", "Confirm executive sponsorship and operational partners.", "Choose two or three pilot decisions."],
    deliverables: ["Resource inventory.", "Responsibility map.", "Pilot scope.", "Baseline plan."],
  },
  {
    id: "days-31-60", period: "Days 31 to 60",
    actions: ["Apply equity assessments.", "Carry out appropriate community engagement and Tribal coordination.", "Review accessibility and language access.", "Identify funded corrective actions."],
    deliverables: ["Completed assessments.", "Engagement records.", "Decision log.", "Action plans."],
  },
  {
    id: "days-61-90", period: "Days 61 to 90",
    actions: ["Review implementation progress.", "Gather participant and staff feedback.", "Test the measures.", "Revise templates.", "Identify what needs leadership approval."],
    deliverables: ["Pilot findings.", "Updated tools.", "Initial scorecard.", "Recommendations for expansion."],
  },
];

export type StarterItem = { number: number; title: string; href: string; detail: string };

export const DIRECTOR_STARTER_PACKAGE: readonly StarterItem[] = [
  { number: 1, title: "Current DHS Equity Policy", href: "/equity-policy", detail: "The published policy expectation for equity analysis." },
  { number: 2, title: "Current internal DHS Equity Analysis Toolkit", href: `${DIRECTOR_TOOLKIT_HREF}#foundation`, detail: "The current approved version, through the Equity, Diversity and Inclusion InfoLink page." },
  { number: 3, title: "State Equity Analysis Toolkit and step-by-step guide", href: `${DIRECTOR_TOOLKIT_HREF}#foundation`, detail: "The seven statewide criteria and the guide for applying them." },
  { number: 4, title: "Equity review intake form", href: `${DIRECTOR_TEMPLATES_HREF}#template-intake-triage`, detail: "Shows which proposals need a fuller review." },
  { number: 5, title: "Community engagement planning template", href: `${DIRECTOR_TEMPLATES_HREF}#template-partner-map`, detail: "Plan who takes part, how, and how their input shapes the decision." },
  { number: 6, title: "Tribal coordination and consultation screening process, developed with Tribal relations", href: `${DIRECTOR_TEMPLATES_HREF}#template-tribal-screening`, detail: "Screen decisions early and bring in the person or area responsible for Tribal and Urban Indian Relations." },
  { number: 7, title: "Accessibility review checklist", href: `${DIRECTOR_TEMPLATES_HREF}#template-accessibility-review`, detail: "Accessibility built into design and approval." },
  { number: 8, title: "Language-access review checklist", href: `${DIRECTOR_TEMPLATES_HREF}#template-language-access-review`, detail: "Translated content and a real path to an interpreter." },
  { number: 9, title: "Workforce process-review worksheet", href: `${DIRECTOR_TEMPLATES_HREF}#template-workforce-review`, detail: "Hiring, onboarding, development and retention processes." },
  { number: 10, title: "Procurement and grant equity review worksheet", href: `${DIRECTOR_TEMPLATES_HREF}#template-procurement-grant-review`, detail: "Solicitations, awards and grant design." },
  { number: 11, title: "Action, decision and commitment tracker", href: `${DIRECTOR_TEMPLATES_HREF}#template-action-tracker`, detail: "Owners, deadlines, evidence and follow-up." },
  { number: 12, title: "A small outcome scorecard", href: `${DIRECTOR_TEMPLATES_HREF}#template-outcome-scorecard`, detail: "A few measures that show whether access improved." },
];

/* ------------------------------------------------------------------ Templates */

export type DirectorTemplateId =
  | "intake-triage" | "impact-assessment" | "budget-worksheet" | "decision-log" | "heard-changed-log" | "partner-map"
  | "tribal-screening" | "accessibility-review" | "language-access-review" | "workforce-review" | "procurement-grant-review"
  | "action-tracker" | "metric-definition" | "outcome-scorecard";

export type TemplateField =
  | { kind: "text"; id: string; label: string; help?: string }
  | { kind: "long"; id: string; label: string; help?: string }
  | { kind: "choice"; id: string; label: string; help?: string; options: string[] }
  | { kind: "checklist"; id: string; label: string; help?: string; items: string[] }
  | { kind: "table"; id: string; label: string; help?: string; columns: string[]; rows: number };

export type DirectorTemplate = {
  id: DirectorTemplateId;
  title: string;
  sectionId: string;
  purpose: string;
  howToUse: string;
  fields: TemplateField[];
};

export const CHECKLIST_ANSWERS = ["Yes", "No", "Not sure", "Does not apply"] as const;
export const TEMPLATE_KEEP_OUT = "Use roles, not names. Leave out client information, case details, personnel matters and any sensitive employee concern. Formal concerns go to authorized processes, not to this form.";

const role = "Use a role or area, not a person's name.";

export const DIRECTOR_TEMPLATES: readonly DirectorTemplate[] = [
  {
    id: "intake-triage", title: "Equity review intake and triage", sectionId: "policy-program-budget",
    purpose: "Decide which proposals need a fuller equity review, so teams apply the existing analysis tools in proportion to the stakes.",
    howToUse: "Fill this in when a proposal is first raised. Confirm the review required by DHS Equity Policy before deciding its scope. Triage helps organize the work; it does not waive a required analysis.",
    fields: [
      { kind: "text", id: "proposal", label: "Decision or proposal" },
      { kind: "text", id: "area", label: "Program or area responsible", help: role },
      { kind: "long", id: "change", label: "What is changing, and when will the decision be made?" },
      { kind: "checklist", id: "triggers", label: "Does the proposal change any of these?", help: "Any \"Yes\" or \"Not sure\" usually points to a fuller review.", items: [
        "Eligibility processes.", "Service access.", "Assessment practices.", "Public communications.", "Grants.", "Procurement.", "Workforce procedures.",
        "Anything affecting Minnesota's 11 Tribal Nations or urban American Indian communities.", "Digital content or systems people must use.", "Notices or materials for people who speak languages other than English.",
      ] },
      { kind: "long", id: "affected", label: "Who is likely to be affected, and how?" },
      { kind: "choice", id: "level", label: "Level of review", options: ["Full equity impact assessment.", "Focused review of specific parts.", "No further review now, with the reason recorded below."] },
      { kind: "long", id: "reason", label: "Reason for the triage decision" },
      { kind: "text", id: "decided", label: "Triage decided by (role) and date", help: role },
    ],
  },
  {
    id: "impact-assessment", title: "Equity impact assessment record", sectionId: "policy-program-budget",
    purpose: "Record a full equity review in nine parts. It puts the statewide toolkit into practice alongside the DHS Equity Analysis Toolkit.",
    howToUse: "Use the DHS toolkit as the agency starting point and the statewide toolkit as a companion.",
    fields: [
      { kind: "long", id: "decision", label: "1. Decision or proposal under review" },
      { kind: "long", id: "outcome", label: "2. Intended outcome and affected populations" },
      { kind: "long", id: "disparities", label: "3. Current disparities and supporting evidence", help: "Use evidence broken out by group where it exists, and say where it does not." },
      { kind: "long", id: "engagement", label: "4. Community and Tribal engagement completed or still needed" },
      { kind: "long", id: "effects", label: "5. Possible benefits, burdens and unintended effects" },
      { kind: "long", id: "alternatives", label: "6. Alternatives considered" },
      { kind: "long", id: "modifications", label: "7. Changes to make" },
      { kind: "text", id: "owners", label: "8. Responsible executive and implementation owner", help: role },
      { kind: "long", id: "resources", label: "9. Resources, measures and review date" },
      { kind: "checklist", id: "criteria", label: "Statewide criteria covered", help: "The seven criteria of the State of Minnesota Equity Analysis Toolkit.", items: ["Impact.", "Partner engagement.", "Data.", "Access.", "Monitoring.", "Resources.", "Accountability."] },
    ],
  },
  {
    id: "budget-worksheet", title: "Budget equity worksheet", sectionId: "policy-program-budget",
    purpose: "Ask who benefits, who bears the effects, and what it costs to make a proposal accessible.",
    howToUse: "Use it for each significant budget proposal, together with the equity impact assessment. The statewide toolkit includes financial resources, dedicated funding to reduce disparities, staff and training as review criteria.",
    fields: [
      { kind: "text", id: "proposal", label: "Budget proposal" },
      { kind: "long", id: "benefits", label: "Who benefits from the spending?" },
      { kind: "long", id: "effects", label: "Who feels the effects of a cut or service change?" },
      { kind: "long", id: "access-costs", label: "What funding is needed for translation, accommodations, accessible technology and participation?" },
      { kind: "long", id: "unfunded", label: "Which barriers to carrying it out remain unfunded?" },
      { kind: "long", id: "outcomes", label: "Which outcomes will show whether the investment improved access?" },
      { kind: "long", id: "dedicated", label: "Dedicated funding to reduce disparities, staff and training included" },
    ],
  },
  {
    id: "decision-log", title: "Decision and mitigation log", sectionId: "policy-program-budget",
    purpose: "Keep findings, changes to make, decisions, reasons, owners and open risks in one place.",
    howToUse: "Add a row each time a finding leads to a decision. It also serves as the decision and risk register in governance.",
    fields: [
      { kind: "text", id: "subject", label: "Decision or review this log covers" },
      { kind: "table", id: "log", label: "Log", columns: ["Finding", "Change to make", "Decision made", "Reason", "Accountable owner (role)", "Open risks", "Date"], rows: 3 },
    ],
  },
  {
    id: "heard-changed-log", title: "\"What we heard / what changed\" log", sectionId: "community-engagement",
    purpose: "Link community input to decisions, and explain recommendations that were not adopted.",
    howToUse: "Summarize themes, not individual comments. Use it to write an accessible feedback report and to track follow-up commitments.",
    fields: [
      { kind: "text", id: "decision", label: "Decision or effort" },
      { kind: "text", id: "engagement", label: "Engagement activities and dates" },
      { kind: "table", id: "log", label: "What we heard and what changed", columns: ["What we heard (theme)", "Where we heard it (group or forum)", "What changed", "If not adopted, why", "How and when we reported back"], rows: 4 },
      { kind: "long", id: "report", label: "How the feedback report will be shared in accessible formats and languages" },
    ],
  },
  {
    id: "partner-map", title: "Partner and participation map", sectionId: "community-engagement",
    purpose: "Identify affected groups, missing perspectives, trusted organizations and barriers to taking part. This also serves as the community engagement planning template in the starter package.",
    howToUse: "Fill it in before inviting anyone. Start from the DHS Community Engagement Guide. For paying or reimbursing participants, settle the applicable agency authority and administrative process before making any promise.",
    fields: [
      { kind: "text", id: "decision", label: "Decision or effort" },
      { kind: "long", id: "purpose", label: "Purpose of engagement and how input will influence the decision" },
      { kind: "text", id: "timing", label: "Timing: when input is needed so it can still change the decision" },
      { kind: "table", id: "map", label: "Participation map", columns: ["Affected group", "Missing perspective?", "Trusted organizations or channels", "Barriers to taking part", "Supports needed (language, accessibility, scheduling, resources)", "How we will invite them"], rows: 4 },
      { kind: "long", id: "resources", label: "Resources and authority for participant support" },
    ],
  },
  {
    id: "tribal-screening", title: "Tribal consultation screening checklist", sectionId: "tribal-relations",
    purpose: "Screen a proposed decision for Tribal consultation, plan the consultation, and record issues and commitments.",
    howToUse: "Develop and use this with the person or area responsible for Tribal and Urban Indian Relations. DHS consultation procedures and Tribal relations guidance decide what consultation requires; this screening does not.",
    fields: [
      { kind: "text", id: "decision", label: "Proposed decision" },
      { kind: "checklist", id: "screen", label: "Screening questions", items: [
        "Could the decision affect one or more of Minnesota's 11 Tribal Nations?",
        "Could it affect how American Indian people reach or use services?",
        "Could it affect funding, grants or contracts with Tribal governments?",
        "Could it affect urban American Indian communities?",
        "Have Tribal Nations, urban Native populations or agency Tribal liaisons been engaged or notified?",
        "Has the person or area responsible for Tribal and Urban Indian Relations been contacted?",
      ] },
      { kind: "long", id: "issue", label: "Consultation planning record: the issue" },
      { kind: "text", id: "timeline", label: "Decision timeline" },
      { kind: "long", id: "contacts", label: "Appropriate contacts and responsible DHS officials", help: role },
      { kind: "table", id: "record", label: "Issues raised, commitments and follow-up", columns: ["Issue raised", "Commitment made", "Follow-up and date", "Decision"], rows: 3 },
      { kind: "long", id: "urban", label: "Separate engagement plan for urban American Indian communities, where appropriate" },
    ],
  },
  {
    id: "accessibility-review", title: "Accessibility review checklist", sectionId: "accessibility",
    purpose: "Build accessibility into design and approval, not only a final document check.",
    howToUse: "Use it from the first draft. Coordinate with accessibility coordinators, Minnesota IT Services, communications, procurement and the program owner. Build the meeting and event part with agency accessibility specialists and the people who will take part.",
    fields: [
      { kind: "text", id: "item", label: "Content, system, meeting or event being reviewed" },
      { kind: "checklist", id: "digital", label: "Digital content and systems", items: [
        "Checked against the current Minnesota digital accessibility standard, including the Web Content Accessibility Guidelines 2.1 Level AA and Section 508.",
        "Automated testing done (for example Accessibility Insights for Web, the WAVE (Web Accessibility Evaluation Tool) browser extension, axe DevTools or ANDI (Accessible Name & Description Inspector)), with findings interpreted by a person.",
        "Keyboard testing done and written down.",
        "Documents checked with Adobe accessibility tools, fixed and checked again.",
        "Video has accurate captions; audio has a transcript.",
        "Accessibility requirements written into any purchase or contract.",
      ] },
      { kind: "checklist", id: "meeting", label: "Meetings and events", items: [
        "Materials shared in accessible formats ahead of time.",
        "More than one way to take part (spoken, written, before or after).",
        "Captioning arranged.",
        "Sign language and spoken-language interpretation arranged where needed.",
        "A clear way to request accommodations, with a named role to respond.",
      ] },
      { kind: "long", id: "findings", label: "Findings and fixes" },
      { kind: "text", id: "owner", label: "Who owns the fixes (role) and retest date", help: role },
    ],
  },
  {
    id: "language-access-review", title: "Language-access review checklist", sectionId: "language-access",
    purpose: "Check both translated content and whether people can actually reach staff who are ready to arrange help.",
    howToUse: "Use DHS resources first: the Limited English Proficiency Plan (DHS-4210-ENG), the eDocs translated-document search and the Language Block guidance. Then walk the person's path in the workflow audit.",
    fields: [
      { kind: "text", id: "item", label: "Document, notice or service being reviewed" },
      { kind: "checklist", id: "checks", label: "Checks", items: [
        "Reviewed against the DHS Limited English Proficiency Plan, DHS-4210-ENG.",
        "Searched DHS eDocs for an existing translation before ordering a new one.",
        "Public document includes the required Language Block notice of free language assistance.",
        "\"I need a language interpreter\" cards are available where people first make contact.",
        "Staff know how to arrange an interpreter, and people can reach those staff.",
        "Interpretation and translation arranged through the applicable state contracts and agency procedures.",
      ] },
      { kind: "table", id: "audit", label: "Workflow audit: follow a person's experience", columns: ["Step", "Language help available?", "Gap found", "Fix and owner (role)"], rows: 5, help: "Suggested steps: first contact, application, notices, follow-up, appeals." },
    ],
  },
  {
    id: "workforce-review", title: "Workforce process-review worksheet", sectionId: "workforce",
    purpose: "Review a hiring, onboarding, development or retention process for barriers that are not related to the work.",
    howToUse: "Review processes, not people. Use group-level data only. Have human resources, labor relations, affirmative action and legal counsel review proposed employment changes before they take effect.",
    fields: [
      { kind: "text", id: "process", label: "Process being reviewed" },
      { kind: "checklist", id: "job", label: "Job description", items: ["No credentials that are not needed for the work.", "Essential functions are clear.", "Wording is accessible and plain.", "No requirements unrelated to the work."] },
      { kind: "checklist", id: "selection", label: "Selection", items: ["Use consistent, job-related core questions and arrange needed accommodations.", "Scoring criteria are related to the job.", "The reason for the selection is written down.", "Applicant-to-interview and interview-to-offer patterns reviewed at group level."] },
      { kind: "checklist", id: "support", label: "Onboarding, development and retention", items: ["New employees can use required systems and get support.", "Development opportunities are shared openly and are accessible.", "Turnover and promotion differences across job categories reviewed.", "Employee resource group charter guards against unfair unpaid inclusion work."] },
      { kind: "long", id: "findings", label: "Findings and proposed changes" },
      { kind: "checklist", id: "reviews", label: "Reviews before implementation", items: ["Human resources.", "Labor relations.", "Affirmative action.", "Legal counsel."] },
    ],
  },
  {
    id: "procurement-grant-review", title: "Procurement and grant equity worksheet", sectionId: "procurement-grants",
    purpose: "Review a solicitation, contract or grant for barriers that are not needed and for fair participation.",
    howToUse: "Use the Office of Equity in Procurement certified vendor directory and the DHS Community Engagement in Grant-Making resource. The Equity Select purchasing policy is not blanket permission for an award; procurement staff should verify its applicability, conditions and approval requirements for the specific purchase.",
    fields: [
      { kind: "text", id: "item", label: "Solicitation, contract or grant" },
      { kind: "checklist", id: "procurement", label: "Procurement review package", items: [
        "Certified vendor directory searched.", "Outreach logged.", "Experience, insurance, administrative and submission requirements checked for barriers that are not needed.",
        "Solicitation is accessible.", "Evaluation rubric is clear.", "Award decision recorded.", "Payment timeliness and vendor experience reviewed.", "Participation and spending tracked.",
      ] },
      { kind: "checklist", id: "grants", label: "Grant-making questions", items: [
        "Communities helped define the problem.", "Application requirements create no barriers that are not needed.", "Technical assistance is accessible.", "Reporting expectations are proportionate.",
        "Engagement planned for grant design, requests for information, requests for proposals and grantee selection.",
      ] },
      { kind: "long", id: "findings", label: "Findings and changes made" },
    ],
  },
  {
    id: "action-tracker", title: "Action, decision and commitment tracker", sectionId: "governance",
    purpose: "Track actions, decisions and commitments with owners, deadlines and evidence. It works as the improvement action tracker, the unit action plan and the community feedback commitment tracker.",
    howToUse: "Review it at each leadership review. Put decisions needed at the top. Keep sensitive employee concerns and protected client information out of it.",
    fields: [
      { kind: "text", id: "scope", label: "Unit, pilot or effort" },
      { kind: "table", id: "tracker", label: "Tracker", columns: ["Item", "Type (action, decision or commitment)", "Owner (role)", "Resources", "Due date", "Status", "Evidence", "Review date"], rows: 4 },
    ],
  },
  {
    id: "metric-definition", title: "Equity metric definition sheet", sectionId: "data-evaluation",
    purpose: "Define a measure precisely before anyone reports it.",
    howToUse: "Fill in one sheet per measure. Defining a measure does not authorize collecting data; work with data staff and complete privacy review first. Person-level internal data stays internal.",
    fields: [
      { kind: "text", id: "name", label: "Measure name" },
      { kind: "long", id: "population", label: "Population" },
      { kind: "text", id: "numerator", label: "Numerator (what is counted)" },
      { kind: "text", id: "denominator", label: "Denominator (out of what)" },
      { kind: "text", id: "period", label: "Period" },
      { kind: "text", id: "source", label: "Data source" },
      { kind: "long", id: "groups", label: "How results will be broken out by group, and small-number protections" },
      { kind: "long", id: "missing", label: "Missing data" },
      { kind: "long", id: "limits", label: "Limits on interpretation" },
      { kind: "text", id: "owner", label: "Who owns this measure (role)", help: role },
    ],
  },
  {
    id: "outcome-scorecard", title: "Small outcome scorecard", sectionId: "data-evaluation",
    purpose: "Track a few measures that show whether access improved.",
    howToUse: "Pick three to six indicators that fit the service. Suggested indicators: application completion and abandonment, processing time, successful service connection, access to requested communication assistance, accommodation fulfillment, employee retention and advancement, community recommendations receiving a documented response, and procurement participation and payment experience.",
    fields: [
      { kind: "text", id: "scope", label: "Service or process" },
      { kind: "table", id: "scorecard", label: "Scorecard", columns: ["Indicator", "Baseline", "Current", "Direction we want", "Data notes (denominator, quality, privacy)", "What we will do"], rows: 4 },
      { kind: "long", id: "context", label: "Community context and lived experience behind the numbers" },
    ],
  },
];

export function directorTemplate(id: string): DirectorTemplate | undefined {
  return DIRECTOR_TEMPLATES.find(template => template.id === id);
}

export function templateAnchor(id: DirectorTemplateId): string {
  return `template-${id}`;
}

export function templateHref(id: DirectorTemplateId): string {
  return `${DIRECTOR_TEMPLATES_HREF}#${templateAnchor(id)}`;
}

export function sectionHref(id: string): string {
  return `${DIRECTOR_TOOLKIT_HREF}#${id}`;
}

/** Table cell key, checklist answer key and table row-count key used by the on-page form and the text export. */
export const cellKey = (field: string, row: number, column: number) => `${field}.${row}.${column}`;
export const checkKey = (field: string, item: number) => `${field}.${item}`;

/** Plain-text copy of a filled template, for copying, downloading or pasting elsewhere. Nothing is stored. */
export function templateText(template: DirectorTemplate, values: Readonly<Record<string, string>>, rowCounts: Readonly<Record<string, number>> = {}): string {
  const lines = [template.title, `From the Equity Director toolkit: ${templateHref(template.id)}`, ""];
  for (const field of template.fields) {
    if (field.kind === "checklist") {
      lines.push(field.label);
      field.items.forEach((item, index) => lines.push(`- ${item} ${values[checkKey(field.id, index)] ? `[${values[checkKey(field.id, index)]}]` : "[not answered]"}`));
    } else if (field.kind === "table") {
      lines.push(field.label);
      const rows = Math.max(field.rows, rowCounts[field.id] ?? field.rows);
      for (let row = 0; row < rows; row++) {
        const cells = field.columns.map((column, index) => `${column}: ${values[cellKey(field.id, row, index)]?.trim() || "-"}`);
        if (field.columns.some((_, index) => values[cellKey(field.id, row, index)]?.trim())) lines.push(`  Row ${row + 1}. ${cells.join(" | ")}`);
      }
    } else {
      lines.push(`${field.label}: ${values[field.id]?.trim() || "-"}`);
    }
    lines.push("");
  }
  lines.push(TEMPLATE_KEEP_OUT);
  return lines.join("\n");
}

/** Every sentence of the toolkit a visitor can read, in page order: used by Ask, the graph and the wording tests. */
export function sectionText(section: ToolkitSection): string {
  const parts = [`${section.number}. ${section.title}`, section.question, ...section.intro];
  for (const item of section.items) {
    parts.push(`${item.name}${item.publisher ? ` (${item.publisher})` : ""}. Purpose: ${item.purpose} How an Equity Director can use it: ${item.use}`);
  }
  for (const list of section.lists ?? []) parts.push(`${list.heading}:`, ...list.items, ...(list.note ? [list.note] : []));
  if (section.id === "first-90-days") for (const period of DIRECTOR_FIRST_90_DAYS) parts.push(`${period.period}. Priority actions: ${period.actions.join(" ")} Deliverables: ${period.deliverables.join(" ")}`);
  if (section.id === "starter-package") for (const item of DIRECTOR_STARTER_PACKAGE) parts.push(`${item.number}. ${item.title}. ${item.detail}`);
  if (section.caution) parts.push(section.caution);
  parts.push(...(section.notes ?? []));
  return parts.join("\n");
}

export function templateDescriptionText(template: DirectorTemplate): string {
  const fields = template.fields.flatMap(field => field.kind === "checklist" ? [field.label, ...field.items] : field.kind === "table" ? [`${field.label}: ${field.columns.join(", ")}.`, ...(field.help ? [field.help] : [])] : [field.label, ...(field.help ? [field.help] : [])]);
  return [template.title, template.purpose, template.howToUse, ...fields, TEMPLATE_KEEP_OUT].join("\n");
}
