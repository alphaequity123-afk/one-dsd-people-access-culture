import { canonicalDomainHref } from "./domain-hrefs";
import { retiredFeatureDestination } from "@/lib/program/retired-features";
const LEGACY_STAFF_ROUTE_PREFIXES = [
  { legacy: "/domains", canonical: "/areas" },
  { legacy: "/resources", canonical: "/library" },
  { legacy: "/paths", canonical: "/practice" },
] as const;

export function canonicalStaffHref(href: string): string {
  const domain = canonicalDomainHref(href);
  if (domain !== href) return domain;
  const retired = retiredFeatureDestination(href);
  if (retired) return retired;
  if (href === "/guided-start") return "/start";
  if (href === "/my-view") return "/my-work";
  if (href === "/paths") return "/learn";

  for (const route of LEGACY_STAFF_ROUTE_PREFIXES) {
    if (href === route.legacy || href.startsWith(`${route.legacy}/`) || href.startsWith(`${route.legacy}?`) || href.startsWith(`${route.legacy}#`)) {
      return `${route.canonical}${href.slice(route.legacy.length)}`;
    }
  }
  return href;
}
