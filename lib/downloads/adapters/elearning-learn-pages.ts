import "server-only";
import presentation from "@/data/program-documents/policy-presentation.json";
import { courseHref, courseSummary, publishedCourses } from "@/lib/content/courses/published";
import type { CoursePack } from "@/lib/content/courses/source-types";
import { groupDiversityCourses } from "@/lib/content/courses/diversity-series";
import {
  CAPABILITY_COURSE_IDS,
  COMMUNITY_GUIDE_COURSE_PATTERN,
  CULTURAL_FRAMEWORKS,
  CULTURAL_INTELLIGENCE_SURFACE_ID,
  FACILITATION_ROUTES,
  LEADER_COURSE_IDS,
  TEAM_FACILITATION_ROUTE,
  culturalIntelligenceVisibleText,
} from "@/lib/content/cultural-intelligence-hub";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { culturalMultidisciplinary } from "@/lib/content/cultural-multidisciplinary";
import { ENGAGEMENT_RESOURCES } from "@/lib/content/engagement-resources";
import {
  CULTURAL_INTELLIGENCE_PERSPECTIVE_SOURCES,
  EMOTIONS_AND_VALUES_COURSE_IDS,
  ENGAGEMENT_STARTING_STEPS,
  EQUITY_IN_PRACTICE_EXAMPLES,
  EQUITY_IN_PRACTICE_POLICY_LINKS,
  type LearnPageLink,
} from "@/lib/content/learn-page-copy";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import selfDirected from "@/lib/content/self-directed-data.json";
import { loadStaffContentSnapshot, type StaffProgramScope } from "@/lib/content/staff-publications";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { COLLABORATION_FOCUSES, COLLABORATION_LEVELS, collaborationCourses } from "@/lib/learning/collaboration-collection";
import { developmentJourney, developmentModel, stageGuidance } from "@/lib/program/development";
import { availableDevelopmentLink, publishedDevelopment } from "@/lib/program/development-published";
import goalModel from "@/lib/program/equity-goals.json";
import media from "@/lib/program/equity-video-media.json";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import { REFERRAL_ONLY_COURSE_IDS } from "@/lib/program/retired-features";
import type { DownloadKind } from "../catalog";
import {
  bullets,
  callout,
  compactSections,
  heading,
  numbered,
  paragraph,
  section,
  table,
  type DocumentBlock,
  type InlineRun,
  type ResourceDocument,
} from "../model";
import { kicker, linkList, programName } from "./shared";

type Builder = (scope: StaffProgramScope) => Promise<ResourceDocument | null>;

/** Courses this view publishes; referral-only courses never appear in a download. */
async function courses(scope: StaffProgramScope): Promise<CoursePack[]> {
  return (await publishedCourses(scope)).map(({ pack }) => pack).filter((pack) => !REFERRAL_ONLY_COURSE_IDS.has(pack.course.id));
}

function courseTable(packs: readonly CoursePack[], extra?: { header: string; value: (pack: CoursePack) => string }): DocumentBlock | null {
  if (packs.length === 0) return null;
  const headers = extra ? ["Course", extra.header, "What it covers", "Program page"] : ["Course", "What it covers", "Program page"];
  return table(
    headers,
    packs.map((pack) => {
      const row = [pack.course.title, courseSummary(pack), courseHref(pack.course.id)];
      return extra ? [row[0], extra.value(pack), row[1], row[2]] : row;
    }),
  );
}

function usedLinks(links: readonly LearnPageLink[]): DocumentBlock | null {
  if (links.length === 0) return null;
  return bullets(links.map((link): InlineRun[] => [{ text: link.title, bold: true }, { text: ` — ${link.use} (program page ${link.href})` }]));
}

function labelled(label: string, text: string): DocumentBlock {
  return paragraph([{ text: `${label} `, bold: true }, { text }]);
}

