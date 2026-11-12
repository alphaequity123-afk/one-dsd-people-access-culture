import "server-only";

import { publishedCommunityProfile } from "@/lib/content/community-profile";
import { WATER_COURSE_HREF, WATER_ESSAY, WATER_MODULES } from "@/lib/content/water-we-swim-in";

export type ReadingCitation = { id: string; title: string; href: string };
type ReadingFamily = "essay" | "module" | "american" | "minnesota";
type Reading = ReadingCitation & { family: ReadingFamily; sectionId: string; body: string };
type Passage = { reading: Reading; text: string };

type UnitScope = { title: string; essaySections: string[]; briefSections: string[] };

// Reading assignments from the original six-module course and the eight-unit collection.
const legacyScopes: Record<string, Omit<UnitScope, "title">> = {
  "module-1": { essaySections: ["why-look-at-our-own-culture", "values-under-the-surface"], briefSections: ["people-and-place", "all-walks-of-life"] },
  "module-2": { essaySections: ["minnesota-nice-decoded", "how-it-looks-from-outside-the-majority"], briefSections: ["family-home-and-daily-life", "work-and-the-economy"] },
  "module-3": { essaySections: ["who-minnesotans-are-majority-and-change", "roots-of-mainstream-minnesota-culture", "race-and-racism-in-minnesota-s-history-and-present", "political-culture"], briefSections: ["people-and-place", "civic-and-political-life"] },
  "module-4": { essaySections: ["how-it-looks-from-outside-the-majority", "other-threads-welcome-faith-gender-and-class", "race-and-racism-in-minnesota-s-history-and-present"], briefSections: ["all-walks-of-life", "religion-and-spiritual-life", "health-and-wellbeing-broadly"] },
  "module-5": { essaySections: ["culture-inside-institutions", "disability-history-as-part-of-minnesota-culture", "culture-inside-disability-services"], briefSections: ["work-and-the-economy", "disability"] },
  "module-6": { essaySections: ["anti-racism-and-equity-work-and-the-debate-about-it", "frameworks-for-reflection", "strengths-to-build-on", "questions-for-reflection"], briefSections: ["civic-and-political-life", "strengths-and-contributions", "what-is-changing-now"] },
};

const collectionScopes: Record<string, UnitScope> = {
  "notice-the-water": { title: "Notice the water", ...legacyScopes["module-1"] },
  "place-history-and-belonging": { title: "Place, history and belonging", essaySections: ["who-minnesotans-are-majority-and-change", "roots-of-mainstream-minnesota-culture"], briefSections: ["family-home-and-daily-life", "work-and-the-economy", "celebrations-and-observances"] },
  "plain-kind-and-clear": { title: "Plain, kind and clear", essaySections: ["minnesota-nice-decoded", "how-it-looks-from-outside-the-majority"], briefSections: ["family-home-and-daily-life", "education"] },
  "history-trust-and-power": { title: "History, trust and power", essaySections: ["race-and-racism-in-minnesota-s-history-and-present"], briefSections: ["civic-and-political-life", "health-and-wellbeing-broadly"] },
  "civic-values-and-disagreement": { title: "Civic values and disagreement", essaySections: ["political-culture", "anti-racism-and-equity-work-and-the-debate-about-it"], briefSections: ["civic-and-political-life", "strengths-and-contributions"] },
  "the-assumptions-in-a-process": { title: "The assumptions in a process", essaySections: ["culture-inside-institutions", "other-threads-welcome-faith-gender-and-class"], briefSections: ["work-and-the-economy", "religion-and-spiritual-life", "education"] },
  "choice-support-and-a-good-life": { title: "Choice, support and a good life", essaySections: ["disability-history-as-part-of-minnesota-culture", "culture-inside-disability-services"], briefSections: ["disability", "family-home-and-daily-life", "health-and-wellbeing-broadly"] },
  "put-the-learning-to-work": { title: "Put the learning to work", essaySections: ["frameworks-for-reflection", "strengths-to-build-on", "questions-for-reflection"], briefSections: ["strengths-and-contributions", "what-is-changing-now"] },
};

export function waterUnitScope(unit: string): UnitScope | undefined {
  const lesson = WATER_MODULES.find(item => item.slug === unit);
  if (lesson) return { title: lesson.title, ...legacyScopes[unit] };
  return Object.hasOwn(collectionScopes, unit) ? collectionScopes[unit] : undefined;
}

