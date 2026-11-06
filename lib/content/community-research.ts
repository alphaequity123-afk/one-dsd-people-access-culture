import "server-only";
import minnesotaAccessData from "@/lib/content/community-research/_minnesota-access.json";
import {
  RESEARCH_EXCLUDED_COMMUNITY_IDS,
  minnesotaAccessProblems,
  selectCommunityResearch,
  type CommunityResearch,
  type MinnesotaAccess,
} from "@/lib/content/community-research-policy";
import { communityPagePublished } from "@/lib/content/cultural-intelligence-publication";
import type { StaffProgramScope } from "@/lib/content/staff-publications";

/** One JSON file per community. Missing or invalid files leave the page as it was. */
export async function loadCommunityResearch(id: string): Promise<CommunityResearch | null> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return null;
  if ((RESEARCH_EXCLUDED_COMMUNITY_IDS as readonly string[]).includes(id)) return null;
  try {
    const data = (await import(`./community-research/${id}.json`)).default as unknown;
    return selectCommunityResearch(data, id);
  } catch { return null; }
}

export function minnesotaAccess(): MinnesotaAccess | null {
  return minnesotaAccessProblems(minnesotaAccessData).length === 0 ? minnesotaAccessData as MinnesotaAccess : null;
}

/** The same request-scoped publication gates as the community additions. */
export async function publishedCommunityResearch(id: string, scope?: StaffProgramScope): Promise<CommunityResearch | null> {
  const research = await loadCommunityResearch(id);
  if (!research) return null;
  return await communityPagePublished(id, scope) ? research : null;
}
