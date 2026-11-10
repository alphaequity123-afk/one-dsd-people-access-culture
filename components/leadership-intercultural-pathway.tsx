import Link from "next/link";
import { LearningTile } from "@/components/learning-tile";
import { courseContentItem, courseHref, courseSummary } from "@/lib/content/courses/published";
import type { CoursePack } from "@/lib/content/courses/source-types";
import { LEADERSHIP_INTERCULTURAL_PATHWAY, LEADERSHIP_LIFECYCLE_CONTEXTS, resolveLeadershipPathwayCourses } from "@/lib/content/leadership-intercultural-pathway";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";

export function LeadershipInterculturalPathway({ courses }: { courses: readonly CoursePack[] }) {
  return <section id="intercultural-leadership" className="my-10 scroll-mt-8">
    <h2 className="text-3xl font-semibold">Intercultural leadership in practice</h2>
    <p className="mt-4 max-w-3xl leading-8">Grow your ability to understand cultural perspectives, adapt your leadership, and improve the practices that shape employee experience. Recruitment, onboarding, supervision, development, and retention connect the learning to decisions you make every day.</p>
    <p className="mt-4 max-w-3xl leading-7">These three stages build from understanding to application across teams and systems. Each offers a different depth of practice. Choose what fits your current question, return to earlier learning when useful, and explore any course without a prerequisite or prior assessment.</p>
    <div className="mt-6 space-y-5">
      {LEADERSHIP_INTERCULTURAL_PATHWAY.map(stage => {
        const available = resolveLeadershipPathwayCourses(stage, courses);
        return <details id={`leadership-${stage.id}`} key={stage.id} className="leadership-pathway-stage scroll-mt-8 rounded-xl border border-[#c4d4e0] bg-[#f7f8fa] p-5 sm:p-7">
          <summary className="cursor-pointer text-xl font-semibold text-[#103f62] sm:text-2xl">{stage.title}</summary>
          <p className="mt-4 max-w-3xl leading-7">{stage.focus}</p>
          <h3 className="mt-6 text-lg font-semibold">What you can practice</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">{stage.objectives.map(objective => <li key={objective}>{objective}</li>)}</ul>
          <div className="mt-6 rounded-lg border border-[#d5dfe6] bg-white p-5"><h3 className="text-lg font-semibold">An onboarding example</h3><p className="mt-3 leading-7">{stage.example}</p><p className="mt-3 leading-7"><strong>Reflect:</strong> {stage.reflection}</p></div>
          <details className="my-6 border-y border-[#d5dfe6] py-4"><summary className="cursor-pointer font-semibold text-[#103f62]">Apply this across the employee life cycle</summary><dl className="mt-5 space-y-5">{LEADERSHIP_LIFECYCLE_CONTEXTS.map(context => <div key={context.id}><dt className="font-semibold">{context.title}</dt><dd className="mt-2 leading-7">{stage.applications[context.id]} <Link href={`/one-dsd/leadership?stage=${context.stage}#life-cycle`} className="font-semibold">Explore a workplace situation</Link></dd></div>)}</dl></details>
          <h3 className="text-lg font-semibold">Courses to explore</h3>
          {available.length ? <ul className="mt-5 grid gap-6 md:grid-cols-2">{available.map(pack => <li key={pack.course.id}><LearningTile item={{ ...courseContentItem(pack, { includeLessonBody: false }), id: `leadership-${stage.id}-course-${pack.course.id}` }} href={courseHref(pack.course.id)} presentation={{ imageSrc: pack.course.coverImage, imageAlt: pack.course.coverAlt, summary: courseSummary(pack) }} /></li>)}</ul> : <p className="mt-3 leading-7">Explore the <Link href="/learn">learning collection</Link> for a course that fits your question.</p>}
        </details>;
      })}
    </div>
    <details className="mt-6 border-t border-[#d5dfe6] pt-4"><summary className="cursor-pointer font-semibold text-[#103f62]">Intercultural development and your learning</summary><p className="mt-4 max-w-3xl leading-7">Intercultural development involves recognizing cultural differences, considering another perspective, and adapting behavior appropriately. The Intercultural Development Continuum describes Denial, Polarization, Minimization, Acceptance, and Adaptation. These ideas inform the learning; the three course stages do not assign you an orientation or measure your development. If you have an IDI development plan, you may use it to choose a focus. The same courses are available if you have not taken the IDI.</p><p className="mt-3 leading-7"><a href="https://www.idiinventory.com/idc">Explore the Intercultural Development Continuum</a></p></details>
    <p className="mt-5 max-w-3xl text-sm leading-6">{TRAINING_CREDIT_NOTICE}</p>
  </section>;
}
