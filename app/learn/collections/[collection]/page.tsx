import type { Metadata } from "next";
import Link from "@/components/app-link";
import { notFound } from "next/navigation";
import { CollectionItemLink } from "@/components/collection-item-link";
import { LEADING_HREF, LEADING_LABEL, STAFF_RESOURCES, TRIBAL_REFERRAL_HREF, staffCollection } from "@/lib/content/collections";
import { publishedCourses } from "@/lib/content/courses/published";
import { requestedContentScope } from "@/lib/product/request-context";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }): Promise<Metadata> {
  const collection = staffCollection((await params).collection);
  return collection ? { title: collection.title, description: collection.description } : {};
}

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const collection = staffCollection((await params).collection);
  if (!collection) notFound();
  const scope = await requestedContentScope();
  const published = new Set((await publishedCourses(scope)).map(({ pack }) => pack.course.id));
  const resources = STAFF_RESOURCES[collection.id] ?? [];
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/learn/collections">Collections</Link></p>
    <header className={base.intro}>
      <p className={base.eyebrow}>Collections</p>
      <h1>{collection.title}</h1>
      <p className={base.lede}>{collection.description}.</p>
      <p>Start with any course below. &ldquo;Go deeper&rdquo; holds more on the same subjects. Those courses are not worse; they are just not the first thing to open.{collection.id === "minnesota-communities" ? " Each community's page is its own starting point. The order is not a ranking." : ""}</p>
    </header>
    <section className={styles.section} aria-labelledby="start-title">
      <h2 id="start-title">Where to start</h2>
      <ul className={styles.startList}>{collection.startIds.map(id => <li key={id}><CollectionItemLink id={id} published={published} /></li>)}</ul>
    </section>
    {collection.deeper.length ? <section className={styles.section} aria-labelledby="deeper-title">
      <h2 id="deeper-title">Go deeper</h2>
      {collection.deeper.map(group => <details key={group.subject} className={styles.deeper}><summary>{group.subject}: {group.ids.length}</summary><ul>{group.ids.map(id => <li key={id}><CollectionItemLink id={id} published={published} /></li>)}</ul></details>)}
    </section> : null}
    <aside className={base.continue}>
      <h2>Keep exploring</h2>
      <p>{resources.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}<Link href={LEADING_HREF}>{LEADING_LABEL}</Link><Link href={TRIBAL_REFERRAL_HREF}>Native American and Tribal-specific guidance</Link></p>
    </aside>
  </div></div>;
}
