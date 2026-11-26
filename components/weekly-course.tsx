import Link from "@/components/app-link";
import Image from "next/image";
import { CORE_FIFTEEN } from "@/components/core-fifteen";
import { SELF_DIRECTED_COURSES, selfDirectedHref } from "@/lib/content/self-directed";
import { selfDirectedPresentation } from "@/lib/content/self-directed-covers";

const ROTATION = CORE_FIFTEEN.flatMap(group => [...group.numbers]);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// 1970-01-05 was a Monday, so each "week" turns over on Monday.
const FIRST_MONDAY = Date.UTC(1970, 0, 5);

/** The Core 15 course for a given Chicago date: one course a week, in the approved order. */
export function weeklyCourseNumber(chicagoDate: string): string {
  const [year, month, day] = chicagoDate.split("-").map(Number);
  const week = Math.floor((Date.UTC(year, month - 1, day) - FIRST_MONDAY) / WEEK_MS);
  return ROTATION[((week % ROTATION.length) + ROTATION.length) % ROTATION.length];
}

/** "This week's course": the one part of the landing page that changes, so returning staff find something new. */
export function WeeklyCourse({ today }: { today: string }) {
  const number = weeklyCourseNumber(today);
  const course = SELF_DIRECTED_COURSES.find(item => item.number === number);
  const href = course ? selfDirectedHref("self-directed-" + course.number) : undefined;
  if (!course || !href) return null;
  const cover = selfDirectedPresentation("self-directed-" + number, course.summary);
  return <section className="pilot-section home-weekly" aria-labelledby="home-weekly-title">
    <div className="pilot-section-heading"><h2 id="home-weekly-title">This week’s course</h2><Link href="/learn/core-15">See the Core 15</Link></div>
    <div className="home-weekly-card">
      {cover ? <Image src={cover.imageSrc} alt={cover.imageAlt} width={640} height={360} sizes="(min-width: 640px) 300px, 100vw" unoptimized /> : null}
      <div>
        <p className="home-weekly-level">{course.level} · Self-directed</p>
        <h3>{course.title}</h3>
        <p>{course.summary}</p>
        <Link className="pilot-secondary" href={href}>Start the course</Link>
      </div>
    </div>
  </section>;
}
