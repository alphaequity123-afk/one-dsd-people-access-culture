import Link from "@/components/app-link";
import "./pac-footer.css";

/** Owner decision 2026-11-22: navy footer with a thin DHS-green top line on every page. Same markup and links as the One DSD front door's SiteFooter; keep the two identical. */
// v2 rebuild (2026-11-25): the footer follows the four pillars; About, help, support and the charter share one page.
const EXPLORE = [
  { href: "/practice", label: "Practice" },
  { href: "/leadership", label: "Leadership" },
  { href: "/communities", label: "Communities" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/people-and-growth", label: "People and Growth" },
  { href: "/minnesota-communities/calendar", label: "Culture Calendar" },
  { href: "/audio-library", label: "Audio library" },
];
const HELP = [
  { href: "/start", label: "Begin here" },
  { href: "/about", label: "About and help" },
  { href: "/about#how-to-use", label: "How to use this site" },
  { href: "/about#charter", label: "Program charter" },
  { href: "/site-map", label: "Site map" },
];

export function PacFooter({ name = "One DSD People, Access and Culture", description = "Learning, guidance and tools for equity in the work and workplace of the Disability Services Division." }: { name?: string; description?: string }) {
  return <footer className="pac-footer">
    <div className="pac-footer-inner">
      <div className="pac-footer-brand"><strong>{name}</strong><p>{description}</p></div>
      <nav aria-label="Explore"><h2>Explore</h2><ul>{EXPLORE.map(l => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul></nav>
      <nav aria-label="Help and program information"><h2>Help and information</h2><ul>{HELP.map(l => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul></nav>
    </div>
    <div className="pac-footer-base"><p>Property of Gary Banks</p></div>
  </footer>;
}
