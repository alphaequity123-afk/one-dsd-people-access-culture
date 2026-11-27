import { describe, expect, it, vi } from "vitest";
import { externalSourceHref, unavailableExternalUrl, EXTERNAL_READINGS } from "./external-readings";

describe("reviewed publisher destinations", () => {
  it("repairs a moved DHS document and preserves a publisher fragment", () => {
    expect(externalSourceHref("https://edocs.mn.gov/forms/DHS-3825-ENG#page=2"))
      .toBe("https://edocs.dhs.state.mn.us/lfserver/Public/DHS-3825-ENG#page=2");
    expect(unavailableExternalUrl("https://edocs.mn.gov/forms/DHS-3825-ENG")).toBe(false);
  });

  it("keeps the same historical W3C edition when repairing a malformed citation", () => {
    expect(externalSourceHref("http://www.w3.org/TR/WAI%E2%80%93WEBCONTENT"))
      .toBe("https://www.w3.org/TR/WCAG10/");
  });

  it("omits confirmed missing publisher destinations without hiding blocked originals", () => {
    expect(externalSourceHref("https://www.beacon.org/White-Fragility-P1672.aspx")).toBeUndefined();
    const blocked = "https://openlibrary.org/works/OL1870578W";
    expect(externalSourceHref(blocked)).toBe(blocked);
    expect(unavailableExternalUrl(blocked)).toBe(false);
  });

  it("retains a complete local reading if its publisher later withdraws the original", async () => {
    const reading = EXTERNAL_READINGS[0];
    const { readingUrlKey } = await import("./external-readings");
    vi.doMock("@/data/source-readings/unavailable.json", () => ({ default: [readingUrlKey(reading.original)] }));
    vi.resetModules();
    const withdrawn = await import("./external-readings");
    expect(withdrawn.externalSourceHref(reading.original)).toBeUndefined();
    expect(withdrawn.externalReadingHref(reading.original)).toBe(`/source-reading/${reading.id}`);
    vi.doUnmock("@/data/source-readings/unavailable.json");
    vi.resetModules();
  });
});


it("applies the audited source replacements and retires only the missing click target", () => {
  expect(externalSourceHref("https://archive.mpr.org/search.q=bosnian")).toBe("https://archive.mpr.org/search?q=bosnian");
  expect(externalSourceHref("https://www.primewest.org/")).toBe("https://www.primewest.org/eligibility-benefits/programs");
  expect(externalSourceHref("https://www.nass.usda.gov/Publications/Todays_Reports/reports/tuky0925.pdf")).toContain("/cj82n825c/tuky0925.pdf");
  expect(externalSourceHref("https://www.kscmn.org/35th-anniversary")).toBeUndefined();
});
