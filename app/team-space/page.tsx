import Link from "@/components/app-link";
import type { Metadata } from "next";
import { analysisRoleFromCookies } from "@/lib/auth/consultant-or-team";
import { listTeamRecords, teamSpaceAvailable, type TeamDecisionRecord } from "@/lib/decision-records/store";
import { DECISION_RECORD_FIELDS } from "@/lib/implementation/records";

export const metadata: Metadata = { title: "Team space" };
export const dynamic = "force-dynamic";

export default async function TeamSpacePage() {
  const role = await analysisRoleFromCookies();
  let records: TeamDecisionRecord[] = [], available = false;
  if (role && await teamSpaceAvailable()) {
    try { records = await listTeamRecords(); available = true; } catch { available = false; }
  }
  return <div className="calm">
    <nav className="calm-crumbs" aria-label="Breadcrumb"><Link href="/equity-workspace">Equity workspace</Link></nav>
    <p className="calm-kicker">One DSD Team and the consultant</p>
    <h1>Team space: decision records</h1>
    <p className="calm-lede">Decision records that people chose to share for leadership review. Each one stays on its author&apos;s computer too. Nothing else from anyone&apos;s learning is kept here.</p>
    <p><Link className="calm-button calm-button--quiet" href="/my-work/decision-records">Write a decision record</Link></p>
    {!role ? <p>Sign in to the Equity workspace to read shared records.</p>
      : !available ? <p className="calm-note">The team space is not available right now. Records on people&apos;s own computers are unaffected.</p>
      : !records.length ? <p className="calm-muted">No decision records have been shared yet.</p>
      : records.map(record => <details key={record.id}>
        <summary>{record.title} <span className="calm-muted calm-small">updated {record.updatedAt.slice(0, 10)}</span></summary>
        {DECISION_RECORD_FIELDS.map(field => record.fields[field.key]?.trim() ? <div key={field.key}><h3 style={{ marginTop: "1rem" }}>{field.label}</h3><p style={{ whiteSpace: "pre-wrap" }}>{record.fields[field.key]}</p></div> : null)}
      </details>)}
  </div>;
}
