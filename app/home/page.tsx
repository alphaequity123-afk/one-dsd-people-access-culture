import Image from "next/image";
import Link from "next/link";
import { HomeTaskFinder } from "@/components/home-task-finder";
import { publishedCalendar } from "@/lib/content/cultural-calendar";
import { CALENDAR_PATH, chicagoToday, compactCalendar, shortDateRange, upcomingObservances } from "@/lib/content/culture-calendar-grid";
import "./task-home.css";

/**
 * The home page has one job: get a person to the right place. The task finder is the main
 * action; three doors and a short calendar preview follow. Everything that used to sit here
 * has a home one click away: the full Culture Calendar on its own page, the topic links on the
 * Learn, Practice and community landing pages, and the program links under One DSD.
 */
export default async function HomePage() {
  const upcoming = await upcomingFromCalendar();
  return <div className="dsd-home od">
    <section className="home-hero" aria-labelledby="home-title">
      <div className="w home-title">
        <h1 id="home-title">People, Access and Culture</h1>
        <p>Learning, guidance and tools for equity in the work and workplace of the Disability Services Division.</p>
        <p className="home-guide"><Link className="home-guide-link" href="/user-guide">How to use this site: read the user guide <span aria-hidden="true">→</span></Link></p>
      </div>
      <Image className="home-hero-image" src="/images/people-access-culture-hero-20261025.webp" width={3840} height={1748} alt="Eight colleagues sharing perspectives around a conference table." preload quality={90} sizes="(max-width: 3840px) 100vw, 3840px" />
    </section>

    <section className="start" id="start-here" aria-labelledby="finder-title"><div className="w">
      <h2 id="finder-title">Find a resource for your work</h2>
      <p className="lead">Tell us what you&apos;re doing and we&apos;ll take you to the right place.</p>
      <HomeTaskFinder />
    </div></section>

    <section className="blk" aria-label="Main areas"><div className="w doors">
      <Link className="door" href="/learn"><h2>Learn</h2><p>Courses, readings and collections to build your understanding.</p></Link>
      <Link className="door" href="/practice"><h2>Apply a tool</h2><p>Work through a real decision, meeting, process or review.</p></Link>
      <Link className="door" href="/minnesota-communities"><h2>Communities</h2><p>Minnesota communities, their history and how to connect well.</p></Link>
    </div></section>

    <section className="blk month" aria-labelledby="month-title"><div className="w">
      <div className="month-head"><h2 id="month-title">Coming up</h2><Link href={CALENDAR_PATH}>Open the One DSD Culture Calendar <span aria-hidden="true">→</span></Link></div>
      {upcoming.length ? <ul className="month-list">{upcoming.map(item => <li key={item.id}><Link href={item.href}><span>{shortDateRange(item.start, item.end)}</span>{item.name}</Link></li>)}</ul>
        : <p>See the full calendar for observances across Minnesota communities.</p>}
    </div></section>

    <section className="blk leaders" aria-label="For leaders"><div className="w">
      <p><Link href="/leading">For leaders, supervisors, managers, and directors <span aria-hidden="true">→</span></Link> Decisions, paths and tools for leading equity work.</p>
    </div></section>
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
