import Image from "next/image";
import Link from "@/components/app-link";
import { HeroMotion } from "./hero-motion";
import { HomeCommandCenter } from "@/components/home-command-center";
import { prepareAsk } from "@/app/ask/ask-view";
import { publishedCalendar } from "@/lib/content/cultural-calendar";
import { CALENDAR_PATH, chicagoToday, compactCalendar, shortDateRange, upcomingObservances } from "@/lib/content/culture-calendar-grid";
import "./live-home.css";

/**
 * Owner decision 2026-11-25: Home is the live One DSD landing page (one-dhs-pac, branch dsd/approved-20261121,
 * app/page.tsx), carried over as it appears there. Only the menu above it follows the five pillars.
 * Its pages were carried over too, so every link opens in this application.
 */
const LEADERSHIP = "/learn/leadership";

const pathways = [
  { image: "/images/pilot-home/learn.jpg", alt: "State staff of different ages and backgrounds talk around a table in a sunlit meeting room.", title: "Learn", description: "Find courses and learning pathways connected to your role, responsibilities and interests.", href: "/learn", action: "Open Learn" },
  { image: "/images/pilot-home/apply-a-tool.jpg", alt: "Four colleagues planning together around a table and arranging ideas on a board.", title: "Apply a tool", description: "Use guided tools to plan a meeting, examine a decision or improve a service.", href: "/practice/disability", action: "Open Practice" },
  { image: "/images/pilot-home/communities.jpg", alt: "Neighbors of different ages share food at a community meal.", title: "Communities", description: "Learn about Minnesota communities, their histories and perspectives, and considerations for working together.", href: "/minnesota-communities", action: "Open Communities" },
] as const;

/** Where each style tends to sit in relation to advancing equity (live site: lib/leadership/styles/equity.ts). Placement describes styles, never people. */
const EQUITY_ZONES = [
  { id: "against", label: "Works against equity", styles: [["authoritarian", "Authoritarian"], ["laissez-faire", "Laissez-faire"]] },
  { id: "mixed", label: "Double-edged", styles: [["directive", "Autocratic or directive"], ["transactional", "Transactional"], ["procedural", "Bureaucratic or procedural"], ["charismatic", "Charismatic"], ["participative", "Democratic or participative"]] },
  { id: "foundation", label: "Strong foundation, used with care", styles: [["transformational", "Transformational"], ["adaptive-situational", "Adaptive and situational"], ["empowering", "Empowering or delegative"], ["shared", "Shared or distributed"], ["servant", "Servant"], ["coaching", "Coaching or developmental"], ["ethical", "Ethical"]] },
  { id: "advances", label: "Most directly advances equity", styles: [["transformative", "Transformative or equity-centered"], ["inclusive", "Inclusive"]] },
] as const;

/** Start, apply, lead (v2 prototype): where to begin, by how far into the work someone is. Learning stays voluntary. */
const TIERS = [
  { tier: "Start", title: "Everyday habits", text: "Begin with the five shared values, the DHS Equity Policy in plain language, Cultural Humility and the podcasts.", href: "/knowledge#knowledge-start", action: "Open Start" },
  { tier: "Apply", title: "Practice for your work", text: "Use the nine applied tools, the equity scan, Disability services in practice and the community briefs.", href: "/practice", action: "Open Practice" },
  { tier: "Lead", title: "Systems and stewardship", text: "Work through six leadership stages, sixteen leadership styles and decisions about resources and change.", href: "/leadership", action: "Open Leadership" },
] as const;

