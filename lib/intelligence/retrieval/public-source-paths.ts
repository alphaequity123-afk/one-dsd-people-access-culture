import { WATER_COURSE_HREF, WATER_ESSAY } from "@/lib/content/water-we-swim-in";
import { selfDirectedHref } from "@/lib/content/self-directed";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { Doc } from "./search";

const localBase = "https://local.invalid";
const protectedPath = /^\/(?:api|_next|admin|consultant|contribute|equity-workspace|intake|my-work|my-view|team-space|toolkit-studio|support\/(?:request|track)|one-dsd\/team\/workspace)(?:\/|$)/i;
const resourceQueryKeys = new Set(["course", "month", "community", "category"]);

export function publicLearningSourceUrl(href: string): URL | undefined {
  if (!/^\/(?!\/)/.test(href) || /[\\\s]/.test(href) || /%(?:2f|5c)/i.test(href)
    || Array.from(href).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return undefined;
  try {
    const url = new URL(href, localBase);
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== localBase || path.includes("\\") || protectedPath.test(path)
      || Array.from(path).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return undefined;
    if (["next", "redirect", "url", "target", "returnTo"].some(key => url.searchParams.has(key))) return undefined;
    return url;
  } catch { return undefined; }
}

/** Route aliases share a source record. Keep parameters that select a resource. */
export function learningResourcePath(value: string): string | undefined {
  if (value.length > 480) return undefined;
  const url = publicLearningSourceUrl(value);
  if (!url) return undefined;
  const path = url.pathname.replace(/\/$/, "").replace(/^\/share\/(library|courses)(?=\/|$)/, "/$1")
    .replace(/^\/resources(?=\/|$)/, "/library");
  if (!path) return undefined;
  const courseAlias = path.startsWith("/library/self-directed-") ? selfDirectedHref(path.slice("/library/".length)) : undefined;
  if (courseAlias) return courseAlias;
  const query = new URLSearchParams();
  for (const [key, entry] of url.searchParams) {
    if (resourceQueryKeys.has(key) && /^[-_a-z0-9]{1,80}$/i.test(entry)) query.set(key, entry);
  }
  query.sort();
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

/** Use the public reading destination for a passage rather than its index page. */
export function projectPublicReadingPath(doc: Doc, scope: StaffProgramScope, directoryPublished: boolean): Doc[] {
  if (doc.href === `${WATER_COURSE_HREF}/essay`) {
    const source = doc.evidenceRevisions?.[0]?.sourceId ?? doc.id;
    const section = WATER_ESSAY.sections.find(item => {
      const prefix = `water-essay-${item.id}-`;
      return source.startsWith(prefix) && /^\d+$/.test(source.slice(prefix.length));
    });
    if (section) return [{ ...doc, href: `${doc.href}/${section.id}` }];
  }
  const community = doc.href.match(/^\/minnesota-communities\/([a-z0-9-]+)$/)?.[1];
  if (!community || doc.type !== "community_research") return [doc];
  const prefix = `profile-${community}-`;
  const source = doc.evidenceRevisions?.find(revision => revision.sourceId.startsWith(prefix))?.sourceId ?? doc.id;
  if (!source.startsWith(prefix)) return [doc];
  const section = source.slice(prefix.length).match(/^([a-z0-9-]+)-\d+$/)?.[1];
  if (!section || !directoryPublished || (scope === "one-dhs" && community !== "american" && community !== "minnesota")) return [];
  const anchor = section === "businesses" ? "businesses-and-commercial-life" : section;
  return [{ ...doc, href: `${doc.href}/profile#profile-${anchor}` }];
}
