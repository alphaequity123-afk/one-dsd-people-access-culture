import type { AudioLibraryEntry, AudioLibraryShelf } from "./audio-library";
import { RESOURCE_THEMES, resourceThemeIds, resourceOrganizationDecision, type ResourceThemeId } from "./resource-organization";

/** Clip-specific subjects supplement the reviewed topic of the linked lesson. */
const recordingSubjects: Readonly<Record<string, readonly ResourceThemeId[]>> = {
  "learning-examples/first-contact-dead-end.wav": ["access"],
  "learning-examples/first-contact-supported.wav": ["access"],
  "learning-examples/conflict-direct.wav": ["identity", "access"],
  "learning-examples/conflict-indirect.wav": ["identity", "access"],
  "learning-examples/packet-drift.wav": ["identity", "workforce"],
  "learning-examples/packet-redirect.wav": ["identity", "workforce", "access"],
  "learning-examples/packet-next-step.wav": ["identity", "workforce", "access", "evidence"],
  "learning-examples/pace-today.wav": ["disability", "access"],
  "learning-examples/pace-topic.wav": ["disability", "access"],
  "learning-examples/pace-next-step.wav": ["disability", "access"],
};

export function podcastThemeIds(id: string): ResourceThemeId[] {
  const decision = resourceOrganizationDecision("podcast." + id);
  // Preserve an existing subject connection when its ID still names a current theme.
  return RESOURCE_THEMES.filter(theme => decision?.themes.includes(theme.id) || decision?.legacyThemes.includes(theme.id)).map(theme => theme.id);
}

export function podcastMatchesTheme(id: string, theme?: string): boolean {
  if (!theme) return true;
  const decision = resourceOrganizationDecision("podcast." + id);
  return RESOURCE_THEMES.some(item => item.id === theme) ? podcastThemeIds(id).includes(theme as ResourceThemeId) : decision?.legacyThemes.includes(theme) ?? false;
}

export function audioEntryThemeIds(entry: AudioLibraryEntry): ResourceThemeId[] {
  if (entry.id.startsWith("podcast/")) return podcastThemeIds(entry.id.slice("podcast/".length));
  const relatedCourse = entry.related?.href.match(/^\/courses\/([^/?#]+)/)?.[1];
  const courseThemes = relatedCourse ? resourceThemeIds({ id: "course-" + decodeURIComponent(relatedCourse), type: "learning_module", tags: [] }) : [];
  return [...new Set([...(recordingSubjects[entry.id] ?? []), ...courseThemes])];
}

export function filterAudioShelves(shelves: readonly AudioLibraryShelf[], theme?: string): AudioLibraryShelf[] {
  if (!theme || !RESOURCE_THEMES.some(item => item.id === theme)) return [...shelves];
  return shelves.map(shelf => ({ ...shelf, entries: shelf.entries.filter(entry => audioEntryThemeIds(entry).includes(theme as ResourceThemeId)) })).filter(shelf => shelf.entries.length > 0);
}

export function audioThemeLabels(shelves: readonly AudioLibraryShelf[]): Record<string, { id: string; title: string }[]> {
  return Object.fromEntries(shelves.flatMap(shelf => shelf.entries.map(entry => [entry.id, RESOURCE_THEMES.filter(theme => audioEntryThemeIds(entry).includes(theme.id)).map(({ id, title }) => ({ id, title }))])));
}
