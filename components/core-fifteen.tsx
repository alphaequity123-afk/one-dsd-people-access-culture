import Link from "next/link";
import { SELF_DIRECTED_COURSES, selfDirectedHref } from "@/lib/content/self-directed";
import { ExplainerVideo } from "@/components/explainer-video";

/** The Core 15: the courses every staff member is encouraged to start with. Approved by the program lead, Oct 25, 2026. */
const CORE_FIFTEEN = [
  { title: "Start here", note: "A shared language for equity, access and everyday judgment", numbers: ["F21", "F02", "F05", "F09", "F10", "F15"] },
  { title: "Apply it", note: "Equity brought into real decisions and services", numbers: ["I09", "I10", "I21", "I15", "I17", "I06"] },
  { title: "Lead it", note: "The systems view that policy and leadership require", numbers: ["A09", "A20", "A21"] },
] as const;

export function CoreFifteen({ standalone = false }: { standalone?: boolean }) {
  const groups = CORE_FIFTEEN.map(group => ({
    ...group,
    courses: group.numbers.flatMap(number => {
      const course = SELF_DIRECTED_COURSES.find(item => item.number === number);
      const href = course ? selfDirectedHref("self-directed-" + course.number) : undefined;
      return course && href ? [{ number, title: course.title, href }] : [];
    }),
  }));
  const content = <div id="start-here" className="scroll-mt-24 space-y-4">
      <p className="max-w-3xl">Fifteen recommended courses for staff. Choose a course that fits your work and learn at your own pace.</p>
      <div className={standalone ? "space-y-8" : "grid gap-6 md:grid-cols-3"}>
        {groups.map(group => <div key={group.title}>
          <h3 className="text-lg font-bold">{group.title}</h3>
          <p className="text-muted">{group.note}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">{group.courses.map(course => <li key={course.number}><Link href={course.href}>{course.title}</Link></li>)}</ol>
        </div>)}
      </div>
      <p><Link href="/learn/self-directed">See all 72 courses in the self-directed series</Link></p>
      <ExplainerVideo id="core-fifteen" />
    </div>;
  return standalone ? content : <details className="course-more-item" suppressHydrationWarning>
    <summary><h2 id="core-fifteen-title">The Core 15</h2></summary>
    {content}
  </details>;
}
