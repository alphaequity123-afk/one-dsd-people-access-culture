import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintPageButton } from "@/components/hub/print-page-button";
import { formatPolicyDate, getPolicies, getPolicy, getPolicyKind, policiesByTag, policyHref } from "@/lib/content/hub/dsd-policies";
import styles from "../../hub.module.css";

const PAGE_TITLES: Record<string, string> = {
  "/community-outreach/county-agencies": "County agencies",
  "/community-outreach/county-map": "Minnesota county map",
  "/community-outreach/how-the-system-connects": "How the system connects",
  "/community-outreach/plan": "Community outreach plan",
  "/community-outreach/providers": "Providers and designated agencies",
  "/equity-policy": "Equity policy",
  "/equity-review": "Equity review",
  "/equity-review/working-group-plan": "Equity review working group plan",
  "/learn/equity-toolkit": "Equity toolkit",
  "/minnesota-communities": "Minnesota communities",
};

function pageTitle(route: string): string {
  return PAGE_TITLES[route] ?? route.split("/").filter(Boolean).map(part => part.replace(/-/g, " ")).join(": ");
}

export function generateStaticParams() {
  return getPolicies().map(p => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const policy = getPolicy((await params).id);
  return policy ? { title: `${policy.title} (Policies that shape disability services)`, description: policy.summary } : { title: "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const policy = getPolicy((await params).id);
  if (!policy) notFound();
  const kind = getPolicyKind(policy.kind);
  const related = new Map<string, { id: string; title: string }>();
  for (const tag of policy.tags) {
    for (const other of policiesByTag(tag)) {
      if (other.id !== policy.id && related.size < 8) related.set(other.id, { id: other.id, title: other.title });
    }
  }

  return <article className={styles.page}>
    <p className={`${styles.kicker} ${styles.noPrint}`}><Link href="/community-outreach">Community Outreach and Engagement</Link> · <Link href="/community-outreach/policies">Policies that shape disability services</Link></p>
    {kind ? <p className={styles.kicker}>{kind.title}</p> : null}
    <h1 className={styles.title}>{policy.title}</h1>
    <div>{policy.programs.map(name => <span className={styles.chip} key={name}>{name}</span>)}</div>
    <p className={styles.meta}>Applies to: {policy.appliesTo.join(", ")}</p>
    <p className={styles.lede}>{policy.summary}</p>
    <p className={styles.note}>This is a summary written in plain language. The policy itself is the source document linked below. Check the date on the source before relying on it.</p>
    <p className={styles.noPrint}><PrintPageButton /></p>

    <section className={styles.section} aria-labelledby="dates-title">
      <h2 id="dates-title">Dates and source</h2>
      <table className={styles.table}>
        <tbody>
          <tr><th scope="row">Effective</th><td>{policy.effective ? formatPolicyDate(policy.effective) : "Not stated on the source"}</td></tr>
          <tr><th scope="row">Last updated</th><td>{policy.lastUpdated ? formatPolicyDate(policy.lastUpdated) : "Not shown on the source"}</td></tr>
          <tr><th scope="row">Facts checked</th><td>{formatPolicyDate(policy.checked)}</td></tr>
          <tr><th scope="row">Source</th><td><a href={policy.source.url}>{policy.source.title}</a>{policy.source.date ? ` (${formatPolicyDate(policy.source.date)})` : ""}<br /><span className={styles.small}>{policy.source.url}</span></td></tr>
        </tbody>
      </table>
    </section>

    <section className={styles.section} aria-labelledby="requires-title">
      <h2 id="requires-title">What it requires</h2>
      <ul className="list-disc pl-6">{policy.requires.map(item => <li key={item}>{item}</li>)}</ul>
    </section>

    <section className={styles.section} aria-labelledby="equity-title">
      <h2 id="equity-title">What to check for equity</h2>
      <ul className="list-disc pl-6">{policy.equityCheck.map(item => <li key={item}>{item}</li>)}</ul>
      <p className={styles.noPrint}><Link href="/equity-review/analyze">Analyze a policy document</Link> · <Link href="/equity-review">Equity review</Link></p>
    </section>

    {policy.relatedSources.length ? <section className={styles.section} aria-labelledby="sources-title">
      <h2 id="sources-title">Related sources</h2>
      <ul className="list-disc pl-6">{policy.relatedSources.map(s => <li key={s.url}><a href={s.url}>{s.title}</a></li>)}</ul>
    </section> : null}

    {policy.relatedPages.length ? <section className={`${styles.section} ${styles.noPrint}`} aria-labelledby="pages-title">
      <h2 id="pages-title">Related program pages</h2>
      <ul className="list-disc pl-6">{policy.relatedPages.map(route => <li key={route}><Link href={route}>{pageTitle(route)}</Link></li>)}</ul>
    </section> : null}

    {related.size ? <section className={`${styles.section} ${styles.noPrint}`} aria-labelledby="related-title">
      <h2 id="related-title">Policies on the same topics</h2>
      <ul className="list-disc pl-6">{[...related.values()].map(r => <li key={r.id}><Link href={policyHref(r.id)}>{r.title}</Link></li>)}</ul>
    </section> : null}

    <section className={styles.section} aria-labelledby="tags-title">
      <h2 id="tags-title">Topics</h2>
      <div>{policy.tags.map(tag => <span className={styles.chip} key={tag}>{tag}</span>)}</div>
    </section>
  </article>;
}
