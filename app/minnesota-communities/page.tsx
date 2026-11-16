import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommunityDesignIndex } from "@/components/community-design-index";
import { communityDesignEnabled } from "@/lib/content/community-design";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: ROUTES.communities.label };

/**
 * The community briefs. Words typed in its search narrow the list in the page and never go into the address;
 * words from a link (?q=) start the search. The earlier page that sent a typed question to the server in the
 * address has been retired with the earlier community design (git history keeps it).
 */
export default async function CommunitiesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!communityDesignEnabled()) notFound();
  const { q } = await searchParams;
  return <CommunityDesignIndex query={q} />;
}
