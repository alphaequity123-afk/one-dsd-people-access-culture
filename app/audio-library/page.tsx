import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { filterAudioShelvesByPublication, listAudioLibraryShelves } from "@/lib/content/audio-library";
import { audioThemeLabels, filterAudioShelves, podcastMatchesTheme } from "@/lib/content/audio-organization";
import { selfDirectedItems } from "@/lib/content/self-directed";
import { listCourseListening } from "@/lib/content/course-listening";
import { publishedCourses } from "@/lib/content/courses/published";
import { requestedContentScope } from "@/lib/product/request-context";
import { RESOURCE_THEMES } from "@/lib/content/resource-organization";
import { AudioLibraryPlayer } from "./audio-library-player";
import { PublishedPodcast } from "@/components/published-podcast";
import { prepareEditableSurface } from "@/components/editable-surface";
import { PODCASTS } from "@/lib/content/podcasts";

export const metadata: Metadata = { title: "Audio library" };
export const dynamic = "force-dynamic";

export default async function AudioLibraryPage({ searchParams }: { searchParams?: Promise<{ theme?: string | string[] }> }) {
  const query = await searchParams ?? {};
  const selectedTheme = RESOURCE_THEMES.find(theme => theme.id === query.theme);
  const scope = await requestedContentScope();
  const courses = await publishedCourses(scope);
  // Full podcast players live here only; other pages link to them.
  const podcastSurfaces = await Promise.all(PODCASTS.map(podcast => prepareEditableSurface(podcast.surfaceId, { scope, includeOwner: false })));
  const availablePodcastIds = new Set(PODCASTS.flatMap((podcast, index) => podcastSurfaces[index].available ? [podcast.id] : []));
  const allShelves = filterAudioShelvesByPublication(listAudioLibraryShelves(), availablePodcastIds);
  const shelves = filterAudioShelves(allShelves, selectedTheme?.id);
  const podcasts = PODCASTS.flatMap((podcast, index) => podcastSurfaces[index].available && podcastMatchesTheme(podcast.id, selectedTheme?.id) ? [{ podcast, surface: podcastSurfaces[index] }] : []);
  // Owner decision 2026-11-22: each podcast appears once, in the Podcasts section with its full player.
  const playerShelves = podcasts.length ? shelves.filter(shelf => shelf.id !== "podcasts") : shelves;
  const courseListening = listCourseListening(courses.map(({ pack }) => pack), selfDirectedItems()).filter(course => !selectedTheme || course.themes.includes(selectedTheme.id));
  return <>
    {/* Owner decision 2026-11-22: a tighter, calmer Audio library in the unified design. */}
    <PageIntro kicker="Learning and resources" title="Audio library" lede="Conversations and recordings to listen to at your own pace, with the full text alongside whenever you'd rather read." />
    <div className="wrap max-w-5xl py-10 audio-library">
      <form action="/audio-library" method="get" className="audio-filter" aria-label="Choose a listening theme">
        <label htmlFor="audio-theme">Theme</label>
        <select id="audio-theme" name="theme" defaultValue={selectedTheme?.id ?? ""}><option value="">Everything</option>{RESOURCE_THEMES.map(theme => <option key={theme.id} value={theme.id}>{theme.title}</option>)}</select>
        <button type="submit" className="btn btn--primary">Show</button>
        {selectedTheme ? <Link href="/audio-library" className="audio-filter-reset">See everything</Link> : null}
      </form>
      {selectedTheme ? <section className="audio-theme" aria-labelledby="audio-theme-title"><h2 id="audio-theme-title">{selectedTheme.title}</h2><p>{selectedTheme.description}</p></section> : null}
      {podcasts.length ? <section aria-labelledby="podcasts-title" className="audio-section"><p className="audio-eyebrow">Listen</p><h2 id="podcasts-title">Podcasts</h2><div className="audio-podcasts">{podcasts.map(({ podcast, surface }) => <PublishedPodcast key={podcast.id} headingLevel={3} podcast={podcast} surface={surface} compact />)}</div></section> : null}
      {playerShelves.some(shelf => shelf.entries.length) ? <AudioLibraryPlayer key={selectedTheme?.id ?? "all"} shelves={playerShelves} themeLabels={audioThemeLabels(shelves)} /> : null}
      {courseListening.length ? <section aria-labelledby="course-listening-title" className="audio-section"><p className="audio-eyebrow">Learn while you listen</p><h2 id="course-listening-title">Listen within a course</h2><p className="audio-section-lede">Each of these courses includes conversations you can listen to alongside the lesson, with the spoken words written out.</p><ul className="audio-course-rows">{courseListening.map(course => <li key={course.id} data-course-listening={course.id}><Link href={course.href}>{course.title}</Link></li>)}</ul></section> : null}
      {!podcasts.length && !playerShelves.some(shelf => shelf.entries.length) && !courseListening.length ? <p className="audio-empty">There's nothing to listen to on this theme yet. <Link href="/audio-library">See everything</Link> or explore <Link href="/learn">Learn</Link>.</p> : null}
    </div>
  </>;
}
