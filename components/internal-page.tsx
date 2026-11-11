"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGE_AREAS, internalPage, pageArea } from "@/lib/program/page-purpose";

export function InternalPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!internalPage(pathname)) return <>{children}</>;
  const area = pageArea(pathname);
  const shared = pathname.startsWith("/share/");
  // The section tabs move between a section's landing pages. A course, lesson, reading or
  // record already has the header and its own back link, so a third row of navigation there
  // only competes with the content.
  // The Ask page is a tool, not a section landing page, so it does not repeat the section row (owner decision, 2026-11-11).
  const landing = pathname !== "/ask" && PAGE_AREAS[area].links.some(([, href]) => href.split("#")[0] === pathname);
  return <div className="internal-page" data-page-purpose={area}>
    {!shared && landing && <nav className="internal-section-nav dsd-shell" aria-label={`${PAGE_AREAS[area].label} pages`}>
      {PAGE_AREAS[area].links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
    </nav>}
    {children}
  </div>;
}
