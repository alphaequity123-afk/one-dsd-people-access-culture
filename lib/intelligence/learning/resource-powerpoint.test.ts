import { beforeEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import type { NextRequest } from "next/server";
import { GET, HEAD } from "@/app/api/consultant/resource-creation/[id]/file/route";
import type { ResourceArtifact } from "@/lib/learning/resource-artifact-types";

const fixture = vi.hoisted(() => ({ authorized: true, scope: "dsd", row: undefined as object | undefined }));
vi.mock("@/lib/auth/request", () => ({ ownerFromRequest: async () => fixture.authorized }));
vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: async () => fixture.scope }));
vi.mock("@/lib/learning/resource-creation-store", () => ({
  creationFileNames: {},
  creationJobId: /^[a-f0-9-]{36}$/,
  creationOutputDirectory: vi.fn(),
  findCreationJob: (_id: string, scope: string) => scope === "dsd" ? fixture.row : undefined,
}));

const id = "00000000-0000-0000-0000-000000000001";
const scope = { params: Promise.resolve({ id }) };
const url = `http://127.0.0.1:8080/api/consultant/resource-creation/${id}/file?kind=pptx&download=1`;
const request = Object.assign(new Request(url), { nextUrl: new URL(url) }) as NextRequest;
const artifact: Extract<ResourceArtifact, { kind: "slides" }> = {
  version: 1, kind: "slides", title: "Clear public notices", summary: "Plan a notice people can understand and use.",
  resourcePath: "/library/notice", sourceRevision: "a".repeat(64), createdAt: "2026-11-12T12:00:00Z",
  sources: [{ id: "notice", title: "Accessible notices", href: "/library/notice#access" }],
  sections: [{
    heading: "Check the next step", points: ["Use words people know", "State how to ask for help"],
    speakerNotes: "Ask a colleague to try following the next step.", sourceIds: ["notice"],
  }],
};

describe("owner-only editable PowerPoint download", () => {
  beforeEach(() => {
    fixture.authorized = true;
    fixture.scope = "dsd";
    fixture.row = { kind: "slides", status: "ready", artifact: JSON.stringify(artifact), revision: artifact.sourceRevision, resourcePath: artifact.resourcePath };
    vi.stubEnv("PAC_PUBLIC_ORIGIN", "https://pac.example.invalid");
  });
  it("returns a compressed editable Office archive with notes and live citation links", async () => {
    const result = await GET(request, scope);
    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("private, no-store");
    expect(result.headers.get("content-disposition")).toBe('attachment; filename="learning-slides-draft.pptx"');
    expect(result.headers.get("content-type")).toContain("presentationml.presentation");
    const bytes = await result.arrayBuffer();
    expect(Number(result.headers.get("content-length"))).toBe(bytes.byteLength);
    const zip = await JSZip.loadAsync(bytes);
    expect(zip.file("ppt/presentation.xml")).not.toBeNull();
    expect(await zip.file("ppt/slides/slide1.xml")?.async("text")).toContain("Clear public notices");
    expect(await zip.file("ppt/slides/slide2.xml")?.async("text")).toContain("Use words people know");
    expect(await zip.file("ppt/notesSlides/notesSlide2.xml")?.async("text")).toContain("Ask a colleague to try following the next step.");
    expect(await zip.file("ppt/slides/_rels/slide2.xml.rels")?.async("text")).toContain("https://pac.example.invalid/library/notice#access");
    expect(await zip.file("ppt/slides/slide3.xml")?.async("text")).toContain("Accessible notices");
    const metadata = await HEAD(request, scope);
    expect(metadata.status).toBe(200);
    expect((await metadata.arrayBuffer()).byteLength).toBe(0);
  });

  it("withholds the download from unauthenticated, wrong-scope, and stale requests", async () => {
    fixture.authorized = false;
    expect((await GET(request, scope)).status).toBe(401);
    fixture.authorized = true;
    fixture.scope = "one-dhs";
    expect((await GET(request, scope)).status).toBe(404);
    fixture.scope = "dsd";
    fixture.row = { ...fixture.row, revision: "b".repeat(64) };
    expect((await GET(request, scope)).status).toBe(404);
  });
});
