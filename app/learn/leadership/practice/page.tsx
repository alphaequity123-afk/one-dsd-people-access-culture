import Link from "next/link";
import { areaSlug } from "@/lib/dsd-live/leadership/areas";
import { practiceCases, practiceHome, practiceIntroduction } from "@/lib/dsd-live/leadership/practice";

export const metadata = { title: "Leadership simulations" };
export default function PracticeIndex() {
  return <>
    <nav className="crumbs" aria-label="Breadcrumb"><Link href="/learn">Learn</Link> / <Link href="/learn/leadership">One DSD Leadership</Link> / Simulations</nav>
    <div className="leadership-section"><h1>Make space to consider a leadership decision</h1><p className="learning-lede">{practiceIntroduction}</p><p>There is room to reconsider. Try another response, pause with a reflection question or prepare a small change that could improve someone’s experience. The goal is to understand the decision more clearly, not to rush through the activity.</p></div>
    <div className="leadership-library">{practiceCases.map(item => <section key={item.id} className="leadership-card">
      <p className="meta">{item.competency}</p><h2><Link href={practiceHome + "/" + areaSlug(item.id)}>{item.title}</Link></h2><p>{item.decisionPrompt}</p>
    </section>)}</div>
    <p><Link href="/learn/leadership/research">Research behind the practice</Link></p>
  </>;
}
