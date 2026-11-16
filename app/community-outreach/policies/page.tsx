import type { Metadata } from "next";
import Link from "@/components/app-link";
import {
  allAppliesTo,
  allPrograms,
  formatPolicyDate,
  getPoliciesData,
  policyHref,
  type Policy,
} from "@/lib/content/hub/dsd-policies";
import { catOneLine, catParam } from "@/lib/cat-paging";
import { CatRow } from "@/components/cat-list";
import { PrivateCatalogForm, PrivateCatalogProvider, PrivateCatalogResults, type CatalogRow } from "@/components/private-catalog";
import styles from "../hub.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "Policies that shape disability services",
  description: "Plain-language summaries of the Minnesota statutes, rules, manual pages, waiver plans, department policies, bulletins, federal rules and reports that shape disability services, each with its official source.",
};

const PER_PAGE = 12;
const BASE = "/community-outreach/policies";

type Query = { q?: string | string[]; search?: string | string[]; kind?: string | string[]; program?: string | string[]; "applies-to"?: string | string[]; page?: string | string[] };

function same(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase("en-US") === b.trim().toLocaleLowerCase("en-US");
}

/** The most recent date the policy carries, for its one-line row. */
function rowDate(p: Policy): string {
  if (p.lastUpdated) return `Last updated ${formatPolicyDate(p.lastUpdated)}`;
  if (p.effective) return `Effective ${formatPolicyDate(p.effective)}`;
  return `Checked ${formatPolicyDate(p.checked)}`;
}

export default async function PoliciesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const kind = catParam(query.kind);
  const program = catParam(query.program);
  const appliesTo = catParam(query["applies-to"]);
  const search = catParam(query.q) || catParam(query.search);
  const data = getPoliciesData();
  const kinds = data.kinds;
  const kindTitle = new Map(kinds.map(k => [k.id, k.title]));
  const programs = allPrograms();
  const groups = allAppliesTo();

  // The kind is a fixed choice in the address (the page explains the chosen kind); the words typed go to
  // /api/catalog-search in a request body, and the program and group lists narrow the rows in the page.
  const selectedKind = kinds.find(k => k.id === kind);
  const matches = selectedKind ? data.policies.filter(p => p.kind === selectedKind.id) : data.policies;
  // Keep the order of the kinds, as the catalog has always been read.
  const kindOrder = new Map(kinds.map((k, i) => [k.id, i]));
  const rows: CatalogRow[] = matches.slice().sort((a, b) => (kindOrder.get(a.kind) ?? 99) - (kindOrder.get(b.kind) ?? 99)).map(p => ({
    key: p.id,
    values: { program: p.programs, "applies-to": p.appliesTo },
    node: <CatRow key={p.id} id={`policy-${p.id}`}
      title={<Link href={policyHref(p.id)}>{p.title}</Link>}
      line={catOneLine(p.summary)}
      meta={`${kindTitle.get(p.kind) ?? p.kind} · ${rowDate(p)}`} />,
  }));
  const choices = {
    kind: selectedKind?.id ?? "",
    program: programs.find(name => same(name, program)) ?? "",
    "applies-to": groups.find(name => same(name, appliesTo)) ?? "",
  };

  return <div className={styles.page}>
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>Policies that shape disability services</h1>
    <p className={styles.lede}>The statutes, rules, manual pages, waiver plans, department policies, bulletins, federal rules and reports that decide who gets home and community-based services in Minnesota, what they get, and who is responsible.</p>
    <p className={styles.note}>These are summaries written in plain language. The policy itself is the source document: each entry links to it. Check the date on the source before relying on it, because policies change. Facts checked on {formatPolicyDate(data.checked)}.</p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="community-outreach" id="policies" noun="policy catalog" /></details>
    <details className="course-more-item">
      <summary>About each kind of policy and how to use them</summary>
      <dl>{kinds.map(k => <div key={k.id} id={`kind-${k.id}`}>
        <dt><strong><Link href={`${BASE}?kind=${k.id}`}>{k.title}</Link></strong> ({data.policies.filter(p => p.kind === k.id).length})</dt>
        <dd style={{ margin: "0 0 0.75rem" }}>{k.intro}</dd>
      </div>)}</dl>
      <p><Link href="/community-outreach/how-the-system-connects">How the system connects</Link> shows where each policy sits between the Department of Human Services, lead agencies, providers and the people they serve. <Link href="/equity-review">Equity review</Link> holds the review tools. <Link href="/equity-review/analyze">Analyze a policy document</Link> to work through the text of a policy section by section.</p>
    </details>

    <PrivateCatalogProvider key={Object.values(choices).join("|")} basePath={BASE} rows={rows} choices={choices} perPage={PER_PAGE} initial={{ q: search, page: catParam(query.page) }} endpoint="policies"
      lists={[
        { name: "kind", label: "Kind", allLabel: "All kinds", options: kinds.map(k => ({ value: k.id, label: k.title })), navigates: true },
        { name: "program", label: "Program", allLabel: "All programs", options: programs.map(name => ({ value: name, label: name })) },
        { name: "applies-to", label: "Applies to", allLabel: "Everyone", options: groups.map(name => ({ value: name, label: name })) },
      ]}>
      <PrivateCatalogForm className={styles.filters} ariaLabel="Find a policy" searchLabel="Search" inputId="policy-q" placeholder="Words in a policy" buttonLabel="Show" buttonClassName={styles.button} clearLabel="Show all policies" />
      {selectedKind ? <p>{selectedKind.intro}</p> : null}
      <PrivateCatalogResults noun="policy" nouns="policies" of={data.policies.length} empty="No policy matches these filters. Try fewer filters or different words." listLabel="Policies" pagerLabel="Policy result pages" />
    </PrivateCatalogProvider>

    <p>
      <Link href="/community-outreach/how-the-system-connects">How the system connects</Link> · <Link href="/equity-review">Equity review</Link> · <Link href="/equity-review/analyze">Analyze a policy document</Link>
    </p>
  </div>;
}
