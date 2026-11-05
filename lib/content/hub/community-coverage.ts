import { COMMUNITY_CROSSWALK } from "./community-crosswalk";

// Short, plain description of the figures available for each community, for the
// leaders' coverage page. Native pages always read "None" (owner rule).
export const CROSSWALK_BY_ID: ReadonlyMap<string, string> = new Map(COMMUNITY_CROSSWALK.map(entry => [
  entry.communityId,
  entry.match === "exact" ? `Statewide figures (${entry.demographicCenterGroups.join(", ")})`
    : entry.match === "approximate" ? `Approximate: ${entry.demographicCenterGroups.join(", ")}`
    : "None",
]));
