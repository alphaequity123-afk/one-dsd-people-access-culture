import type { Metadata } from "next";
import Link from "next/link";
import { leadersAllowed } from "@/lib/auth/leaders-access";
import { BRIEFS } from "@/lib/content/briefs";
import { communityDesignEntries } from "@/lib/content/community-design";
import { ORGANIZATIONS, hasDivisionRecord, isNativeCommunity, organizationHref } from "@/lib/content/hub/organizations";
import { CROSSWALK_BY_ID } from "@/lib/content/hub/community-coverage";
import styles from "@/app/community-outreach/hub.module.css";

export const metadata: Metadata = {
  title: "Community coverage",
  description: "For leaders: which communities have organizations on record with the Disability Services Division, figures, and a completed community review.",
};

export const dynamic = "force-dynamic";

const TODAY = "2026-11-05";

export default async function CommunityCoveragePage() {
  if (!(await leadersAllowed())) return <div className={styles.page}>
    <h1 className={styles.title}>Community coverage</h1>
    <p>This page is for managers, supervisors and the consultant. <Link href="/leading">Return to the leaders&apos; space</Link>.</p>
  </div>;
  const rows = communityDesignEntries().filter(entry => !isNativeCommunity(entry.id)).map(entry => {
    const brief = BRIEFS.find(b => b.id === entry.id);
    const orgs = ORGANIZATIONS.filter(org => org.communities.includes(entry.id) && !org.closed);
    const divisionOrgs = orgs.filter(hasDivisionRecord);
    const figures = CROSSWALK_BY_ID.get(entry.id);
    return { id: entry.id, title: entry.title, brief, orgs, divisionOrgs, figures };
  });
  const noOrgs = rows.filter(row => row.divisionOrgs.length === 0);
  const pendingReview = rows.filter(row => row.brief && row.brief.representationReview !== "reviewed");
  const overdue = rows.filter(row => row.brief && row.brief.reviewDate < TODAY);
  return <div className={styles.page}>
    <p className={styles.kicker}><Link href="/leading">Leaders&apos; space</Link></p>
    <h1 className={styles.title}>Community coverage</h1>
    <p className={styles.lede}>Where the program and the Disability Services Division have gaps: communities with no organization on record, communities without figures, and briefs that members of the community have not yet reviewed.</p>
    <p className={styles.note}>These are findings about the system, not about any community. A missing organization means no published record of a connection was found, not that the community lacks organizations. Nothing here counts or shows anyone&apos;s use of the program.</p>

    <section className={styles.section}>
      <h2>Summary</h2>
      <ul className="list-disc pl-6">
        <li>{noOrgs.length} of {rows.length} communities have no current organization with a published record naming the Disability Services Division.</li>
        <li>{pendingReview.length} of {rows.filter(r => r.brief).length} briefs are waiting for a review by members of the community.</li>
        <li>{overdue.length} briefs are past their review date.</li>
      </ul>
    </section>

    <section className={styles.section}>
      <h2>By community</h2>
      <div role="region" aria-label="Community coverage table" tabIndex={0} style={{ overflowX: "auto" }}>
        <table className={styles.table}>
          <thead><tr><th scope="col">Community</th><th scope="col">Organizations on record</th><th scope="col">Figures</th><th scope="col">Community review</th><th scope="col">Review date</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.id}>
            <th scope="row"><Link href={`/minnesota-communities/${row.id}`}>{row.title}</Link></th>
            <td>{row.orgs.length ? row.orgs.map((org, i) => <span key={org.slug}>{i ? ", " : ""}<Link href={organizationHref(org.slug)}>{org.name}</Link>{hasDivisionRecord(org) ? "" : " (Department of Human Services record)"}</span>) : "None found"}</td>
            <td>{row.figures ? row.figures : "None"}</td>
            <td>{row.brief ? (row.brief.representationReview === "reviewed" ? "Reviewed" : "Not yet reviewed") : "No brief"}</td>
            <td>{row.brief ? `${row.brief.reviewDate}${row.brief.reviewDate < TODAY ? " (past)" : ""}` : ""}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>

    <section className={styles.section}>
      <h2>How a community review works</h2>
      <ol className="list-decimal space-y-2 pl-6">
        <li>Invite two or more members of the community to review the brief, through an organization they choose or directly. Do not ask one person to speak for everyone.</li>
        <li>Offer compensation and supports through approved arrangements, and confirm them before the review starts.</li>
        <li>Ask reviewers to check names and terms, how people differ within the community, history, what staff are told to ask, and anything that could lead to a stereotype.</li>
        <li>Record what changed because of the review, and tell the reviewers.</li>
        <li>Mark the brief as reviewed and set the next review date. Plan a fresh review at least every two years, or sooner when something important changes.</li>
      </ol>
      <p>Native American and Tribal Nation pages are not part of this review. They defer to the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation.</p>
    </section>
  </div>;
}
