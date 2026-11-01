import "server-only";
import { createHash } from "node:crypto";
import { culturalMultidisciplinary } from "@/lib/content/cultural-multidisciplinary";
import { culturalLeadershipApproaches, culturalLeadershipLessons } from "@/lib/content/cultural-leadership-learning";
import { RESOURCE_THEMES } from "@/lib/content/resource-organization";
import { THEME_CONTEXT_LINKS } from "@/lib/content/theme-collections";
import { CULTURAL_INTELLIGENCE_VISIBLE_FIELDS, culturalIntelligenceVisibleText } from "@/lib/content/cultural-intelligence-hub";
import { configuredLeadershipRoot, serveLeadershipMedia } from "@/lib/content/leadership-media";
import { collectionItem, collectionItemHref, LEADING_DOORS, LEADING_PATHS, STAFF_COLLECTIONS } from "@/lib/content/collections";
import { DEVELOPMENT_ENTRIES } from "@/lib/content/leadership-development";
import { LEADERSHIP_STAGES } from "@/lib/content/leadership-lifecycle";
import { foundationArticles, foundationProvisions } from "@/lib/program/constitution";
import { ADSA_IMPLEMENTATION_ACTIONS } from "@/lib/program/adsa-implementation";
import { OPERATIONALIZING_EQUITY } from "@/lib/program/equity";
import equityGoals from "@/lib/program/equity-goals.json";
import policyPresentation from "@/data/program-documents/policy-presentation.json";
import { LEADING_PRIVACY_SENTENCE } from "@/lib/content/collections";
import { TOOLKIT_WHY, TOOLKIT_STEPS, TOOLKIT_CATALOG, TOOLKIT_CARDS } from "@/lib/content/toolkit-studio";
import { readingPathways } from "@/lib/content/reading-pathways";
import { logicStages } from "@/lib/program/dsd-logic-model";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { Doc } from "./search";

const digest = (data: unknown) => createHash("sha256").update(JSON.stringify(data)).digest("hex");

/** Search follows the exact public page projection, not hidden legacy fields. */
export function culturalIntelligenceSearchValues(values: EditableSurfaceValues): EditableSurfaceValues {
  return Object.fromEntries(Object.entries(values).filter(([key]) => CULTURAL_INTELLIGENCE_VISIBLE_FIELDS.has(key))
    .map(([key, value]) => [key, typeof value === "string" ? culturalIntelligenceVisibleText(key, value) : value]));
}

/** Public, authored learning only. Parent withdrawal suppresses every child. */
export function leadershipLearningDocs(scope: StaffProgramScope, publishedSurfaces: ReadonlySet<string>): Doc[] {
  if (!publishedSurfaces.has("learn.cultural-intelligence")) return [];
  const base = "/learn/cultural-intelligence";
  return [
    { kind: "content" as const, id: "public-cultural-multidisciplinary", title: culturalMultidisciplinary.title,
      href: `${base}#broader-practice-title`, authority: "learning" as const, type: "cultural_learning", status: "approved", reviewDate: "",
      scope: scope === "dsd" ? "dsd" : "agencywide", summary: culturalMultidisciplinary.introduction[0],
      text: [culturalMultidisciplinary.title, ...culturalMultidisciplinary.introduction, culturalMultidisciplinary.progressionTitle,
        ...culturalMultidisciplinary.progression, culturalMultidisciplinary.lensesTitle, ...culturalMultidisciplinary.lenses.flatMap(lens => [lens.title, lens.body]), culturalMultidisciplinary.closing].join("\n"),
      tags: ["cultural intelligence", "multidisciplinary", "sociology", "anthropology", "ethnography", "power", "equity"], intents: [],
      graphRelated: [base, "/collections/leadership"], evidenceRevisions: [{ sourceId: "public-cultural-multidisciplinary", revisionId: null, payloadHash: digest(culturalMultidisciplinary), scope }] },
    ...culturalMultidisciplinary.lenses.map((lens, index) => ({
      kind: "content" as const, id: `public-cultural-lens-${index + 1}`, title: lens.title === "Ethnography and lived experience" ? "Ethnography" : lens.title,
      href: `${base}#broader-practice-title`, authority: "learning" as const, type: "cultural_learning_lens",
      status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide", summary: lens.body,
      text: [lens.title, lens.body, culturalMultidisciplinary.closing].join("\n"),
      tags: ["cultural intelligence", lens.title], intents: [], graphRelated: [base, "/collections/leadership"],
      evidenceRevisions: [{ sourceId: `public-cultural-lens-${index + 1}`, revisionId: null, payloadHash: digest(lens), scope }],
    })),
    ...culturalLeadershipApproaches.map(approach => ({
      kind: "content" as const, id: `leadership-approach-${approach.id}`, title: approach.name,
      href: `${base}#leadership-style-${approach.id}`, authority: "learning" as const, type: "leadership_learning",
      status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide",
      summary: approach.description, text: [approach.name, approach.description, approach.possibleUse, approach.watchFor].join("\n"),
      tags: ["leadership", "decision-making", "equity", approach.name], intents: [],
      graphRelated: [base, "/collections/leadership", "/learn/equity-toolkit"],
      evidenceRevisions: [{ sourceId: `leadership-approach-${approach.id}`, revisionId: null, payloadHash: digest(approach), scope }],
    })),
    ...culturalLeadershipLessons.map(lesson => ({
      kind: "content" as const, id: `leadership-lesson-${lesson.id}`, title: lesson.title,
      href: `${base}#${lesson.id}`, authority: "learning" as const, type: "leadership_learning",
      status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide",
      summary: lesson.question, text: [lesson.title, lesson.question, ...lesson.outcomes, ...lesson.reading, lesson.scenario, ...lesson.practice, lesson.check].join("\n"),
      tags: ["leadership", "power", "equity", "learning", lesson.title], intents: [],
      graphRelated: [base, "/collections/leadership", "/learn/equity-toolkit"],
      evidenceRevisions: [{ sourceId: `leadership-lesson-${lesson.id}`, revisionId: null, payloadHash: digest(lesson), scope }],
    })),
  ];
}

