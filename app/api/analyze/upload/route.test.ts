// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { uploadResponseSchema } from "@/lib/analysis/contract";

vi.mock("server-only", () => ({}));
const limiter = vi.hoisted(() => ({ consume: vi.fn() }));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRequestLimit: limiter.consume,
  rateLimitHeaders: () => ({ "retry-after": "60", "x-ratelimit-remaining": "0" }),
}));
import { POST } from "./route";

const ORIGIN = "http://localhost:8911";
const URL_ = `${ORIGIN}/api/analyze/upload`;

function multipart(form: FormData, origin = ORIGIN, extra: Record<string, string> = {}) {
  return new NextRequest(URL_, { method: "POST", headers: { origin, ...extra }, body: form });
}
function textFile(name: string, text: string) {
  const form = new FormData();
  form.append("file", new File([text], name, { type: "text/plain" }));
  return form;
}

beforeEach(() => {
  vi.stubEnv("PAC_PUBLIC_ORIGIN", ORIGIN);
  limiter.consume.mockReset();
  limiter.consume.mockResolvedValue({ allowed: true, remaining: 19, resetAt: new Date(Date.now() + 600000).toISOString() });
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("POST /api/analyze/upload", () => {
  it("rejects a cross-origin request before reading anything", async () => {
    const response = await POST(multipart(textFile("notes.txt", "hello"), "https://other.example"));
    expect(response.status).toBe(403);
    expect(limiter.consume).not.toHaveBeenCalled();
  });

  it("returns 429 with rate-limit headers when the allowance is used up", async () => {
    limiter.consume.mockResolvedValue({ allowed: false, remaining: 0, resetAt: new Date(Date.now() + 60000).toISOString() });
    const response = await POST(multipart(textFile("notes.txt", "hello")));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(limiter.consume).toHaveBeenCalledWith(expect.anything(), { scope: "staff-analyze-upload", limit: 20, windowSeconds: 600 });
  });

  it("rejects a request that is not multipart", async () => {
    const request = new NextRequest(URL_, { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify({ file: "x" }) });
    const response = await POST(request);
    expect(response.status).toBe(415);
  });

  it("rejects a second form field", async () => {
    const form = textFile("notes.txt", "hello");
    form.append("other", "value");
    const response = await POST(multipart(form));
    expect(response.status).toBe(400);
  });

  it("rejects an oversize declared length without reading the body", async () => {
    const request = new NextRequest(URL_, {
      method: "POST",
      headers: { origin: ORIGIN, "content-type": "multipart/form-data; boundary=abc", "content-length": String(30 * 1024 * 1024) },
      body: "--abc--\r\n",
    });
    const response = await POST(request);
    expect(response.status).toBe(413);
  });

  it("rejects a file with an unsupported extension", async () => {
    const response = await POST(multipart(textFile("notes.exe", "hello")));
    expect(response.status).toBe(415);
    const body = await response.json();
    expect(body.error).toContain("PDF");
  });

  it("accepts a small text file and returns the upload response shape with no-store headers", async () => {
    const response = await POST(multipart(textFile(" Meeting notes.txt ", "Line one\nLine two\n")));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    const body = uploadResponseSchema.parse(await response.json());
    expect(body.source.id).toMatch(/^upload-[0-9a-f-]{36}$/);
    expect(body.source.title).toBe("Meeting notes.txt");
    expect(body.source.text).toBe("Line one\nLine two");
    expect(body.note).toBeTruthy();
  });

  it("has no process-wide count, so one person's run of uploads never locks everyone else out", async () => {
    for (let attempt = 0; attempt < 25; attempt++) {
      const response = await POST(multipart(textFile(`notes-${attempt}.txt`, "Line one\n")));
      expect(response.status, `attempt ${attempt + 1}`).toBe(200);
    }
  });

  it("never logs file names or text", async () => {
    await POST(multipart(textFile("secret-plan.txt", "private words")));
    const logged = [...(console.info as unknown as { mock: { calls: unknown[][] } }).mock.calls, ...(console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls].flat().join(" ");
    expect(logged).not.toContain("secret-plan");
    expect(logged).not.toContain("private words");
  });
});
