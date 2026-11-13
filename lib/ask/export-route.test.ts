import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/intelligence/clone/config", () => ({ cloneAgentsEnabled: () => true }));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRequestLimit: async () => ({ allowed: true }) }));
vi.mock("@/lib/downloads/render", () => ({
  renderResourceDocument: vi.fn(async () => Buffer.from("test-document")),
  downloadContentType: () => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  downloadFileName: () => "working-draft.docx",
}));
import { renderResourceDocument } from "@/lib/downloads/render";
import { POST } from "@/app/api/ask/export/route";
const work = { title: "Draft", format: "docx", sections: [{ heading: "", paragraphs: ["A useful starting point."], headers: [], rows: [] }], sources: [{ title: "Reading", href: "/learn" }] };
const request = (body: unknown, origin = "https://public.example") => new NextRequest("http://internal:8080/api/ask/export", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("requires a matching public origin before rendering", async () => {
  vi.stubEnv("PAC_PUBLIC_ORIGIN", "https://public.example");
  expect((await POST(request(work, "https://other.example"))).status).toBe(403);
  expect(renderResourceDocument).not.toHaveBeenCalled();
});
it("rejects malformed work products", async () => {
  vi.stubEnv("PAC_PUBLIC_ORIGIN", "https://public.example");
  expect((await POST(request({ ...work, sections: [] }))).status).toBe(400);
  expect(renderResourceDocument).not.toHaveBeenCalled();
});
it("exports without caching and uses public links behind Railway's internal origin", async () => {
  vi.stubEnv("PAC_PUBLIC_ORIGIN", "https://public.example");
  const response = await POST(request(work));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("content-disposition")).toContain("attachment");
  expect(vi.mocked(renderResourceDocument).mock.calls[0][0].sources![0].href).toBe("https://public.example/learn");
});