export default async function HomePage() {
  const [upcoming, ask] = await Promise.all([upcomingFromCalendar(), askForHome()]);
  const heroImage = <Image className="home-hero-image" src="/images/home/people-access-culture-hero.webp" width={3840} height={1748} alt="Eight colleagues sharing perspectives around a conference table." preload quality={90} sizes="(max-width: 3840px) 100vw, 3840px" />;
  return <div className="dsd-home od">
    <section className="home-hero" aria-labelledby="home-title">
      <HeroMotion src="/videos/one-dsd-hero.mp4">{heroImage}</HeroMotion>
      <div className="pilot-wrap home-title">
        <h1 id="home-title">People, Access and Culture</h1>
        <p>People with disabilities should have a meaningful say in their lives and opportunities to belong, contribute and grow. Together, we can make our services and our workplace more responsive to the people who rely on them.</p>
        <p><Link className="home-guide-link" href="/begin-with-equity">Begin with equity in practice</Link></p>
        <p className="home-guide"><Link className="home-guide-link" href="/user-guide">How to use this site</Link></p>
      </div>
    </section>

    <div className="pilot-wrap">
      <HomeCommandCenter copy={ask?.copy ?? {}} askAvailable={Boolean(ask?.enabled)} researchAvailable={Boolean(ask?.research?.enabled)} />

      <section className="pilot-section home-tiers" aria-labelledby="home-tiers-title">
        <h2 id="home-tiers-title">Choose where you are in the work</h2>
        <p className="home-tiers-note">Learning here is voluntary. Nothing is tracked or counted toward training credit.</p>
        <ol>{TIERS.map(item => <li key={item.tier}>
          <p className="home-tier-label">{item.tier}</p>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
          <Link className="pilot-secondary" href={item.href}>{item.action}</Link>
        </li>)}</ol>
      </section>

      <section className="pilot-section" aria-labelledby="pilot-pathways">
        <h2 id="pilot-pathways">Explore learning, tools and communities</h2>
        <ul className="pilot-pathways">{pathways.map(item => <li key={item.title}>
          <Image src={item.image} alt={item.alt} width={900} height={600} sizes="(min-width: 760px) 33vw, 100vw" />
          <div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <Link className="pilot-secondary" href={item.href}>{item.action}</Link>
          </div>
        </li>)}</ul>
      </section>

      <section className="pilot-section home-feature-lead" aria-labelledby="featured-title">
        <div className="home-water home-featured">
          <Image src="/images/home/featured-leadership-hd.webp" alt="A supervisor listens as a colleague explains an idea to a small team gathered by tall office windows; one team member uses a wheelchair." width={3840} height={2560} sizes="(min-width: 760px) 560px, 100vw" />
          <div><p className="home-featured-kicker">Featured</p><h2 id="featured-title">One DSD Leadership</h2>
            <p>Leadership shapes whether people get service that is fair, respectful and easy to understand. Explore leadership styles, how each one affects the people you lead, and what to try next.</p>
            <Link className="pilot-primary" href={LEADERSHIP}>Explore One DSD Leadership</Link>
          </div>
        </div>
        <div className="home-equity-bar" aria-labelledby="home-equity-title">
          <h3 id="home-equity-title">How the styles relate to advancing equity</h3>
          <div className="home-equity-scale" aria-hidden="true"><span>Works against equity</span><span>Most directly advances equity</span></div>
          <ol>{EQUITY_ZONES.map(zone => <li key={zone.id} className={`home-zone home-zone-${zone.id}`}>
            <strong>{zone.label}</strong>
            <ul>{zone.styles.map(([slug, name]) => <li key={slug}><Link href={`${LEADERSHIP}/styles/${slug}`}>{name}</Link></li>)}</ul>
          </li>)}</ol>
        </div>
      </section>

      <section className="pilot-section" aria-labelledby="pilot-more">
        <div className="pilot-section-heading"><h2 id="pilot-more">Coming up and keep learning</h2><Link href={CALENDAR_PATH}>Open the Culture Calendar</Link></div>
        <div className="home-row">
          <ul className="pilot-list">{upcoming.map(item => <li key={item.id}>
            <Link className="pilot-calendar-row" href={item.href}>
              <span className="pilot-date" aria-hidden="true"><span>{new Date(item.start).toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</span><strong>{Number(item.start.slice(-2))}</strong></span>
              <span><strong>{item.name}</strong><span>{shortDateRange(item.start, item.end)}</span></span>
            </Link>
          </li>)}</ul>
          <ul className="pilot-list">
            <li><Link href="/my-work"><strong>Your work</strong><span>Find learning and resources for your responsibilities, with room to explore other roles.</span></Link></li>
            <li><Link href="/minnesota-communities/prepare"><strong>Prepare for a conversation</strong><span>Plan a community meeting or a conversation about services, with questions and access arrangements ready.</span></Link></li>
            <li><Link href="/trainings/cultural-humility"><strong>Cultural Humility</strong><span>Interactive training with a version for each job family.</span></Link></li>
            <li><Link href="/learning/self-directed/index.html?course=F09"><strong>Disability, Rights, Identity, and Belonging</strong><span>See disability as part of a person&apos;s identity and culture.</span></Link></li>
          </ul>
        </div>
      </section>
    </div>
  </div>;
}

/** Ask on Home must never break the page: if it cannot be prepared, the command center links to the Ask page. */
async function askForHome() {
  try { return await prepareAsk(); } catch (error) {
    console.error("home Ask unavailable", error instanceof Error ? `${error.name}: ${error.message}` : error);
    return null;
  }
}

/** The calendar preview must never break the home page: if the calendar cannot be read, it shows the link only. */
async function upcomingFromCalendar() {
  try {
    return upcomingObservances(compactCalendar(await publishedCalendar()), chicagoToday(), 3);
  } catch (error) {
    console.error("home calendar preview unavailable", error instanceof Error ? `${error.name}: ${error.message}` : error);
    return [];
  }
}
