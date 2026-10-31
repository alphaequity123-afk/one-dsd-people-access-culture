import { defineEditableSurface } from "./editable-surface-contract";

export const CULTURAL_INTELLIGENCE_SURFACE_ID = "learn.cultural-intelligence";

const heading = (key: string, label: string) => ({ key, label, kind: "short" as const, required: true, maxLength: 300 });
const body = (key: string, label: string) => ({ key, label, kind: "long" as const, required: true, maxLength: 4_000 });

/**
 * The hub's own publication, separate from learn.intercultural so that withdrawing one
 * topic cannot take the collection with it. It is deliberately not code-approved: a
 * code-approved area falls back to these values after a withdrawal, which would make
 * withdrawal do nothing. The current-program release registers and publishes it.
 */
export const CULTURAL_INTELLIGENCE_SURFACE = defineEditableSurface({
  surfaceId: CULTURAL_INTELLIGENCE_SURFACE_ID,
  route: "/learn/cultural-intelligence",
  scopePolicy: "inheritable",
  label: "Cultural Intelligence collection",
  fields: [
    heading("eyebrow", "Opening section label"), heading("title", "Page title"), body("intro", "Opening description"),
    body("scopeLine", "How the collection relates to the four capabilities"),
    heading("foundationTitle", "Foundation heading"), body("foundationBody", "Foundation for both applications"),
    heading("messageTitle", "Central message heading"), body("centralMessage", "Central message"),
    body("foundationBook", "How the book shapes the foundation"),
    heading("bookTitle", "Book section heading"), body("bookAnchor", "Why the book anchors the collection"), body("bookCitation", "Book citation"), body("bookAccess", "How to reach the book"),
    body("bookDefinition", "Definition of cultural intelligence"), heading("capabilitiesTitle", "Capabilities heading"), body("capabilitiesIntro", "How the four capabilities work together"),
    body("capabilityDrive", "CQ Drive in our words"), body("capabilityKnowledge", "CQ Knowledge in our words"), body("capabilityStrategy", "CQ Strategy in our words"), body("capabilityAction", "CQ Action in our words"),
    heading("bookContributesTitle", "What the book contributes heading"), body("bookBody", "What the book contributes"),
    heading("buildsTitle", "How the collection builds on the book heading"), body("buildsIntro", "How the collection builds on the book"),
    heading("buildDisabilityTitle", "Disability heading"), body("buildDisability", "What the collection adds on disability"),
    heading("buildServicesTitle", "Human services heading"), body("buildServices", "What the collection adds on human services"),
    heading("buildTribalTitle", "Tribal authority heading"), body("buildTribal", "What the collection says on Tribal authority"),
    heading("buildMeasuresTitle", "Who judges success heading"), body("buildMeasures", "What the collection adds on judging success"),
    heading("differTitle", "Where the collection differs heading"), body("differIntro", "How the differences are framed"),
    heading("differHiringTitle", "First difference heading"), body("differHiring", "Difference on hiring, promotion, ratings and reviews"),
    heading("differAskingTitle", "Second difference heading"), body("bookLimit", "Difference on group tendencies and asking the person"),
    heading("differClustersTitle", "Third difference heading"), body("differClusters", "Difference on cluster labels"),
    heading("bookEvidenceTitle", "Evidence heading"), body("bookEvidence", "What the evidence supports"), body("trademarkNote", "Trademark and non-affiliation line"),
    body("learnBook", "How the book shapes the Learn section"), body("exploreOwnCulture", "The worlds you belong to"), body("exploreBook", "Why capabilities come before community briefs"),
    body("applyQuestions", "Questions for a live project"), body("applyRoutine", "Plan, notice and check routine"),
  ],
  approvedValues: {
    eyebrow: "Learning for everyday work",
    title: "Cultural Intelligence collection",
    intro: "Start with your own culture, learn about the communities you serve, including people with disabilities, and practice decisions in services and in the workplace.",
    scopeLine: "We keep the name Cultural Intelligence, but this collection is broader than the four CQ® capabilities.",
    foundationTitle: "The foundation for One DHS and One DSD",
    foundationBody: "One DHS and One DSD People, Access and Culture share one foundation: careful research on culture, and the education built from it. In practice, you start with your own culture, including the culture of DHS, DSD and your profession. What is known about a group gives you better questions; it never describes the person in front of you. Culture is one possible explanation, looked at alongside schedules, transport, cost and agency rules. Starting with your own culture is a well-argued foundation, not a proven cause of better service, and finishing a course is not evidence that anything changed.",
    messageTitle: "What this collection cannot replace",
    centralMessage: "Knowledge and training never replace direct community engagement, everyday equity conversations and action, or a welcoming, inclusive workplace.",
    foundationBook: "The anchoring book is David Livermore's Leading with Cultural Intelligence. Its main arguments shape everything here. No single way of leading works everywhere, and no group of people can be reduced to a list of traits (prologue, about p. xv). Awareness is not enough, because people need skill in changing how they work (ch. 1, about pp. 15-16). This work belongs inside the mission and a named problem, not bolted on (ch. 9, about pp. 200, 204), and for these applications that means person-centered services and access. Purpose sustains it, and it should not be used to impose your views on others (ch. 3, about pp. 65-67). Being willing to change processes, policies and timelines counts for more than knowing the etiquette (ch. 7, about p. 168). That last point is the bridge from personal skill to changing the system.",
    bookTitle: "The book this collection is anchored in",
    bookAnchor: "This is the book the collection starts from. Its definition and four capabilities frame the capability courses, and its questions and routines run through the courses, tools and leader material here. We cite it openly, explain it in our own words, and say where we go further and where we differ.",
    bookCitation: "David Livermore, Leading with Cultural Intelligence: The Real Secret to Success, 3rd edition. Foreword by Soon Ang and Linn Van Dyne. HarperCollins Leadership, 2024. ISBN 978-1-4002-4747-9 (ebook), 978-1-4002-4744-8 (hardcover).",
    bookAccess: "Opening the book in VitalSource Bookshelf takes a VitalSource sign-in and access to this title.",
    bookDefinition: "In plain terms, cultural intelligence means being able to build relationships and get work done well when cultural differences are in play. The book's wording, credited to Soon Ang and Linn Van Dyne, is \"the capability to relate and work effectively in culturally diverse situations\" (ch. 1, about p. 3). Culture here reaches past race and nation to the worlds people belong to, such as family, faith, profession and interests (ch. 1, about pp. 3-4).",
    capabilitiesTitle: "The four capabilities, in our words",
    capabilitiesIntro: "The book describes four capabilities that work together and do not have to develop in any order (ch. 2, about pp. 27-33).",
    capabilityDrive: "Why this matters to you and whether you believe you can do it. Drive can come from interest in the work, from what it gives you, your team or your mission, and from confidence (ch. 3).",
    capabilityKnowledge: "Understanding how culture shapes people and work, both in general and in the particular setting in front of you (chs. 4 and 5).",
    capabilityStrategy: "Making sense of what is happening: planning ahead, noticing as it unfolds, and checking afterward whether you read it correctly (ch. 6).",
    capabilityAction: "Changing how you act while keeping your goal. That covers what you say, how you say it, and what you communicate without words (ch. 7).",
    bookContributesTitle: "What the book gives this collection",
    bookBody: "It gives us a shared language and a working routine: plan, notice, check (ch. 6). It gives us a sorting habit: is this universal, cultural or personal (ch. 4, about pp. 75, 95)? It treats being able to generate several explanations for puzzling behavior as a mark of advanced knowledge (ch. 4, about p. 74). It shows teams how to agree on ways of working, where one standard can be met in several legitimate ways (ch. 8, about pp. 185-89). And it reminds organizations that people judge them by whoever answers the phone (ch. 9, about p. 206).",
    buildsTitle: "How this collection builds on it",
    buildsIntro: "Everything in this part is the work of these applications, not Livermore's. The book's foreword, by Soon Ang and Linn Van Dyne, names nonprofit and government readers (p. x), but the book says little or nothing on these subjects, and we report that plainly.",
    buildDisabilityTitle: "Disability",
    buildDisability: "The book mentions disability in one passing clause (ch. 8, about p. 184) and does not take up accessibility, ASL or Deaf culture. So we add this: disability is inside every framework and every community, and is never one more group. Before reading silence, eye contact, flat affect, pacing or a speech difference as cultural, consider disability and access. For Deaf people who use ASL, engagement is language access and cultural relations at once. Reasonable accommodation sits beside every idea about hiring, teams and communication.",
    buildServicesTitle: "Human services",
    buildServices: "The book's cases are leader to staff, peer to peer, or seller to buyer. It has no eligibility, case work or client relationship. So we add two questions to his three: is this the system, such as shifts, transport, cost or rules, and is this disability or access? A worker's power over services is real power, not a cultural preference. We turn his questions about organizations on DHS, DSD, counties and providers. The person leads, and how they decide and with whom is asked. He observes that adapting is expected more of some people than others, including women, gay people and Black people (ch. 7, about pp. 165-66). We add a rule: the institution and those with more power adapt first, and people served adapt least. Where CLAS, the Toolkit, language access and person-centered rules apply to your work, they are obligations that no question about whether to adapt can weigh away.",
    buildTribalTitle: "Tribal authority",
    buildTribal: "The book does not address Tribal Nations or government-to-government duties, so nothing here on that subject comes from it. Tribal Nations are governments. We defer to the Office of Indian Affairs and the DHS offices that handle Tribal relations and consultation.",
    buildMeasuresTitle: "Who judges success",
    buildMeasures: "None of the measures the book names, such as self-report, a colleague's 360 rating, situational judgment or an executive's rating, asks the people served. Here, success in service is judged by what people served, families and community partners tell us, by observed practice, by follow-up later on and by service data, with each measure labeled by what it can show. A self-rating, a finished course or a capability ladder is not evidence that anything changed.",
    differTitle: "Where we differ from the book",
    differIntro: "We respect this book and part from it in three places. These are decisions made for these applications, not corrections of his research.",
    differHiringTitle: "CQ is not used for hiring, promotion, ratings or performance reviews here",
    differHiring: "Livermore advises assessing CQ when hiring and building it into reviews, while cautioning against hiring only high scorers (ch. 7, about p. 172; ch. 8, about pp. 188-89; ch. 9, about pp. 208-9, 213). We do not. The book offers no evidence that CQ works for selection and does not discuss adverse impact or accommodation. In our judgment, asking candidates to show how they adapt their communication could disadvantage disabled and Deaf candidates. The book gives no advice on promotion decisions; here we simply go further. No capability, score, dimension or cluster goes into selection criteria, interview or reference questions, ratings, review forms or promotion decisions, and the same holds for the IDI. Team norms stay with the team. Ordinary job duties remain with supervisors and Human Resources under their own rules.",
    differAskingTitle: "Group tendencies lead to questions, and asking the person remains the rule",
    bookLimit: "Livermore allows research-based group tendencies, which he calls sophisticated stereotypes, to inform what you first expect of someone, held loosely and tested in direct contact (ch. 1, about pp. 21-22; ch. 5, about p. 124). He also warns that simply asking has loopholes (ch. 1, about pp. 20-22). He is right that you need something before you meet someone, and right that power can distort answers. We answer both differently. Before you meet, do not guess; offer. Prepare options for language, format, who is present and how decisions get made, and let the person choose. When answers may be distorted, change how and by whom the question is asked: give time, a private option, several ways to answer and a chance to say it again later. Never conclude that the person cannot say. A group fact can produce a question to ask or a change to make in the system. It never produces an expectation of the person.",
    differClustersTitle: "No cluster labels on community pages",
    differClusters: "The book groups the world's cultures into ten clusters and places them on ten dimensions (ch. 5; appendix). We use no cluster names, placements, dimension labels or scores on community pages or in staff exercises about communities. The clusters appear only in the one optional background course, named as his and with their limits. He says himself that they are one way to begin, that each holds enormous variety, and that many groups have little affinity with any of them, including Indigenous populations, African Americans and Caribbean groups (appendix, about p. 233). The book gives no source for where each cluster sits on each dimension.",
    bookEvidenceTitle: "What the evidence supports",
    bookEvidence: "Livermore is a founder of the Cultural Intelligence Center, which sells the CQ assessment (about p. 264), and much of the book's evidence comes from his own research group. He warns readers against easy promises of financial return (ch. 2, about p. 33), then makes softer versions of the same claim (about pp. 33-41), so we do not repeat those figures. A 2021 analysis of 70 studies by Schlaegel, Richter and Taras found that cultural intelligence is associated with job performance. Most of those studies looked at one point in time and relied on what people said about themselves, so this is an association, not proof of cause. The book reports no trial showing that training changes service, and we found no evidence specific to disability services or a state human-services workforce. Applying these ideas to disability and public service is the work of these applications, not Livermore's.",
    trademarkNote: "CQ® is a registered trademark of Cultural Intelligence Center, LLC. These applications are not affiliated with Cultural Intelligence Center, LLC, or with David Livermore. They do not use the licensed CQ scale or show CQ scores.",
    learnBook: "Before you start, ask what would make this worth your time. Livermore says training fails when it skips whether people want it or see the point (ch. 3, about p. 50), and that workshops can reinforce stereotypes when people say what they think they should (ch. 9, about p. 211). So learning here comes two ways, as courses you can open directly and as questions built into other work. Bring a real decision to it, and talk it through with someone.",
    exploreOwnCulture: "Think about the worlds you belong to: family, faith, profession and interests, which Livermore calls figured worlds (ch. 1, about pp. 3-4). We add DHS, DSD, your county or provider, and disability and Deaf communities. He says ignoring how your own culture affects you is the largest obstacle to this kind of knowledge (ch. 4, about pp. 76-78). He gives no study for that, and it remains well-argued, not proven.",
    exploreBook: "If you can, start with your own culture and the four capabilities before the community briefs, though any brief opens directly. Livermore argues that knowledge on its own can breed overconfidence and stereotyping (ch. 5, about pp. 123-24), and that capability should come before content about a particular culture (ch. 9, about p. 212).",
    applyQuestions: "For a live project, adapted from Livermore (ch. 1, about p. 4): What makes the cultural side of this worth my effort? Where does culture touch this work? What is my plan for that? What might I need to do differently? We add a fifth: who will tell me whether it helped them?",
    applyRoutine: "Then use a routine from the book's account of CQ Strategy: plan, notice, check (ch. 6, about pp. 128-43). Before, name what you are assuming and what you will try. During, watch what is happening, including what you did not expect. After, check whether your reading was right and what should change. It takes five minutes before a planning meeting or a hard conversation.",
  },
});

