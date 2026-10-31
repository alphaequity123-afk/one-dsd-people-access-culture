import "server-only";
import { communityDesignEntries, communityReading } from "@/lib/content/community-design";
import { getBrief } from "@/lib/content/briefs";
import { NATIVE_DEFERENCE_COMMUNITY_IDS } from "@/lib/content/community-presentation";
import { communityReadingSurfaceId } from "@/lib/content/community-reading-surface";
import { communityBriefSurfaceId, stringValue } from "@/lib/content/staff-surface-registry";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { assembleAvailableCommunities, type AvailableCommunity } from "@/lib/content/intercultural-community-list-policy";

/** Request-scoped published entries; call dynamically and do not cache the returned titles. */
export async function getAvailableInterculturalCommunities(scope: StaffProgramScope): Promise<AvailableCommunity[]> {
  return assembleAvailableCommunities(scope, {
    async parentAvailable(currentScope, id) {
      const surface = await prepareEditableSurface(id, { scope: currentScope, includeOwner: false });
      return surface.available;
    },
    entries() {
      return communityDesignEntries().map(entry => {
        const raw = getBrief(entry.id);
        return {
          id: entry.id,
          seedTitle: entry.title,
          rawTitle: raw?.title ?? null,
          hasBrief: Boolean(raw),
          hasReading: Boolean(communityReading(entry.id)),
          standingTribalDeference: (NATIVE_DEFERENCE_COMMUNITY_IDS as readonly string[]).includes(entry.id),
        };
      });
    },
    async brief(currentScope, id) {
      const surface = await prepareEditableSurface(communityBriefSurfaceId(id), { scope: currentScope, includeOwner: false });
      return { available: surface.available, title: stringValue(surface.values, "title") };
    },
    async reading(currentScope, id) {
      const surface = await prepareEditableSurface(communityReadingSurfaceId(id), { scope: currentScope, includeOwner: false });
      return { available: surface.available, title: stringValue(surface.values, "title") };
    },
  });
}
