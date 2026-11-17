/** Keep Native community links unchanged; other briefs can carry a general question to Ask. */
export function communityAskHref(id: string, native: boolean, part?: string) {
  if (native) return "/ask";
  const query = new URLSearchParams({ community: id });
  if (part) query.set("communityPart", part);
  return `/ask?${query.toString()}`;
}
