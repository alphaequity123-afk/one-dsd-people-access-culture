import "server-only";
import { RESEARCH_EXCLUDED_COMMUNITY_IDS } from "@/lib/content/community-research-policy";
import { communityPagePublished } from "@/lib/content/cultural-intelligence-publication";
import type { StaffProgramScope } from "@/lib/content/staff-publications";

export type CommunityBusiness = { name: string; type: string; place: string; about: string; href?: string; status: string };
export type CommunityProfileSection = { id: string; heading: string; body: string };
export type CommunityProfile = {
  communityId: string;
  title: string;
  sections: CommunityProfileSection[];
  limits: string;
  sources: string;
  businesses: CommunityBusiness[];
};

/** One JSON file per community. Pages under standing deference never load one. */
export async function publishedCommunityProfile(id: string, scope?: StaffProgramScope): Promise<CommunityProfile | null> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || (RESEARCH_EXCLUDED_COMMUNITY_IDS as readonly string[]).includes(id)) return null;
  try {
    const profile = (await import(`./community-360/${id}.json`)).default as CommunityProfile;
    return await communityPagePublished(id, scope) ? profile : null;
  } catch { return null; }
}
