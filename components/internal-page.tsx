"use client";

import { usePathname } from "next/navigation";
import { internalPage, pageArea } from "@/lib/program/page-purpose";

export function InternalPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!internalPage(pathname)) return <>{children}</>;
  const area = pageArea(pathname);
  // Community pages keep their own color while sitting in the Support area of the menu.
  const tone = /^\/(minnesota-communities|employee-resource-groups|community-outreach|communities)(?:\/|$)/.test(pathname) ? "communities" : area;
  // Owner decision 2026-11-22: no "More in …" row; the One DSD menu is the only navigation.
  return <div className="internal-page" data-page-purpose={area} data-tone={tone}>
    {children}
  </div>;
}
