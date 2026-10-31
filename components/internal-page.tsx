"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGE_AREAS, internalPage, pageArea } from "@/lib/program/page-purpose";

export function InternalPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!internalPage(pathname)) return <>{children}</>;
  const area = pageArea(pathname);
  const shared = pathname.startsWith("/share/");
  return <div className="internal-page" data-page-purpose={area}>
    {!shared && <nav className="internal-section-nav dsd-shell" aria-label={`${PAGE_AREAS[area].label} pages`}>
      {PAGE_AREAS[area].links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
    </nav>}
    {children}
  </div>;
}
