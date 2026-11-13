import { z } from "zod";
import { paragraph, table, type ResourceDocument } from "@/lib/downloads/model";

/** Bounded data only: no executable code, macros, remote fetches or formulas. */
export const AskWorkDraftSchema = z.object({
  title: z.string().trim().min(1).max(160),
  format: z.enum(["docx", "xlsx"]),
  sections: z.array(z.object({
    heading: z.string().max(160),
    paragraphs: z.array(z.string().max(6000)).max(12),
    headers: z.array(z.string().max(160)).max(16),
    rows: z.array(z.array(z.string().max(2000)).max(16)).max(100),
  }).strict()).min(1).max(12),
}).strict();

export const AskWorkSourceSchema = z.object({ title: z.string().max(400), href: z.string().max(2000) }).strict();
export const AskWorkProductSchema = AskWorkDraftSchema.extend({ sources: z.array(AskWorkSourceSchema).max(60) }).strict();
export type AskWorkProduct = z.infer<typeof AskWorkProductSchema>;

export function usableWorkDraft(value: unknown): z.infer<typeof AskWorkDraftSchema> | undefined {
  const result = AskWorkDraftSchema.safeParse(value);
  if (!result.success) return undefined;
  const draft = result.data;
  if (JSON.stringify(draft).length > 80_000) return undefined;
  if (draft.sections.some(section => section.rows.some(row => !section.headers.length || row.length !== section.headers.length))) return undefined;
  if (!draft.sections.some(section => section.paragraphs.some(text => text.trim()) || section.rows.length)) return undefined;
  if (draft.format === "xlsx" && !draft.sections.some(section => section.headers.length && section.rows.length)) return undefined;
  return draft;
}

export function workProductDocument(work: AskWorkProduct, origin: string): ResourceDocument {
  return {
    title: work.title,
    meta: [{ label: "Status", value: "Working draft" }],
    attribution: "Prepared with Ask. Review and adapt for your work.",
    sections: work.sections.map(section => ({
      heading: section.heading || undefined,
      blocks: [...section.paragraphs.map(paragraph), ...(section.headers.length ? [table(section.headers, section.rows)] : [])],
    })),
    sources: work.sources.flatMap(source => {
      try {
        const url = new URL(source.href, origin);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return [];
        return [{ title: source.title, href: url.href }];
      } catch { return []; }
    }),
  };
}

/** Suggestions remain choices; they never initiate a request by themselves. */
export function cleanFollowUps(values: readonly string[], question: string): string[] {
  const seen = new Set([question.trim().toLocaleLowerCase()]);
  return values.map(value => value.trim()).filter(value => {
    const key = value.toLocaleLowerCase();
    if (!value || value.length > 240 || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}
