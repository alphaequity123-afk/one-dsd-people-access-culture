import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionItemLink } from "@/components/collection-item-link";
import { DOOR_ASK, DOOR_RESOURCES, LEADING_LABEL, LEADING_PRIVACY_SENTENCE, QUESTION_SCENARIOS, RIGHT_PERSON_HREF, TRIBAL_REFERRAL_HREF, collectionItem, jobAidHref, leadingDoor, scenarioHref, whomToAsk } from "@/lib/content/collections";
import { publishedCourses } from "@/lib/content/courses/published";
import { DSD_SCENARIOS } from "@/lib/dsd";
import { requestedContentScope } from "@/lib/product/request-context";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ door: string }> }): Promise<Metadata> {
  const door = leadingDoor((await params).door);
  return door ? { title: door.title, description: door.description } : {};
}

export default async function LeadingDoorPage({ params }: { params: Promise<{ door: string }> }) {
  const door = leadingDoor((await params).door);
  if (!door) notFound();
  const scope = await requestedContentScope();
  const published = new Set((await publishedCourses(scope)).map(({ pack }) => pack.course.id));
  const resources = DOOR_RESOURCES[door.slug];
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/leading">← {LEADING_LABEL}</Link></p>
    <header className={base.intro}>
      <p className={base.eyebrow}>What are you deciding?</p>
      <h1>{door.title}</h1>
      <p className={base.lede}>{door.description}.</p>
      <p>Find your question, and start with the one course named under it. {LEADING_PRIVACY_SENTENCE}</p>
    </header>
    <section aria-label="Questions">
      {door.questions.map(question => {
        const start = collectionItem(question.startId);
        const aid = start && published.has(start.id) ? jobAidHref(start) : undefined;
        const scenarios = (QUESTION_SCENARIOS[question.key] ?? []).flatMap(id => DSD_SCENARIOS.filter(scenario => scenario.id === id));
        return <article key={question.key} id={question.key} className={styles.question}>
          <h2>{question.question}</h2>
          <dl className={styles.facts}>
            <dt>Start here</dt><dd><CollectionItemLink id={question.startId} published={published} /></dd>
            {aid ? <><dt>Job aid</dt><dd><Link href={aid} prefetch={false}>Open the one-page job aid</Link></dd></> : null}
            {scenarios.length ? <><dt>Scenario</dt><dd><ul>{scenarios.map(scenario => <li key={scenario.id}><Link href={scenarioHref(scenario.id)} prefetch={false}>{scenario.title}</Link></li>)}</ul></dd></> : null}
            <dt>Whom to ask</dt><dd>{whomToAsk(door.slug, question.key).map(entry => entry.role).join("; ")}</dd>
          </dl>
          {question.deeperIds.length ? <details className={styles.deeper}><summary>Go deeper: {question.deeperIds.length} more</summary><ul>{question.deeperIds.map(id => <li key={id}><CollectionItemLink id={id} published={published} /></li>)}</ul></details> : null}
        </article>;
      })}
    </section>
    {door.relatedIds.length ? <details className={styles.deeper}><summary>Also related to this decision: {door.relatedIds.length}</summary><ul>{door.relatedIds.map(id => <li key={id}><CollectionItemLink id={id} published={published} /></li>)}</ul></details> : null}
    {resources.practice.length ? <details className={styles.deeper}><summary>Guided practice: {resources.practice.length}</summary><ul>{resources.practice.map(link => <li key={link.href}><Link href={link.href} prefetch={false}>{link.label}</Link></li>)}</ul></details> : null}
    {resources.jobAids.length ? <details className={styles.deeper}><summary>More job aids: {resources.jobAids.length}</summary><ul>{resources.jobAids.map(link => <li key={link.href}><Link href={link.href} prefetch={false}>{link.label}</Link></li>)}</ul></details> : null}
    {resources.tools.length ? <details className={styles.deeper}><summary>Tools and related pages: {resources.tools.length}</summary><ul>{resources.tools.map(link => <li key={link.href}><Link href={link.href} prefetch={false}>{link.label}</Link></li>)}</ul></details> : null}
    <section className={styles.section} aria-labelledby="whom-to-ask-title">
      <h2 id="whom-to-ask-title">Whom to ask, by role</h2>
      <p>Names change, so these are roles. Keep the contacts for your own division where you can reach them.</p>
      <dl className={styles.facts}>{DOOR_ASK[door.slug].map(entry => <div key={entry.role} style={{ display: "contents" }}><dt>{entry.role}</dt><dd>{entry.forWhat}</dd></div>)}</dl>
      <p><Link href={RIGHT_PERSON_HREF}>Find the right person or office</Link></p>
    </section>
    <aside className={base.continue}>
      <h2>Keep exploring</h2>
      <p><Link href="/leading">All nine decisions</Link><Link href="/leading/paths">Suggested paths</Link><Link href="/leading/how-this-works">How this works</Link><Link href={TRIBAL_REFERRAL_HREF}>Native American and Tribal-specific guidance</Link></p>
    </aside>
  </div></div>;
}
