import { describe, expect, it, vi } from "vitest";
import { DOMAINS } from "@/lib/domains";
import { WORK_AREA_DOMAINS } from "@/lib/domains/surfaces";
import { WORK_AREAS } from "./work-areas";
import { workAreaStartingPoint } from "./work-origin";
import { canonicalDomainHref, DOMAIN_WORK_AREAS } from "./domain-hrefs";
import { canonicalStaffHref } from "./routes";
import { canonicalResourceHref } from "./resource-hrefs";

vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NOT_FOUND"); },
  permanentRedirect: (href: string) => { throw new Error(`REDIRECT:${href}`); },
}));
import LegacyDomainPage from "@/app/domains/[id]/page";

describe("domain bookmarks across the agency and practice zones", () => {
  it.each(DOMAINS.map(domain => domain.id))("routes %s to its existing primary work area without a loop", async id => {
    const area = DOMAIN_WORK_AREAS[id];
    const target = `/areas/work/${area}`;
    expect(WORK_AREAS.some(item => item.id === area)).toBe(true);
    expect(WORK_AREA_DOMAINS[area]).toContain(id);
    expect(workAreaStartingPoint(area)?.origin.area).toBe(id);
    for (const source of [`/domains/${id}`, `/areas/${id}`]) {
      expect(canonicalDomainHref(source)).toBe(target);
      expect(canonicalStaffHref(source)).toBe(target);
      expect(canonicalResourceHref(source)).toBe(target);
      expect(canonicalDomainHref(source + "?learningPath=example&family=supervisors#tasks")).toBe(target + "?learningPath=example&family=supervisors#tasks");
    }
    expect(canonicalDomainHref(target)).toBe(target);
    expect(canonicalStaffHref(target)).toBe(target);
    await expect(LegacyDomainPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({ area: id, tag: ["one", "two"] }) }))
      .rejects.toThrow(`REDIRECT:${target}?area=${id}&tag=one&tag=two`);
  });
  it("leaves agency areas, unknown routes, external URLs and nested paths alone", () => {
    for (const href of ["/areas/dsd", "/areas/adsa", "/areas/unknown", "/domains/unknown", "/domains/workforce/extra", "https://example.org/domains/workforce", "//example.org/domains/workforce"])
      expect(canonicalDomainHref(href)).toBe(href);
  });
  it("retains not-found behavior for an unknown bookmarked domain", async () => {
    await expect(LegacyDomainPage({ params: Promise.resolve({ id: "unknown" }) })).rejects.toThrow("NOT_FOUND");
  });
});