type PublicMediaReader = (name: string, method?: "GET" | "HEAD") => Promise<Response>;

/** Index only complete, publicly served manifests and their hash-matched
 * transcripts. Nothing from drafts, owner files, or unpublished styles is read. */
export async function publishedLeadershipVideoDocs(
  scope: StaffProgramScope,
  publishedSurfaces: ReadonlySet<string>,
  readMedia?: PublicMediaReader,
): Promise<Doc[]> {
  if (!publishedSurfaces.has("learn.cultural-intelligence")) return [];
  const root = configuredLeadershipRoot(process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT, process.env.RAILWAY_VOLUME_MOUNT_PATH);
  const read = readMedia ?? (root ? (name: string, method: "GET" | "HEAD" = "GET") => serveLeadershipMedia(new Request(`http://localhost/learning/leadership-videos/${name}`, { method }), name, root) : undefined);
  if (!read) return [];
  const out = await Promise.all(culturalLeadershipApproaches.map(async approach => {
    try {
      const response = await read(`${approach.id}.json`);
      if (!response.ok) return null;
      const manifest = await response.json() as Record<string, unknown>;
      const prefix = "/learning/leadership-videos/";
      if (manifest.format !== "leadership-video-v1" || manifest.style !== approach.id
        || typeof manifest.video !== "string" || !/^\/learning\/leadership-videos\/[a-f0-9]{64}\.mp4$/.test(manifest.video)
        || typeof manifest.captions !== "string" || !/^\/learning\/leadership-videos\/[a-f0-9]{64}\.vtt$/.test(manifest.captions)
        || typeof manifest.transcript !== "string" || !/^\/learning\/leadership-videos\/[a-f0-9]{64}\.txt$/.test(manifest.transcript)) return null;
      const name = manifest.transcript.slice(prefix.length);
      const [videoResponse, captionResponse, transcriptResponse] = await Promise.all([
        read(manifest.video.slice(prefix.length), "HEAD"), read(manifest.captions.slice(prefix.length), "HEAD"), read(name),
      ]);
      if (!videoResponse.ok || !captionResponse.ok || !transcriptResponse.ok) return null;
      const bytes = Buffer.from(await transcriptResponse.arrayBuffer());
      if (!bytes.length || bytes.length > 512 * 1024 || createHash("sha256").update(bytes).digest("hex") !== name.slice(0, 64)) return null;
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes).trim();
      if (!text) return null;
      return {
        kind: "content" as const, id: `leadership-video-${approach.id}`, title: `${approach.name}: video transcript`,
        href: `/learn/cultural-intelligence#leadership-style-${approach.id}`, authority: "learning" as const, type: "leadership_video_transcript",
        status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide", summary: approach.description, text,
        tags: ["leadership", "video", "transcript", approach.name], intents: [],
        graphRelated: ["/learn/cultural-intelligence", "/collections/leadership"],
        evidenceRevisions: [{ sourceId: `leadership-video-${approach.id}`, revisionId: null, payloadHash: digest({ manifest, transcriptSha256: name.slice(0, 64) }), scope }],
      } satisfies Doc;
    } catch { return null; }
  }));
  return out.filter((value): value is NonNullable<typeof value> => value !== null);
}

