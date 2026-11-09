import type { Block, CoursePack, Source } from "../../source-types";
import plan from "./plan.json";
import catalog from "./catalog.json";
import { AVAILABLE_CATALOG_COURSE_IDS } from "./available-courses";
import { REVIEWED_CATALOG_IMAGE_ALTS } from "./reviewed-image-alts";
import { catalogDisplayLabel } from "./display-labels";

/** One lesson as authored in a DEIA catalog spec file. Every catalog topic is a six-lesson course. */
export type CatalogLesson = {
  title: string;
  summary: string;
  objective: string;
  objectives?: string[];
  takeaways: [string, string, string];
  statement: string;
  image: { src: string; caption: string };
  intro: { heading: string; body: string };
  inThisLesson: [string, string, string, string];
  keyStatement: string;
  flashcards?: { front: string; back: string }[];
  accordion: { heading: string; items: { title: string; body: string }[] };
  tabs: { heading: string; tabs: { label: string; body: string }[] };
  check: { question: string; correct: string; wrong: [string, string, string]; feedbackCorrect: string; feedbackIncorrect: string };
  sorting: { heading: string; categories: [string, string, string]; items: { text: string; category: string }[] };
  next: string;
  scenario: { context: string; prompt: string; options: [string, string, string]; responses: [string, string, string]; recommended: 0 | 1 | 2 };
  transfer: string;
  move: { control: string; failure: string; next: string };
};
export type CatalogSpec = {
  id: string;
  topicId: string;
  subtitle: string;
  scope: string;
  introTranscript: string;
  lessons: CatalogLesson[];
  jobAid: { subtitle: string; remember: string[]; sections: { heading: string; items: string[] }[] };
  sources: Source[];
};

type Topic = { title: string; outcome: string; level: string; series: string; category: string; pathway: string; audience: string; format: string; core_roles: string[]; ic_stage: string };
type Link = { source: string; target: string; relation: string; basis: string };
const TOPICS = catalog.topics as Record<string, Topic>;
const LINKS = catalog.links as Link[];
const ROLES = catalog.roles as Record<string, string>;
const LEVELS = catalog.levels as Record<string, string>;
const PLAN_BY_TOPIC = new Map(plan.map(row => [row.topicId, row]));
const AVAILABLE_IDS = new Set<string>(AVAILABLE_CATALOG_COURSE_IDS);
const availableTopic = (topicId: string) => {
  const row = PLAN_BY_TOPIC.get(topicId);
  return !!TOPICS[topicId] && !!row && AVAILABLE_IDS.has(row.id);
};

const OWNER = "One DSD — People, Access and Culture";
const SERIES_LABELS: Record<string, string> = {
  "Leader DEIA": "Leadership",
  "Staff DEIA": "For all staff",
  "Team and collaboration": "Teams and collaboration",
  "Intercultural": "Intercultural learning",
};
/** Lowercase only the leading word so proper names such as DHS keep their form mid-sentence. */
const lowerFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const html = (value: string) => value.trim().split(/\n\s*\n/).map(p => `<p>${escape(p.trim())}</p>`).join("");
const topicLink = (topicId: string) => {
  const topic = TOPICS[topicId];
  const row = PLAN_BY_TOPIC.get(topicId);
  const text = `${escape(catalogDisplayLabel(topic.title))} (${topic.level})`;
  return row && availableTopic(topicId) ? `<a href="/courses/${row.id}">${text}</a>` : text;
};

/** Estimate reading plus ordinary interaction time, rather than assigning every course 45 minutes. */
function estimatedLessonMinutes(lesson: CatalogLesson): number {
  const reading = [lesson.summary, lesson.statement, lesson.intro.body, lesson.keyStatement,
    ...lesson.takeaways, ...lesson.inThisLesson,
    ...(lesson.flashcards ?? []).flatMap(card => [card.front, card.back]),
    ...lesson.accordion.items.flatMap(item => [item.title, item.body]),
    ...lesson.tabs.tabs.flatMap(tab => [tab.label, tab.body]),
    lesson.check.question, lesson.check.correct, ...lesson.check.wrong,
    lesson.check.feedbackCorrect, lesson.check.feedbackIncorrect,
    ...lesson.sorting.items.map(item => item.text),
    lesson.scenario.context, lesson.scenario.prompt, ...lesson.scenario.options, ...lesson.scenario.responses,
    lesson.transfer, lesson.move.control, lesson.move.failure, lesson.move.next].join(" ");
  const words = reading.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(7, Math.ceil(words / 200) + 4);
}

