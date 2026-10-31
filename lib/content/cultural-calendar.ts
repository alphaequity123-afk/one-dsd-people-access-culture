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
  });
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
