import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { communityDesignEntries } from "@/lib/content/community-design";
import { ORGANIZATIONS, getOrganization, relationshipLine } from "@/lib/content/hub/organizations";
import { PrintPageButton } from "@/components/hub/print-page-button";
import styles from "../../hub.module.css";

export function generateStaticParams() {
  return ORGANIZATIONS.map(org => ({ slug: org.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const org = getOrganization((await params).slug);
  return org ? { title: `${org.name} (Community Outreach and Engagement)`, description: org.summary } : { title: "Organization" };
}

export default async function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const org = getOrganization((await params).slug);
  if (!org) notFound();
  const titles = new Map(communityDesignEntries().map(entry => [entry.id, entry.title]));
  const contact = [
    org.contact.website ? <a key="w" href={org.contact.website}>{org.contact.website}</a> : null,
    org.contact.phone ? <span key="p">{org.contact.phone}</span> : null,
    org.contact.email ? <a key="e" href={`mailto:${org.contact.email}`}>{org.contact.email}</a> : null,
  ].filter(Boolean);
  return <article className={styles.page}>
    <p className={`${styles.kicker} ${styles.noPrint}`}><Link href="/community-outreach">Community Outreach and Engagement</Link> · <Link href="/community-outreach/organizations">Organizations</Link></p>
    <p className={styles.kicker}>{org.kind}</p>
    <h1 className={styles.title}>{org.name}</h1>
    {org.alsoKnownAs ? <p className={styles.meta}>Also known as {org.alsoKnownAs}</p> : null}
    <div>{org.relationshipTypes.map(t => <span className={styles.chip} key={t}>{t}</span>)}</div>
    {org.closed ? <p className={styles.note}>This organization has closed, according to its own website. It is listed for the record of its work with the Disability Services Division, not as a place to refer people.</p> : null}
    <p className={styles.lede}>{org.summary}</p>

    <div className={styles.grid}>
      <section><h2 className="text-lg font-bold">Who it serves</h2><p>{org.whoItServes || "Not confirmed in the public records."}</p>
        <h2 className="text-lg font-bold">Where it works</h2><p>{org.whereItWorks || "Not confirmed in the public records."}</p></section>
      <section><h2 className="text-lg font-bold">What it does</h2>{org.services.length ? <ul className="list-disc pl-6">{org.services.map(s => <li key={s}>{s}</li>)}</ul> : <p>Not confirmed in the public records.</p>}</section>
    </div>

    <section className={styles.section}>
      <h2>Work with the Disability Services Division and the Department of Human Services</h2>
      {org.withTheDivision.map((rel, i) => <div className={styles.rel} key={i}>
        <strong>{relationshipLine(rel)}</strong>
        {rel.departmentWide ? <p className={styles.small}>This record names the Department of Human Services, not the Disability Services Division.</p> : null}
        <p style={{ margin: 0 }}>{rel.what}</p>
      </div>)}
    </section>

    <section className={styles.section}>
      <h2>When staff might connect</h2>
      <p>{org.whyItMattersForStaff}</p>
      {org.communities.length ? <p>Community pages: {org.communities.map((id, i) => <span key={id}>{i ? ", " : ""}<Link href={`/minnesota-communities/${id}`}>{titles.get(id) ?? id}</Link></span>)}</p> : null}
      <p className={styles.noPrint}><Link href="/community-outreach/plan">Plan an engagement before you reach out</Link></p>
    </section>

    <section className={styles.section}>
      <h2>Contact</h2>
      <p>{contact.length ? contact.map((item, i) => <span key={i}>{i ? " · " : ""}{item}</span>) : "No general contact details were found in public sources."}</p>
    </section>

    <section className={styles.section}>
      <h2>Public records</h2>
      <ul className="list-disc pl-6">{org.records.map(r => <li key={r.url}>{r.title}{r.date ? `, ${r.date}` : ""}. <a href={r.url}>{r.url.replace(/^https:\/\/(www\.)?/, "").slice(0, 70)}</a></li>)}</ul>
      {org.uncertainties.filter(Boolean).length ? <><h3 className="mt-4 font-bold">Not confirmed</h3><ul className="list-disc pl-6">{org.uncertainties.filter(Boolean).map(u => <li key={u}>{u}</li>)}</ul></> : null}
      <p className={styles.small}>Facts checked against public sources on {org.checked}. Confirm current details with the organization before relying on them.</p>
    </section>
    <p className={styles.noPrint}><PrintPageButton /></p>
  </article>;
}
