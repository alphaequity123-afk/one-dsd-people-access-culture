// Client calls for the Equity Policy Analyzer. Every response that carries a case is
// checked against the shared contract before the screen uses it.

import { policyCaseSchema, policySourceSchema, type PolicyCase, type PolicySource } from "@/lib/policy-analysis/contract";

export const API_BASE = "/api/equity-workspace/policy-analysis";
export const UPLOAD_URL = "/api/consultant/toolkit/upload";

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** A 409 that means the case changed somewhere else (not a step that is unavailable in the current state). */
export function isConflict(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409 && error.code !== "transition";
}

export type WorkspaceStatus = {
  role: "consultant" | "team";
  roleLabel: string;
  analysisAvailable: boolean;
  analysisUnavailableReason?: string | null;
  caseSavingAvailable: boolean;
  caseSavingUnavailableReason?: string | null;
};

export type CaseSummary = {
  id: string;
  version: number;
  status: "draft" | "review" | "final";
  title: string;
  policyTitle: string;
  catalogId?: string;
  recommendationCount: number;
  approvedCount: number;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
};

function fallbackMessage(status: number): string {
  if (status === 401) return "Your sign-in has ended. Sign in again to continue.";
  if (status === 403) return "Open this workspace from the program before making changes.";
  if (status === 404) return "That analysis could not be found. It may have been deleted.";
  if (status === 409) return "This analysis changed somewhere else.";
  if (status === 413) return "That is too much material to send at once.";
  if (status === 429) return "Too many requests at once. Wait a minute and try again.";
  return "This could not be completed. Your saved analysis is unchanged.";
}

async function readError(response: Response): Promise<ApiError> {
  let message = "";
  let code: string | undefined;
  try {
    const body = await response.json() as { error?: unknown; code?: unknown };
    if (typeof body.error === "string") message = body.error;
    if (typeof body.code === "string") code = body.code;
  } catch { /* not JSON */ }
  return new ApiError(message || fallbackMessage(response.status), response.status, code);
}

async function request<T>(path: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init?.method ?? "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: init?.body === undefined ? { accept: "application/json" } : { accept: "application/json", "content-type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init?.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("The workspace could not be reached. Check your connection and try again.", 0);
  }
  if (!response.ok) throw await readError(response);
  try {
    return await response.json() as T;
  } catch {
    throw new ApiError("The workspace sent a reply that could not be read.", response.status);
  }
}

function readCase(body: { case?: unknown }): PolicyCase {
  const parsed = policyCaseSchema.safeParse(body?.case);
  if (!parsed.success) throw new ApiError("The saved analysis could not be read. Reload the page and try again.", 500, "invalid_case");
  return parsed.data;
}

export const api = {
  status: (signal?: AbortSignal) => request<WorkspaceStatus>(API_BASE, { signal }),

  listCases: async (offset = 0) => {
    const body = await request<{ cases?: CaseSummary[]; nextOffset?: number | null }>(`${API_BASE}/cases?offset=${encodeURIComponent(String(offset))}`);
    return { cases: Array.isArray(body.cases) ? body.cases : [], nextOffset: typeof body.nextOffset === "number" ? body.nextOffset : null };
  },

  getCase: async (id: string) => readCase(await request(`${API_BASE}/cases/${encodeURIComponent(id)}`)),

  createCase: async (body: unknown) => readCase(await request(`${API_BASE}/cases`, { method: "POST", body })),

  updateCase: async (id: string, body: unknown) => readCase(await request(`${API_BASE}/cases/${encodeURIComponent(id)}`, { method: "PUT", body })),

  deleteCase: (id: string, expectedVersion: number) => request<{ ok: true }>(`${API_BASE}/cases/${encodeURIComponent(id)}`, { method: "DELETE", body: { expectedVersion } }),

  analyze: async (caseId: string, expectedVersion: number, step: "analysis" | "recommendations" | "both" = "both") =>
    readCase(await request(`${API_BASE}/analyze`, { method: "POST", body: { caseId, expectedVersion, step } })),

  sendForDecisions: async (caseId: string, expectedVersion: number) =>
    readCase(await request(`${API_BASE}/send-for-decisions`, { method: "POST", body: { caseId, expectedVersion } })),

  decide: async (body: unknown) => readCase(await request(`${API_BASE}/decide`, { method: "POST", body })),

  formalize: async (caseId: string, expectedVersion: number, documentTitle: string, decidingAs?: string) =>
    readCase(await request(`${API_BASE}/formalize`, { method: "POST", body: { caseId, expectedVersion, documentTitle, ...(decidingAs ? { decidingAs } : {}) } })),

  reopen: async (caseId: string, expectedVersion: number) =>
    readCase(await request(`${API_BASE}/reopen`, { method: "POST", body: { caseId, expectedVersion } })),

  fetchSource: async (catalogId: string): Promise<PolicySource> => {
    const body = await request<{ source?: unknown }>(`${API_BASE}/fetch-source`, { method: "POST", body: { catalogId } });
    const parsed = policySourceSchema.safeParse(body.source);
    if (!parsed.success) throw new ApiError("The official text could not be read. Try attaching the document instead.", 500);
    return parsed.data;
  },
};

/** Sends one file to the shared document reader and returns it as a source. */
export async function uploadDocument(file: File): Promise<{ source: { id: string; title: string; text: string }; note?: string }> {
  const form = new FormData();
  form.append("file", file);
  let response: Response;
  try {
    response = await fetch(UPLOAD_URL, { method: "POST", body: form, credentials: "same-origin", cache: "no-store" });
  } catch {
    throw new ApiError("The document could not be sent. Check your connection and try again.", 0);
  }
  if (!response.ok) throw await readError(response);
  const body = await response.json().catch(() => null) as { source?: { id?: unknown; title?: unknown; text?: unknown }; note?: unknown } | null;
  const source = body?.source;
  if (!source || typeof source.id !== "string" || typeof source.text !== "string") throw new ApiError("The document could not be read. Try pasting its text instead.", 500);
  return {
    source: { id: source.id, title: typeof source.title === "string" && source.title.trim() ? source.title : file.name, text: source.text },
    ...(typeof body?.note === "string" ? { note: body.note } : {}),
  };
}

export type ExportKind = "analysis" | "recommendations" | "decision-record" | "formal-policy-proposal";

/** Asks the server for a document and hands it to the browser as a download. */
export async function downloadExport(caseId: string, expectedVersion: number, kind: ExportKind, format: "docx" | "pdf"): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/export`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId, expectedVersion, kind, format }),
    });
  } catch {
    throw new ApiError("The download could not be prepared. Check your connection and try again.", 0);
  }
  if (!response.ok) throw await readError(response);
  const blob = await response.blob();
  const filename = filenameFrom(response.headers.get("content-disposition")) ?? `${kind}.${format}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function filenameFrom(header: string | null): string | null {
  if (!header) return null;
  const encoded = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(header);
  if (encoded) {
    try { return sanitizeFilename(decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ""))); } catch { /* fall through */ }
  }
  const plain = /filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/.exec(header);
  const value = plain?.[1] ?? plain?.[2]?.trim();
  return value ? sanitizeFilename(value) : null;
}

function sanitizeFilename(value: string): string | null {
  const name = value.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f]/g, "").trim();
  return name ? name.slice(0, 200) : null;
}