const collaboration: Builder = async (scope) => {
  const rows = collaborationCourses(await courses(scope));
  return {
    kicker: kicker(scope, "Work better together"),
    title: "Teams and Cross-Collaboration",
    subtitle: "Good collaboration helps people contribute, understand one another, and carry shared work forward. Explore learning for your team, work across the Disability Services Division and the Aging and Disability Services Administration, and relationships with partners.",
    meta: [],
    sections: compactSections([
      section(undefined, [paragraph("Choose the situation that fits your work. Each course brings together explanation, examples, reflection, and practice you can return to when it is useful.")]),
      section("Choose your depth", [
        paragraph("Foundation builds understanding. Intermediate offers practice with situations. Advanced explores more complex shared responsibilities. These describe learning depth, not job rank. Directors, managers, supervisors, and staff can begin wherever the learning helps."),
        table(["Level", "What it offers"], COLLABORATION_LEVELS.map((level) => [level.title, level.description])),
      ]),
      ...COLLABORATION_FOCUSES.map((focus) => {
        const focusRows = rows.filter((row) => row.focus === focus.id);
        const categories = [...new Set(focusRows.map((row) => row.category))];
        return section(focus.title, [
          paragraph(focus.description),
          callout(focus.example, "When to start here"),
          ...categories.flatMap((category) => {
            const inCategory = focusRows.filter((row) => row.category === category);
            const levelOf = new Map(inCategory.map((row) => [row.pack.course.id, COLLABORATION_LEVELS.find((level) => level.id === row.level)?.title ?? ""]));
            return [
              heading(focus.id === "partners" ? "Working with agencies, counties, providers, and communities" : category),
              courseTable(inCategory.map((row) => row.pack), { header: "Level", value: (pack) => levelOf.get(pack.course.id) ?? "" }),
            ];
          }),
        ]);
      }),
      section("About participation and training credit", [paragraph("Learning here is voluntary. Choose what supports your work and return when it is useful."), paragraph(TRAINING_CREDIT_NOTICE)]),
    ]),
    attribution: programName(scope),
  };
};

const diversity: Builder = async (scope) => {
  const groups = groupDiversityCourses(await courses(scope));
  return {
    kicker: kicker(scope, "People, Access and Culture"),
    title: "Diversity: understanding and practice",
    subtitle: "Explore identity, culture, privilege, bias, and belonging through explanation, realistic situations, reflection, and practice.",
    meta: [],
    sections: compactSections([
      section(undefined, [paragraph("Choose a course that speaks to a question or experience you want to explore. Foundation, Intermediate, and Advanced describe the depth of the material. They do not label you or restrict where you can begin. Each course includes four lessons, activities with feedback, a practical job aid, and sources for further reading.")]),
      ...groups.map((group) => section(group.title, [paragraph(group.description), courseTable(group.courses) ?? paragraph("No courses in this group are currently published for this view.")])),
      section(undefined, [paragraph(TRAINING_CREDIT_NOTICE)]),
    ]),
    attribution: programName(scope),
  };
};

const emotionsAndValues: Builder = async (scope) => {
  const available = await courses(scope);
  const series = EMOTIONS_AND_VALUES_COURSE_IDS.flatMap((id) => available.filter((pack) => pack.course.id === id));
  return {
    kicker: kicker(scope, "Learn at your own pace"),
    title: "Emotions, Values, and Everyday Practice",
    subtitle: "Understand your responses, explore different perspectives, and put that understanding to work in conversations and decisions.",
    meta: [],
    sections: compactSections([
      section("Choose a starting point", [
        paragraph("Begin with emotional awareness or your own cultural-value lens, then move into conversations and practical decisions. Each course stands on its own. Directors, managers, supervisors, and staff can use the same cases from the perspective of their responsibilities."),
        paragraph("Each course offers seven lessons, situations you may recognize, choices with helpful feedback, and a guide to take into your work. Listen to the two-person conversation or read it, then try an activity at your own pace. Allow about 75–90 minutes per course, including practice, or return for one lesson at a time."),
      ]),
      ...series.map((pack, index) =>
        section(`Course ${index + 1}: ${pack.course.title}`, [
          paragraph([{ text: index < 2 ? "Emotional intelligence" : "Cultural values", italic: true }]),
          paragraph(pack.course.subtitle),
          heading("What you will explore"),
          numbered(pack.course.lessons.map((lesson) => lesson.title)),
          paragraph(`Program page: ${courseHref(pack.course.id)}`),
        ]),
      ),
      section("Connect the learning to your work", [
        linkList([
          { label: "Use the Equity Analysis Toolkit to examine a decision, its assumptions, and its effects", href: "/learn/equity-toolkit/practice" },
          { label: "Explore culturally and linguistically appropriate services when planning communication and participation", href: "/practice/clas" },
          { label: "Continue with team and collaboration learning for shared responsibilities and cross-division work", href: "/courses?browse=all&q=collaboration" },
          { label: "Find the right person or office when a concern needs formal advice or a decision beyond your role", href: "/support/right-person" },
        ]),
        paragraph("Start with one change and see what you learn. You can use the examples provided for every exercise, and choose what you want to reflect on privately. There is no personal assessment to complete."),
      ]),
      section("About the learning", [
        paragraph("The emotional-intelligence courses draw on research about emotional abilities, regulation, and the limits of assessment. The cultural-values courses combine values research with cultural humility and original public-service examples. Each course includes its sources and explains what those sources can support."),
        paragraph(TRAINING_CREDIT_NOTICE),
      ]),
    ]),
    attribution: programName(scope),
  };
};

