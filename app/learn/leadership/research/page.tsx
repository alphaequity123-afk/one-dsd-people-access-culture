import Link from "next/link";
import { practiceHome, practiceSources } from "@/lib/dsd-live/leadership/practice";
import { pageHref } from "@/lib/dsd-live/leadership/program";

export const metadata = { title: "Research and guidance for leadership practice" };
export default function Research() {
  return <article className="leadership-section article-layout">
    <nav className="crumbs" aria-label="Breadcrumb"><Link href="/learn">Learn</Link> › <Link href="/learn/leadership">One DSD Leadership</Link> › Research</nav>
    <h1>Research and guidance for leadership practice</h1><p className="learning-lede">A study can help us ask a better question without settling every decision. Practice and legal guidance help us understand responsibilities and consider the next step. These sources inform the leadership learning. As you read, consider what each source offers on participation, trust and access—and where its setting or authority differs.</p>
    <p><Link href={pageHref("research")}>Read the ten studies and reports in the leadership program</Link> or <Link href={practiceHome}>choose a simulation</Link>.</p>
    {practiceSources.map(s => <section key={s.id} id={s.id}>
      <h2>{s.title}</h2><p>{s.finding}</p><p><strong>Scope. </strong>{s.limit}</p><p><strong>In this program. </strong>{s.application}</p>
      <a href={s.url}>Read the source<span className="sr-only"> for {s.title}</span></a>
    </section>)}
  </article>;
}
