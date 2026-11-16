import { PRACTICE_STORAGE_KEY } from "@/lib/content/learning-practice";
import { GRADUATION_PATHS } from "@/lib/content/paths";

export type PrivateBrowserStorageKey = {
  area: "local" | "session";
  key: string;
  purpose: "ask_history" | "search_handoff" | "practice_handoff" | "consultation_prefill" | "saved_request_reference" | "path_notes" | "path_progress" | "learning_notes" | "course_notes" | "course_progress" | "equity_analysis_draft" | "practice_plans" | "saved_resources" | "practice_reflection" | "my_path";
};

export const BROWSER_STORAGE_KEYS = {
  askSession: "pac_ask_session_v2",
  equityAnalysisDraft: "pac_equity_analysis_draft_v1",
  structuralReviewDraft: "one-dsd-structural-review-draft",
  analyzeDocumentKeep: "one-dsd-analyze-document-v1",
  askPracticeHandoff: "pac_ask_practice_handoff_v1",
  /** A question typed on the landing page, carried to the Ask page and removed as soon as it is asked. */
  askHomeQuestion: "pac_ask_home_question_v1",
  /** A question handed to Ask from another page (search results), removed as soon as it is asked. Same key as the live One DHS app. */
  askPendingQuestion: "ask-pending-question",
  /** Words typed in the search box at the top of every page, carried to the search page and removed once read. */
  siteSearchHandoff: "site-search-pending",
  /** Words typed on the short Learn page, carried to the learning catalog and removed once read. */
  learnSearchHandoff: "learn-search-pending",
  /** Words typed in the Library search, carried across a change of fixed choices and removed once read. */
  librarySearchHandoff: "library-search-pending",
  consultationPrefill: "pac_intake_prefill",
  recentConsultationReferences: "pac_requests_session",
  savedConsultationReferences: "pac_requests",
  learningPracticeNotes: PRACTICE_STORAGE_KEY,
  practicePlans: "one-dsd-practice-plans-v1",
  savedResources: "one-dsd-saved-resources-v1",
  practiceReflection: "one-dsd-logic-model-reflection-v1",
  myPath: "one-dsd-my-path-v1",
  actionPlans: "one-dsd-action-plans-v1",
  decisionRecords: "one-dsd-decision-records-v1",
  reflections: "one-dsd-reflections-v1",
  pathArtifact: (pathId: string) => `pac_artifact_${pathId}`,
  pathArtifactSource: (pathId: string) => `pac_artifact_source_${pathId}`,
  pathProgress: (pathId: string) => `pac_progress_${pathId}`,
} as const;

export const PRIVATE_BROWSER_STORAGE_KEYS: readonly PrivateBrowserStorageKey[] = [
  { area: "session", key: BROWSER_STORAGE_KEYS.askSession, purpose: "ask_history" },
  { area: "session", key: BROWSER_STORAGE_KEYS.askPracticeHandoff, purpose: "practice_handoff" },
  { area: "session", key: BROWSER_STORAGE_KEYS.askHomeQuestion, purpose: "ask_history" },
  { area: "session", key: BROWSER_STORAGE_KEYS.askPendingQuestion, purpose: "ask_history" },
  { area: "session", key: BROWSER_STORAGE_KEYS.siteSearchHandoff, purpose: "search_handoff" },
  { area: "session", key: BROWSER_STORAGE_KEYS.learnSearchHandoff, purpose: "search_handoff" },
  { area: "session", key: BROWSER_STORAGE_KEYS.librarySearchHandoff, purpose: "search_handoff" },
  { area: "session", key: BROWSER_STORAGE_KEYS.consultationPrefill, purpose: "consultation_prefill" },
  { area: "session", key: BROWSER_STORAGE_KEYS.recentConsultationReferences, purpose: "saved_request_reference" },
  { area: "local", key: BROWSER_STORAGE_KEYS.savedConsultationReferences, purpose: "saved_request_reference" },
  { area: "local", key: BROWSER_STORAGE_KEYS.learningPracticeNotes, purpose: "learning_notes" },
  { area: "local", key: BROWSER_STORAGE_KEYS.equityAnalysisDraft, purpose: "equity_analysis_draft" },
  { area: "local", key: BROWSER_STORAGE_KEYS.structuralReviewDraft, purpose: "equity_analysis_draft" },
  // "Keep in this browser" on Analyze a document: the request and its result, only when the person chose to keep them.
  { area: "local", key: BROWSER_STORAGE_KEYS.analyzeDocumentKeep, purpose: "equity_analysis_draft" },
  { area: "local", key: BROWSER_STORAGE_KEYS.practicePlans, purpose: "practice_plans" },
  { area: "local", key: BROWSER_STORAGE_KEYS.savedResources, purpose: "saved_resources" },
  { area: "local", key: BROWSER_STORAGE_KEYS.practiceReflection, purpose: "practice_reflection" },
  { area: "local", key: BROWSER_STORAGE_KEYS.myPath, purpose: "my_path" },
  // Personal action plans and decision records the person chose to keep on this computer.
  { area: "local", key: BROWSER_STORAGE_KEYS.actionPlans, purpose: "practice_plans" },
  { area: "local", key: BROWSER_STORAGE_KEYS.decisionRecords, purpose: "practice_plans" },
  { area: "local", key: BROWSER_STORAGE_KEYS.reflections, purpose: "practice_reflection" },
  ...GRADUATION_PATHS.flatMap((path) => [
    { area: "local" as const, key: BROWSER_STORAGE_KEYS.pathArtifact(path.id), purpose: "path_notes" as const },
    { area: "local" as const, key: BROWSER_STORAGE_KEYS.pathArtifactSource(path.id), purpose: "path_notes" as const },
    { area: "local" as const, key: BROWSER_STORAGE_KEYS.pathProgress(path.id), purpose: "path_progress" as const },
  ]),
  // "Keep my place" on the suggested paths for supervisors and managers.
  ...["first-year", "experienced", "managers-of-managers", "senior-leaders"].map(path => ({ area: "local" as const, key: BROWSER_STORAGE_KEYS.pathProgress(`leading-${path}`), purpose: "path_progress" as const })),
];