const equityInPractice: Builder = async (scope) => ({
  kicker: kicker(scope, "People, Access and Culture"),
  title: "From shared purpose to everyday work",
  subtitle: "Begin with the Equity Outcome Map. Then follow examples from disability services to see how people, decisions, and practical resources connect.",
  meta: [],
  sections: compactSections([
    section(undefined, [paragraph("The DSD examples show how the six Aging and Disability Services Administration goals connect with your responsibilities, the learning that fits and the resources already here in One DSD.")]),
    section("Part one: Equity Outcome Map", [
      paragraph("Explore the shared direction for equity work across the Department of Human Services, the intended outcomes, and why everyday decisions matter."),
      paragraph(`Video, ${media.foundation.runtime}. Watch it on the program page /learn/equity-in-practice.`),
    ]),
    section("Part two: People, Access and Culture in Practice: A Disability Services Division Example", [
      paragraph("Follow four situations in Disability Services Division work. See how the six Aging and Disability Services Administration goals, policy, learning and practical tools can help a team think through a decision and its effects."),
      paragraph(`Video, ${media.companion.runtime}. Watch it on the program page /learn/equity-in-practice.`),
      callout("The Outcome Map describes intended outcomes. The six implementation goals belong to the Aging and Disability Services Administration. The Disability Services Division situations are examples, and other teams can adapt them to their own responsibilities and goals."),
    ]),
    section("Choose the example that connects with your work", [
      paragraph("The links below open guidance, learning and practical tools you can use now. Begin with a real question, use the resources that fit, and bring in the people whose experience can help."),
      ...EQUITY_IN_PRACTICE_EXAMPLES.flatMap((example) => [
        heading(example.title),
        paragraph(example.situation),
        paragraph(example.action),
        labelled("Goals:", example.goals),
        usedLinks(example.links),
        callout(example.evidence, "What to look for"),
      ]),
    ]),
    section("When the question involves policy or legislation", [
      paragraph("Be clear about what is a proposed change, what is enacted law and what is current program guidance. Work out who could be affected and which choices are still open. Keep the source policy or legislation separate from analysis, learning and recommendations."),
      usedLinks(EQUITY_IN_PRACTICE_POLICY_LINKS),
    ]),
    section("Start with one useful next step", [
      paragraph("Choose a decision or piece of work. Name a barrier worth a closer look, bring in the perspectives that matter, and use one resource to develop a possible improvement. Ask what would tell you whether it helped, for whom, and what still needs attention."),
      paragraph("Directors, managers, supervisors, and staff contribute through their responsibilities, knowledge, and relationships. These resources help you prepare and learn; decisions stay with the people and offices responsible."),
      linkList([
        { label: "Explore the six goals", href: "/learn/equity-toolkit/goals" },
        { label: "Connect goals to implementation", href: "/program/implementation" },
        { label: "Consider evidence of progress", href: "/practice/measurement" },
      ]),
    ]),
  ]),
  attribution: programName(scope),
});

