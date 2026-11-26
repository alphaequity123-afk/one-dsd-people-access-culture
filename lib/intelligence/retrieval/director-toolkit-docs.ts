import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { Doc } from "./search";

export const DIRECTOR_TOOLKIT_DOC_PREFIX = "public-director-toolkit-";

/** Retired by the owner on November 26, 2026; never expose old toolkit passages to Ask. */
export function directorToolkitDocs(_scope: StaffProgramScope): Doc[] { return []; }
