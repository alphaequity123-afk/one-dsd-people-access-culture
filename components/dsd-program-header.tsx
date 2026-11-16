"use client";
import Link from "@/components/app-link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PRIMARY_SECTIONS, pageArea } from "@/lib/program/page-purpose";
import { stageForPath } from "@/lib/program/dsd-logic-model";
import { SiteSearch } from "@/components/site-search";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";
import "./dsd-header-tools.css";
import { agencyZoneEnabled, agencyHref } from "@/lib/program/agency-zone";

const AskClient = dynamic(() => import("@/components/ask-client").then(module => module.AskClient), {
  loading: () => <p role="status">Opening Ask…</p>,
});

type Tool = "ask" | "search";
type HeaderProps = {
  culturalIntelligenceAvailable?: boolean;
  ask?: { copy: EditableSurfaceValues; researchAvailable: boolean };
};

export function DsdProgramHeader(props: HeaderProps = {}) {
  const pathname = usePathname();
  return <Header key={pathname} pathname={pathname} {...props} />;
}

function Header({ pathname, culturalIntelligenceAvailable = false, ask }: HeaderProps & { pathname: string }) {
  const active = stageForPath(pathname);
  const area = pathname === "/" || pathname === "/home" ? undefined : pageArea(pathname);
  const divisionPage = pathname === "/one-dsd" || pathname.startsWith("/one-dsd/");
  const collectionPage = pathname === "/learn/cultural-intelligence" || pathname.startsWith("/learn/cultural-intelligence/") || pathname === "/community-outreach" || pathname.startsWith("/community-outreach/");
  const themeCollectionPage = pathname === "/collections" || pathname.startsWith("/collections/");
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [compose, setCompose] = useState(true);
  const menu = useRef<HTMLButtonElement>(null);
  const askButton = useRef<HTMLButtonElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const [draft, setDraft] = useState("");

  function toggleTool(name: Tool) {
    if (tool === "ask") {
      const field = panel.current?.querySelector("textarea");
      if (field) setDraft(field.value);
    }
    if (tool === name) {
      setTool(null);
      (name === "ask" ? askButton : searchButton).current?.focus();
      return;
    }
    setOpen(false);
    setCompose(true);
    setTool(name);
  }

  useEffect(() => {
    const section = panel.current;
    if (!tool || !section) return;
    const focusField = () => {
      const field = section.querySelector<HTMLElement>("textarea, input[type=search]");
      if (!field) return false;
      field.focus({ preventScroll: true });
      return true;
    };
    if (focusField()) return;
    section.focus({ preventScroll: true });
    const observer = new MutationObserver(() => {
      if (document.activeElement === section && focusField()) observer.disconnect();
    });
    observer.observe(section, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [tool]);

  return <header className="dsd-header" onKeyDown={event => {
    if (event.key !== "Escape") return;
    if (tool) { event.preventDefault(); toggleTool(tool); }
    else if (open) { setOpen(false); menu.current?.focus(); }
  }}>
    {agencyZoneEnabled ? <nav className="dsd-shell dsd-breadcrumb" aria-label="Agency location"><a href={agencyHref("/")}>One DHS People, Access and Culture</a><span aria-hidden="true"> · </span><a href={agencyHref("/areas/adsa")}>Aging and Disability Services</a><span aria-hidden="true"> · </span><a href={agencyHref("/areas/dsd")}>Disability Services Division</a></nav> : null}
    <div className="dsd-shell dsd-brand-row">
      <Link href="/home" className="dsd-brand" aria-label="One DSD People, Access and Culture home">
        <Image src="/images/dhs-logo.png" width={319} height={68} alt="Minnesota Department of Human Services" priority />
        <span><strong>One DSD</strong><span>People, Access and Culture</span></span>
      </Link>
      <div className="dsd-utilities">
        {ask ? <button ref={askButton} type="button" className="dsd-tool-button" aria-controls="dsd-ask-panel" aria-expanded={tool === "ask"} onClick={() => toggleTool("ask")}>Ask</button> : <Link className="dsd-tool-link" href="/ask">Ask</Link>}
        <button ref={searchButton} type="button" className="dsd-tool-button" aria-controls="dsd-search-panel" aria-expanded={tool === "search"} onClick={() => toggleTool("search")}>Search</button>
        <button ref={menu} type="button" aria-controls="dsd-navigation" aria-expanded={open} onClick={() => {
          if (tool) { toggleTool(tool); menu.current?.focus(); }
          setOpen(!open);
        }} className="dsd-menu">Menu</button>
      </div>
    </div>
    <nav id="dsd-navigation" aria-label="Program" className={`dsd-nav ${open ? "is-open" : ""}`}>
      <div className="dsd-shell">{PRIMARY_SECTIONS.map(([label, href, section]) => <Link key={href} href={href} data-tone={section} aria-current={pathname === href ? "page" : !collectionPage && (area === section || (section === "learn" && themeCollectionPage)) ? "location" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}{culturalIntelligenceAvailable ? <Link href="/learn/cultural-intelligence" data-tone="communities" aria-current={pathname === "/learn/cultural-intelligence" ? "page" : collectionPage ? "location" : undefined} onClick={() => setOpen(false)}>Cultural Intelligence</Link> : null}<Link className="dsd-mobile-utility" href="/my-work" onClick={() => setOpen(false)}>My work</Link><Link className="dsd-mobile-utility" href="/leading" onClick={() => setOpen(false)} title="For leaders, supervisors, managers, and directors">Leadership</Link></div>
    </nav>
    <section id="dsd-ask-panel" ref={tool === "ask" ? panel : undefined} hidden={tool !== "ask"}
      tabIndex={-1} className="dsd-tool-panel" aria-label="Ask a question"
      data-compose={compose} onSubmitCapture={() => setCompose(false)}>
      {tool === "ask" && ask ? <div className="dsd-shell">
        <div className="dsd-tool-heading"><h2>Ask a question</h2><button type="button" onClick={() => toggleTool("ask")}>Close Ask</button></div>
        <AskClient compact initialQuestion={draft} researchAvailable={ask.researchAvailable} intakeEnabled={false} copy={ask.copy} />
      </div> : null}
    </section>
    <section id="dsd-search-panel" ref={tool === "search" ? panel : undefined} hidden={tool !== "search"}
      tabIndex={-1} className="dsd-tool-panel" aria-label="Search One DSD">
      <div className="dsd-shell">
        <div className="dsd-tool-heading"><h2>Search resources</h2><button type="button" onClick={() => toggleTool("search")}>Close Search</button></div>
        <SiteSearch />
      </div>
    </section>
    {divisionPage ? <nav className="dsd-shell dsd-breadcrumb" aria-label="Division location"><Link href="/understanding-dhs">DHS</Link><span aria-hidden="true"> · </span><Link href="/administrations/adsa">Aging and Disability Services Administration</Link><span aria-hidden="true"> · </span><Link href="/one-dsd" aria-current={pathname === "/one-dsd" ? "page" : undefined}>One DSD</Link></nav> : active && !pathname.startsWith("/program/") ? <div className="dsd-shell dsd-breadcrumb"><Link href={`/program/${active.slug}`}>{active.label}</Link></div> : null}
  </header>;
}