/** Rendered only when the file exists, so the page does not depend on when the media arrives. */
export const LIVERMORE_COVER = {
  publicPath: "/images/cultural-intelligence/leading-with-cultural-intelligence-3e.jpg",
  alt: "Cover of Leading with Cultural Intelligence: The Real Secret to Success, third edition, by David Livermore, with a foreword by Soon Ang and Linn Van Dyne.",
  credit: "Cover image: HarperCollins Leadership, 2024. Shown to identify the book.",
} as const;

/** Fixed by the owner, so these addresses stay out of the editable wording. */
export const LIVERMORE_BOOK_LINKS = {
  open: { label: "Open the book", href: "https://bookshelf.vitalsource.com/reader/books/9781400247479" },
  vitalSource: { label: "VitalSource page", href: "https://www.vitalsource.com/products/leading-with-cultural-intelligence-3rd-edition-david-livermore-v9781400247479?duration=perpetual" },
  publisher: { label: "Publisher's page (HarperCollins Leadership)", href: "https://www.harpercollinsleadership.com/9781400247448/leading-with-cultural-intelligence-3rd-edition" },
} as const;

export const COMMUNITY_GUIDE_COURSE_PATTERN = /^cultural-intelligence-[a-z0-9-]+$/;

export const CAPABILITY_COURSE_IDS = [
  "dc-i21-cultural-intelligence-cq-in-depth",
  "dc-i22-cq-drive-motivation-across-cultures",
  "dc-i23-cq-knowledge-understanding-cultural-systems",
  "dc-i24-cq-strategy-planning-for-cross-cultural-interact",
  "dc-i25-cq-action-adapting-behavior",
  "dc-i41-using-cultural-frameworks-responsibly",
] as const;

