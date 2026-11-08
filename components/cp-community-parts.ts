// Parts of a community page. The overview lives at /minnesota-communities/<id>;
// each part below lives at /minnesota-communities/<id>/<slug>. Native community
// pages are never split (owner rule) and have no parts.

export const COMMUNITY_PARTS = [
  { slug: "history", label: "History and culture" },
  { slug: "learning", label: "Learning and reflection" },
  { slug: "working-with", label: "Working with the community" },
  { slug: "numbers", label: "Numbers, with care" },
  { slug: "organizations", label: "Organizations" },
  { slug: "profile", label: "Community profile" },
  { slug: "people", label: "People, institutions, and access" },
  { slug: "sources", label: "Sources and more to explore" },
] as const;

export type CommunityPartSlug = (typeof COMMUNITY_PARTS)[number]["slug"];

export function isCommunityPartSlug(value: string): value is CommunityPartSlug {
  return COMMUNITY_PARTS.some(part => part.slug === value);
}

export function communityPartHref(id: string, slug?: CommunityPartSlug): string {
  return slug ? `/minnesota-communities/${id}/${slug}` : `/minnesota-communities/${id}`;
}

/**
 * Which part now holds an anchor that used to be on the single community page,
 * so old links such as /minnesota-communities/oromo#community-numbers still land.
 */
export function communityPartForAnchor(anchor: string): CommunityPartSlug | null {
  if (/^community-(history|context|observances)\b/.test(anchor)) return "history";
  if (/^community-(practice|before-outreach|connections)\b/.test(anchor)) return "working-with";
  if (/^community-numbers\b/.test(anchor)) return "numbers";
  if (/^community-organizations\b/.test(anchor)) return "organizations";
  if (/^(community-profile|profile-)/.test(anchor)) return "profile";
  if (/^research-/.test(anchor)) return "people";
  if (/^(community-sources|community-collection-addition|community-more-stories)/.test(anchor)) return "sources";
  return null;
}
