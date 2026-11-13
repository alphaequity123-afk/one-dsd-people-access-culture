import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyzePolicyLink } from "@/components/hub/analyze-policy-link";
import { PrintPageButton } from "@/components/hub/print-page-button";
import { formatPolicyDate, getPolicies, getPolicy, getPolicyKind, policyHref, policyPageTitle, relatedPolicies } from "@/lib/content/hub/dsd-policies";
import styles from "../../hub.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";
import { PrintOpenPanels } from "@/components/rp-print-open-panels";

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
  const related = relatedPolicies(policy);

  return <article className={`${styles.page} pilot-reading-width`}>
    <p className={`${styles.kicker} ${styles.noPrint}`}><Link href="/community-outreach">Community Outreach and Engagement</Link> · <Link href="/community-outreach/policies">Policies that shape disability services</Link></p>
    {kind ? <p className={styles.kicker}>{kind.title}</p> : null}
    <h1 className={styles.title}>{policy.title}</h1>
    <div>{policy.programs.map(name => <span className={styles.chip} key={name}>{name}</span>)}</div>
    <p className={styles.meta}>Applies to: {policy.appliesTo.join(", ")}</p>
    <p className={styles.lede}>{policy.summary}</p>
    <p className={styles.note}>This is a summary written in plain language. The policy itself is the source document linked below. Check the date on the source before relying on it.</p>
    <p className={`${styles.noPrint} flex flex-wrap gap-3`}><PrintPageButton /><AnalyzePolicyLink policyId={policy.id} /></p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="policy" id={policy.id} noun="policy summary" /></details>

    <section className={styles.section} aria-labelledby="dates-title">
      <h2 id="dates-title">Dates and source</h2>
      <table className={styles.table}>
        <tbody>
          <tr><th scope="row">Effective</th><td>{policy.effective ? formatPolicyDate(policy.effective) : "Not stated on the source"}</td></tr>
          <tr><th scope="row">Last updated</th><td>{policy.lastUpdated ? formatPolicyDate(policy.lastUpdated) : "Not shown on the source"}</td></tr>
          <tr><th scope="row">Facts checked</th><td>{formatPolicyDate(policy.checked)}</td></tr>
          <tr><th scope="row">Source</th><td><a href={policy.source.url}>{policy.source.title}</a>{policy.source.date ? ` (${formatPolicyDate(policy.source.date)})` : ""}<br /><span className={`${styles.small} break-all`} >{policy.source.url}</span></td></tr>
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

    <section className={styles.section} aria-labelledby="more-title">
      <h2 id="more-title">Related and sources</h2>
      {policy.relatedSources.length ? <details className="course-more-item">
        <summary id="sources-title">Related sources</summary>
        <ul className="list-disc pl-6">{policy.relatedSources.map(s => <li key={s.url}><a href={s.url}>{s.title}</a></li>)}</ul>
      </details> : null}

      {policy.relatedPages.length ? <details className={`course-more-item ${styles.noPrint}`}>
        <summary id="pages-title">Related program pages</summary>
        <ul className="list-disc pl-6">{policy.relatedPages.map(route => <li key={route}><Link href={route}>{policyPageTitle(route)}</Link></li>)}</ul>
      </details> : null}

      {related.length ? <details className={`course-more-item ${styles.noPrint}`}>
        <summary id="related-title">Policies on the same topics</summary>
        <ul className="list-disc pl-6">{related.map(r => <li key={r.id}><Link href={policyHref(r.id)}>{r.title}</Link></li>)}</ul>
      </details> : null}

      <details className="course-more-item">
        <summary id="tags-title">Topics</summary>
        <div>{policy.tags.map(tag => <span className={styles.chip} key={tag}>{tag}</span>)}</div>
      </details>
    </section>
    <PrintOpenPanels />
  </article>;
}
