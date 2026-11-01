"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  boundsNote, CALENDAR_ICS_PATH, calendarDayHref, calendarEntryHref, calendarMonthHref, capDay, chicagoToday, clampMonth, DATE_MARKERS, dateStateText,
  dayEntries, isoDate, monthLabel, monthOf, monthWeeks, MONTH_NAMES, navControls, WEEKDAY_NAMES, withinBounds,
  type CompactEntry, type DayEntry, type NavControl, type YearMonth,
} from "@/lib/content/culture-calendar-grid";
import styles from "./culture-calendar.module.css";

const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

function daysWithObservances(count: number) {
  if (!count) return "No observances are loaded for this month.";
  return count === 1 ? "1 day has observances." : `${count} days have observances.`;
}

function NavButton({ control, ready, onMove, children }: { control: NavControl; ready: boolean; onMove: (target: YearMonth) => void; children: ReactNode }) {
  // aria-disabled rather than disabled: a button that reaches an end keeps keyboard focus.
  const off = !ready || !control.target;
  return <button type="button" className={styles.control} aria-label={control.label} aria-disabled={off || undefined} onClick={() => { if (!off) onMove(control.target!); }}>{children}</button>;
}

function EntryLink({ entry }: { entry: DayEntry }) {
  const marker = entry.state === "confirmed" ? null : DATE_MARKERS[entry.state];
  return <Link className={styles.entry} prefetch={false} href={calendarEntryHref(entry.id, entry.start)} title={`${entry.name}. ${dateStateText(entry.state)}`}>
    <span className={styles.entryName}>{entry.name}</span>
    {marker ? <><span className={styles.marker} aria-hidden="true">{marker.symbol}</span><span className={styles.srOnly}> ({marker.short})</span></> : null}
  </Link>;
}

function DayEntries({ view, day, items }: { view: YearMonth; day: number; items: DayEntry[] }) {
  const { shown, more } = capDay(items);
  return <>
    <ul className={styles.entries}>{shown.map(entry => <li key={entry.id}><EntryLink entry={entry} /></li>)}</ul>
    {more ? <Link className={styles.more} prefetch={false} href={calendarDayHref(view.year, view.month, day)} aria-label={`${more} more on ${MONTH_NAMES[view.month - 1]} ${day}, ${view.year}`}>{more} more</Link> : null}
  </>;
}

export function CultureCalendar({ entries, initialToday }: { entries: CompactEntry[]; initialToday: string }) {
  const ready = useSyncExternalStore(subscribeNever, onClient, onServer);
  const today = useSyncExternalStore(subscribeNever, chicagoToday, () => initialToday);
  const [selected, setSelected] = useState<YearMonth | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const todayMonth = monthOf(today);
  const view = selected ?? clampMonth(todayMonth);
  const { year, month } = view;
  const days = dayEntries(entries, view);
  const controls = navControls(view);
  const note = boundsNote(view);
  const todayAvailable = withinBounds(todayMonth);

  function move(target: YearMonth) {
    setSelected(target);
    const edge = boundsNote(target);
    setAnnouncement(`${monthLabel(target)}. ${daysWithObservances(dayEntries(entries, target).size)}${edge ? ` ${edge}` : ""}`);
  }

  const listedDays = [...days.keys()].sort((a, b) => a - b);
  return <section className={styles.root} aria-labelledby="culture-calendar-title">
    <h2 id="culture-calendar-title" className={styles.title}>One DSD Culture Calendar</h2>
    <p className={styles.note}>A date does not tell you whether a particular person observes it.</p>
    <div className={styles.toolbar}>
      <div className={styles.controls}>
        <NavButton control={controls.previousYear} ready={ready} onMove={move}><span aria-hidden="true">«</span> Year</NavButton>
        <NavButton control={controls.previousMonth} ready={ready} onMove={move}><span aria-hidden="true">‹</span> Month</NavButton>
      </div>
      <h3 id="culture-calendar-month" className={styles.month}>{monthLabel(view)}</h3>
      <div className={styles.controls}>
        <NavButton control={controls.nextMonth} ready={ready} onMove={move}>Month <span aria-hidden="true">›</span></NavButton>
        <NavButton control={controls.nextYear} ready={ready} onMove={move}>Year <span aria-hidden="true">»</span></NavButton>
        <button type="button" className={styles.control} aria-label={todayAvailable ? `Today, ${monthLabel(todayMonth)}` : "Today, not available. Dates are loaded from January 2026 through 2028."} aria-disabled={!ready || !todayAvailable || undefined} onClick={() => { if (ready && todayAvailable) move(monthOf(chicagoToday())); }}>Today</button>
      </div>
    </div>
    {note ? <p className={styles.bounds}>{note}</p> : null}
    <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    <noscript><p className={styles.bounds}>Moving between months needs JavaScript. Use the <a href={calendarMonthHref(view)}>full calendar</a> to see any month.</p></noscript>

    <table className={styles.grid} aria-labelledby="culture-calendar-month">
      <thead><tr>{WEEKDAY_NAMES.map(name => <th key={name} scope="col"><span aria-hidden="true">{name.slice(0, 3)}</span><span className={styles.srOnly}>{name}</span></th>)}</tr></thead>
      <tbody>{monthWeeks(view).map((week, index) => <tr key={index}>{week.map((day, column) => {
        if (day === null) return <td key={`blank-${column}`} className={styles.blank} />;
        const isToday = isoDate(year, month, day) === today;
        const items = days.get(day);
        return <td key={day} className={isToday ? styles.today : undefined} aria-current={isToday ? "date" : undefined}>
          <div className={styles.dayHead}><span className={styles.dayNumber}><span className={styles.srOnly}>{MONTH_NAMES[month - 1]} </span>{day}</span>{isToday ? <span className={styles.todayTag}>Today</span> : null}</div>
          {items ? <DayEntries view={view} day={day} items={items} /> : null}
        </td>;
      })}</tr>)}</tbody>
    </table>

    <ol className={styles.dayList} aria-labelledby="culture-calendar-month">{listedDays.map(day => {
      const iso = isoDate(year, month, day);
      const isToday = iso === today;
      const weekday = WEEKDAY_NAMES[new Date(`${iso}T12:00:00Z`).getUTCDay()];
      return <li key={day} className={isToday ? styles.today : undefined} aria-current={isToday ? "date" : undefined}>
        <h4 className={styles.dayListHead}>{weekday}, {MONTH_NAMES[month - 1]} {day}{isToday ? <span className={styles.todayTag}>Today</span> : null}</h4>
        <DayEntries view={view} day={day} items={days.get(day)!} />
      </li>;
    })}</ol>
    {!listedDays.length ? <p className={styles.note}>{entries.length ? "No observances are loaded for this month." : "Dates are not available here right now. Try the full calendar."}</p> : null}

    <p className={styles.legend}><span aria-hidden="true">{DATE_MARKERS.expected.symbol}</span> Expected date, not yet confirmed. <span aria-hidden="true">{DATE_MARKERS.moon.symbol}</span> Depends on the moon or on an announcement, so it may shift. No mark means the date is confirmed by a source.</p>
    <p className={styles.links}><Link prefetch={false} href={calendarMonthHref(view)}>View the full calendar</Link><a href={CALENDAR_ICS_PATH}>Download confirmed dates for your own calendar</a></p>
  </section>;
}