const culturalIntelligence: Builder = async (scope) => {
  if (!(await culturalIntelligenceHubAvailable(scope))) return null;
  const surface = await prepareEditableSurface(CULTURAL_INTELLIGENCE_SURFACE_ID, { scope, includeOwner: false });
  if (!surface.available) return null;
  const text = (key: string) => culturalIntelligenceVisibleText(key, stringValue(surface.values, key));
  const available = await courses(scope);
  const byId = new Map(available.map((pack) => [pack.course.id, pack]));
  const pick = (ids: readonly string[]) => ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const capabilities = pick(CAPABILITY_COURSE_IDS);
  const guides = available.filter((pack) => COMMUNITY_GUIDE_COURSE_PATTERN.test(pack.course.id));
  const leaderCourses = pick(LEADER_COURSE_IDS);
  const facilitation = [...FACILITATION_ROUTES, ...(scope === "dsd" ? [TEAM_FACILITATION_ROUTE] : [])];
  return {
    kicker: kicker(scope, text("eyebrow")),
    title: text("title"),
    subtitle: text("intro"),
    meta: [],
    sections: compactSections([
      section(undefined, [paragraph(text("scopeLine"))]),
      section(text("foundationTitle"), [paragraph(text("foundationBody")), callout(text("centralMessage"), text("messageTitle"))]),
      section(culturalMultidisciplinary.title, [
        ...culturalMultidisciplinary.introduction.map((value) => paragraph(value)),
        heading(culturalMultidisciplinary.progressionTitle),
        ...culturalMultidisciplinary.progression.map((value) => paragraph(value)),
        heading(culturalMultidisciplinary.lensesTitle),
        table(["Perspective", "What it asks"], culturalMultidisciplinary.lenses.map((lens) => [lens.title, lens.body])),
        paragraph(culturalMultidisciplinary.closing),
      ]),
      section("The frameworks this collection connects", [
        paragraph("Each one adds something the others do not. Each also carries its own assumptions about the self, independence and family, so ask whether it fits the people you are working with, and check with them."),
        table(["Framework", "Kind", "What it contributes"], CULTURAL_FRAMEWORKS.map((framework) => [framework.name, framework.kind, framework.contributes])),
      ]),
      section("Learn", [
        capabilities.length ? heading("Cultural understanding and practice") : null,
        capabilities.length ? paragraph("Explore cultural understanding, implicit bias and ways to use frameworks responsibly.") : null,
        courseTable(capabilities),
        guides.length ? heading("Community guides") : null,
        guides.length ? paragraph("Background on a community, to help you ask better questions. A guide does not describe any individual.") : null,
        courseTable(guides),
      ]),
      section("Explore", [
        paragraph("Everyone works from inside a culture, including people whose background is treated as the default."),
        paragraph(text("exploreOwnCulture")),
        paragraph("Choose a community brief when it helps you understand context. You do not need to read every brief. Ask people directly what matters to them and what support works for them. Disability is part of every community, so look for it in each brief."),
        paragraph("The existing Tribal and Native community pages include guidance about Tribal authority and the appropriate relationships for this work. Follow that guidance and the applicable processes."),
      ]),
      section("Apply", [
        paragraph("Think about an upcoming notice, meeting, hiring step or team decision. Ask what language, format, and support the person wants; check who can make the decision; and make a plan to follow up."),
        paragraph(text("applyQuestions")),
        paragraph(text("applyRoutine")),
        heading("Practice with other people"),
        paragraph("Courses alone are not the work. These bring people together around a real decision."),
        bullets(facilitation.map((route): InlineRun[] => [{ text: route.use }, { text: ` (program page ${route.href})` }])),
      ]),
      section("For leaders", [
        paragraph("Leaders begin with the same questions about their own culture, then ask them of the institution. What does this organization treat as normal? Who designed the default? Whose experience is missing, including disabled colleagues and people served, and people at the point where disability, language, race and income meet? Bring these to policy, program and resource decisions and, with equal weight, to workforce decisions and workplace culture."),
        courseTable(leaderCourses),
      ]),
    ]),
    sources: CULTURAL_INTELLIGENCE_PERSPECTIVE_SOURCES.map((source) => ({ title: source.title, href: source.href })),
    attribution: programName(scope),
  };
};