export const LEADER_COURSE_IDS = [
  "dc-l82-cultural-intelligence-cq-for-leaders",
  "dc-i30-culturally-intelligent-leadership",
] as const;

export const LEADER_AREA_GROUPS = [
  { title: "Policy, programs and resources", areaIds: ["policy-program-service", "leadership-systems"] },
  { title: "Workforce and workplace culture", areaIds: ["workforce", "culture-trust"] },
] as const;

export const OWN_CULTURE_COMMUNITY_IDS = ["american", "minnesota", "european-american"] as const;

/** Paths that bring people together around a real decision; the One DSD Team is added in that scope. */
export const FACILITATION_ROUTES = [
  { href: "/practice/gp-5", use: "Plan a session or huddle around what people will use afterward." },
  { href: "/practice/gp-4", use: "Work on participation, candor and everyday team practices with your team." },
  { href: "/practice/gp-3", use: "Plan community engagement with people, while the work can still change." },
] as const;
export const TEAM_FACILITATION_ROUTE = { href: "/one-dsd/team", use: "Bring a practice question to colleagues across the division." } as const;

export type CulturalFramework = {
  id: string;
  name: string;
  /** What kind of claim this is, so a standard, a rule and a promising tool do not read alike. */
  kind: string;
  contributes: string;
  hrefs: readonly string[];
};

