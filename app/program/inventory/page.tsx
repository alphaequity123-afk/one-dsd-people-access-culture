import type { Metadata } from "next";
import Link from "@/components/app-link";
import { catalogSummary, programCatalog, nextReview, SCOPE_LABEL, ENGINE_LABEL, TIER_LABEL } from "@/lib/program/catalog";
import styles from "@/components/pillar-hub.module.css";

export const metadata: Metadata = { title: "Program inventory" };

/**
 * For the people who look after the program (owner direction 2026-11-26): what the program holds, by engine, scope
 * and tier, and how much of it has a recorded review. It counts content, never people or use.
 */
export default function ProgramInventory() {
  const summary = catalogSummary();
  const today = new Date().toISOString().slice(0, 10);
  const due = programCatalog().filter(item => { const next = nextReview(item); return next !== null && next <= today; });
  const unverified = programCatalog().filter(item => !item.governance.lastVerified).length;
  return <div className={styles.hub}>
    <header className={styles.intro} aria-labelledby="inventory-title">
      <h1 id="inventory-title">Program inventory</h1>
      <p className={styles.lede}>Everything the program offers, in one place, so whoever looks after it next can see what&apos;s here, who it&apos;s for and when it was last checked. The program holds {summary.total.toLocaleString("en-US")} items today. Nothing here counts or tracks the people who use it.</p>
    </header>
    <section aria-labelledby="inventory-engines">
      <h2 id="inventory-engines">By engine</h2>
      <table>
        <caption>Items in each engine, by scope and suggested tier</caption>
        <thead><tr><th scope="col">Engine</th><th scope="col">Items</th>{Object.values(SCOPE_LABEL).map(label => <th key={label} scope="col">{label}</th>)}{Object.values(TIER_LABEL).map(label => <th key={label} scope="col">{label}</th>)}<th scope="col">With a recorded review</th></tr></thead>
        <tbody>{summary.byEngine.map(row => <tr key={row.engine}><th scope="row">{ENGINE_LABEL[row.engine]}</th><td>{row.total}</td>{row.byScope.map(cell => <td key={cell.scope}>{cell.count}</td>)}{row.byTier.map(cell => <td key={cell.tier}>{cell.count}</td>)}<td>{row.verified}</td></tr>)}</tbody>
      </table>
      <p>An item can carry more than one scope. Tiers are a suggestion for where to begin; every item stays open to everyone.</p>
    </section>
    <section aria-labelledby="inventory-review">
      <h2 id="inventory-review">Reviews</h2>
      <p>{unverified.toLocaleString("en-US")} items don&apos;t have a recorded review yet, and {due.length.toLocaleString("en-US")} are past their review date. Owners, stewards and review cycles are set in the program&apos;s governance settings, and an item&apos;s own recorded owner and review date come first.</p>
      {due.length ? <ul>{due.slice(0, 40).map(item => <li key={item.id}><Link href={item.href}>{item.title}</Link> (last verified {item.governance.lastVerified})</li>)}</ul> : null}
    </section>
  </div>;
}
