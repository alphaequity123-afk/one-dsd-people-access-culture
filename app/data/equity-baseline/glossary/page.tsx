import type { Metadata } from "next";
import { leadersAllowed } from "@/lib/auth/leaders-access";
import Link from "@/components/app-link";
import { GLOSSARY } from "@/lib/content/data/equity-baseline";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "../equity-baseline.module.css";

export const metadata: Metadata = { title: "Glossary — Equity baseline" };

export const dynamic = "force-dynamic";

export default async function EquityGlossaryPage() {
  if (!(await leadersAllowed())) return null;
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/data/equity-baseline">Equity baseline</Link></p>
    <header className={base.intro}>
      <p className={base.eyebrow}>Equity baseline</p>
      <h1>Glossary of full names</h1>
      <p className={base.lede}>{GLOSSARY.rule}</p>
    </header>
    <table className={styles.table}>
      <caption>Full names used in the dashboard, with the short form found in state documents.</caption>
      <thead><tr><th scope="col">Full name</th><th scope="col">Short form used in state documents</th><th scope="col">What it means</th><th scope="col">Source</th></tr></thead>
      <tbody>{GLOSSARY.terms.map(term => <tr key={term.short}>
        <th scope="row">{term.full}</th>
        <td>{term.short}</td>
        <td>{term.plain}</td>
        <td>{term.source}</td>
      </tr>)}</tbody>
    </table>
  </div></div>;
}
