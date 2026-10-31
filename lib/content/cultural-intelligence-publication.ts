import "server-only";
import { CULTURAL_INTELLIGENCE_SURFACE_ID } from "@/lib/content/cultural-intelligence-hub";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { requestedContentScope } from "@/lib/product/request-context";

/**
 * The one availability check for links to the hub. Reads without the owner override,
 * in the requested scope. A withdrawal or a failed check hides the link.
 */
export async function culturalIntelligenceHubAvailable(scope?: StaffProgramScope): Promise<boolean> {
  try {
    const requested = scope ?? await requestedContentScope();
    if (requested !== "dsd" && requested !== "one-dhs") return false;
    const surface = await prepareEditableSurface(CULTURAL_INTELLIGENCE_SURFACE_ID, { scope: requested, includeOwner: false });
    return surface.available === true;
  } catch {
    return false;
  }
}

/**
 * The one availability check for what a community page adds to its brief. It follows the
 * community's own surfaces and the directory, not the intercultural topic, which publishes
 * separately. Reads without the owner override. A withdrawal or a failed check hides the addition.
 */
export async function communityPagePublished(id: string, scope?: StaffProgramScope): Promise<boolean> {
  try {
    const requested = scope ?? await requestedContentScope();
    if (requested !== "dsd" && requested !== "one-dhs") return false;
    // Loaded here so the hub check, which runs in the site header, does not pull in the community data.
    const { getAvailableInterculturalCommunities } = await import("@/lib/content/intercultural-community-list");
    const available = await getAvailableInterculturalCommunities(requested);
    if (!available.some(community => community.id === id)) return false;
    const directory = await prepareEditableSurface("communities.index", { scope: requested, includeOwner: false });
    if (directory.available !== true) return false;
    // Recheck before anything is emitted, in case of a withdrawal during these lookups.
    const current = await getAvailableInterculturalCommunities(requested);
    return current.some(community => community.id === id);
  } catch {
    return false;
  }
}
