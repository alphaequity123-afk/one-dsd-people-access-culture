import { CultureCalendar } from "@/components/culture-calendar";
import { publishedCalendar } from "@/lib/content/cultural-calendar";
import { chicagoToday, compactCalendar } from "@/lib/content/culture-calendar-grid";

/** Server half of the grid: publishedCalendar() stays the only source, and only a compact list reaches the browser. */
export async function CultureCalendarSection() {
  return <CultureCalendar entries={compactCalendar(await publishedCalendar())} initialToday={chicagoToday()} />;
}
