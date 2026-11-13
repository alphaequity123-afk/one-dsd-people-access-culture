import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { ResourceDocument } from "./model";
vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: vi.fn(async () => "dsd") }));
vi.mock("@/lib/downloads/resolve", () => ({ resolveDownloadDocument: vi.fn() }));
vi.mock("@/lib/downloads/exporters/pdf", () => ({ renderPdf: vi.fn(async () => Buffer.from("%PDF-test")) }));
import { requestedContentScope } from "@/lib/product/request-context";
import { resolveDownloadDocument } from "./resolve";
import { renderPdf } from "./exporters/pdf";
import { GET, HEAD } from "@/app/api/downloads/[kind]/[id]/route";

const document: ResourceDocument = { title: "Published resource", meta: [], sections: [{blocks:[{kind:"paragraph",runs:[{text:"Published substantive content."}]}]}], attribution: "Program" };
const request = (format = "pdf", method = "GET") => new NextRequest(`https://public.example/api/downloads/library/resource?format=${format}`, {method});
const context = (kind = "library", id = "resource") => ({params:Promise.resolve({kind,id})});
afterEach(() => { vi.resetAllMocks(); });

it.each([["library","ref-one-dsd-three-year-plan","pdf",410],["unknown","resource","pdf",404],["library","resource","invalid",400]] as const)("applies the same early guard to HEAD and GET (%s / %s / %s)", async (kind,id,format,status) => {
  expect((await HEAD(request(format,"HEAD"),context(kind,id))).status).toBe(status);
  expect((await GET(request(format),context(kind,id))).status).toBe(status);
  expect(resolveDownloadDocument).not.toHaveBeenCalled();
  expect(renderPdf).not.toHaveBeenCalled();
});
it("does not report a draft, absent, or inaccessible resource as downloadable", async () => {
  vi.mocked(resolveDownloadDocument).mockResolvedValue(null);
  for (const handler of [HEAD,GET]) expect((await handler(request(),context())).status).toBe(404);
  expect(renderPdf).not.toHaveBeenCalled();
});
it("uses the same requested scope and document resolution without rendering HEAD", async () => {
  vi.mocked(requestedContentScope).mockResolvedValue("dsd");
  vi.mocked(resolveDownloadDocument).mockResolvedValue(document);
  const head = await HEAD(request("pdf","HEAD"),context());
  expect(head.status).toBe(200);
  expect(await head.text()).toBe("");
  expect(head.headers.get("content-type")).toBe("application/pdf");
  expect(head.headers.get("x-download-readiness")).toBe("available");
  expect(resolveDownloadDocument).toHaveBeenCalledWith("library","resource","dsd");
  expect(renderPdf).not.toHaveBeenCalled();
  vi.mocked(renderPdf).mockResolvedValue(Buffer.from("%PDF-test"));
  const get = await GET(request(),context());
  expect(get.status).toBe(200);
  expect(get.headers.get("content-disposition")).toBe(head.headers.get("content-disposition"));
  expect(await get.text()).toBe("%PDF-test");
});
it("reports a resolution failure consistently instead of claiming readiness", async () => {
  vi.mocked(resolveDownloadDocument).mockRejectedValue(new Error("publication unavailable"));
  const quiet = vi.spyOn(console,"error").mockImplementation(() => {});
  try { for (const handler of [HEAD,GET]) expect((await handler(request(),context())).status).toBe(503); }
  finally { quiet.mockRestore(); }
});
