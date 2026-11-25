
import { WaterCollectionFeature } from "@/components/water-collection-feature";
import Image from "next/image";
import Link from "@/components/app-link";
import { HomeTaskFinder } from "@/components/home-task-finder";
import { HeroMotion } from "./hero-motion";
import { publishedCalendar } from "@/lib/content/cultural-calendar";
import { CALENDAR_PATH, chicagoToday, compactCalendar, shortDateRange, upcomingObservances } from "@/lib/content/culture-calendar-grid";
import "./task-home.css";

// v2 rebuild (2026-11-25): Home leads with the task finder, then the five pillars.
const pillars = [
  { title: "Practice", description: "Work through a real decision, meeting, form, process or review with guided tools.", href: "/practice" },
  { title: "Leadership", description: "Team kits, leadership approaches and paths for supervisors, managers and directors.", href: "/leadership" },
  { title: "Communities", description: "Minnesota communities, the Culture Calendar, Tribal Nations and community outreach.", href: "/communities" },
  { title: "Knowledge", description: "Courses, readings, podcasts and the library, with Ask and Search for quick answers.", href: "/knowledge" },
  { title: "Charter", description: "The principles and responsibilities that guide the program.", href: "/charter" },
] as const;

export default async function HomePage() {
  const upcoming = await upcomingFromCalendar();
  const heroImage = <Image className="home-hero-image" src="/images/people-access-culture-hero-20261025.webp" width={3840} height={1748} alt="Eight colleagues sharing perspectives around a conference table." preload quality={90} sizes="(max-width: 3840px) 100vw, 3840px" />;
  return <div className="dsd-home od">
    <section className="home-hero" aria-labelledby="home-title">
      <div className="pilot-wrap home-title">
        <h1 id="home-title">People, Access and Culture</h1>
        <p>Learning, guidance and tools for equity in the work and workplace of the Disability Services Division.</p>
        <p className="home-guide"><Link className="home-guide-link" href="/user-guide">How to use this site</Link></p>
      </div>
      <HeroMotion src="/videos/one-dsd-hero.mp4">{heroImage}</HeroMotion>
    </section>

    <div className="pilot-wrap">
      <HomeTaskFinder />

      <section className="pilot-section" aria-labelledby="pilot-explore">
        <h2 id="pilot-explore"><Link className="pilot-agency-link" href="/understanding-dhs">Explore DHS</Link></h2>
        <p>People, programs and partnerships across the Department of Human Services.</p>
      </section>

      <section className="pilot-section" aria-labelledby="pilot-pillars">
        <h2 id="pilot-pillars">Where to go next</h2>
        <ul className="pilot-list">{pillars.map(item => <li key={item.href}>
          <Link href={item.href}><strong>{item.title}</strong><span>{item.description}</span></Link>
        </li>)}</ul>
      </section>

      <section className="pilot-section" aria-labelledby="pilot-calendar">
        <div className="pilot-section-heading"><h2 id="pilot-calendar">Coming up</h2><Link href={CALENDAR_PATH}>Open the calendar</Link></div>
        {upcoming.length ? <ul className="pilot-list">{upcoming.map(item => <li key={item.id}>
          <Link className="pilot-calendar-row" href={item.href}>
            <span className="pilot-date" aria-hidden="true"><span>{new Date(item.start).toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</span><strong>{Number(item.start.slice(-2))}</strong></span>
            <span><strong>{item.name}</strong><span>{shortDateRange(item.start, item.end)}</span></span>
          </Link>
        </li>)}</ul> : <p>See the full calendar for observances across Minnesota communities.</p>}
      </section>

      <div className="pilot-section"><WaterCollectionFeature withPhoto /></div>

      <section className="pilot-section" aria-labelledby="pilot-more">
        <h2 id="pilot-more">More from One DSD</h2>
        <ul className="pilot-list">
          <li><Link href="/start"><strong>Begin here</strong><span>A short helper that suggests a first step for your role and time.</span></Link></li>
          <li><Link href="/one-dsd"><strong>About One DSD</strong><span>The program, the division’s work and the people behind it.</span></Link></li>
          <li><Link href="/my-work"><strong>My work</strong><span>Plans and notes saved on your own computer.</span></Link></li>
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
