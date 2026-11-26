
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { CALENDAR_TITLES, calendarEntryFor, publishedCalendar, type CalendarDate, type CalendarEntry } from "@/lib/content/cultural-calendar";
import { calendarMonthHref, CALENDAR_ICS_PATH, dateCovers, dateStateKind, dateStateText, entryAnchor, validDay } from "@/lib/content/culture-calendar-grid";
import { ResearchInline } from "@/components/research-markdown";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";

export const metadata: Metadata = { title: "One DSD Culture Calendar (Minnesota Communities)" };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const KINDS: Record<string, string> = { religious: "Religious", "community festival": "Community festival", national: "National", cultural: "Cultural", remembrance: "Remembrance", heritage: "Heritage" };
const YEARS = [2026, 2027, 2028];

function formatDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

function dateState(entry: CalendarEntry, date: CalendarDate) {
  return dateStateText(dateStateKind(entry.dateCertainty, date.confirmed));
}

function Entry({ entry, date, open }: { entry: CalendarEntry; date?: CalendarDate; open: boolean }) {
  return <details id={entryAnchor(entry.id)} className="community-research-disclosure" open={open}>
    <summary>
      <h3>{entry.name}</h3>
      <span>
        {date?.date ? <span className="calendar-entry-date">{formatDate(date.date)}{date.endDate && date.endDate !== date.date ? ` to ${formatDate(date.endDate)}` : ""}</span> : <span className="calendar-entry-date">Date not set</span>}
        {date?.date ? <span className="calendar-entry-state">{dateState(entry, date)}</span> : null}
      </span>
    </summary>
    {entry.members?.length ? <div>
      {entry.alsoKnownAs.length ? <p>Also known as: {entry.alsoKnownAs.join("; ")}</p> : null}
      {entry.dateRule ? <p><strong>How the date is set.</strong> {entry.dateRule}</p> : null}
      {entry.members.map(member => <section key={member.id} id={entryAnchor(member.id)} className="calendar-community-note" aria-label={`${entry.name}: ${member.communities.map(id => CALENDAR_TITLES[id] ?? id).join(", ")}`}>
        <h4>{member.communities.map((id, index) => <span key={id}>{index ? ", " : ""}<Link href={`/minnesota-communities/${id}`}>{CALENDAR_TITLES[id] ?? id}</Link></span>)}</h4>
        <p>{member.capsule}</p>
        {member.whatItMarks ? <p><strong>What it marks.</strong> {member.whatItMarks}</p> : null}
        {member.howCelebrated ? <p><strong>In Minnesota.</strong> {member.howCelebrated}</p> : null}
        {member.workplaceNote ? <p><strong>At work.</strong> {member.workplaceNote}</p> : null}
        {member.events.length ? <><p className="community-research-label">Events in Minnesota</p><ul>{member.events.map((event, index) => <li key={index}>{event.href ? <SourceLink href={event.href}>{event.name}</SourceLink> : event.name}{event.place ? `, ${event.place}` : ""}{event.dates ? `. ${event.dates}` : ""}</li>)}</ul></> : null}
      </section>)}
      {entry.sources.length ? <p className="community-research-sources">Sources: {entry.sources.map((source, index) => <span key={index}>{index ? "; " : ""}<SourceLink href={source.href}><ResearchInline text={source.title} /></SourceLink></span>)}</p> : null}
    </div> : <div>
      <p>{entry.capsule}</p>
      {entry.alsoKnownAs.length ? <p>Also known as: {entry.alsoKnownAs.join("; ")}</p> : null}
      {entry.dateRule ? <p><strong>How the date is set.</strong> {entry.dateRule}</p> : null}
      {entry.whatItMarks ? <p><strong>What it marks.</strong> {entry.whatItMarks}</p> : null}
      {entry.howCelebrated ? <p><strong>In Minnesota.</strong> {entry.howCelebrated}</p> : null}
      {entry.workplaceNote ? <p><strong>At work.</strong> {entry.workplaceNote}</p> : null}
      {entry.events.length ? <><p className="community-research-label">Events in Minnesota</p><ul>{entry.events.map((event, index) => <li key={index}>{event.href ? <SourceLink href={event.href}>{event.name}</SourceLink> : event.name}{event.place ? `, ${event.place}` : ""}{event.dates ? `. ${event.dates}` : ""}</li>)}</ul></> : null}
      <p>Communities: {entry.communities.map((id, index) => <span key={id}>{index ? ", " : ""}<Link href={`/minnesota-communities/${id}`}>{CALENDAR_TITLES[id] ?? id}</Link></span>)}</p>
      {entry.sources.length ? <p className="community-research-sources">Sources: {entry.sources.map((source, index) => <span key={index}>{index ? "; " : ""}<SourceLink href={source.href}><ResearchInline text={source.title} /></SourceLink></span>)}</p> : null}
    </div>}
  </details>;
}

