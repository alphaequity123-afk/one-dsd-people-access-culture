import Link from "@/components/app-link";
export function DsdProgramFooter() {
  return <footer className="dsd-footer"><div className="dsd-shell">
    <div><strong>One DSD People, Access and Culture</strong><p>Learning, resources and practical equity guidance for the Disability Services Division.</p></div>
    <nav aria-label="Support and program information"><Link href="/start">Getting started</Link><Link href="/user-guide">How to use this site</Link><Link href="/leading">For leaders, supervisors, managers, and directors</Link><Link href="/one-dsd">One DSD</Link><Link href="/program-foundation">Program charter</Link><Link href="/about">About</Link><Link href="/support">Support</Link><Link href="/minnesota-agencies">State of Minnesota agencies</Link><Link href="/site-map">Site map</Link></nav>
    <details><summary>Participation and privacy</summary><p>Participation in this program is voluntary. Keep private client, case, health, and personnel information out of questions and learning notes. This resource does not replace official DHS systems, policies, or required training.</p></details>
    <p style={{ fontSize: "0.875rem", marginTop: "1rem" }}>Property of Gary Banks</p>
  </div></footer>;
}
