// Owner decision 2026-11-21: the course is retired; its related readings now sit under Culture at work in Learn.
export const WATER_RESOURCE_COLLECTION_PATH = "/learn#learn-culture-title";
export const WATER_RESOURCE_COLLECTION_TITLE = "Culture at work";

export const WATER_RESOURCE_COLLECTION_SOURCES = [
  { family: "water", title: "The Water We Swim In essay", resourcePath: "/learn/water-we-swim-in/essay" },
  { family: "american", title: "American Culture Brief", resourcePath: "/minnesota-communities/american/profile" },
  { family: "minnesota", title: "Minnesota Culture Brief", resourcePath: "/minnesota-communities/minnesota/profile" },
  { family: "toolkit", title: "DHS Equity Analysis Toolkit public companion", resourcePath: "/learn/equity-toolkit" },
] as const;

export type WaterCollectionFamily = typeof WATER_RESOURCE_COLLECTION_SOURCES[number]["family"];

export function waterCollectionSourceFamily(href: string): WaterCollectionFamily | undefined {
  const path = href.split(/[?#]/, 1)[0];
  if (/^\/learn\/water-we-swim-in\/essay\/[a-z0-9-]+$/.test(path)) return "water";
  if (path === "/minnesota-communities/american/profile") return "american";
  if (path === "/minnesota-communities/minnesota/profile") return "minnesota";
  if (href.includes("#podcast-")) return undefined;
  if (/^\/learn\/equity-toolkit(?:\/(?:practice|curriculum\/0[1-8]))?$/.test(path)) return "toolkit";
  return undefined;
}