const equityToolkitGoals: Builder = async (scope) => {
  const snapshot = await loadStaffContentSnapshot({ scope });
  const approved = new Set(snapshot.items.filter((item) => item.status === "approved").map((item) => item.id));
  return {
    kicker: kicker(scope, "Equity Analysis Toolkit"),
    title: "Aging and Disability Services Administration six goals and work plan",
    subtitle: "Explore the Aging and Disability Services Administration’s six equity goals, find related resources, and prepare a three-goal work plan where this implementation plan applies.",
    meta: [],
    sections: compactSections([
      section(undefined, [
        paragraph("These are ADSA goals, not an agency-wide requirement to choose three goals. If you work in DHS outside ADSA, you can still learn from this example; just confirm your own priorities, requirements and who holds decision authority. The program constitution governs how this resource supports the whole One DSD program."),
        callout(`${goalModel.goalAuthority} ${goalModel.mappingAuthority}`, "Where the goals come from"),
      ]),
      ...goalModel.goals.map((goal) => {
        const resources = goal.resources.filter((resource) => approved.has(resource.id));
        return section(`Goal ${goal.number}: ${goal.title}`, [
          paragraph(goal.summary),
          labelled("Focus:", goal.focus),
          labelled("In practice:", goal.example),
          heading("Questions to work through"),
          bullets(goal.questions),
          labelled("Anti-racism in practice:", goal.antiRacism),
          labelled("A useful working output:", goal.output),
          resources.length ? heading("Related resources") : null,
          linkList(resources.map((resource) => ({ label: resource.title, href: resource.href }))),
        ]);
      }),
      section("Prepare a three-goal work plan", [
        paragraph("Choose up to three goals that apply to your work. For each one, describe its intended purpose, who carries its burden, the evidence you need and the role with authority to change it. Keep your notes in your own document."),
      ]),
    ]),
    attribution: programName(scope),
  };
};

const equityToolkitPolicyReview: Builder = async (scope) => ({
  kicker: kicker(scope, "Equity Analysis Toolkit"),
  title: "Equity analysis for policy review",
  subtitle: "Explore how equity analysis informs policy development, the questions a drafting group considers, and the relationship between analysis and leadership review.",
  meta: [{ label: "Adapted from", value: `${presentation.sourceTitle}, ${presentation.sourceDate}` }],
  sections: compactSections([
    section(undefined, [
      callout(`Adapted for One DSD from ${presentation.sourceTitle}, dated ${presentation.sourceDate}. The original training content, diagrams, and speaker notes are retained in the PowerPoint on the program page. Contacts and submission steps describe that training’s process; confirm current arrangements with the responsible office before acting.`, "About this presentation"),
    ]),
    ...presentation.slides.map((slide) => section(`Slide ${slide.number}: ${slide.title}`, slide.text.length ? [bullets(slide.text)] : [])),
    section("Bring the analysis into your work", [
      paragraph("Name the policy decision, the people affected and the options that are still open. Then work through those options with the toolkit and agree who will follow through."),
      linkList([
        { label: "Practice with the toolkit", href: "/learn/equity-toolkit/practice" },
        { label: "Find support for your work", href: "/support/right-person" },
      ]),
    ]),
  ]),
  attribution: programName(scope),
});

const clasMatch = (value: unknown) => /\bCLAS\b|culturally and linguistically appropriate/i.test(JSON.stringify(value));

