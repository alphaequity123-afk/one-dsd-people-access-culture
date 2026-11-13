import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { ResourceFormatLinks } from "@/components/resource-format-links";
import { countAudioLibraryEntries, filterAudioShelvesByPublication, listAudioLibraryShelves } from "@/lib/content/audio-library";
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
  const count = countAudioLibraryEntries(shelves);
  const podcasts = PODCASTS.flatMap((podcast, index) => podcastSurfaces[index].available && podcastMatchesTheme(podcast.id, selectedTheme?.id) ? [{ podcast, surface: podcastSurfaces[index] }] : []);
  const courseListening = listCourseListening(courses.map(({ pack }) => pack), selfDirectedItems()).filter(course => !selectedTheme || course.themes.includes(selectedTheme.id));
  return <>
    <PageIntro kicker="Learning and resources" title="Audio library" lede="Explore podcasts and courses with recordings. Choose a theme, listen at your own pace, or read the accompanying text.">
      <p className="mt-3 text-sm">{count === 1 ? "1 recording" : `${count} recordings`} in this collection{courseListening.length ? `, plus ${courseListening.length} courses with listening` : ""}.</p>
    </PageIntro>
    <div className="wrap max-w-5xl py-10">
      <ResourceFormatLinks theme={selectedTheme?.id} current="listening" />
      <form action="/audio-library" method="get" className="mb-8 flex flex-wrap items-end gap-4" aria-label="Choose a listening theme">
        <label className="block min-w-0 max-w-full w-full font-semibold sm:w-auto" htmlFor="audio-theme">Explore by theme<select id="audio-theme" name="theme" defaultValue={selectedTheme?.id ?? ""} className="mt-2 block w-full min-w-0 max-w-full rounded border border-line bg-white p-3"><option value="">All recordings and course listening</option>{RESOURCE_THEMES.map(theme => <option key={theme.id} value={theme.id}>{theme.title}</option>)}</select></label>
        <button type="submit" className="btn btn--primary">Explore</button>
        {selectedTheme ? <Link href="/audio-library" className="inline-flex min-h-11 items-center underline underline-offset-4">View all listening</Link> : null}
      </form>
      {selectedTheme ? <section className="mb-8" aria-labelledby="audio-theme-title"><h2 id="audio-theme-title" className="text-2xl font-semibold">{selectedTheme.title}</h2><p className="mt-2 max-w-3xl leading-7">{selectedTheme.description}</p></section> : null}
      {podcasts.length ? <section aria-labelledby="podcasts-title" className="mb-10"><h2 id="podcasts-title" className="text-2xl font-semibold">Podcasts</h2><div className="mt-5 space-y-8">{podcasts.map(({ podcast, surface }) => <PublishedPodcast key={podcast.id} headingLevel={3} podcast={podcast} surface={surface} />)}</div></section> : null}
      {count > 0 ? <AudioLibraryPlayer key={selectedTheme?.id ?? "all"} shelves={shelves} themeLabels={audioThemeLabels(shelves)} /> : <p>No stand-alone recordings match this theme yet. Explore the courses below or choose another way to learn.</p>}
      {courseListening.length ? <section aria-labelledby="course-listening-title" className="mt-10"><h2 id="course-listening-title" className="text-2xl font-semibold">Listen within a course</h2><p className="mt-2 max-w-3xl leading-7">These courses include optional listening alongside the lesson. Open a course to hear its recordings, read the spoken text, and work through its activities.</p><ul className="mt-5 grid list-none gap-4 p-0 md:grid-cols-2">{courseListening.map(course => <li key={course.id} data-course-listening={course.id} className="rounded-lg border border-line bg-white p-5"><h3 className="text-lg font-semibold"><Link href={course.href} className="underline underline-offset-4">{course.title}</Link></h3><p className="mt-2 text-sm">Open the course for listening and practice.</p></li>)}</ul></section> : null}
    </div>
  </>;
}
