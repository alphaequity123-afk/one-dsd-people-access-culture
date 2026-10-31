import type { Metadata } from "next";
import Link from "next/link";
import { CALENDAR_TITLES, publishedCalendar, type CalendarDate, type CalendarEntry } from "@/lib/content/cultural-calendar";
import { ResearchInline } from "@/components/research-markdown";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";

export const metadata: Metadata = { title: "Cultural calendar (Minnesota Communities)" };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const KINDS: Record<string, string> = { religious: "Religious", "community festival": "Community festival", national: "National", cultural: "Cultural", remembrance: "Remembrance", heritage: "Heritage" };
const YEARS = [2026, 2027, 2028];

function formatDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

function dateState(entry: CalendarEntry, date: CalendarDate) {
  if (entry.dateCertainty.startsWith("moon")) return "Depends on the moon or on an announcement, so it may shift. Confirm before planning.";
  return date.confirmed ? "Date confirmed by a source." : "Expected date, not yet confirmed. Check with the organizer before planning.";
}

function Entry({ entry, date }: { entry: CalendarEntry; date?: CalendarDate }) {
  return <details className="community-research-disclosure">
    <summary>
      <h3>{entry.name}</h3>
      <span>
        {date?.date ? <span className="calendar-entry-date">{formatDate(date.date)}{date.endDate && date.endDate !== date.date ? ` to ${formatDate(date.endDate)}` : ""}</span> : <span className="calendar-entry-date">Date not set</span>}
        {date?.date ? <span className="calendar-entry-state">{dateState(entry, date)}</span> : null}
      </span>
    </summary>
    <div>
      <p>{entry.capsule}</p>
      {entry.alsoKnownAs.length ? <p>Also known as: {entry.alsoKnownAs.join("; ")}</p> : null}
      {entry.dateRule ? <p><strong>How the date is set.</strong> {entry.dateRule}</p> : null}
      {entry.whatItMarks ? <p><strong>What it marks.</strong> {entry.whatItMarks}</p> : null}
      {entry.howCelebrated ? <p><strong>In Minnesota.</strong> {entry.howCelebrated}</p> : null}
      {entry.workplaceNote ? <p><strong>At work.</strong> {entry.workplaceNote}</p> : null}
      {entry.events.length ? <><p className="community-research-label">Events in Minnesota</p><ul>{entry.events.map((event, index) => <li key={index}>{event.href ? <a href={event.href}>{event.name}</a> : event.name}{event.place ? `, ${event.place}` : ""}{event.dates ? `. ${event.dates}` : ""}</li>)}</ul></> : null}
      <p>Communities: {entry.communities.map((id, index) => <span key={id}>{index ? ", " : ""}<Link href={`/minnesota-communities/${id}`}>{CALENDAR_TITLES[id] ?? id}</Link></span>)}</p>
      {entry.sources.length ? <p className="community-research-sources">Sources: {entry.sources.map((source, index) => <span key={index}>{index ? "; " : ""}<a href={source.href}><ResearchInline text={source.title} /></a></span>)}</p> : null}
    </div>
  </details>;
}

export default async function CulturalCalendarPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string; community?: string; kind?: string }> }) {
  const params = await searchParams;
  const entries = await publishedCalendar();
  const [thisYear, thisMonth] = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" }).split("-").map(Number);
  const requestedYear = Number(params.year);
  const year = YEARS.includes(requestedYear) ? requestedYear : YEARS.includes(thisYear) ? thisYear : YEARS[0];
  const month = params.month === "all" ? "all" : /^(?:[1-9]|1[0-2])$/.test(params.month ?? "") ? Number(params.month) : thisMonth;
  const communityIds = [...new Set(entries.flatMap(entry => entry.communities))].sort((a, b) => (CALENDAR_TITLES[a] ?? a).localeCompare(CALENDAR_TITLES[b] ?? b));
  const community = communityIds.includes(params.community ?? "") ? params.community! : "";
  const kind = params.kind && KINDS[params.kind] ? params.kind : "";
  const filtered = entries.filter(entry => (!community || entry.communities.includes(community)) && (!kind || entry.kind === kind));
  const dated = filtered.flatMap(entry => entry.dates.filter(date => date.year === year && date.date).map(date => ({ entry, date })))
    .filter(({ date }) => month === "all" || Number(date.date!.slice(5, 7)) === month)
    .sort((a, b) => a.date.date!.localeCompare(b.date.date!) || a.entry.name.localeCompare(b.entry.name));
  const undated = filtered.filter(entry => !entry.dates.some(date => date.year === year && date.date));
  const byMonth = MONTHS.map((name, index) => ({ name, items: dated.filter(({ date }) => Number(date.date!.slice(5, 7)) === index + 1) })).filter(group => group.items.length);
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href="/minnesota-communities">Minnesota Communities</Link></p>
    <h1>Cultural calendar</h1>
    <p className="community-opening">Observances, festivals and remembrances across Minnesota&apos;s communities, for planning meetings, deadlines and outreach with care.</p>
    <p>A date on this calendar does not tell you whether a particular person observes it. Ask people what they need, and check any date that matters with the organizer or community.</p>
    <form method="get" className="calendar-filters">
      <label>Year<select name="year" defaultValue={year}>{YEARS.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Month<select name="month" defaultValue={month}><option value="all">All months</option>{MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>
      <label>Community<select name="community" defaultValue={community}><option value="">All communities</option>{communityIds.map(id => <option key={id} value={id}>{CALENDAR_TITLES[id] ?? id}</option>)}</select></label>
      <label>Type<select name="kind" defaultValue={kind}><option value="">All types</option>{Object.entries(KINDS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button type="submit" className="btn">Show dates</button>
    </form>
    <p><a href="/minnesota-communities/calendar/cultural-calendar.ics">Download confirmed dates for your own calendar</a></p>
    {byMonth.map(group => <section key={group.name} className="calendar-month"><h2>{group.name} {year}</h2>{group.items.map(({ entry, date }) => <Entry key={`${entry.id}-${date.date}`} entry={entry} date={date} />)}</section>)}
    {!byMonth.length ? <p>No dates match these choices. Try another month, or choose all months.</p> : null}
    {undated.length && (community || month === "all") ? <section className="calendar-month"><h2>Date not set for {year}</h2><p>These recur, but no date for this year is available yet.</p>{undated.map(entry => <Entry key={entry.id} entry={entry} />)}</section> : null}
  </div></div>;
}
