// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/auth/request", () => ({ ownerFromRequest: async (request: NextRequest) => request.headers.get("x-test-owner") === "yes" }));

const request = (owner: boolean) => new NextRequest("https://example.test/api/consultant/session", { headers: owner ? { "x-test-owner": "yes" } : {} });

describe("consultant session check", () => {
  it("answers 200 only for the consultant session", async () => {
    const response = await GET(request(true));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ consultant: true });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("gives everyone else an empty answer with no detail", async () => {
    const response = await GET(request(false));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
