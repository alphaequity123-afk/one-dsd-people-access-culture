import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { facetValue, type FacetItem } from "@/lib/graph/facets";

type Props = { params: Promise<{ role: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role } = await params;
  return { title: facetValue("role", role)?.title ?? "Growth path" };
}

const LEADS = new Set(["supervisor_manager", "leadership", "equity_professional"]);

function List({ items }: { items: FacetItem[] }) {
  return <ul className="calm-list">{items.map(item => <li key={item.id}><Link href={item.href}>{item.title}</Link></li>)}</ul>;
}

export default async function GrowthRolePage({ params }: Props) {
  const { role } = await params;
  const entry = facetValue("role", role);
  if (!entry) notFound();
  const pick = (kinds: string[], n: number) => entry.items.filter(item => kinds.includes(item.kind)).slice(0, n);
  const learn = pick(["course", "lesson"], 4);
  const apply = pick(["practice"], 4);
  const tools = pick(["resource"], 3);
  const leading = LEADS.has(role);
  return <div className="calm calm-narrow">
    <nav className="calm-crumbs" aria-label="Breadcrumb"><Link href="/growth">Growth paths</Link></nav>
    <p className="calm-kicker">Growth path</p>
    <h1>{entry.title}</h1>
    <p className="calm-lede">Three steps, each a few weeks long if you like. After each step, write one action plan so the learning shows up in your work.</p>
    <ol className="calm-steps">
      <li>
        <h2 style={{ marginTop: 0 }}>Start: build a shared foundation</h2>
        <p>Begin with the <Link href="/learn#start-here">Core 15 courses</Link>, then choose one of these.</p>
        {learn.length ? <List items={learn} /> : null}
      </li>
      <li>
        <h2 style={{ marginTop: 0 }}>Apply: use it on a real piece of work</h2>
        <p>Pick a decision, meeting or document that is in front of you now and work through one guided practice.</p>
        {apply.length ? <List items={apply} /> : null}
        {tools.length ? <><p className="calm-muted calm-small">Tools that help along the way:</p><List items={tools} /></> : null}
        <p><Link className="calm-button calm-button--quiet" href={`/my-work/action-plan?from=${encodeURIComponent(entry.title + " growth path")}`}>Write an action plan</Link></p>
      </li>
      <li>
        <h2 style={{ marginTop: 0 }}>{leading ? "Lead: help your team do it together" : "Share: bring a colleague along"}</h2>
        {leading ? <p>Use a <Link href="/team-kits">team kit</Link> to run a twenty-minute session, and keep a <Link href="/my-work/decision-records">decision record</Link> for the next consequential choice. The <Link href="/leading">leaders&apos; entry point</Link> holds questions for the hardest moments.</p>
          : <p>Share a link to something that helped, or suggest a <Link href="/team-kits">team kit</Link> for your next staff meeting.</p>}
      </li>
    </ol>
    <p><Link href={`/explore/role/${entry.id}`}>See everything connected with this role</Link></p>
  </div>;
}