/** Theme names and descriptions are public; context links follow the same
 * publication gates as the collection page, rather than exposing drafts. */
export function themeCollectionDocs(scope: StaffProgramScope, publishedSurfaces: ReadonlySet<string>): Doc[] {
  const allowed = (gate?: "communities" | "programs" | "cultural") => !gate
    || (gate === "communities" && publishedSurfaces.has("communities.index"))
    || (gate === "programs" && publishedSurfaces.has("one-dsd.program-overview"))
    || (gate === "cultural" && publishedSurfaces.has("learn.cultural-intelligence"));
  return RESOURCE_THEMES.map(theme => {
    const context = THEME_CONTEXT_LINKS[theme.id].filter(link => allowed(link.gate));
    const text = [theme.title, theme.description, ...context.map(link => `${link.title}: ${link.description}`)].join("\n");
    return {
      kind: "content" as const, id: `collection-theme-${theme.id}`, title: `${theme.title} collection`,
      href: `/collections/${theme.id}`, authority: "learning" as const, type: "theme_collection",
      status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide",
      summary: theme.description, text, tags: ["theme", "collection", theme.title], intents: [],
      graphRelated: context.map(link => link.href),
      evidenceRevisions: [{ sourceId: `collection-theme-${theme.id}`, revisionId: null, payloadHash: digest({ theme, context }), scope }],
    };
  });
}

/** Existing published navigation data, not private plans or participant work.
 * Course links are included only when that scoped course is published. */
