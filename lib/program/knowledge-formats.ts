import type { Tier } from "@/lib/program/catalog";

/** Client-safe parts of the Knowledge browser index: the browser component imports these, so nothing here may reach server-only modules. */
export const FORMATS = ["course", "guide", "reading", "policy", "audio"] as const;
export type Format = (typeof FORMATS)[number];
export const FORMAT_LABEL: Record<Format, string> = { course: "Course", guide: "Guide", reading: "Reading", policy: "Policy reference", audio: "Audio" };

export type LearningPath = { id: string; title: string };
/** Compact rows: [title, href, format, tier, path ids]. Kept short because the whole list is sent to the browser. */
export type KnowledgeRow = [string, string, Format, Tier, string[]];
