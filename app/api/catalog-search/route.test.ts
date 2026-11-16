// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { getPoliciesData } from "@/lib/content/hub/dsd-policies";
import { readings } from "@/lib/content/reading-collection";

function post(body: unknown) {
  return new NextRequest("https://example.test/api/catalog-search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

describe("catalog word search (words in the request body, never the address)", () => {
  it("returns the ids of matching policies and readings", async () => {
    const policy = getPoliciesData().policies[0];
    const policyIds = (await (await POST(post({ catalog: "policies", q: policy.title }))).json()).ids as string[];
    expect(policyIds).toContain(policy.id);
    const book = readings[0];
    const response = await POST(post({ catalog: "readings", q: book.title }));
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()).ids).toContain(book.id);
  });

  it("returns nothing for no words and refuses an unknown catalog or a non-JSON body", async () => {
    expect((await (await POST(post({ catalog: "readings", q: "   " }))).json()).ids).toEqual([]);
    expect((await POST(post({ catalog: "staff", q: "x" }))).status).toBe(400);
    const text = new NextRequest("https://example.test/api/catalog-search", { method: "POST", headers: { "content-type": "text/plain" }, body: "q=x" });
    expect((await POST(text)).status).toBe(415);
  });
});
