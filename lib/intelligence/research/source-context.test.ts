import { describe, expect, it } from "vitest";
import { COMMUNITY_CONNECTIONS_SURFACE } from "@/lib/content/community-connections";
import { publicSourceMetadata, researchIdentityInstruction, researchSourceContext } from "./source-context";
import type { Doc } from "../retrieval/search";

const page: Doc = {
  id: "public-community-connections", kind: "content", type: "program_destination", status: "approved", scope: "dsd",
  title: "Community engagement: from input to action", href: "/learn/community-connections", authority: "practice_note",
  reviewDate: "", summary: "", text: "This full body must never reach the research provider.", tags: [], intents: [],
  publicResearchSources: publicSourceMetadata(COMMUNITY_CONNECTIONS_SURFACE.approvedValues),
};
const question = "For a Minnesota DSD staff member improving access to employment information, explain how DLI, DEED, Minnesota Management and Budget (MMB), and PACER could inform the work differently. Use a relevant application resource together with current official public sources. Cite both. Separate documented responsibilities from your suggested coordination, do not assume a contract or referral agreement.";

describe("public source identities for external research", () => {
  it("carries the actual published PACER transition source into the employment question", () => {
    const context = researchSourceContext(question, [page]);
    expect(context).toContainEqual({ title: "PACER: transition planning for families", url: "https://media.pacer.org/php/php-c157.pdf" });
    expect(context.some(source => source.url.includes("uscourts"))).toBe(false);
    expect(JSON.stringify(context)).not.toContain(page.text);
    expect(researchIdentityInstruction(context)).toContain("not verified evidence of current services, jurisdiction, contracts or partnerships");
  });

  it.each([
    "How do I use PACER to find federal court dockets?",
    "For a Minnesota DSD staff member, how do I use PACER (Public Access to Court Electronic Records) to download a federal court case?",
    "How much does https://pacer.uscourts.gov charge for court documents?",
    "What is PACER?",
    "Explain the rings of Saturn.",
  ])("does not impose a disability partner on a different or ambiguous subject: %s", other => {
    expect(researchSourceContext(other, [page])).toEqual([]);
  });

  it("matches public directory names and contextual aliases without sending bodies", () => {
    const agency: Doc = { ...page, type: "agency", status: "published", scope: "public", publicResearchSources: undefined,
      title: "Employment and Economic Development Department", href: "https://mn.gov/deed/", tags: ["DEED", "employment", "jobs"] };
    expect(researchSourceContext(question, [agency])).toEqual([{ title: agency.title, url: agency.href }]);
    expect(researchSourceContext("What is a deed for a house?", [agency])).toEqual([]);
    expect(researchSourceContext("What does the Employment and Economic Development Department do?", [agency])).toHaveLength(1);
  });

  it("excludes drafts, private documents, unavailable links and internal text", () => {
    expect(researchSourceContext(question, [{ ...page, status: "draft" }, { ...page, scope: "private" }])).toEqual([]);
    const metadata = publicSourceMetadata({
      employmentLinks: [{ label: "PACER: transition planning for families", href: "https://media.pacer.org/php/php-c157.pdf", body: "Private discussion is not link metadata." }],
      unpublishedText: "not projected", badLinks: [
        { label: "PACER internal", href: "http://localhost:3000/private" },
        { label: "PACER credential", href: "https://example.org/private?api_key=secret" },
        { label: "PACER private", href: "http://192.168.1.1/private" },
      ],
    });
    expect(metadata).toHaveLength(1);
    expect(JSON.stringify(metadata)).not.toContain("Private discussion");
    expect(JSON.stringify(metadata)).not.toContain("not projected");
    const serialized = researchIdentityInstruction([{ title: "PACER", url: "https://www.pacer.org/", text: "Never serialize extra context" } as never]);
    expect(serialized).not.toContain("Never serialize");
    expect(serialized).toContain("Follow the user's explicit subject");
  });
});
