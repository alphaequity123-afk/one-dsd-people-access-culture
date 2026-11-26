import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { deepCourses, type DeepCourse } from "@/lib/dsd-live/leadership/deep";
import { courseHref, root } from "@/lib/dsd-live/leadership/collection";
import Listen from "./listen";
import Depths from "./depths";
import Simulation from "./simulation";
import Plan from "./plan";

const media = (id: string) => "/learning-media/leading-others/deep/" + id;
const ready = (path: string) =>
  existsSync(join(process.cwd(), "public", path, "audio.mp3")) &&
  existsSync(join(process.cwd(), "public", path, "captions.vtt"));

export default function DeepCoursePage({ c }: { c: DeepCourse }) {
  const audio = media(c.id);
  const related = deepCourses
    .filter((p) => p.id !== c.id && p.series === c.series && p.theme === c.theme)
    .slice(0, 3);
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/learn">Learn</Link> / <Link href={root}>Leadership courses</Link> ›
        Course
      </nav>
      <header className="lo-course-heading">
        <div>
          <p className="lo-kicker">
            {c.series} · {c.theme}
          </p>
          <h1>{c.title}</h1>
          <p className="lo-intro">{c.objective}</p>
          {(
            <Listen
              available={ready(audio)}
              title={
                (c.media.kind === "conversation"
                  ? "Listen to the conversation: "
                  : "Listen to the lesson: ") + c.title
              }
              src={audio + "/audio.mp3"}
              captions={audio + "/captions.vtt"}
            >
              {c.media.script.map((t, i) => (
                <p key={i}>
                  {c.media.kind === "conversation" && (
                    <>
                      <strong>{t.role}</strong>
                      <br />
                    </>
                  )}
                  {t.text}
                </p>
              ))}
            </Listen>
          )}
        </div>
        {c.photo && (
          <Image
            className="lo-case-photo"
            src={c.photo.src}
            alt={c.photo.alt}
            width={880}
            height={540}
            sizes="(max-width:720px) 94vw, 475px"
            priority
          />
        )}
      </header>
      <div className="lo-reading">
        <section>
          <h2>What you will be able to do</h2>
          <ul>
            {c.outcomes.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
        <section className="lo-band lo-evidence" aria-labelledby={c.id + "-ev"}>
          <h2 id={c.id + "-ev"}>What the research shows</h2>
          <p>{c.evidence.summary}</p>
          <ul className="lo-findings">
            {c.evidence.findings.map((f, i) => (
              <li key={i}>
                <strong>{f.claim}</strong>
                <span>{f.detail}</span>
                <a href={f.url}>{f.source}</a>
              </li>
            ))}
          </ul>
        </section>
        <aside className="lo-surprise" aria-label="A finding that surprises many leaders">
          <p className="lo-kicker">What surprises many leaders</p>
          <h2>{c.counterintuitive.headline}</h2>
          <p>{c.counterintuitive.text}</p>
        </aside>
        <Depths depths={c.depths} />
        <Simulation
          setup={c.simulation.setup}
          steps={c.simulation.steps}
          debrief={c.simulation.debrief}
        />
        <section aria-labelledby={c.id + "-mis"}>
          <h2 id={c.id + "-mis"}>Common mistakes, and why smart people make them</h2>
          {c.mistakes.map((m, i) => (
            <details key={i} className="lo-lesson" open={i === 0}>
              <summary>{m.mistake}</summary>
              <p>{m.why}</p>
              <p>
                <strong>Instead:</strong> {m.instead}
              </p>
            </details>
          ))}
        </section>
        <section className="lo-band lo-jobaid" aria-labelledby={c.id + "-aid"}>
          <h2 id={c.id + "-aid"}>Job aid: {c.jobAid.title}</h2>
          <p>{c.jobAid.use}</p>
          <ol>
            {c.jobAid.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>
        <Plan prompts={c.plan.prompts} />
        <section className="lo-band">
          <h2>Sources</h2>
          <ul className="leadership-links lo-sources">
            {c.sources.map((s) => (
              <li key={s.url + s.title}>
                <a href={s.url}>{s.title}</a> · {s.authors}, {s.year}
              </li>
            ))}
          </ul>
          {related.length > 0 && (
            <>
              <h3>Related courses</h3>
              <ul className="leadership-links">
                {related.map((p) => (
                  <li key={p.id}>
                    <Link href={courseHref(p.id)}>{p.title}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p>
            <Link href={root + "#courses"}>Browse all {deepCourses.length} courses</Link>
          </p>
        </section>
      </div>
    </>
  );
}
