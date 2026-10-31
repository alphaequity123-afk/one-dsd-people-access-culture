/** Pure availability policy. Input titles are never exposed until every applicable surface is available. */
export type CommunityEntry = { id: string; seedTitle: string; rawTitle: string | null; hasBrief: boolean; hasReading: boolean; standingTribalDeference: boolean };
export type CommunitySurface = { available: boolean; title: string };
export type AvailableCommunity = { id: string; title: string; href: string; standingTribalDeference: boolean };
export type CommunityListDependencies<Scope> = {
  parentAvailable(scope: Scope, surfaceId: "communities.index"): Promise<boolean>;
  entries(): CommunityEntry[];
  brief(scope: Scope, id: string): Promise<CommunitySurface>;
  reading(scope: Scope, id: string): Promise<CommunitySurface>;
};

/** Fail closed for each optional item if its published status cannot be resolved. */
export async function assembleAvailableCommunities<Scope>(scope: Scope, deps: CommunityListDependencies<Scope>): Promise<AvailableCommunity[]> {
  // Callers gate on their own parent: the hub and the intercultural curriculum publish separately.
  if (!await deps.parentAvailable(scope, "communities.index")) return [];
  const results = await Promise.all(deps.entries().map(async (entry): Promise<AvailableCommunity | null> => {
    try {
      if (!entry.hasBrief && !entry.hasReading) return null;
      const [brief, reading] = await Promise.all([
        entry.hasBrief ? deps.brief(scope, entry.id) : Promise.resolve(null),
        entry.hasReading ? deps.reading(scope, entry.id) : Promise.resolve(null),
      ]);
      if ((brief && !brief.available) || (reading && !reading.available)) return null;
      // Match CommunityDesignIndex: a changed structured title wins; otherwise use the reading title.
      const editedTitle = brief?.title;
      const title = editedTitle && editedTitle !== entry.rawTitle ? editedTitle : reading ? reading.title : entry.seedTitle;
      return { id: entry.id, title, href: `/minnesota-communities/${entry.id}`, standingTribalDeference: entry.standingTribalDeference };
    } catch {
      return null;
    }
  }));
  return results.filter((item): item is AvailableCommunity => item !== null);
}
