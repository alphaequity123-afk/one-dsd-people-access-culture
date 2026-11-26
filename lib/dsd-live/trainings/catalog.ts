import { TRAININGS } from "./catalog.generated";
import type { Simulation, Training } from "./schema";

export const trainings = (): Training[] => TRAININGS;
export const trainingById = (id: string): Training | undefined => TRAININGS.find(t => t.id === id);

/** The version for a reader: their job family's own when it exists, else all staff. */
export function versionFor(t: Training, family: string | null, asked?: string | null): Simulation {
  return t.simulations.find(s => s.version === asked) ?? t.simulations.find(s => s.version === family) ?? t.simulations.find(s => s.version === "all-staff")!;
}