/** Knowledge-graph neighbours of a topic, grouped by relationship, as one list block. */
function graphBlock(topicId: string): Block {
  const topic = TOPICS[topicId];
  const buildsOn = LINKS.filter(l => l.relation === "prepares for" && l.target === topicId).map(l => l.source).filter(availableTopic);
  const preparesFor = LINKS.filter(l => l.relation === "prepares for" && l.source === topicId).map(l => l.target).filter(availableTopic);
  const counterpart = LINKS.filter(l => l.relation === "counterpart of" && (l.source === topicId || l.target === topicId)).map(l => (l.source === topicId ? l.target : l.source)).filter(availableTopic);
  const related = LINKS.filter(l => l.relation === "related to" && (l.source === topicId || l.target === topicId)).map(l => (l.source === topicId ? l.target : l.source)).filter(availableTopic);
  const items: string[] = [
    `${topic.level} learning for ${topic.audience.toLowerCase()}: ${catalogDisplayLabel(topic.category)}.`,
    `Learning pathway: ${catalogDisplayLabel(topic.pathway)}.`,
    topic.core_roles.length ? `Especially useful for: ${topic.core_roles.map(code => ROLES[code] ?? code).join("; ")}. Participation is optional.` : "Useful for staff in any role.",
  ];
  if (buildsOn.length) items.push(`Builds on: ${buildsOn.map(topicLink).join("; ")}.`);
  if (preparesFor.length) items.push(`Prepares for: ${preparesFor.map(topicLink).join("; ")}.`);
  if (counterpart.length) items.push(`Learn together: ${counterpart.map(topicLink).join("; ")}. These courses can help leaders and staff develop a shared understanding.`);
  if (related.length) items.push(`Related topics: ${related.map(topicLink).join("; ")}.`);
  return { type: "list", heading: "Continue your learning", items };
}