export default async function CulturalCalendarPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string; community?: string; kind?: string; entry?: string; day?: string }> }) {
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
  const day = validDay(year, month, params.day);
  const openEntry = calendarEntryFor(entries, params.entry)?.id;
  const dated = filtered.flatMap(entry => entry.dates.filter(date => day ? dateCovers(date, day) : date.year === year && date.date).map(date => ({ entry, date })))
    .filter(({ date }) => day || month === "all" || Number(date.date!.slice(5, 7)) === month)
    .sort((a, b) => a.date.date!.localeCompare(b.date.date!) || a.entry.name.localeCompare(b.entry.name));
  const undated = filtered.filter(entry => !entry.dates.some(date => date.year === year && date.date));
  const backToMonth = `${calendarMonthHref({ year, month: month === "all" ? 1 : month })}${community ? `&community=${encodeURIComponent(community)}` : ""}${kind ? `&kind=${encodeURIComponent(kind)}` : ""}`;
  const byMonth = MONTHS.map((name, index) => ({ name, items: dated.filter(({ date }) => Number(date.date!.slice(5, 7)) === index + 1) })).filter(group => group.items.length);
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href="/minnesota-communities">Minnesota Communities</Link></p>
    <h1>One DSD Culture Calendar</h1>
    <p className="community-opening">Observances, festivals and remembrances across Minnesota&apos;s communities, for planning meetings, deadlines and outreach with care.</p>
    <p>A date on this calendar does not tell you whether a particular person observes it. Ask people what they need, and check any date that matters with the organizer or community.</p>
    <form method="get" className="calendar-filters">
      <label>Year<select name="year" defaultValue={year}>{YEARS.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Month<select name="month" defaultValue={month}><option value="all">All months</option>{MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>
      <label>Community<select name="community" defaultValue={community}><option value="">All communities</option>{communityIds.map(id => <option key={id} value={id}>{CALENDAR_TITLES[id] ?? id}</option>)}</select></label>
      <label>Type<select name="kind" defaultValue={kind}><option value="">All types</option>{Object.entries(KINDS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button type="submit" className="btn">Show dates</button>
    </form>
    <p><SourceLink href={CALENDAR_ICS_PATH}>Download confirmed dates for your own calendar</SourceLink></p>
    {day ? <section className="calendar-month"><h2>{formatDate(day)}</h2><p><Link href={backToMonth}>Back to all of {MONTHS[Number(day.slice(5, 7)) - 1]} {year}</Link></p>{dated.map(({ entry, date }) => <Entry key={`${entry.id}-${date.date}`} entry={entry} date={date} open={entry.id === openEntry} />)}{!dated.length ? <p>No dates match these choices on this day.</p> : null}</section> : null}
    {!day ? byMonth.map(group => <section key={group.name} className="calendar-month"><h2>{group.name} {year}</h2>{group.items.map(({ entry, date }) => <Entry key={`${entry.id}-${date.date}`} entry={entry} date={date} open={entry.id === openEntry} />)}</section>) : null}
    {!day && !byMonth.length ? <p>No dates match these choices. Try another month, or choose all months.</p> : null}
    {!day && undated.length && (community || month === "all") ? <section className="calendar-month"><h2>Date not set for {year}</h2><p>These recur, but no date for this year is available yet.</p>{undated.map(entry => <Entry key={entry.id} entry={entry} open={entry.id === openEntry} />)}</section> : null}
  </div></div>;
}