const clas: Builder = async (scope) => {
  const [published, snapshot] = await Promise.all([courses(scope), loadStaffContentSnapshot({ scope })]);
  const matching = published.filter(clasMatch);
  const teaching = matching.filter((pack) => clasMatch(pack.course) || clasMatch(pack.jobAid));
  const references = matching.filter((pack) => !teaching.includes(pack));
  const resources = snapshot.items.filter((item) => item.status === "approved").filter(clasMatch);
  const directed = selfDirected.filter(clasMatch);
  const withLessons = { header: "Length", value: (pack: CoursePack) => [`${pack.course.lessons.length} lessons`, pack.course.duration].filter(Boolean).join(" · ") };
  return {
    kicker: kicker(scope, "Learning, communication and service access"),
    title: "National Culturally and Linguistically Appropriate Services Standards",
    subtitle: "Bring culturally and linguistically appropriate services into everyday practice.",
    meta: [],
    sections: compactSections([
      section(undefined, [
        paragraph("Explore One DSD’s training, planning tools and references together. Start with the foundations, follow a service encounter, or consider how your team can improve access."),
        callout("Culturally and Linguistically Appropriate Services connects respectful communication with workforce preparation, leadership, community participation and improvement. Check which standards, and which separate legal, policy or contract requirements, apply to your work.", "A shared reference for thoughtful practice"),
      ]),
      section("Put the standards into your work", [
        paragraph("Follow nine connected lessons with individual practice and a personal improvement plan. Move at your own pace and use a work example that matters to you."),
        linkList([{ label: "The guided curriculum", href: "/learn/clas/curriculum" }]),
      ]),
      section("Learn the standards, then put them into practice", [
        courseTable(teaching.filter((pack) => /National Culturally and Linguistically Appropriate Services Standards/i.test(pack.course.title)), withLessons),
        directed.length ? heading("Three ways into Culturally and Linguistically Appropriate Services") : null,
        directed.length ? paragraph("These self-directed courses connect the foundations with service delivery and organizational practice.") : null,
        directed.length ? table(["Course", "Level", "What it covers", "Program page"], directed.map((course) => [course.title, course.level, course.summary, `/learning/self-directed/index.html?course=${course.number}`])) : null,
      ]),
      section("Planning, checklists and reference material", [
        table(
          ["Resource", "What it offers", "Program page"],
          [["Cultural and language access planning", "Think through the service, the standards that matter for it, the changes, review, implementation and results.", "/practice/clas"], ...resources.map((item) => [item.title, item.summary, `/library/${item.id}`])],
        ),
      ]),
      section("Courses that discuss Culturally and Linguistically Appropriate Services", [
        paragraph(`${teaching.length} courses include CLAS in their teaching or accompanying job aid. Each one opens with its lessons, activities and any media that come with it.`),
        courseTable(teaching, withLessons),
      ]),
      section("Related courses using CLAS as a source", [
        paragraph(`These ${references.length} courses cite CLAS as a supporting reference. Their focus extends beyond the standards themselves.`),
        courseTable(references, withLessons),
      ]),
      section("Go to the original standards", [
        paragraph("The federal Office of Minority Health provides the National Culturally and Linguistically Appropriate Services Standards and accompanying guidance."),
        linkList([
          { label: "National Culturally and Linguistically Appropriate Services Standards", href: "https://thinkculturalhealth.hhs.gov/clas/standards" },
          { label: "Implementation checklist and action worksheet (PDF)", href: "/documents/engagement/clas-implementation-checklist.pdf" },
        ]),
      ]),
    ]),
    attribution: programName(scope),
  };
};

