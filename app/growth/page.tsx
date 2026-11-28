import Link from "@/components/app-link";
import type { Metadata } from "next";
import { facetValues } from "@/lib/graph/facets";

export const metadata: Metadata = { title: "Growth paths" };

export default function GrowthPage() {
  const roles = facetValues("role");
  return <div className="calm">
    <p className="calm-kicker">Professional growth</p>
    <h1>Growth paths by role</h1>
    <p className="calm-lede">Build your skills in three steps: start, apply and lead. Choose the learning that fits your work. These suggestions don’t replace assigned training or the agency duties that apply to you, and each linked tool has a short notice worth reading before you save notes or start a practice activity.</p>
    <ul className="calm-choices">
      {roles.map(role => <li key={role.id}><Link className="calm-choice" href={`/growth/${role.id}`}><h2 style={{ fontSize: "1.15rem" }}>{role.title}</h2><p>{role.items.filter(item => item.kind === "practice").length} practices, {role.items.filter(item => item.kind === "course").length} courses</p></Link></li>)}
    </ul>
    <p className="calm-note">Roles simply help organize the learning. You are welcome to explore other roles too, though some resources have their own access or participation requirements.</p>
  </div>;
}
