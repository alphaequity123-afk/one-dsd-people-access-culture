import { calendarIcs, publishedCalendar } from "@/lib/content/cultural-calendar";

export async function GET() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return new Response(calendarIcs(await publishedCalendar(), stamp), {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="one-dsd-cultural-calendar.ics"', "cache-control": "no-store" },
  });
}