// Course IDs and lesson IDs share the CoursePackSchema slug grammar. Register
// the namespace rather than importing the complete course corpus into the client.
const COURSE_ID = "[a-z0-9][a-z0-9-]{0,159}";
export const PRIVATE_BROWSER_STORAGE_PATTERNS = [
  { area: "local", keyPattern: `^pac-course:${COURSE_ID}:${COURSE_ID}$`, purpose: "course_notes" },
  { area: "local", keyPattern: `^pac-course-resume:${COURSE_ID}$`, purpose: "course_progress" },
  { area: "local", keyPattern: "^one-dsd-learning-[FIA](?:0[1-9]|1[0-9]|2[0-4])$", purpose: "course_progress" },
  // Guided-practice record for one curriculum or leadership lesson (lib/tutor/student-model.ts): attempt counts only, no answers or messages.
  { area: "local", keyPattern: "^tutor:(?:0[1-9]|ls0[1-9])$", purpose: "course_progress" },
  // "Keep my place" on any suggested leadership path, so clearing saved work removes every path's place, including paths added later.
  { area: "local", keyPattern: "^pac_progress_leading-[a-z0-9-]{1,60}$", purpose: "path_progress" },
] as const;

export function isPrivateBrowserStorageKey(area: PrivateBrowserStorageKey["area"], key: string): boolean {
  return PRIVATE_BROWSER_STORAGE_KEYS.some(entry => entry.area === area && entry.key === key)
    || PRIVATE_BROWSER_STORAGE_PATTERNS.some(entry => entry.area === area && new RegExp(entry.keyPattern).test(key));
}

export function courseNoteIdentity(key: string): { courseId: string; lessonId: string } | undefined {
  if (!new RegExp(PRIVATE_BROWSER_STORAGE_PATTERNS[0].keyPattern).test(key)) return undefined;
  const [, courseId, lessonId] = key.split(":");
  return { courseId, lessonId };
}

type StorageArea = PrivateBrowserStorageKey["area"];
export type PrivateDataClearResult = { ok: boolean; failedKeys: string[]; discoveryFailed: boolean };

function browserKeys(area: StorageArea): string[] {
  if (typeof window === "undefined") return [];
  const storage = area === "local" ? window.localStorage : window.sessionStorage;
  return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => key !== null);
}

/** Snapshot dynamic keys before deletion; unrelated applications' keys remain untouched. */
export function clearRegisteredPrivateBrowserData(
  clear: (area: StorageArea, key: string, value: null) => boolean | void,
  keys: (area: StorageArea) => readonly string[] = browserKeys,
): PrivateDataClearResult {
  const entries = new Map(PRIVATE_BROWSER_STORAGE_KEYS.map(entry => [`${entry.area}:${entry.key}`, entry]));
  let discoveryFailed = false;
  // Only local storage currently has registered dynamic namespaces.
  try {
    for (const key of keys("local")) {
      const pattern = PRIVATE_BROWSER_STORAGE_PATTERNS.find(entry => new RegExp(entry.keyPattern).test(key));
      if (pattern) entries.set(`local:${key}`, { area: "local", key, purpose: pattern.purpose });
    }
  } catch { discoveryFailed = true; }
  const failedKeys: string[] = [];
  for (const entry of entries.values()) {
    try {
      if (clear(entry.area, entry.key, null) === false) failedKeys.push(`${entry.area}:${entry.key}`);
    } catch { failedKeys.push(`${entry.area}:${entry.key}`); }
  }
  return { ok: !discoveryFailed && failedKeys.length === 0, failedKeys, discoveryFailed };
}
