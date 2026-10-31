import { NextResponse, type NextRequest } from "next/server";
import { ownerFromRequest } from "@/lib/auth/request";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedFormUrlEncoded } from "@/lib/http/request";
import { analysisExportSchema } from "@/lib/consultant-analysis/export-schema";
import { analysisReportHtml, analysisReportWord, type AnalysisReportInput } from "@/lib/consultant-analysis/report";

export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
let wordExports = 0;
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });

export async function POST(request: NextRequest) {
  if (!(await ownerFromRequest(request))) return error("Sign in to the Consultant Workspace before downloading.", 401);
  if (!isSameOriginMutation(request)) return error("Open the Consultant Workspace before downloading.", 403);
  // Form percent-encoding can triple UTF-8 size, especially for translated
  // material. Bound transport separately from the decoded working copy.
  const body = await readBoundedFormUrlEncoded(request, 8_000_000);
  if (!body.ok) return error(body.status === 413 ? "This working copy is too large to download at once. Use shorter source excerpts." : "This download request could not be read. Try again from the workspace.", body.status);
  if (body.value.getAll("format").length !== 1 || body.value.getAll("payload").length !== 1 || [...body.value.keys()].some(key => key !== "format" && key !== "payload")) return error("Choose a download format from the workspace.", 400);
  const format = body.value.get("format");
  if (!["html", "word", "json"].includes(format ?? "")) return error("Choose a supported download format.", 400);
  const payload = body.value.get("payload")!;
  if (Buffer.byteLength(payload, "utf8") > 2_000_000) return error("This working copy is too large to download at once. Use shorter source excerpts.", 413);
  let value: unknown;
  try { value = JSON.parse(payload); }
  catch { return error("This working copy could not be read. Your current work is unchanged.", 400); }
  const parsed = analysisExportSchema.safeParse(value);
  if (!parsed.success) return error("Some parts of this working copy could not be read. Your current work is unchanged.", 400);
  if (format === "word" && wordExports >= 2) return error("Two Word reports are being prepared. Please try again shortly.", 429);
  if (format === "word") wordExports++;
  try {
    const { gapResult, ...draft } = parsed.data;
    const report: AnalysisReportInput = { ...draft, sources: draft.analysis ? draft.analysisSources : draft.request.sources, gapResult: gapResult ?? null };
    const content = format === "json" ? JSON.stringify(draft, null, 2) : format === "html" ? analysisReportHtml(report) : await analysisReportWord(report);
    const type = format === "json" ? "application/json; charset=utf-8" : format === "html" ? "text/html; charset=utf-8" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const name = format === "json" ? "one-dsd-equity-analysis.json" : `one-dsd-analysis-report.${format === "html" ? "html" : "docx"}`;
    return new Response(content, { headers: { ...headers, "content-type": type, "content-disposition": `attachment; filename="${name}"`, "content-security-policy": "sandbox" } });
  } catch {
    return error("The file could not be prepared. Your current work is unchanged. Try another download format.", 500);
  } finally { if (format === "word") wordExports--; }
}
