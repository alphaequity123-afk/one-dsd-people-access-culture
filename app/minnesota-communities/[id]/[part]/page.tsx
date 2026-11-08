import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommunityDesignPage } from "@/components/community-design-page";
import { communityDesignEnabled } from "@/lib/content/community-design";

// One part of a community page, such as /minnesota-communities/oromo/history.
// The overview at /minnesota-communities/<id> lists the parts that exist for
// that community; a part with nothing in it returns not found.

export async function generateMetadata(): Promise<Metadata> {
  // As on the overview, the page applies the live publication gate, so the
  // metadata does not name the community separately.
  return { title: "Minnesota Communities" };
}

export default async function CommunityPartPage({ params }: { params: Promise<{ id: string; part: string }> }) {
  const { id, part } = await params;
  if (!communityDesignEnabled()) notFound();
  return <CommunityDesignPage id={id} part={part} />;
}
