import Image from "next/image";
import Link from "next/link";
import { guideDownloads } from "@/lib/dsd-live/leadership/styles";
import { currentUnit } from "@/lib/dsd-live/unit";

export function generateMetadata() {
  return { title: `About · ${currentUnit().short} Leadership` };
}

/** Why the leadership section exists and how to use it, moved off the landing page so the styles lead. */
export default function LeadershipAbout() {
  const unit = currentUnit();
  const dsd = unit.id === "dsd";
  const downloads = guideDownloads(unit.id);
  return <article className="article-layout">
    <header className="article-head">
      <Link className="article-tag" href="/learn/leadership">{unit.short} Leadership</Link>
      <h1>Why leadership matters here</h1>
      <p className="article-lede">Leadership shapes whether {dsd ? "Minnesotans with disabilities and their families" : "every person the department serves"} get service that is fair, respectful and easy to understand.</p>
      <figure className="article-figure">
        <Image src="/images/home/featured-leadership-hd.webp" alt="A supervisor listens as a colleague explains an idea to a small team gathered by tall office windows; one team member uses a wheelchair." width={3840} height={2560} sizes="(max-width:720px) 94vw, 736px" priority />
      </figure>
    </header>
    <p>{unit.name} exists so that {dsd ? "the people the Disability Services Division serves" : "every person the Minnesota Department of Human Services serves"} receive fair, respectful and understandable service. How staff listen, explain and decide shapes whether those people can actually reach the help the law promises them.</p>
    <p>Leaders set the conditions for that work. The way you use authority, share decisions, hand over work and develop people shapes whether staff feel able to raise a concern, whether they can adapt to the person in front of them, and whether the team stays steady through change.</p>
    <h2>How to use the styles</h2>
    <ul>
      <li><strong>Every leader uses several styles.</strong> The aim is to see your own patterns clearly and choose your approach on purpose.</li>
      <li><strong>Each style is described the same way:</strong> what it looks like, where it helps, where it costs, how it affects staff and the people they serve, and what to do.</li>
      <li><strong>The guidance supports your judgment.</strong> Decisions stay with you and the person or area responsible.</li>
      {dsd ? <li><strong>Disability is part of the picture throughout.</strong> Accessibility, accommodation and person-centered practice appear in every style, because they shape both the team and the service.</li> : null}
    </ul>
    <p>The full guide to every style: <a href={downloads.docx} download>Word</a> · <a href={downloads.pdf} download>PDF</a></p>
    <p><Link className="button" href="/learn/leadership">Back to the leadership styles</Link></p>
  </article>;
}
