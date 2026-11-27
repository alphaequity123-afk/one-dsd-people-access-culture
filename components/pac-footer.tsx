import Link from "@/components/app-link";
import "./pac-footer.css";

/** Owner decision 2026-11-22: navy footer with a thin DHS-green top line on every page. Same markup and links as the One DSD front door's SiteFooter; keep the two identical. */
const EXPLORE = [
  { href: "/learn", label: "Learn" },
  { href: "/learn/leadership", label: "Leadership" },
  { href: "/library", label: "Library" },
  { href: "/minnesota-communities", label: "Communities" },
  { href: "/calendar", label: "Culture Calendar" },
  { href: "/audio-library", label: "Audio library" },
];
const HELP = [
  { href: "/equity-centered-practice", label: "Equity-centered practice" },
  { href: "/start", label: "Begin with equity" },
  { href: "/user-guide", label: "How to use this site" },
  { href: "/support", label: "Support" },
  { href: "/about", label: "About" },
  { href: "/program-foundation", label: "Program charter" },
  { href: "/site-map", label: "Site map" },
];

const DSD_DESCRIPTION = "Learning, guidance and tools for equity in the work and workplace of the Disability Services Division.";
const DHS_DESCRIPTION = "Learning, guidance and practical tools to support equity in the work of the Minnesota Department of Human Services.";

/** Without a name, the footer follows the front door it is shown through (One DHS by default, One DSD on a One DSD address), like the agency header. */
export function PacFooter({ name, description }: { name?: string; description?: string }) {
  const brand = name
    ? <><strong>{name}</strong><p>{description ?? DSD_DESCRIPTION}</p></>
    : <><strong><span className="pac-unit-dhs">One DHS</span><span className="pac-unit-dsd">One DSD</span> People, Access and Culture</strong>
      <p><span className="pac-unit-dhs">{description ?? DHS_DESCRIPTION}</span><span className="pac-unit-dsd">{description ?? DSD_DESCRIPTION}</span></p></>;
  return <footer className="pac-footer">
    <div className="pac-footer-inner">
      <div className="pac-footer-brand">{brand}</div>
      <nav aria-label="Explore"><h2>Explore</h2><ul>{EXPLORE.map(l => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul></nav>
      <nav aria-label="Help and program information"><h2>Help and information</h2><ul>{HELP.map(l => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul></nav>
    </div>
    <div className="pac-footer-base"><p>Property of Gary Banks</p></div>
  </footer>;
}
