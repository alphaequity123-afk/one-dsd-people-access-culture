import Link from "next/link";
import { leadershipStyles } from "@/lib/dsd-live/leadership/styles";
import { momentFor } from "@/lib/dsd-live/leadership/in-the-moment";
import { currentUnit } from "@/lib/dsd-live/unit";

export function generateMetadata() {
  return { title: "Team discussion kits" };
}

/** Index of the printable 20-minute team discussions, one per leadership style. */
export default function TeamKits() {
  const unit = currentUnit();
  const kits = leadershipStyles.map(style => ({ style, moment: momentFor(style.slug, unit.id) })).filter(k => k.moment);
  return <div className="team-kit">
    <header>
      <p className="eyebrow">For supervisors and team leads</p>
      <h1>Team discussion kits</h1>
      <p>Each kit turns one realistic situation into a 20-minute conversation for a team meeting: a plan, the situation, notes on each response, questions for the group and a closing commitment. Print one, or open it on a shared screen.</p>
    </header>
    <ul className="team-kit-list">{kits.map(({ style, moment }) => <li key={style.slug}>
      <Link href={`/learn/leadership/styles/${style.slug}/team-kit`}>
        <strong>{style.name}</strong>
        <span>{moment!.situation.length > 150 ? `${moment!.situation.slice(0, moment!.situation.lastIndexOf(" ", 150))}…` : moment!.situation}</span>
      </Link>
    </li>)}</ul>
  </div>;
}