export const CULTURAL_FRAMEWORKS: readonly CulturalFramework[] = [
  {
    id: "livermore", name: "Leading with Cultural Intelligence", kind: "Book and research model",
    contributes: "David Livermore's book gives this collection its definition and its four capabilities: Drive, Knowledge, Strategy and Action. It is written about leaders and teams and is largely silent on disability and public services, so these applications say where they go further and where they differ.",
    hrefs: CAPABILITY_COURSE_IDS.map(id => `/courses/${id}`),
  },
  {
    id: "toolkit", name: "Equity Analysis Toolkit and Scan", kind: "DHS policy tool",
    contributes: "Examines how a decision may affect people differently and compares alternatives while the decision can still change. The scan is the shorter form, used only when current official guidance identifies it as the appropriate review.",
    hrefs: ["/learn/equity-toolkit", "/learn/equity-toolkit/practice", "/practice/gp-7"],
  },
  {
    id: "clas", name: "National CLAS Standards", kind: "National standards",
    contributes: "A shared reference for culturally and linguistically appropriate services: communication, workforce preparation, community participation and improvement. Confirm which standards, and which separate legal, policy or contract requirements, apply to your work.",
    hrefs: ["/learn/clas", "/practice/clas"],
  },
  {
    id: "engagement", name: "Community engagement", kind: "Practice",
    contributes: "Asks who sets the agenda, what people can actually influence and how they will hear what happened to their input. No one person or organization stands for a whole community.",
    hrefs: ["/learn/community-connections", "/practice/gp-3"],
  },
  {
    id: "accessibility", name: "Accessibility", kind: "Law and practice",
    contributes: "Makes taking part possible at all: language, captions, interpreting, formats, place and timing. For Deaf people who use ASL, this is language access and cultural relations at once, and nobody should have to choose between them.",
    hrefs: ["/library/ja-access-checks"],
  },
  {
    id: "person-centered", name: "Person-centeredness", kind: "Federal rule and value",
    contributes: "The person leads, and how they decide and with whom is asked, not assumed. It guards against two failures: imposing individualism on someone, and using culture to override or speak for a disabled person.",
    hrefs: ["/courses/ipe-04-person-centered-systems", "/library/lm-disability-rights-and-service-delivery"],
  },
  {
    id: "idi", name: "Intercultural Development Inventory (IDI)", kind: "Licensed assessment",
    contributes: "Supports individual and group development, given by qualified administrators. It names five orientations. Integration, the sixth orientation in these applications, comes from Bennett's Developmental Model of Intercultural Sensitivity and the applications' own use, not from the IDI. It is never used for hiring, ranking or performance.",
    hrefs: ["/library/tool-idi"],
  },
  {
    id: "lifecourse", name: "Charting the LifeCourse", kind: "Promising framework, not evidence-based",
    contributes: "A published way to plan a good life across the lifespan, using the person's vision and a mix of supports. Its value depends on the person leading the conversation.",
    hrefs: ["/library/tool-lifecourse"],
  },
  {
    id: "communities", name: "Minnesota Communities", kind: "Context, not prediction",
    contributes: "History, institutions, languages, migration and differences within groups, as background for better questions. A page is never evidence about an individual in planning, eligibility or investigation.",
    hrefs: ["/minnesota-communities"],
  },
];
