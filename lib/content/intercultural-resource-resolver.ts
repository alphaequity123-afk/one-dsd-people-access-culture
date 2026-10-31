import "server-only";
import { getPublishedStaffContent, type StaffProgramScope } from "@/lib/content/staff-publications";
import { publishedCourses } from "@/lib/content/courses/published";
import { CoursePackSchema } from "@/lib/content/courses/contract";
import { REFERRAL_ONLY_COURSE_IDS, isRetiredCulturalWorkshop } from "@/lib/program/retired-features";
import { EDITABLE_SURFACE_REGISTRY, stringValue } from "@/lib/content/staff-surface-registry";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import { resolveInterculturalResources, type AvailableResource, type RequestedResource } from "@/lib/content/intercultural-resource-policy";

/** Request-scoped: never cache its result or replace an omitted item with an unchecked seed link. */
export async function getAvailableInterculturalResources(scope: StaffProgramScope, sources: readonly RequestedResource[]): Promise<AvailableResource[]> {
  // The catalog applies retired-course filtering. Check the actual course surface as well.
  let catalog: ReturnType<typeof publishedCourses> | undefined;
  return resolveInterculturalResources(scope, sources, {
    async course(currentScope, id) {
      const published = await (catalog ??= publishedCourses(currentScope));
      if (!published.some(({ pack }) => pack.course.id === id)) return null;
      const surface = await prepareEditableSurface(`course.${id}`, { scope: currentScope, includeOwner: false });
      if (!surface.available) return null;
      const pack = CoursePackSchema.safeParse(surface.values.pack);
      return pack.success && pack.data.course.id === id && !REFERRAL_ONLY_COURSE_IDS.has(id) && !isRetiredCulturalWorkshop(pack.data.course) ? pack.data.course.title : null;
    },
    async library(currentScope, id) {
      const [shell, item] = await Promise.all([
        prepareEditableSurface("library.resource-shell", { scope: currentScope, includeOwner: false }),
        getPublishedStaffContent(id, { scope: currentScope }),
      ]);
      return shell.available && item?.status === "approved" ? item.title : null;
    },
    async surface(currentScope, path) {
      const definitions = EDITABLE_SURFACE_REGISTRY.filter(def => def.route === path);
      if (definitions.length !== 1) return null;
      const surface = await prepareEditableSurface(definitions[0].surfaceId, { scope: currentScope, includeOwner: false });
      if (!surface.available) return null;
      // The directory renders its default heading when its older seed title is unchanged.
      if (surface.definition.surfaceId === "communities.index") {
        const title = stringValue(surface.values, "introTitle");
        return title !== stringValue(surface.definition.approvedValues, "introTitle") ? title : "Minnesota Communities";
      }
      return stringValue(surface.values, "title") || null;
    },
  });
}


