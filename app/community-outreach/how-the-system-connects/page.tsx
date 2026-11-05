import type { Metadata } from "next";
import Link from "next/link";
import { getSystemConnections } from "@/lib/content/hub/system-connections";
import styles from "../hub.module.css";

export const metadata: Metadata = {
  title: "How the system connects",
  description: "How the Department of Human Services, the Disability Services Division, other divisions, lead agencies and providers connect in Minnesota disability services.",
};

const Source = ({ source }: { source: { title: string; url: string; date?: string } }) =>
  <span className={styles.small}> Source: <a href={source.url}>{source.title}</a>{source.date ? `, ${source.date}` : ""}.</span>;

export default function HowTheSystemConnectsPage() {
  const data = getSystemConnections();
  return <div className={styles.page}>
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>How the system connects</h1>
    <p className={styles.lede}>Minnesota disability services are state-supervised and county-administered. The Department of Human Services sets policy and pays for services; the Disability Services Division leads the disability programs; lead agencies assess people and manage their services; and licensed providers deliver them. This page shows how those parts connect, with a source for each point.</p>
    <nav aria-label="On this page" className={styles.links}><a href="#structure">Inside the department</a><a href="#lead-agencies">Lead agencies</a><a href="#division-roles">The division and lead agencies</a><a href="#department-roles">The department and lead agencies</a><a href="#referrals">How people are referred</a><a href="#tribal">Tribal Nations</a><a href="#glossary">Plain-language glossary</a></nav>

    <section className={styles.section} id="structure" aria-labelledby="structure-title">
      <h2 id="structure-title">Inside the Department of Human Services</h2>
      <p>The administrations, divisions and offices that connect to disability services, and what each one does in that connection.</p>
      <ul className={styles.grid} style={{ listStyle: "none", padding: 0 }}>{data.structure.map(item => <li className={styles.card} key={item.name}>
        <h3>{item.name}</h3>
        <p className={styles.meta}>{item.kind}</p>
        <p>{item.whatItDoesForDisabilityServices}</p>
        <p><strong>Connection to the Disability Services Division:</strong> {item.connectionToDivision}</p>
        <Source source={item.source} />
      </li>)}</ul>
    </section>

    <section className={styles.section} id="lead-agencies" aria-labelledby="lead-title">
      <h2 id="lead-title">What a lead agency is</h2>
      <ul className="list-disc space-y-3 pl-6">{data.leadAgencyTypes.map(item => <li key={item.type}>
        <strong>{item.type}.</strong> {item.description}{item.examples?.length ? ` Examples: ${item.examples.join("; ")}.` : ""}{item.programs?.length ? ` Programs: ${item.programs.join("; ")}.` : ""}<Source source={item.source} />
      </li>)}</ul>
      <p><Link href="/community-outreach/county-agencies">See the agency for each county</Link> · <Link href="/community-outreach/providers">Providers and designated agencies</Link></p>
    </section>

    <section className={styles.section} id="division-roles" aria-labelledby="division-title">
      <h2 id="division-title">What the Disability Services Division does with lead agencies</h2>
      <ul className="list-disc space-y-3 pl-6">{data.divisionRoles.map(item => <li key={item.role}>
        <strong>{item.role}.</strong> {item.description} <em>How lead agencies experience it:</em> {item.howLeadAgenciesExperienceIt}<Source source={item.source} />{item.alsoSee?.map(extra => <Source key={extra.url} source={extra} />)}
      </li>)}</ul>
    </section>

    <section className={styles.section} id="department-roles" aria-labelledby="department-title">
      <h2 id="department-title">What the Department of Human Services does with lead agencies</h2>
      <ul className="list-disc space-y-3 pl-6">{data.departmentRoles.map(item => <li key={item.role}>
        <strong>{item.role}.</strong> {item.description}<Source source={item.source} />
      </li>)}</ul>
    </section>

    <section className={styles.section} id="referrals" aria-labelledby="referrals-title">
      <h2 id="referrals-title">How people are referred</h2>
      <div role="region" aria-label="Referral paths" tabIndex={0} style={{ overflowX: "auto" }}>
        <table className={styles.table}>
          <thead><tr><th scope="col">From</th><th scope="col">To</th><th scope="col">When</th><th scope="col">Source</th></tr></thead>
          <tbody>{data.referralPaths.map((item, i) => <tr key={i}><td>{item.from}</td><td>{item.to}</td><td>{item.when}</td><td><a href={item.source.url}>{item.source.title}</a></td></tr>)}</tbody>
        </table>
      </div>
    </section>

    <section className={styles.section} id="tribal" aria-labelledby="tribal-title">
      <h2 id="tribal-title">Tribal Nations</h2>
      {data.tribalNations.lines.map(line => <p key={line}>{line}</p>)}
      <p className={styles.note}>{data.tribalNations.note} <Link href="/learn/tribal-referral">Native American and Tribal-specific guidance</Link>.</p>
      {data.tribalNations.source ? <Source source={data.tribalNations.source} /> : null}
    </section>

    <section className={styles.section} id="glossary" aria-labelledby="glossary-title">
      <h2 id="glossary-title">Plain-language glossary</h2>
      <dl>{data.glossary.map(item => <div key={item.term} style={{ marginBottom: ".5rem" }}><dt><strong>{item.term}</strong></dt><dd>{item.plain}</dd></div>)}</dl>
      <p className={styles.small}>Facts checked on {data.checked}. Organizational structures change; confirm current names with the department.</p>
    </section>
  </div>;
}
