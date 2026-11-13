import Link from "@/components/app-link";
import type { Metadata } from "next";
import { facetValues } from "@/lib/graph/facets";

export const metadata: Metadata = { title: "Growth paths" };

export default function GrowthPage() {
  const roles = facetValues("role");
  return <div className="calm">
    <p className="calm-kicker">Professional growth</p>
    <h1>Growth paths by role</h1>
    <p className="calm-lede">A suggested order for building skill over time, in three steps: start, apply and lead. Nothing here is required or recorded. Take it at your own pace and skip what you already know.</p>
    <ul className="calm-choices">
      {roles.map(role => <li key={role.id}><Link className="calm-choice" href={`/growth/${role.id}`}><h2 style={{ fontSize: "1.15rem" }}>{role.title}</h2><p>{role.items.filter(item => item.kind === "practice").length} practices, {role.items.filter(item => item.kind === "course").length} courses</p></Link></li>)}
    </ul>
    <p className="calm-note">Roles describe useful connections, not limits. Every resource stays open to everyone.</p>
  </div>;
}
