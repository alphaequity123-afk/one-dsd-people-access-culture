
import { WaterCollectionFeature } from "@/components/water-collection-feature";
import Image from "next/image";
import Link from "@/components/app-link";
import { HomeTaskFinder } from "@/components/home-task-finder";
import { HeroMotion } from "./hero-motion";
import { publishedCalendar } from "@/lib/content/cultural-calendar";
import { CALENDAR_PATH, chicagoToday, compactCalendar, shortDateRange, upcomingObservances } from "@/lib/content/culture-calendar-grid";
import "./task-home.css";

const pathways = [
  { image: "learn", alt: "State staff of different ages and backgrounds talk around a table in a sunlit meeting room.", title: "Learn", description: "Start with An Equity Lens for Ordinary Decisions, the first of 15 recommended courses.", href: "/learn", action: "Open Learn" },
  { image: "apply-a-tool", alt: "Four colleagues planning together around a table and arranging ideas on a board.", title: "Apply a tool", description: "Run a quick check on a routine decision, or open a guided practice for a hire, a meeting, or a draft.", href: "/practice", action: "Open Practice" },
  { image: "communities", alt: "Neighbors of different ages share food at a community meal.", title: "Communities", description: "Open a brief on a Minnesota community to see what to ask, what to check for access, and who to involve.", href: "/minnesota-communities", action: "Open Communities" },
] as const;

export default async function HomePage() {
  const upcoming = await upcomingFromCalendar();
  const heroImage = <Image className="home-hero-image" src="/images/people-access-culture-hero-20261025.webp" width={3840} height={1748} alt="Eight colleagues sharing perspectives around a conference table." preload quality={90} sizes="(max-width: 3840px) 100vw, 3840px" />;
  return <div className="dsd-home od">
    <section className="home-hero" aria-labelledby="home-title">
      <div className="pilot-wrap home-title">
        <h1 id="home-title">People, Access and Culture</h1>
        <p>This site helps staff of the Disability Services Division (DSD) at the Minnesota Department of Human Services (DHS) make fairer decisions, run better meetings, and learn about the communities they serve. It is run by One DSD, the division’s equity program.</p>
        <p className="home-guide"><Link className="home-guide-link" href="/user-guide">How to use this site</Link></p>
      </div>
      <HeroMotion src="/videos/one-dsd-hero.mp4">{heroImage}</HeroMotion>
    </section>

    <div className="pilot-wrap">
      <HomeTaskFinder />

      <section className="pilot-section" aria-labelledby="pilot-explore">
        <h2 id="pilot-explore"><Link className="pilot-agency-link" href="/understanding-dhs">Explore DHS, the Minnesota Department of Human Services</Link></h2>
        <p>See how DHS programs, people, and partners fit together, with a closer look at Disability Services.</p>
      </section>

      <section className="pilot-section" aria-labelledby="pilot-pathways">
        <h2 id="pilot-pathways">Three ways to start: learn, apply a tool, or explore communities</h2>
        <ul className="pilot-pathways">{pathways.map(item => <li key={item.href}>
          <Image src={`/images/pilot-home/${item.image}.jpg`} alt={item.alt} width={900} height={600} sizes="(min-width: 760px) 33vw, 100vw" />
          <div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <Link className="pilot-secondary" href={item.href}>{item.action}</Link>
          </div>
        </li>)}</ul>
      </section>

      <section className="pilot-section" aria-labelledby="pilot-calendar">
        <div className="pilot-section-heading"><h2 id="pilot-calendar">Coming up: observances in Minnesota communities</h2><Link href={CALENDAR_PATH}>Open the calendar</Link></div>
        {upcoming.length ? <ul className="pilot-list">{upcoming.map(item => <li key={item.id}>
          <Link className="pilot-calendar-row" href={item.href}>
            <span className="pilot-date" aria-hidden="true"><span>{new Date(item.start).toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</span><strong>{Number(item.start.slice(-2))}</strong></span>
            <span><strong>{item.name}</strong><span>{shortDateRange(item.start, item.end)}</span></span>
          </Link>
        </li>)}</ul> : <p>Open the calendar to see observances across Minnesota communities.</p>}
      </section>

      <div className="pilot-section"><WaterCollectionFeature withPhoto /></div>

      <section className="pilot-section" aria-labelledby="pilot-leadership">
        <h2 id="pilot-leadership">Tools for leaders, and more about the One DSD program</h2>
        <ul className="pilot-list">
          <li><Link href="/leading"><strong>Leadership</strong><span>Pick the kind of decision you face, such as hiring or feedback, and open plain questions and a course to start with.</span></Link></li>
          <li><Link href="/one-dsd"><strong>About One DSD</strong><span>One DSD is the division’s equity program. Read what it covers and who is behind it.</span></Link></li>
          <li><Link href="/team-kits"><strong>Team kits</strong><span>Run a thirty-minute book discussion or a twenty-minute practice case at your next staff meeting.</span></Link></li>
        </ul>
      </section>
    </div>
  </div>;
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
