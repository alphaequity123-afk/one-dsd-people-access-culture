// Pure calendar logic shared by the month grid (a client component) and the full
// calendar page. This file must stay free of server-only imports and of the calendar
// data: entries reach it only after publishedCalendar() has applied the publication rules.
import type { CalendarDate, CalendarEntry } from "@/lib/content/cultural-calendar";

export type YearMonth = { year: number; month: number };
export type DateStateKind = "confirmed" | "expected" | "moon";

type StateCode = "c" | "e" | "m";
/** One compact date: [start, state], or [start, end, state] when it runs over several days. */
export type CompactDate = [string, StateCode] | [string, string, StateCode];
/** One compact observance: [id, name, dates]. Tuples keep the page payload small. */
export type CompactEntry = [string, string, CompactDate[]];
export type DayEntry = { id: string; name: string; start: string; end: string; state: DateStateKind };

export const FIRST_MONTH: YearMonth = { year: 2026, month: 1 };
export const LAST_MONTH: YearMonth = { year: 2028, month: 12 };
export const DAY_ENTRY_CAP = 3;
export const CALENDAR_PATH = "/minnesota-communities/calendar";
export const CALENDAR_ICS_PATH = `${CALENDAR_PATH}/cultural-calendar.ics`;
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const monthIndex = ({ year, month }: YearMonth) => year * 12 + month - 1;
const fromIndex = (index: number): YearMonth => ({ year: Math.floor(index / 12), month: index % 12 + 1 });
const pad = (value: number) => String(value).padStart(2, "0");

export const isoDate = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;
export const monthLabel = ({ year, month }: YearMonth) => `${MONTH_NAMES[month - 1]} ${year}`;
export const monthOf = (iso: string): YearMonth => ({ year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) });
export const daysInMonth = ({ year, month }: YearMonth) => new Date(Date.UTC(year, month, 0)).getUTCDate();
export const addMonths = (from: YearMonth, delta: number) => fromIndex(monthIndex(from) + delta);
export const addYears = (from: YearMonth, delta: number): YearMonth => ({ year: from.year + delta, month: from.month });
export const withinBounds = (value: YearMonth) => monthIndex(value) >= monthIndex(FIRST_MONTH) && monthIndex(value) <= monthIndex(LAST_MONTH);
export const clampMonth = (value: YearMonth) => fromIndex(Math.min(Math.max(monthIndex(value), monthIndex(FIRST_MONTH)), monthIndex(LAST_MONTH)));

