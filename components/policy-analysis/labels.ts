// Plain-language labels and small shared types for the Equity Policy Analyzer screens.
// Every visible word here follows the owner rules: names in full, no acronyms,
// and "the person or area responsible" for a responsible party.

import type { ChangeType, DecisionOutcome } from "@/lib/policy-analysis/contract";

/** A slim, client-safe view of one catalog policy. Built on the server page from lib/content/hub/dsd-policies.ts. */
export type CatalogPolicy = {
  id: string;
  title: string;
  kind: string;
  kindLabel: string;
  summary: string;
  programs: string[];
  tags: string[];
  sourceTitle: string;
  sourceUrl: string;
  /** Already written out in words, for example "February 1, 2026". */
  sourceDate: string;
};

export type CatalogKind = { id: string; title: string };

/** Question prompts from the policy review instrument, keyed by question id. */
export type QuestionLabels = Record<string, { prompt: string; stage: string; stageOrder: number }>;

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  "policy-wording": "Policy wording change",
  protocol: "Protocol change",
  process: "Process change",
  procedure: "Procedure change",
  training: "Training change",
  data: "Data change",
  engagement: "Engagement change",
};

export const STATUS_LABELS: Record<"draft" | "review" | "final", string> = {
  draft: "Draft",
  review: "Waiting for decisions",
  final: "Formalized",
};

export const ANSWER_KIND_LABELS: Record<"evidence" | "inference" | "gap", string> = {
  evidence: "From the sources",
  inference: "Reasoned from the sources",
  gap: "Missing information",
};

export const EFFORT_LABELS: Record<"low" | "medium" | "high", string> = {
  low: "Low effort",
  medium: "Medium effort",
  high: "High effort",
};

export const OUTCOME_LABELS: Record<DecisionOutcome, string> = {
  approved: "Approved",
  rejected: "Rejected",
  deferred: "Deferred",
};

export const OUTCOME_ACTIONS: Record<DecisionOutcome, string> = {
  approved: "Approve",
  rejected: "Reject",
  deferred: "Defer",
};

export const ROLE_NAMES: Record<"consultant" | "team", string> = {
  consultant: "Equity and Inclusion Operations Consultant",
  team: "One DSD Team",
};

/** "language-access" -> "Language access". Used for principle ids until a label list is supplied. */
export function humanizeId(value: string): string {
  const words = value.replace(/[._:-]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : value;
}

/** ISO date-time or YYYY-MM-DD -> "November 5, 2026". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const day = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(day ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", ...(day ? { timeZone: "UTC" } : {}) });
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
