import { expect, it, vi } from "vitest";

vi.mock("@/lib/content/external-readings", () => ({
  EXTERNAL_READINGS: [
    { id: "retained", title: "Reviewed public guidance", original: "https://example.org/removed" },
    { id: "missing", title: "Missing reading", original: "https://example.org/missing" },
  ],
  unavailableExternalUrl: () => true,
}));
vi.mock("@/lib/content/external-reading-body", () => ({
  loadExternalReading: async (id: string) => id === "retained" ? {
    id, checkedAt: "2026-11-13", sections: [{ title: "Reading", html: "<p>Preserved substantive public guidance.</p>" }],
  } : null,
}));
import { sourceReadingDocs } from "./source-reading-docs";

it("retains a complete approved local reading when only its original website disappears", async () => {
  const docs = await sourceReadingDocs();
  expect(docs).toHaveLength(1);
  expect(docs[0]).toMatchObject({ href: "/source-reading/retained", text: "Preserved substantive public guidance.", reviewDate: "2026-11-13", graphRelated: ["/source-reading/retained", "https://example.org/removed"] });
  expect(docs[0].evidenceRevisions?.[0].payloadHash).toMatch(/^[a-f0-9]{64}$/);
});