const commonWords = new Set(("also about after again against all am an and any are as at be because been before being both but by can could did do does for from give had has have how i if in into is it its just let make may me more most much my no not of on one only or other our out own same see she so some such take than that the their them then there these they this those through to too up use very was we were what when where which who why will with would you your minnesota minnesotan american america cultural culture cultures readings reading explain compare practice reflection").split(" "));

function words(text: string): Set<string> {
  const terms = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(terms.filter(term => term.length > 2 && !commonWords.has(term))
    .map(term => term.length > 5 ? term.replace(/(?:ing|ed|s)$/, "") : term));
}

function readingPassages(reading: Reading): Passage[] {
  return reading.body
    .replace(/\[([^\]\n]+)\]\(https?:\/\/[^\s)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .split(/\n\s*\n/)
    .flatMap(block => block.trim().match(/[\s\S]{1,850}(?:\s|$)/g) ?? [])
    .map(block => block.replace(/^#{1,6}\s+/gm, "").replace(/\*\*|\*/g, "").replace(/\s+/g, " ").trim())
    .filter(text => text.length >= 85)
    .map(text => ({ reading, text }));
}

export async function waterReadingPassages(question: string, scope?: UnitScope, unit?: string, comparison = false) {
  // The same public publication checks that protect the brief pages also protect
  // their excerpts from being sent to the model.
  const profiles = await Promise.all([publishedCommunityProfile("american"), publishedCommunityProfile("minnesota")]);
  const briefNames = ["American Culture", "Minnesota Culture"];
  const readings: Reading[] = [
    ...WATER_ESSAY.sections.filter(section => !scope || scope.essaySections.includes(section.id)).map(section => ({
      id: `essay:${section.id}`,
      sectionId: section.id,
      family: "essay" as const,
      title: `The Water We Swim In — ${section.heading}`,
      href: `${WATER_COURSE_HREF}/essay/${section.id}`,
      body: section.body,
    })),
    ...profiles.flatMap<Reading>((profile, index) => {
      if (!profile || (profile.communityId !== "american" && profile.communityId !== "minnesota")) return [];
      const family = profile.communityId;
      return profile.sections.filter(section => !scope || scope.briefSections.includes(section.id)).map(section => ({
        id: `${family}:${section.id}`,
        sectionId: section.id,
        family,
        title: `${briefNames[index]} — ${section.heading}`,
        href: `/minnesota-communities/${family}/profile#profile-${section.id}`,
        body: section.body,
      }));
    }),
    ...WATER_MODULES.filter(module => module.slug === unit).map(module => ({
      id: `course:${module.slug}`,
      sectionId: module.slug,
      family: "module" as const,
      title: `The Water We Swim In — ${module.title}`,
      href: `${WATER_COURSE_HREF}/${module.slug}`,
      body: module.body,
    })),
  ];
  const query = [...words(question)];
  const passages = readings.flatMap(readingPassages).map(passage => ({
    ...passage, terms: words(passage.text), sectionTerms: words(passage.reading.sectionId.replace(/-/g, " ")),
  }));
  const weights = new Map(query.map(term => [
    term, Math.log(1 + passages.length / (1 + passages.filter(passage => passage.terms.has(term)).length)),
  ]));
  const ranked = passages.map(passage => ({
    ...passage, score: query.reduce((score, term) => score +
      (weights.get(term) ?? 0) * (Number(passage.terms.has(term)) + 1.5 * Number(passage.sectionTerms.has(term))), 0),
  })).sort((left, right) => right.score - left.score);
  const perFamily = comparison ? 2 : 1;
  const selected = new Set(ranked.filter(passage => passage.score > 0).slice(0, 3));
  for (const family of ["essay", "module", "american", "minnesota"] as const) {
    const choices = ranked.filter(passage => passage.reading.family === family);
    if (comparison || scope || !query.length) {
      choices.slice(0, perFamily).forEach(passage => selected.add(passage));
    } else if (choices[0]?.score > 0) {
      selected.add(choices[0]);
    }
  }
  // A limited excerpt window keeps questions fast and caps provider input.
  return [...selected].map(({ reading, text }) => ({
    citation: { id: reading.id, title: reading.title, href: reading.href },
    text,
  }));
}