/** Today in America/Chicago as YYYY-MM-DD, whatever the server's or the reader's time zone is. */
export function chicagoToday(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

/** Weeks of the month, Sunday first; days outside the month are null. */
export function monthWeeks(value: YearMonth): Array<Array<number | null>> {
  const lead = new Date(Date.UTC(value.year, value.month - 1, 1)).getUTCDay();
  const cells: Array<number | null> = [...Array<null>(lead).fill(null), ...Array.from({ length: daysInMonth(value) }, (_, index) => index + 1)];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

export type NavControl = { target: YearMonth | null; label: string };
function navControl(name: string, target: YearMonth, end: string): NavControl {
  return withinBounds(target) ? { target, label: `${name}, ${monthLabel(target)}` } : { target: null, label: `${name}, not available. ${end}` };
}
const LATER_END = "Dates are loaded through 2028.";
const EARLIER_END = "Dates are loaded from January 2026 through 2028.";

/** The four movement controls for a month, each with its target (null at the ends) and its accessible label. */
export function navControls(value: YearMonth) {
  return {
    previousYear: navControl("Previous year", addYears(value, -1), EARLIER_END),
    previousMonth: navControl("Previous month", addMonths(value, -1), EARLIER_END),
    nextMonth: navControl("Next month", addMonths(value, 1), LATER_END),
    nextYear: navControl("Next year", addYears(value, 1), LATER_END),
  };
}

/** The plain statement shown whenever a control is off because the loaded dates end there. */
export function boundsNote(value: YearMonth): string | null {
  if (monthIndex(value) === monthIndex(LAST_MONTH)) return "Dates are loaded through 2028. There are no later months to show yet.";
  if (value.year === LAST_MONTH.year) return "Dates are loaded through 2028, so the next year is not available.";
  if (monthIndex(value) === monthIndex(FIRST_MONTH)) return "Dates are loaded from January 2026 through 2028. There are no earlier months to show.";
  if (value.year === FIRST_MONTH.year) return "Dates are loaded from January 2026 through 2028, so the previous year is not available.";
  return null;
}

export function dateStateKind(dateCertainty: string, confirmed: boolean): DateStateKind {
  if (dateCertainty.startsWith("moon")) return "moon";
  return confirmed ? "confirmed" : "expected";
}

/** The full calendar's wording for a date's certainty; the grid's marker uses the same words. */
export function dateStateText(kind: DateStateKind): string {
  if (kind === "moon") return "Depends on the moon or on an announcement, so it may shift. Confirm before planning.";
  return kind === "confirmed" ? "Date confirmed by a source." : "Expected date, not yet confirmed. Check with the organizer before planning.";
}

/** A small non-color marker; confirmed dates carry none. */
export const DATE_MARKERS: Record<Exclude<DateStateKind, "confirmed">, { symbol: string; short: string }> = {
  expected: { symbol: "≈", short: "expected date, not yet confirmed" },
  moon: { symbol: "☾", short: "depends on the moon or on an announcement" },
};

const STATE_CODES: Record<DateStateKind, StateCode> = { confirmed: "c", expected: "e", moon: "m" };
const STATE_KINDS: Record<StateCode, DateStateKind> = { c: "confirmed", e: "expected", m: "moon" };

/** Keeps only what the grid needs, and only dates that touch the months it can show. */
export function compactCalendar(entries: CalendarEntry[]): CompactEntry[] {
  const first = isoDate(FIRST_MONTH.year, FIRST_MONTH.month, 1);
  const last = isoDate(LAST_MONTH.year, LAST_MONTH.month, 31);
  return entries.flatMap((entry): CompactEntry[] => {
    const dates = entry.dates.flatMap((date): CompactDate[] => {
      if (!date.date || date.date > last || (date.endDate ?? date.date) < first) return [];
      const state = STATE_CODES[dateStateKind(entry.dateCertainty, date.confirmed)];
      return [date.endDate && date.endDate !== date.date ? [date.date, date.endDate, state] : [date.date, state]];
    });
    return dates.length ? [[entry.id, entry.name, dates]] : [];
  });
}

/** Every observance on each day of a month, by day number. Multi-day dates appear on each day they cover. */
export function dayEntries(entries: CompactEntry[], value: YearMonth): Map<number, DayEntry[]> {
  const first = isoDate(value.year, value.month, 1);
  const last = isoDate(value.year, value.month, daysInMonth(value));
  const days = new Map<number, DayEntry[]>();
  for (const [id, name, dates] of entries) for (const date of dates) {
    const start = date[0];
    const end = date.length === 3 ? date[1] : start;
    if (start > last || end < first) continue;
    const state = STATE_KINDS[date[date.length - 1] as StateCode];
    const from = start < first ? 1 : Number(start.slice(8));
    const to = end > last ? daysInMonth(value) : Number(end.slice(8));
    for (let day = from; day <= to; day += 1) {
      const list = days.get(day) ?? [];
      if (!list.some(item => item.id === id)) list.push({ id, name, start, end, state });
      days.set(day, list);
    }
  }
  // Single-day observances first, so a season lasting weeks does not push them behind "more".
  for (const list of days.values()) list.sort((a, b) => Number(a.start !== a.end) - Number(b.start !== b.end) || a.name.localeCompare(b.name, "en"));
  return days;
}

export function capDay<T>(items: T[], cap = DAY_ENTRY_CAP): { shown: T[]; more: number } {
  return items.length > cap ? { shown: items.slice(0, cap), more: items.length - cap } : { shown: items, more: 0 };
}

/** A stable, ASCII-only anchor for an observance on the full calendar. */
export function entryAnchor(id: string): string {
  return `entry-${id.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

export const calendarMonthHref = ({ year, month }: YearMonth) => `${CALENDAR_PATH}?year=${year}&month=${month}`;

/**
 * Link to an observance's detail. It names the month the date starts in, because that is
 * where the full calendar lists it; a date running on from an earlier month or year still
 * opens correctly.
 */
export function calendarEntryHref(id: string, start: string): string {
  const { year, month } = monthOf(start);
  return `${calendarMonthHref({ year, month })}&entry=${encodeURIComponent(id)}#${entryAnchor(id)}`;
}

export const calendarDayHref = (year: number, month: number, day: number) => `${calendarMonthHref({ year, month })}&day=${day}`;

export type UpcomingObservance = { id: string; name: string; start: string; end: string; state: DateStateKind; href: string };

/**
 * The next observances from today: anything still running today first, then the soonest
 * to start. Single-day observances come before long seasons that started on the same day,
 * so a month-long season does not crowd out a holiday. Each observance appears once.
 */
export function upcomingObservances(entries: CompactEntry[], today: string, count = 3): UpcomingObservance[] {
  const found = new Map<string, UpcomingObservance>();
  for (const [id, name, dates] of entries) for (const date of dates) {
    const start = date[0];
    const end = date.length === 3 ? date[1] : start;
    if (end < today) continue;
    const item = { id, name, start, end, state: STATE_KINDS[date[date.length - 1] as StateCode], href: calendarEntryHref(id, start) };
    const prior = found.get(id);
    if (!prior || item.start < prior.start) found.set(id, item);
  }
  const key = (item: UpcomingObservance) => item.start < today ? today : item.start;
  const sorted = [...found.values()]
    .sort((a, b) => key(a).localeCompare(key(b)) || Number(a.start !== a.end) - Number(b.start !== b.end) || a.name.length - b.name.length || a.name.localeCompare(b.name, "en"));
  // A local event of an observance already listed ("Diwali Puja at Milan Mandir" after "Diwali") adds nothing to a short preview.
  const picked: UpcomingObservance[] = [];
  for (const item of sorted) {
    if (picked.length >= count) break;
    const name = item.name.toLowerCase();
    if (!picked.some(other => name.includes(other.name.toLowerCase()))) picked.push(item);
  }
  return picked;
}

/** "November 11" or "November 1 to 30", for a short list. */
export function shortDateRange(start: string, end: string): string {
  const day = (iso: string) => `${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8))}`;
  if (start === end) return day(start);
  return start.slice(0, 7) === end.slice(0, 7) ? `${day(start)} to ${Number(end.slice(8))}` : `${day(start)} to ${day(end)}`;
}

/** The day param as a real date in the given month, or null. Requires a specific month. */
export function validDay(year: number, month: number | "all", value: unknown): string | null {
  if (month === "all" || typeof value !== "string" || !/^(?:[1-9]|[12]\d|3[01])$/.test(value)) return null;
  return Number(value) <= daysInMonth({ year, month }) ? isoDate(year, month, Number(value)) : null;
}

export const dateCovers = (date: CalendarDate, iso: string) => Boolean(date.date) && date.date! <= iso && (date.endDate ?? date.date!) >= iso;
