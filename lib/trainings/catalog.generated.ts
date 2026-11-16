// Written by scripts/trainings/assemble.ts. Do not edit.
import type { Training } from "./schema.ts";
import t0 from "../../data/trainings/built/cultural-humility.json" with { type: "json" };
import t1 from "../../data/trainings/built/psychological-safety.json" with { type: "json" };
export const TRAININGS: Training[] = [t0 as unknown as Training, t1 as unknown as Training];
