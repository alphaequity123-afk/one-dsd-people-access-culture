/** Exact earlier destinations retained after their content moved to dedicated pages. */
export const LEGACY_RESOURCE_DESTINATIONS: Readonly<Record<string, string>> = {
  "/learn#start-here": "/learn/core-15",
  "/learn#orientation": "/start#new-to-dsd",
  "/learn#foundations": "/learn/paths#level-foundations",
  "/learn#intercultural-practice": "/learn/paths#level-applying",
  "/learn#application": "/learn/paths#level-applying",
  "/learn#systems-practice": "/learn/paths#level-leading",
  "/learn#leadership-continuity": "/learn/paths#level-leading",
  "/learn#podcast-anti-racism-public-service": "/podcasts/anti-racism-public-service",
  "/learn/equity-toolkit#podcast-equity-toolkit": "/podcasts/equity-toolkit",
  "/my-work#my-path-title": "/my-work?view=workspace#my-path-title",
  "/learn/paths#level-oriented": "/start#new-to-dsd",
};

export function canonicalResourceHref(href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const url = new URL(href, "https://one-dsd.invalid");
  // Filtered topic pages still use this anchor; the unfiltered page now links to Core 15.
  if (url.pathname === "/learn" && url.hash === "#start-here" && url.searchParams.has("theme")) return href;
  if (url.pathname === "/my-work" && url.searchParams.get("view") === "workspace") return href;
  const target = LEGACY_RESOURCE_DESTINATIONS[url.pathname + url.hash];
  if (!target) return href;
  const destination = new URL(target, url);
  const view = url.searchParams.get("view");
  if (view && !destination.searchParams.has("view")) destination.searchParams.set("view", view);
  return destination.pathname + destination.search + destination.hash;
}
