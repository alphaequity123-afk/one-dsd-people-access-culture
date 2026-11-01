"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { PRIMARY_SECTIONS, pageArea } from "@/lib/program/page-purpose";
import { stageForPath } from "@/lib/program/dsd-logic-model";

export function DsdProgramHeader({ culturalIntelligenceAvailable = false }: { culturalIntelligenceAvailable?: boolean } = {}) {
  const pathname = usePathname();
  const active = stageForPath(pathname);
  const area = pathname === "/" || pathname === "/home" ? undefined : pageArea(pathname);
  const divisionPage = pathname === "/one-dsd" || pathname.startsWith("/one-dsd/");
  const collectionPage = pathname === "/learn/cultural-intelligence" || pathname.startsWith("/learn/cultural-intelligence/");
  const themeCollectionPage = pathname === "/collections" || pathname.startsWith("/collections/");
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLButtonElement>(null);
  return <header className="dsd-header" onKeyDown={event => {
    if (event.key === "Escape" && open) { setOpen(false); menu.current?.focus(); }
  }}>
    <div className="dsd-shell dsd-brand-row">
      <Link href="/home" className="dsd-brand" aria-label="One DSD People, Access and Culture home">
        <Image src="/images/dhs-logo.png" width={319} height={68} alt="Minnesota Department of Human Services" priority />
        <span><strong>One DSD</strong><span>People, Access and Culture</span></span>
      </Link>
      <div className="dsd-utilities"><Link href="/my-work" aria-current={pathname === "/my-work" ? "page" : undefined}>My work</Link><Link href="/leading" aria-current={pathname === "/leading" ? "page" : pathname.startsWith("/leading/") ? "location" : undefined}>For leaders, supervisors, managers, and directors</Link>
        <button ref={menu} aria-controls="dsd-navigation" aria-expanded={open} onClick={() => setOpen(!open)} className="dsd-menu">{open ? "Close" : "Menu"}</button>
      </div>
    </div>
    <nav id="dsd-navigation" aria-label="Program" className={`dsd-nav ${open ? "is-open" : ""}`}>
      <div className="dsd-shell">{PRIMARY_SECTIONS.map(([label, href, section]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : !collectionPage && !themeCollectionPage && area === section ? "location" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}<Link href="/collections" aria-current={pathname === "/collections" ? "page" : themeCollectionPage ? "location" : undefined} onClick={() => setOpen(false)}>Themes and collections</Link>{culturalIntelligenceAvailable ? <Link href="/learn/cultural-intelligence" aria-current={pathname === "/learn/cultural-intelligence" ? "page" : collectionPage ? "location" : undefined} onClick={() => setOpen(false)}>Cultural Intelligence</Link> : null}<Link className="dsd-mobile-utility" href="/my-work" onClick={() => setOpen(false)}>My work</Link><Link className="dsd-mobile-utility" href="/leading" onClick={() => setOpen(false)}>For leaders, supervisors, managers, and directors</Link></div>
    </nav>
    {divisionPage ? <nav className="dsd-shell dsd-breadcrumb" aria-label="Division location"><Link href="/understanding-dhs">DHS</Link><span aria-hidden="true"> · </span><Link href="/administrations/adsa">Aging and Disability Services Administration</Link><span aria-hidden="true"> · </span><Link href="/one-dsd" aria-current={pathname === "/one-dsd" ? "page" : undefined}>One DSD</Link></nav> : active && !pathname.startsWith("/program/") ? <div className="dsd-shell dsd-breadcrumb"><Link href={`/program/${active.slug}`}>{active.label}</Link></div> : null}
  </header>;
}