/** Builds a DEIA catalog course pack in the program's six-lesson course format. */
export function catalogCourse(spec: CatalogSpec): CoursePack {
  const row = plan.find(entry => entry.id === spec.id);
  if (!row) throw new Error(`DEIA catalog course ${spec.id} is not in plan.json`);
  if (row.topicId !== spec.topicId) throw new Error(`DEIA catalog course ${spec.id} topic ${spec.topicId} does not match plan topic ${row.topicId}`);
  if (spec.lessons.length !== 6) throw new Error(`DEIA catalog course ${spec.id} needs six lessons, found ${spec.lessons.length}`);
  const topic = TOPICS[row.topicId];
  const minutes = spec.lessons.map(estimatedLessonMinutes);
  const total = minutes.reduce((sum, value) => sum + value, 0);
  const last = spec.lessons[5];
  const lessonId = (index: number) => `${spec.id}-${index + 1}`;
  return {
    course: {
      id: spec.id, indexNumber: row.indexNumber, title: catalogDisplayLabel(row.title), seriesLabel: `${SERIES_LABELS[row.series] ?? row.series} · ${row.level}`, subtitle: spec.subtitle,
      scope: `${spec.scope} This ${row.level.toLowerCase()} course focuses on ${lowerFirst(catalogDisplayLabel(row.category))}. ${LEVELS[row.level]} Participation is voluntary and lessons can be opened in any order. Examples are practice. Keep reflection notes without identifying coworkers or members of the public. Use the applicable agency equity-analysis process for actual decisions; course routines are preparation and do not replace it. This course supports learning; formal employment, accommodation, civil-rights, eligibility, Tribal consultation and licensing decisions stay with the responsible office.`,
      treatment: "Six lessons with explanations, DSD practice cases, key terms, practice decisions and feedback, knowledge checks, sorting activities, personal reflection, related courses, and a practical job aid.",
      duration: `About ${total} minutes, plus optional practice`, author: OWNER,
      coverImage: row.coverImage, coverAlt: row.coverAlt, kind: "course", contentType: row.contentType as CoursePack["course"]["contentType"],
      introTranscript: spec.introTranscript,
      learning: {
        objectives: spec.lessons.map(lesson => lesson.objective),
        evidence: ["Make and reconsider scenario decisions without being assigned a score.", "Use the knowledge checks and sorting activities to support a meaningful reflection or next practice.", "Use the course job aid for personal understanding, a practice example, or an appropriate work task. Personal reflection can remain private and does not require entered notes or a work result."],
        appliedNextStep: last.move.next,
      },
      governance: {
        contentOwner: "Equity and Inclusion Operations Consultant", reviewers: [], evidenceDate: "2026-10-06",
        lastReviewed: "Source checks and content reviews are recorded separately with the course release.",
        nextReview: "2027-04-06 or when evidence, law, policy, or relevant guidance changes",
        updateTriggers: ["Updated research, law, DHS or Minnesota Management and Budget policy, or official guidance", "Learner or community feedback about accuracy, accessibility, or a scenario", "Changes to the DSD People, Access and Culture catalog levels, roles, or knowledge graph"],
        relatedDoor: "Use the responsible agency office for formal policy, employment, accommodation, civil-rights, eligibility, or Tribal consultation decisions. This course supports learning rather than making those determinations.",
        toolkitQuestion: "Who is affected by this decision, and what would I need to learn from them before it is final?",
        status: "current",
      },
      lessons: spec.lessons.map((lesson, index) => {
        const slot = index % 4;
        const options = lesson.check.wrong.map(text => ({ text, correct: false }));
        options.splice(slot, 0, { text: lesson.check.correct, correct: true });
        const id = lessonId(index);
        const blocks: Block[] = [
          { type: "image", src: lesson.image.src, alt: lookupAlt(lesson.image.src), caption: lesson.image.caption },
          { type: "statement", body: lesson.statement },
          { type: "text", heading: lesson.intro.heading, body: html(lesson.intro.body) },
          { type: "list", heading: "In this lesson", ordered: true, items: lesson.inThisLesson },
          { type: "statement", body: lesson.keyStatement },
          ...(lesson.flashcards?.length ? [{ type: "flashcards" as const, heading: "Key terms", cards: lesson.flashcards.map(card => ({ front: card.front, back: html(card.back) })) }] : []),
          { type: "accordion", heading: lesson.accordion.heading, items: lesson.accordion.items.map(item => ({ title: item.title, body: html(item.body) })) },
          { type: "knowledgeCheck", id: `${id}-check`, question: lesson.check.question, options, feedbackCorrect: lesson.check.feedbackCorrect, feedbackIncorrect: lesson.check.feedbackIncorrect },
          { type: "tabs", heading: lesson.tabs.heading, tabs: lesson.tabs.tabs.map(tab => ({ label: tab.label, body: html(tab.body) })) },
          { type: "sorting", id: `${id}-sort`, heading: lesson.sorting.heading, categories: [...lesson.sorting.categories], items: lesson.sorting.items },
          { type: "text", body: html(lesson.next) },
          ...(index === 5 ? [graphBlock(row.topicId)] : []),
          { type: "leaderMove", heading: "Put this lesson into practice", control: lesson.move.control, failure: lesson.move.failure, next: lesson.move.next },
        ];
        return {
          id, number: index + 1, title: lesson.title, summary: lesson.summary, minutes: minutes[index],
          learning: {
            objective: lesson.objective,
            ...(lesson.objectives ? { objectives: lesson.objectives } : {}),
            takeaways: lesson.takeaways,
            evidence: "Practice includes a scenario choice, a knowledge check, a sorting activity, and a reflection. These activities do not establish that a change was used or that an outcome improved.",
            appliedNextStep: lesson.move.next,
          },
          scenario: { context: lesson.scenario.context, prompt: lesson.scenario.prompt, options: lesson.scenario.options.map((label, i) => ({ label, response: lesson.scenario.responses[i], recommended: i === lesson.scenario.recommended })) },
          transfer: { prompt: lesson.transfer, options: ["Reflect privately on a meaningful question, or use a practice example. No personal account needs to be entered or shared.", `If useful, connect ${catalogDisplayLabel(topic.title)} to a work task within your responsibility and examine the evidence for any proposed change.`, "Use the responsible office when a formal duty or decision is involved. Optional reflection does not replace a required process."] },
          blocks,
        };
      }),
    },
    jobAid: {
      title: `${catalogDisplayLabel(row.title)}: job aid`, subtitle: spec.jobAid.subtitle,
      use: { purpose: `Use this aid to explore ${catalogDisplayLabel(row.title)} through personal understanding, a practice example, or an appropriate work task. Private reflection does not need a work product or entered personal notes.`, remember: spec.jobAid.remember, doNext: last.move.next },
      sections: [
        ...spec.jobAid.sections,
        { heading: "Continue your learning", items: [`Level: ${row.level}. ${LEVELS[row.level]}`, `Learning pathway: ${catalogDisplayLabel(topic.pathway)}.`, topic.core_roles.length ? `Especially useful for: ${topic.core_roles.map(code => ROLES[code] ?? code).join("; ")}. Participation is optional.` : "Useful for staff in any role.", "Lesson 6 connects this topic with related courses you can explore next."] },
      ],
    },
    sources: spec.sources,
  };
}

const IMAGE_ALTS = catalog.images as Record<string, string>;
function lookupAlt(src: string): string {
  const alt = REVIEWED_CATALOG_IMAGE_ALTS[src] ?? IMAGE_ALTS[src];
  if (!alt) throw new Error(`DEIA catalog image ${src} is not in the image pool`);
  return alt;
}
