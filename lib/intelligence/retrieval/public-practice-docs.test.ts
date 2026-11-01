import { describe, expect, it } from "vitest";
import { publicPracticeDocs } from "./public-practice-docs";
import { searchDocs } from "./search";

describe("public practice retrieval", () => {
  it("projects the actual public framework, policy and review guidance without user worksheet data", () => {
    const docs = publicPracticeDocs("dsd");
    expect(docs.map(item => item.href)).toEqual(expect.arrayContaining(["/equity-framework", "/equity-policy", "/equity-review/structural", "/practice/requirements"]));
    const policy = docs.find(item => item.href === "/equity-policy")!;
    expect(policy.text).toContain("official policy");
    expect(policy.authority).toBe("guidance");
    expect(searchDocs("requirements governing source evidence crosswalk", docs, { limit: 3 }).some(hit => hit.href === "/practice/requirements")).toBe(true);
    expect(docs.every(item => item.graphRelated?.length && item.evidenceRevisions?.[0].payloadHash)).toBe(true);
  });
});
