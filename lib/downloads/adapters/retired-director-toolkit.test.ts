import { describe, expect, it } from "vitest";
import { equityReviewDocument, EQUITY_REVIEW_IDS } from "./hub-review";
import RemovedDirectorToolkit from "@/app/equity-review/director-toolkit/page";
import RemovedDirectorToolkitTemplates from "@/app/equity-review/director-toolkit/templates/page";

describe("retired Equity Director Toolkit", () => {
  it("does not fall through to generic downloads in either program", async () => {
    for (const scope of ["dsd", "one-dhs"] as const) {
      expect(await equityReviewDocument("director-toolkit", scope)).toBeNull();
      expect(await equityReviewDocument("templates", scope)).toBeNull();
    }
    expect(EQUITY_REVIEW_IDS).not.toContain("director-toolkit");
    expect(EQUITY_REVIEW_IDS).not.toContain("templates");
    expect(EQUITY_REVIEW_IDS).toContain("equity-policy");
  });
  it("rejects direct page access", () => {
    expect(RemovedDirectorToolkit).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(RemovedDirectorToolkitTemplates).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
