import Image from "next/image";
import Link from "next/link";
import { courses, families, root } from "@/lib/dsd-live/leadership/collection";
import { deepCourses } from "@/lib/dsd-live/leadership/deep";
import Directory from "./directory";

export const metadata = { title: "Leadership courses" };

export default function LeadershipCourses() {
  const list = deepCourses.length ? deepCourses : courses;
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/learn">Learn</Link> ›{" "}
        <Link href="/learn/leadership">One DSD Leadership</Link> › Leadership
        courses
      </nav>
      <div className="leadership-hero lo-hero">
        <div>
          <h1>Leadership courses</h1>
          <p>
            An acting assignment opens on your team. You know whose work gets
            seen at the morning meeting. What evidence would help you compare
            two people who work different shifts?
          </p>
          <p>
            Practice decisions like this wherever you lead, from your first
            project to a change that affects several programs.
          </p>
          <a className="button" href="#courses">
            Find a course
          </a>
        </div>
        <Image
          src="/images/home/people-access-culture-hero.webp"
          alt="Colleagues around a conference table considering a decision."
          width={3840}
          height={1748}
          priority
          sizes="(max-width:720px) 94vw, 540px"
        />
      </div>
      <section aria-labelledby="courses" className="lo-band">
        <h2 id="courses">Choose a course</h2>
        <p>
          The {list.length} courses open in any order. Each one draws on
          checked research and a case you work through. Choose a decision you
          face or explore a responsibility you want to grow into.
        </p>
        <Directory
          courses={list.map(({ id, title, series, theme, roles }) => ({
            id,
            title,
            series,
            theme,
            roles,
          }))}
          families={families}
        />
      </section>
    </>
  );
}
