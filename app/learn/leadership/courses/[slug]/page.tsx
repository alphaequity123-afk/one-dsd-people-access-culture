import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { publicFileAvailable } from "@/lib/storage/public-offload-manifest";
import { join } from "node:path";
import {
  courses,
  courseHref,
  families,
  guidedLessons,
  guides,
  photos,
  podcasts,
  root,
} from "@/lib/dsd-live/leadership/collection";
import { absorbedBy, deepCourse } from "@/lib/dsd-live/leadership/deep";
import { pageHref } from "@/lib/dsd-live/leadership/program";
import Listen from "../listen";
import Practice from "../practice";
import DeepCoursePage from "../deep-course";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return {
    title:
      deepCourse(slug)?.title ??
      courses.find((c) => c.id === slug)?.title ??
      "Course",
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const deep = deepCourse(slug);
  if (deep) return <DeepCoursePage c={deep} />;
  const replacement = absorbedBy(slug);
  if (replacement) permanentRedirect(courseHref(replacement.id));
  const c = courses.find((c) => c.id === slug);
  if (!c) notFound();
  const guide = guides[c.guide - 1];
  const photo = photos[c.id];
  const audio = "/learning-media/leading-others/" + c.id;
  const lesson = guidedLessons.find((l) => l.id === c.id);
  const canPlay = (path: string) =>
    publicFileAvailable(join(process.cwd(), "public", path, "audio.mp3")) &&
    publicFileAvailable(join(process.cwd(), "public", path, "captions.vtt"));
  const podcast = podcasts.find((p) => p.courseIds.includes(c.id));
  const related = courses
    .filter(
      (p) => p.id !== c.id && p.series === c.series && p.theme === c.theme,
    )
    .slice(0, 2);
  const {
    decision,
    choices,
    perspective,
    reconsider,
    reflection,
    transfer,
    followup,
  } = c;
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/learn">Learn</Link> /{" "}
        <Link href={root}>Leadership courses</Link> / Course
      </nav>
      <header className="lo-course-heading">
        <div>
          <p className="lo-kicker">{c.theme}</p>
          <h1>{c.title}</h1>
          <p className="lo-intro">{c.objective.replace(/[.!?]$/, "")}.</p>
          <a href="#situation">Try the case</a>
        </div>
        {photo && (
          <Image
            className="lo-case-photo"
            src={photo.src}
            alt={photo.alt}
            width={880}
            height={540}
            sizes="(max-width:720px) 94vw, 475px"
            priority
          />
        )}
      </header>
      <div className="lo-reading">
        <section>
          <h2>What you’ll practice</h2>
          <p>{c.learn.replace(/[.!?]$/, "")}.</p>
          {lesson && (
            <>
              <h3>{canPlay(audio + "/lesson") ? "Listen to the lesson" : "Read the lesson"}</h3>
              <Listen
                available={canPlay(audio + "/lesson")}
                title={"Listen to the lesson on " + c.title}
                src={audio + "/lesson/audio.mp3"}
                captions={audio + "/lesson/captions.vtt"}
              >
                {lesson.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Listen>
            </>
          )}
          {c.teaching.map((unit, i) => (
            <details key={i} className="lo-lesson" open={i === 0}>
              <summary>{unit.title}</summary>
              {unit.text
                .split(/\n\s*\n|\n/)
                .filter(Boolean)
                .map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
            </details>
          ))}
        </section>
        <section aria-labelledby="situation" className="lo-band">
          <h2 id="situation">A decision at work</h2>
          <p className="lo-fine">Fictional practice scenario</p>
          <p>{c.scenario}</p>
          {canPlay(audio) && (
            <>
              <h3>Listen to the case</h3>
              <Listen
                title={"Listen to the case for " + c.title}
                src={audio + "/audio.mp3"}
                captions={audio + "/captions.vtt"}
              >
                <p>
                  {c.scenario} {c.decision}
                </p>
              </Listen>
            </>
          )}
        </section>
        <Practice
          course={{
            decision,
            choices,
            perspective,
            reconsider,
            reflection,
            transfer,
            followup,
          }}
          guide={guide}
          guideNumber={c.guide}
        />
        <details className="lo-lesson">
          <summary>Consider your role in this decision</summary>
          <p>
            If you lead without formal authority, identify the evidence you can
            bring and who can act on it. If you supervise others, consider who
            relies on your decision and how they can challenge it.
          </p>
          <ul className="leadership-links">
            {families
              .filter((f) => c.roles.includes(f.title))
              .map((f) => (
                <li key={f.id}>
                  <strong>{f.title}</strong> · {f.authority}
                </li>
              ))}
          </ul>
        </details>
        {podcast && (
          <section className="lo-band">
            <h2>Two perspectives</h2>
            <h3>{podcast.title}</h3>
            <p>
              {podcast.turns[0].role} and {podcast.turns[1].role.toLowerCase()}{" "}
              discuss the decision from their different positions.
            </p>
            <Listen
              available={publicFileAvailable(join(process.cwd(), "public/learning-media/leading-others/podcasts", podcast.id + ".mp3")) && publicFileAvailable(join(process.cwd(), "public/learning-media/leading-others/podcasts", podcast.id + ".vtt"))}
              title={podcast.title}
              src={
                "/learning-media/leading-others/podcasts/" + podcast.id + ".mp3"
              }
              captions={
                "/learning-media/leading-others/podcasts/" + podcast.id + ".vtt"
              }
            >
              {podcast.turns.map((turn, i) => (
                <p key={i}>
                  <strong>{turn.role}</strong>
                  <br />
                  {turn.text}
                </p>
              ))}
            </Listen>
          </section>
        )}
        <section className="lo-band">
          <h2>Continue exploring</h2>
          <ul className="leadership-links">
            {c.articleId && (
              <li>
                <Link href={pageHref(c.articleId)}>
                  Read the full leadership article and its learning connections
                </Link>
              </li>
            )}
            {c.sources?.map((s) => (
              <li key={s.url}>
                <a href={s.url}>{s.title}</a>
              </li>
            ))}
            {related.map((p) => (
              <li key={p.id}>
                <Link href={courseHref(p.id)}>{p.title}</Link>
              </li>
            ))}
            <li>
              <Link href={root + "#courses"}>Browse leadership courses</Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