export function learningNavigationDocs(scope: StaffProgramScope, publishedSurfaces: ReadonlySet<string>): Doc[] {
  const allowedLinks = (ids: readonly string[]) => ids.flatMap(id => {
    const item = collectionItem(id);
    if (!item || (item.kind === "course" && !publishedSurfaces.has(`course.${id}`))) return [];
    return [{ title: item.title, href: collectionItemHref(item) }];
  });
  const make = (id: string, title: string, href: string, summary: string, text: string, graphRelated: string[], payload: unknown): Doc => ({
    kind: "content", id, title, href, authority: "learning", type: "learning_navigation", status: "approved", reviewDate: "",
    scope: scope === "dsd" ? "dsd" : "agencywide", summary, text, tags: ["learning", "leadership", title], intents: [], graphRelated,
    evidenceRevisions: [{ sourceId: id, revisionId: null, payloadHash: digest(payload), scope }],
  });
  const themeHub = make("collections-theme-hub", "Explore collections by theme", "/collections", "Find related learning, tools, reading, research and listening by theme.",
    RESOURCE_THEMES.map(theme => `${theme.title}: ${theme.description}`).join("\n"), RESOURCE_THEMES.map(theme => `/collections/${theme.id}`), RESOURCE_THEMES);
  const leadingHub = make("leadership-decision-hub", "Leadership decisions for leaders, supervisors, managers, and directors", "/leading", "Start with the decision in front of you.",
    ["Explore leadership growth, mentoring, open development opportunities, fair access, succession and continuity planning.", ...LEADING_DOORS.map(door => `${door.title}: ${door.description}`)].join("\n"),
    ["/one-dsd/leadership", "/one-dsd/amplify/mentoring", ...LEADING_DOORS.map(door => `/leading/${door.slug}`)], LEADING_DOORS);
  const doors = LEADING_DOORS.map(door => {
    const links = allowedLinks([...door.relatedIds, ...door.questions.flatMap(question => [question.startId, ...question.deeperIds])]);
    const text = [door.title, door.description, ...door.questions.map(question => question.question), ...links.map(link => link.title)].join("\n");
    return make(`leadership-door-${door.slug}`, door.title, `/leading/${door.slug}`, door.description, text,
      ["/leading", ...links.map(link => link.href)], { title: door.title, description: door.description, questions: door.questions.map(question => question.question), links });
  });
  const paths = LEADING_PATHS.map(item => {
    const links = allowedLinks(item.courseIds);
    return make(`leadership-path-${item.slug}`, item.title, `/leading/paths/${item.slug}`, item.description,
      [item.title, item.description, ...links.map(link => link.title)].join("\n"), ["/leading", ...links.map(link => link.href)], { title: item.title, description: item.description, links });
  });
  const collections = STAFF_COLLECTIONS.map(item => {
    const links = allowedLinks([...item.startIds, ...item.deeper.flatMap(group => group.ids)]);
    const text = [item.title, item.description, ...item.deeper.map(group => group.subject), ...links.map(link => link.title)].join("\n");
    return make(`staff-collection-${item.id}`, item.title, `/learn/collections/${item.id}`, item.description, text,
      ["/learn/collections", ...links.map(link => link.href)], { title: item.title, description: item.description, subjects: item.deeper.map(group => group.subject), links });
  });
  const growth = DEVELOPMENT_ENTRIES.map(entry => make(`leadership-growth-${entry.id}`, entry.title, "/one-dsd/leadership#starting-points", entry.invitation,
    [entry.title, entry.invitation, ...entry.teaching, ...entry.objectives, entry.example, ...entry.steps.map(step => `${step.title}: ${step.body}`)].join("\n"),
    ["/leading", "/collections/leadership", ...entry.steps.map(step => step.href)], entry));
  const stages = LEADERSHIP_STAGES.map(stage => make(`leadership-lifecycle-${stage.id}`, stage.title, "/one-dsd/leadership#life-cycle", stage.question,
    [stage.title, stage.question, stage.learn, stage.scenario, ...stage.practice, stage.reflect, stage.evidence].join("\n"),
    ["/leading", "/collections/leadership", stage.resource], stage));
  const leadership = make("leadership-growth-hub", "Equity leadership and growth", "/one-dsd/leadership", "Explore leadership development, mentoring, workplace responsibilities and succession planning.",
    "Start by exploring leadership, leading a team or preparing for broader responsibility. Development and continuity plans are voluntary drafts. Do not name or rank employees; follow applicable personnel rules.",
    ["/leading", "/collections/leadership", "/one-dsd/amplify/mentoring"], { entries: DEVELOPMENT_ENTRIES, stages: LEADERSHIP_STAGES });
  return [themeHub, leadingHub, leadership, ...doors, ...paths, ...collections, ...growth, ...stages];
}

/** Public, code-authored program content. Personal reflections and saved work are excluded. */
export function programFrameworkDocs(scope: StaffProgramScope): Doc[] {
  const make = (id: string, title: string, href: string, summary: string, text: string, links: string[], source: unknown): Doc => ({
    kind: "content", id, title, href, summary, text, authority: "learning", type: "program_framework",
    status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide", tags: ["program", title], intents: [],
    graphRelated: links, evidenceRevisions: [{ sourceId: id, revisionId: null, payloadHash: digest(source), scope }],
  });
  const articles = foundationArticles.map(article => {
    const provisions = foundationProvisions.filter(item => item.article === article.id);
    return make(`program-charter-article-${article.id}`, `Program charter: ${article.title}`, "/program-foundation",
      "Proposed program charter; approved policy and existing authority continue to govern official work.",
      [article.title, ...provisions.map(item => `${item.title}: ${item.summary}`)].join("\n"),
      provisions.flatMap(item => item.resources.map(resource => resource.href)), {article, provisions});
  });
  const stages = logicStages.map(stage => make(`program-model-stage-${stage.slug}`, stage.label, `/program/${stage.slug}`, stage.introduction,
    [stage.question, stage.introduction, stage.explanation, stage.reflection, ...stage.resources.map(item => `${item.title}: ${item.description}`)].join("\n"),
    ["/program/model", ...stage.resources.map(item => item.href)], stage));
  const actions = ADSA_IMPLEMENTATION_ACTIONS.map(action => make(`program-action-${action.id}`, `ADSA goal ${action.goalNumber}: ${action.goalTitle} — ${action.id}`, `/program/implementation#${action.id}`,
    "The supplied ADSA plan action and suggested implementation support; check current adoption, responsibility and applicable requirements.",
    [action.sourceText, action.workProduct, ...action.capabilities.map(item => item.label), ...action.evidenceQuestions, ...action.dependencies].join("\n"),
    action.tools.map(item => item.href), action));
  const equity = make("operationalizing-equity-definition", "Operationalizing equity", "/operationalizing-equity", OPERATIONALIZING_EQUITY.definition,
    [OPERATIONALIZING_EQUITY.definition, OPERATIONALIZING_EQUITY.basis, ...OPERATIONALIZING_EQUITY.practiceQuestions, ...OPERATIONALIZING_EQUITY.applicationRules].join("\n"),
    ["/program/model", "/learn/equity-toolkit", "/practice/requirements"], OPERATIONALIZING_EQUITY);
  const examples = TOOLKIT_CARDS.map(card => make(`toolkit-example-${card.id}`, `Toolkit example: ${card.title}`, `/toolkit-studio/${card.id}`,
    "Fictional learning example; not official policy or a completed equity analysis.",
    [card.title, card.prompt, card.lede, card.brief.decision, card.brief.goal, card.brief.people, card.brief.institutionalSelf, ...card.steps.flatMap(step => [step.walked, step.insight, step.antiStereotype ?? "", step.designChange ?? ""]), card.practice.body].join("\n"),
    ["/toolkit-studio", ...card.briefs.map(brief => brief.href), card.practice.href], card));
  return [...articles, ...stages, ...actions, equity, ...examples];
}

