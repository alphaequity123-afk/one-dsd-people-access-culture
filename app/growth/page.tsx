import Link from "@/components/app-link";
import type { Metadata } from "next";
import { facetValues } from "@/lib/graph/facets";

export const metadata: Metadata = { title: "Growth paths" };

export default function GrowthPage() {
  const roles = facetValues("role");
  return <div className="calm">
    <p className="calm-kicker">Professional growth</p>
    <h1>Growth paths by role</h1>
    <p className="calm-lede">Explore a suggested sequence for building skill: start, apply and lead. Choose learning that fits your work; these suggestions do not replace assigned training or applicable agency duties. Check each linked tool’s notice before saving notes or using a practice activity.</p>
    <ul className="calm-choices">
      {roles.map(role => <li key={role.id}><Link className="calm-choice" href={`/growth/${role.id}`}><h2 style={{ fontSize: "1.15rem" }}>{role.title}</h2><p>{role.items.filter(item => item.kind === "practice").length} practices, {role.items.filter(item => item.kind === "course").length} courses</p></Link></li>)}
    </ul>
    <p className="calm-note">Roles help organize relevant learning. You can explore other roles as well; individual resources may have access or participation requirements.</p>
  </div>;
}
