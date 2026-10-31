/** The one personal progression path. Levels are guidance, not gates: anyone can open anything. */
export const PROGRESSION_LEVELS = [
  { id: "oriented", number: 1, title: "Getting oriented", fits: "You are new to DSD, or new to equity work, and want to understand what the program offers and where authority for decisions sits" },
  { id: "foundations", number: 2, title: "Foundations", fits: "You are building a shared language with colleagues: how to talk about equity, access and bias clearly and without labeling people" },
  { id: "applying", number: 3, title: "Applying", fits: "You are bringing equity into real decisions: an analysis, an engagement plan, a hiring process, a service change" },
  { id: "leading", number: 4, title: "Leading and sustaining", fits: "You are shaping systems or helping others grow: tracing structural barriers, building accountability without surveillance, mentoring" },
] as const;

export type ProgressionLevelId = typeof PROGRESSION_LEVELS[number]["id"];

export function progressionLevel(id: ProgressionLevelId) {
  return PROGRESSION_LEVELS.find(level => level.id === id)!;
}
