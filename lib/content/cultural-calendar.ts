import "server-only";
import data from "@/lib/content/cultural-calendar.json";
import { communityPagePublished } from "@/lib/content/cultural-intelligence-publication";
import { RESEARCH_EXCLUDED_COMMUNITY_IDS } from "@/lib/content/community-research-policy";

export type CalendarDate = { year: number; date: string | null; endDate: string | null; confirmed: boolean };
export type CalendarEntry = {
  id: string;
  name: string;
  alsoKnownAs: string[];
  communities: string[];
  kind: string;
  capsule: string;
  dateRule: string;
  dateCertainty: string;
  dates: CalendarDate[];
  whatItMarks: string;
  howCelebrated: string;
  events: Array<{ name: string; place: string; href: string | null; dates: string }>;
  workplaceNote: string | null;
  sources: Array<{ title: string; href: string }>;
  /** Owner decision 2026-11-26: an observance listed for several communities shows once; each community's own entry is kept here. */
  members?: CalendarEntry[];
};

export const CALENDAR_TITLES = data.titles as Record<string, string>;
const ENTRIES = data.entries as CalendarEntry[];

/** Only communities with a published page appear, under the same gates as the page itself. */
export async function publishedCalendar(): Promise<CalendarEntry[]> {
  const ids = [...new Set(ENTRIES.flatMap(entry => entry.communities))].filter(id => !(RESEARCH_EXCLUDED_COMMUNITY_IDS as readonly string[]).includes(id));
  const published = new Set((await Promise.all(ids.map(async id => await communityPagePublished(id) ? id : null))).filter(Boolean));
  return ENTRIES.flatMap(entry => {
    const communities = entry.communities.filter(id => published.has(id));
    return communities.length ? [{ ...entry, communities }] : [];
  }).reduce<CalendarEntry[]>(mergeRepeated, []);
}

export function mergeRepeatedObservances(entries: CalendarEntry[]): CalendarEntry[] {
  return entries.reduce<CalendarEntry[]>(mergeRepeated, []);
}

const nameKey = (entry: CalendarEntry) => entry.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const datesKey = (entry: CalendarEntry) => entry.dates.map(date => `${date.year}:${date.date ?? ""}:${date.endDate ?? ""}`).join("|");

/**
 * Owner decision 2026-11-26 ("Just once. Only once."): the same observance on the same dates appears once, listing
 * every community, with each community's own description, Minnesota notes, workplace note and events kept in full.
 * The first community's entry keeps its id, so existing links still open the observance.
 */
function mergeRepeated(merged: CalendarEntry[], entry: CalendarEntry): CalendarEntry[] {
  const match = merged.find(item => nameKey(item) === nameKey(entry) && item.kind === entry.kind && datesKey(item) === datesKey(entry));
  if (!match) { merged.push(entry); return merged; }
  const members = match.members ?? [{ ...match }];
  const index = merged.indexOf(match);
  const all = [...members, entry];
  const dates = match.dates.map((date, i) => ({ ...date, confirmed: all.every(member => member.dates[i]?.confirmed) }));
  merged[index] = {
    ...match,
    dates,
    dateCertainty: all.every(member => member.dateCertainty === match.dateCertainty) ? match.dateCertainty : members[0].dateCertainty,
    alsoKnownAs: [...new Set(all.flatMap(member => member.alsoKnownAs))],
    communities: [...new Set(all.flatMap(member => member.communities))],
    sources: all.flatMap(member => member.sources).filter((source, i, list) => list.findIndex(other => other.href === source.href) === i),
    events: all.flatMap(member => member.events).filter((event, i, list) => list.findIndex(other => other.name === event.name && other.dates === event.dates) === i),
    members: all,
  };
  return merged;
}

/** Find the observance that holds an entry id, whether it is the observance itself or one community's entry within it. */
export function calendarEntryFor(entries: CalendarEntry[], id: string | undefined): CalendarEntry | undefined {
  return id ? entries.find(entry => entry.id === id || entry.members?.some(member => member.id === id)) : undefined;
}

function dateLine(value: string) {
  return value.replace(/-/g, "");
}
function nextDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
function icsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function fold(line: string) {
  const parts: string[] = [];
  for (let rest = line; rest.length; rest = rest.slice(70)) parts.push(rest.slice(0, 70));
  return parts.join("\r\n ");
}

/** Confirmed dates only: an expected date should not land on someone's calendar as fact. */
export function calendarIcs(entries: CalendarEntry[], stamp: string): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//One DSD//Cultural Calendar//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:One DSD cultural calendar"];
  for (const entry of entries) for (const date of entry.dates) {
    if (!date.confirmed || !date.date) continue;
    lines.push("BEGIN:VEVENT", `UID:${entry.id}-${date.year}@one-dsd`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${dateLine(date.date)}`,
      `DTEND;VALUE=DATE:${dateLine(nextDay(date.endDate ?? date.date))}`, fold(`SUMMARY:${icsText(entry.name)}`), fold(`DESCRIPTION:${icsText(entry.capsule)}`), "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
