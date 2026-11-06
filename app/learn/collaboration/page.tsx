import type { Metadata } from "next";
import { ResourceDownloads } from "@/components/resource-downloads";
import Link from "next/link";
import { courseHref, courseSummary, publishedCourses } from "@/lib/content/courses/published";
import { requestedContentScope } from "@/lib/product/request-context";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import { COLLABORATION_FOCUSES, COLLABORATION_LEVELS, collaborationCourses, collaborationHref, normalizeCollaborationFilters } from "@/lib/learning/collaboration-collection";
import styles from "./collaboration.module.css";

export const metadata: Metadata = {
  title: "Teams and Cross-Collaboration",
  description: "Strengthen your team, work across the Disability Services Division and the Aging and Disability Services Administration, and collaborate with partners. Find learning at Foundation, Intermediate, and Advanced levels.",
};
export const dynamic = "force-dynamic";

function summary(text: string): string {
  if (text.length <= 235) return text;
  const cut = text.slice(0, 236);
  return `${cut.slice(0, cut.lastIndexOf(" ")).trimEnd()}…`;
}

export default async function CollaborationLearningPage({ searchParams }: { searchParams?: Promise<{ focus?: string | string[]; level?: string | string[] }> }) {
  const filters = normalizeCollaborationFilters(await searchParams ?? {});
  const scope = await requestedContentScope();
  const published = (await publishedCourses(scope)).map(row => row.pack);
  const allCourses = collaborationCourses(published);
  const visible = collaborationCourses(published, filters);
  const selectedFocus = COLLABORATION_FOCUSES.find(focus => focus.id === filters.focus);
  const selectedLevel = COLLABORATION_LEVELS.find(level => level.id === filters.level);

  return <div className={styles.page}>
    <div className={styles.content}>
      <p className={styles.back}><Link href="/learn">← Learn</Link></p>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Work better together</p>
        <h1>Teams and Cross-Collaboration</h1>
        <p className={styles.lede}>Good collaboration helps people contribute, understand one another, and carry shared work forward. Explore learning for your team, work across the Disability Services Division and the Aging and Disability Services Administration, and relationships with partners.</p>
        <p>Choose the situation that fits your work. Each course brings together explanation, examples, reflection, and practice you can return to when it is useful.</p><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="learn-page" id="collaboration" noun="collection" scope={scope} /></details>
      </header>

      <nav className={styles.paths} aria-label="Choose your collaboration focus">
        {COLLABORATION_FOCUSES.map(focus => {
          const count = allCourses.filter(course => course.focus === focus.id && (!filters.level || course.level === filters.level)).length;
          return <Link key={focus.id} href={collaborationHref({ ...filters, focus: focus.id })} className={styles.path} aria-current={filters.focus === focus.id ? "page" : undefined}>
            <span className={styles.pathTitle}>{focus.title}</span>
            <span>{focus.description}</span>
            <span className={styles.pathAction}>Explore {count} {count === 1 ? "course" : "courses"} <span aria-hidden="true">→</span></span>
          </Link>;
        })}
      </nav>

      <section className={styles.selection} aria-labelledby="choose-level-title">
        <div className={styles.selectionHeading}><h2 id="choose-level-title">Choose your depth</h2>{filters.focus ? <Link href={collaborationHref({ level: filters.level })}>See all three paths</Link> : null}</div>
        <p>Foundation builds understanding. Intermediate offers practice with situations. Advanced explores more complex shared responsibilities. These describe learning depth, not job rank. Directors, managers, supervisors, and staff can begin wherever the learning helps.</p>
        <nav className={styles.levels} aria-label="Learning level">
          <Link href={collaborationHref({ focus: filters.focus })} aria-current={!filters.level ? "page" : undefined}>All levels</Link>
          {COLLABORATION_LEVELS.map(level => <Link key={level.id} href={collaborationHref({ ...filters, level: level.id })} aria-current={filters.level === level.id ? "page" : undefined}>{level.title}</Link>)}
        </nav>
      </section>

      <section id="courses" className={styles.results} aria-labelledby="courses-title">
        <h2 id="courses-title">{selectedFocus?.title ?? "Explore the courses"}</h2>
        {selectedFocus ? <p className={styles.example}>{selectedFocus.example}</p> : <p>Open a topic to explore its courses, or choose a path above to focus on a particular kind of work.</p>}
        <p role="status" className={styles.count}>{visible.length} {visible.length === 1 ? "course" : "courses"}{selectedLevel ? ` · ${selectedLevel.title}` : " · All levels"}{selectedFocus ? ` · ${selectedFocus.title}` : " · All three paths"}</p>
        {!visible.length ? <div className={styles.empty}><h3>No courses are available in this selection.</h3><p>Choose another level or return to <Link href={collaborationHref()}>all collaboration learning</Link>.</p></div> : null}
        {COLLABORATION_FOCUSES.filter(focus => !filters.focus || focus.id === filters.focus).map(focus => {
          const rows = visible.filter(course => course.focus === focus.id);
          if (!rows.length) return null;
          const categories = [...new Set(rows.map(course => course.category))];
          return <section key={focus.id} className={styles.focusGroup} aria-label={focus.title}>
            {!selectedFocus ? <><h3>{focus.title}</h3><p>{focus.description}</p></> : null}
            {categories.map((category, index) => {
              const courses = rows.filter(course => course.category === category);
              // T84 is excluded; the public group describes the learning actually offered here.
              const title = focus.id === "partners" ? "Working with agencies, counties, providers, and communities" : category;
              return <details key={`${category}:${filters.level ?? "all"}`} className={styles.topic} open={Boolean(filters.focus || filters.level) || (focus.id === "teams" && index === 0)}>
                <summary><span>{title}</span><span className={styles.topicCount}>{courses.length} {courses.length === 1 ? "course" : "courses"}</span></summary>
                <ul className={styles.courseGrid}>{courses.map(({ pack, level, topicId }) => <li key={pack.course.id} data-collaboration-course={pack.course.id} data-collaboration-level={level} data-collaboration-topic={topicId}>
                  <p className={styles.courseLevel}>{COLLABORATION_LEVELS.find(item => item.id === level)!.title}</p>
                  <h4><Link href={courseHref(pack.course.id)} prefetch={false}>{pack.course.title}</Link></h4>
                  <p>{summary(courseSummary(pack))}</p>
                  <Link className={styles.courseAction} href={courseHref(pack.course.id)} prefetch={false} aria-label={`Explore ${pack.course.title}`}>Explore course <span aria-hidden="true">→</span></Link>
                </li>)}</ul>
              </details>;
            })}
          </section>;
        })}
      </section>
      <aside className={styles.continue}><h2>Keep exploring</h2><p><Link href="/learn?browse=all#catalog">Browse all learning and resources</Link><Link href="/library?theme=workforce">Find resources for team and workplace practice</Link></p></aside>
      <details className={styles.credit}><summary>About participation and training credit</summary><p>Learning here is voluntary. Choose what supports your work and return when it is useful.</p><p>{TRAINING_CREDIT_NOTICE}</p></details>
    </div>
  </div>;
}
