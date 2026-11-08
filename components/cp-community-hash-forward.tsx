"use client";

import { useEffect } from "react";
import { communityPartForAnchor, communityPartHref, type CommunityPartSlug } from "./cp-community-parts";

/** Sends an old in-page link (for example #community-numbers) to the part that now holds it. */
export function CommunityHashForward({ id, parts }: { id: string; parts: CommunityPartSlug[] }) {
  useEffect(() => {
    const anchor = decodeURIComponent(window.location.hash.slice(1));
    if (!anchor || document.getElementById(anchor)) return;
    const part = communityPartForAnchor(anchor);
    if (part && parts.includes(part)) window.location.replace(`${communityPartHref(id, part)}#${encodeURIComponent(anchor)}`);
  }, [id, parts]);
  return null;
}
