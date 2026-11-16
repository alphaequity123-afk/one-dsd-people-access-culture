import "server-only";
import { TRAININGS } from "./catalog.generated";
import type { Simulation, Training } from "./schema";

/** Built trainings (data/trainings/built), bundled with the server through the generated module. */
export const trainings = (): Training[] => TRAININGS;
export const trainingById = (id: string): Training | undefined => TRAININGS.find(t => t.id === id);

/** The version for a reader: the one asked for, else their job family's own when it exists, else all staff. */
export function versionFor(t: Training, family: string | null, asked?: string | null): Simulation {
  return t.simulations.find(s => s.version === asked) ?? t.simulations.find(s => s.version === family) ?? t.simulations.find(s => s.version === "all-staff")!;
}