const engagementResources: Builder = async (scope) => ({
  kicker: kicker(scope, "Community engagement"),
  title: "Community engagement and cultural access resources",
  subtitle: "Move from understanding the approach to planning participation, checking access, and following through.",
  meta: [],
  sections: compactSections([
    section("Choose a starting point", [numbered(ENGAGEMENT_STARTING_STEPS.map((step): InlineRun[] => [{ text: step.lead, bold: true }, { text: ` ${step.body}` }]))]),
    section("Engagement guides and planning resources", [
      paragraph("Use the original resources alongside your working notes. Each overview explains when to use the resource and links to its PDF."),
      ...ENGAGEMENT_RESOURCES.flatMap((item) => {
        const pdf = item.nextActions.find((action) => action.href.startsWith("/documents/engagement/"));
        return [
          heading(item.title),
          paragraph(item.summary),
          item.whyItMatters ? callout(item.whyItMatters, "When to use it") : null,
          paragraph(`Overview: program page /library/${item.id}${pdf ? `. Original PDF: ${pdf.href}` : ""}`),
        ];
      }),
    ]),
    section("Put the resources to work", [
      linkList([
        { label: "Community engagement: from input to action", href: "/learn/community-connections" },
        { label: "Cultural and language access planning", href: "/practice/clas" },
        { label: "Equity Analysis Toolkit", href: "/learn/equity-toolkit" },
        { label: "Plan how to learn from results", href: "/practice/measurement" },
        { label: "Ask a question about these resources", href: "/ask" },
      ]),
      paragraph("The original documents are preserved. ADSA materials describe their administration’s context, including internal processes and contacts. Including them here for staff and public readers doesn’t make every example a requirement for every service. When you plan, go by the source dates and the current processes that apply to you."),
    ]),
  ]),
  attribution: programName(scope),
});

function journeyBuilder(journeyId: string): Builder {
  return async (scope) => {
    const journey = developmentJourney(journeyId);
    if (!journey) return null;
    const { records } = await publishedDevelopment(scope);
    const resources = records.filter((record) => record.journeyIds.includes(journey.id) && !REFERRAL_ONLY_COURSE_IDS.has(record.id.replace(/^course-/, "")));
    return {
      kicker: kicker(scope, "From engagement to action"),
      title: journey.title,
      subtitle: journey.summary,
      meta: [],
      sections: compactSections([
        section(undefined, [paragraph("Use whichever steps help with your question. There's nothing to enroll in and no set order.")]),
        ...developmentModel.stages.map((stage, index) =>
          section(`Step ${index + 1}: ${stage.title}`, [
            paragraph(stage.purpose),
            heading(stage.id === "practice" ? "Try a different approach" : stage.id === "apply" ? "Take it into your situation" : "A question to work with"),
            paragraph(stageGuidance(journey, stage.id)),
            linkList(journey.links.filter((link) => link.stage === stage.id && availableDevelopmentLink(link.href, records)).map((link) => ({ label: link.label, href: link.href }))),
            labelled("Something to carry forward:", stage.evidence),
          ]),
        ),
        section("Make room for another perspective", [
          paragraph(journey.social),
          linkList([{ label: journey.connection.label, href: journey.connection.href }]),
          paragraph("Whether and how you take part is up to you. Check what's on offer with the people or group involved."),
        ]),
        section("Explore more within this pathway", [
          paragraph("Each of these can help with a different part of your question. There's no need to work through the whole collection."),
          resources.length ? table(["Resource", "How it helps", "Program page"], resources.map((record) => [record.title, record.contribution, record.href])) : null,
        ]),
      ]),
      attribution: programName(scope),
    };
  };
}

const BUILDERS: Record<string, Builder> = {
  collaboration,
  diversity,
  "emotions-and-values": emotionsAndValues,
  "equity-in-practice": equityInPractice,
  "cultural-intelligence": culturalIntelligence,
  "equity-toolkit-goals": equityToolkitGoals,
  "equity-toolkit-policy-review": equityToolkitPolicyReview,
  clas,
  "engagement-resources": engagementResources,
  ...Object.fromEntries(developmentModel.journeys.map((journey) => [`paths-${journey.id}`, journeyBuilder(journey.id)])),
};

/** Downloadable copies of the /learn pages with their own teaching content. The id is the route below /learn, joined with "-". */
export async function learnPageDownloadDocument(id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  const build = Object.prototype.hasOwnProperty.call(BUILDERS, id) ? BUILDERS[id] : undefined;
  return build ? build(scope) : null;
}

export async function learnPageDownloadIds(scope: StaffProgramScope): Promise<{ kind: DownloadKind; id: string }[]> {
  const ids: { kind: DownloadKind; id: string }[] = [];
  for (const id of Object.keys(BUILDERS)) {
    if (await learnPageDownloadDocument(id, scope)) ids.push({ kind: "learn-page", id });
  }
  return ids;
}