/** Public route guidance; user-entered work and personal progress never enter these documents. */
export function additionalPublicRouteDocs(scope: StaffProgramScope, publishedSurfaces: ReadonlySet<string>): Doc[] {
  const make = (id: string, title: string, href: string, summary: string, text: string, related: string[], payload: unknown): Doc => ({
    kind: "content", id, title, href, summary, text, authority: "guidance", type: "public_guidance", status: "approved", reviewDate: "",
    scope: scope === "dsd" ? "dsd" : "agencywide", tags: ["program guidance", title], intents: [], graphRelated: related,
    evidenceRevisions: [{ sourceId: id, revisionId: null, payloadHash: digest(payload), scope }],
  });
  const model = make("public-program-model", "How the program works", "/program/model", "Start with a question, decision or something to understand.",
    logicStages.map(stage => `${stage.label}: ${stage.question} ${stage.introduction} ${stage.explanation}`).join("\n"), logicStages.map(stage => `/program/${stage.slug}`), logicStages);
  const toolkit = make("public-toolkit-studio", TOOLKIT_WHY.title, "/toolkit-studio", TOOLKIT_WHY.authority,
    [TOOLKIT_WHY.chrome, ...TOOLKIT_WHY.beats.map(beat => `${beat.title}: ${beat.body}`), ...TOOLKIT_STEPS.map(step => `${step.number}. ${step.title}`), ...TOOLKIT_CATALOG.map(item => `${item.title}: ${item.prompt}`)].join("\n"),
    ["/equity-review", ...TOOLKIT_CARDS.map(card => `/toolkit-studio/${card.id}`)], {why: TOOLKIT_WHY, steps: TOOLKIT_STEPS, catalog: TOOLKIT_CATALOG});
  const clas = make("public-clas-planning", "Cultural and language access planning", "/practice/clas", "Connect the National CLAS Standards with a service question, proposed actions and appropriate review.",
    "Use the National CLAS Standards to examine communication, workforce preparation, community participation and service improvement. Confirm relevant standards and separate legal, policy or contract requirements. The worksheet does not make every standard binding for every service. Do not include private case details in learning notes.",
    ["/learn/clas", "/resources/ja-language-cultural-access-planning", "/learn/equity-toolkit"], "Public CLAS planning guidance");
  const privacy = make("public-leadership-participation", "Leadership learning: how this works", "/leading/how-this-works", "How leadership learning and privacy work.",
    [LEADING_PRIVACY_SENTENCE, "Progress and practice answers stay in the browser, and anyone using the same browser may see them. Ask questions and recent conversation go to outside answer and research services. The current service does not intentionally save a question-and-answer copy in the owner workspace. Operational activity may be recorded, and earlier versions may have retained separate records. Supervisors do not receive your browser conversation from Ask. Outside services have their own data-handling terms. Do not enter names or case, health or personnel details. This learning is general information and does not replace required state training or responsible personnel decisions. Tribal-specific learning and engagement are referred to the responsible Tribal liaison."].join("\n"),
    ["/leading", "/learn/tribal-referral", "/about"], LEADING_PRIVACY_SENTENCE);
  const presentation = make("public-policy-review-presentation", "Equity analysis for policy review", "/learn/equity-toolkit/policy-review", "Adapted 2024 training; confirm current arrangements before acting.",
    [policyPresentation.sourceTitle, policyPresentation.sourceDate, ...policyPresentation.slides.flatMap(slide => [slide.title, ...slide.text])].join("\n"),
    ["/equity-policy", "/support/right-person", "/learn/equity-toolkit/practice"], policyPresentation);
  const readings = make("public-reading-paths", "Reading pathways", "/learn/readings/pathways", "Choose a work question and connect readings with practical application.",
    readingPathways.map(path => [path.title, path.question, path.tryIt, path.check].join(" ")).join("\n"),
    readingPathways.map(path => path.tool), readingPathways);
  const notice = make("public-service-notice-practice", "Improve a service notice", "/learn/readings/practice/service-notice", "Examine a notice through reading, access and communication.",
    "Ask whether people can understand the requested action and respond in a usable way. Clarify the purpose, learn where difficulties occur, compare accessible response options, record alternatives and uncertainty, and check the result with people affected.",
    ["/learn/equity-toolkit/practice", "/practice/gp-13", "/practice/clas", "/practice/measurement"], "Public service-notice practice guidance");
  const planning = make("public-planning-and-progress", "Planning and reviewing progress", "/one-dsd/planning", "Connect priorities with practical action, evidence and an account of what changed.",
    "Use available evidence, name missing information and determine what to examine next. Examples remain separate from real figures; measures describe aggregate patterns and do not score staff. Division maturity is described through foundation, integration and institutionalization, not an individual rating. Keep confidential information out of notes.",
    ["/one-dsd/planning/report", "/equity-review"], "Public planning and reviewing progress");
  const reflection = make("public-program-reflection", "Practice reflection", "/program/reflection", "Notice what changed using a concrete observation.",
    "Consider the action, its effects, the perspectives informing your conclusion, uncertainty and a reasonable next step. Private reflection responses are not included in the public search index.",
    ["/program/progress", "/program/impact"], "Public reflection introduction");
  const groups = make("public-employee-resource-groups", "Employee resource groups", "/employee-resource-groups", "Find DHS and statewide employee resource groups and connections.",
    "Employee resource groups offer opportunities for connection and collaboration. Groups shape their own participation and priorities; no group or member is expected to speak for an entire community. Consult each current group or official source for participation and contact information.",
    ["/start"], "Public employee resource group overview");
  const division = make("public-dsd-administration", "Disability Services Division within ADSA", "/administrations/adsa/divisions/dsd", "DSD brings together service knowledge, workplace practice and equity resources in One DSD.",
    "The One DSD program includes division-specific programs, examples, team resources and learning connections. Confirm current organizational information with the cited official sources.",
    ["/one-dsd"], "Public DSD division overview");
  const guide = make("public-site-user-guide", "How to use this site", "/user-guide", "Find useful learning and practical resources, explore at your own pace, and bring them into work.",
    "Begin from a question or task. Explore courses, community perspectives and source references; use an appropriate tool or guided practice. A community brief provides context, not a prediction about an individual. Protect private information in notes and Ask questions.",
    ["/one-dsd/programs", "/one-dsd/team", "/one-dsd/amplify"], "Public user guide overview");
  const docs = [model, toolkit, clas, privacy, presentation, readings, notice, planning, reflection, groups, division, guide];
  if (publishedSurfaces.has("equity-toolkit.home")) docs.push(make("public-adsa-equity-goals", "ADSA six goals and work plan", "/learn/equity-toolkit/goals",
    "ADSA goals and program companion guidance; they are not a requirement for all DHS offices to choose three goals.",
    [equityGoals.goalAuthority, equityGoals.mappingAuthority, ...equityGoals.goals.flatMap(goal => [goal.title, goal.focus, goal.summary, goal.example, goal.antiRacism, goal.output, ...goal.questions])].join("\n"),
    ["/learn/equity-toolkit", "/learn/equity-toolkit/practice"], equityGoals));
  return docs;
}
