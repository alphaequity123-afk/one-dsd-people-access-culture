import type { Metadata } from "next";
import Link from "next/link";
import {
  allAppliesTo,
  allPrograms,
  formatPolicyDate,
  getPoliciesData,
  policiesByKind,
  policyHref,
  searchPolicies,
  type Policy,
} from "@/lib/content/hub/dsd-policies";
import styles from "../hub.module.css";

export const metadata: Metadata = {
  title: "Policies that shape disability services",
  description: "Plain-language summaries of the Minnesota statutes, rules, manual pages, waiver plans, department policies, bulletins, federal rules and reports that shape disability services, each with its official source.",
};

type Query = { kind?: string; program?: string; "applies-to"?: string; search?: string };

function same(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase("en-US") === b.trim().toLocaleLowerCase("en-US");
}

function dateLine(p: Policy): string {
  const parts: string[] = [];
  if (p.effective) parts.push(`Effective ${formatPolicyDate(p.effective)}`);
  if (p.lastUpdated) parts.push(`Last updated ${formatPolicyDate(p.lastUpdated)}`);
  parts.push(`Checked ${formatPolicyDate(p.checked)}`);
  return parts.join(" · ");
}

export default async function PoliciesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const kind = (query.kind ?? "").trim();
  const program = (query.program ?? "").trim();
  const appliesTo = (query["applies-to"] ?? "").trim();
  const search = (query.search ?? "").trim();
  const data = getPoliciesData();
  const kinds = data.kinds;
  const programs = allPrograms();
  const groups = allAppliesTo();

  let matches = data.policies;
  if (kind) matches = matches.filter(p => p.kind === kind);
  if (program) matches = matches.filter(p => p.programs.some(name => same(name, program)));
  if (appliesTo) matches = matches.filter(p => p.appliesTo.some(name => same(name, appliesTo)));
  if (search) matches = searchPolicies(search, matches);
  const filtered = Boolean(kind || program || appliesTo || search);
  const grouped = policiesByKind(matches).filter(g => g.policies.length > 0);

  return <div className={styles.page}>
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>Policies that shape disability services</h1>
    <p className={styles.lede}>The statutes, rules, manual pages, waiver plans, department policies, bulletins, federal rules and reports that decide who gets home and community-based services in Minnesota, what they get, and who is responsible.</p>
    <p className={styles.note}>These are summaries written in plain language. The policy itself is the source document: each entry links to it. Check the date on the source before relying on it, because policies change. Facts checked on {formatPolicyDate(data.checked)}.</p>
    <p>
      <Link href="/community-outreach/how-the-system-connects">How the system connects</Link> · <Link href="/equity-review">Equity review</Link> · <Link href="/equity-review/analyze">Analyze a policy document</Link>
    </p>

    <form method="get" className={styles.filters} aria-label="Filter the policies">
      <label>Kind
        <select name="kind" defaultValue={kind}>
          <option value="">All kinds</option>
          {kinds.map(k => <option key={k.id} value={k.id}>{k.title}</option>)}
        </select>
      </label>
      <label>Program
        <select name="program" defaultValue={program}>
          <option value="">All programs</option>
          {programs.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <label>Applies to
        <select name="applies-to" defaultValue={appliesTo}>
          <option value="">Everyone</option>
          {groups.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <label>Search
        <input type="search" name="search" defaultValue={search} placeholder="Words in a policy" />
      </label>
      <button className={styles.button} type="submit">Show</button>
      {filtered ? <Link href="/community-outreach/policies">Show all policies</Link> : null}
    </form>

    <p className={styles.small} aria-live="polite">{matches.length === data.policies.length ? `${data.policies.length} policies.` : `${matches.length} of ${data.policies.length} policies match.`}</p>

    {grouped.length === 0 ? <p>No policy matches these filters. Try fewer filters or different words.</p> : null}

    {grouped.map(({ kind: k, policies }) => <section className={styles.section} key={k.id} aria-labelledby={`kind-${k.id}`}>
      <h2 id={`kind-${k.id}`}>{k.title} <span className={styles.small}>({policies.length})</span></h2>
      <p>{k.intro}</p>
      <ul className={styles.grid} style={{ listStyle: "none", padding: 0 }}>
        {policies.map(p => <li className={styles.card} key={p.id}>
          <h3><Link href={policyHref(p.id)}>{p.title}</Link></h3>
          <div>{p.programs.map(name => <span className={styles.chip} key={name}>{name}</span>)}</div>
          <p className={styles.meta}>Applies to: {p.appliesTo.join(", ")}</p>
          <p>{p.summary}</p>
          <p className={styles.meta}>{dateLine(p)}</p>
          <p className={styles.small}>Source: <a href={p.source.url}>{p.source.title}</a>{p.source.date ? ` (${formatPolicyDate(p.source.date)})` : ""}</p>
          <p className={styles.small}><Link href={policyHref(p.id)}>What it requires and what to check for equity</Link></p>
        </li>)}
      </ul>
    </section>)}

    <section className={styles.section} aria-labelledby="next-title">
      <h2 id="next-title">Use a policy</h2>
      <p><Link href="/community-outreach/how-the-system-connects">How the system connects</Link> shows where each policy sits between the Department of Human Services, lead agencies, providers and the people they serve. <Link href="/equity-review">Equity review</Link> holds the review tools. <Link href="/equity-review/analyze">Analyze a policy document</Link> to work through the text of a policy section by section.</p>
    </section>
  </div>;
}
