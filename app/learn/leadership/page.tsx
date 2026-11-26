import Link from "next/link";
import { getStyle, styleGroups, styleHref, stylesInGroup } from "@/lib/dsd-live/leadership/styles";
import { EQUITY_ZONES } from "@/lib/dsd-live/leadership/styles/equity";
import { currentUnit } from "@/lib/dsd-live/unit";
import { StyleFinder } from "@/components/dsd-live/style-finder";
import { leadershipStyles as allStyles } from "@/lib/dsd-live/leadership/styles";

export function generateMetadata() {
  return { title: `${currentUnit().short} Leadership` };
}

const MORE = [
  { title: "Inclusive leadership development sequence", href: "/learn/leadership/development" },
  { title: "Leadership courses", href: "/learn/leadership/courses" },
  { title: "Simulations", href: "/learn/leadership/practice" },
  { title: "Team discussion kits", href: "/learn/leadership/team-kits" },
  { title: "Areas of practice", href: "/learn/leadership/areas" },
  { title: "About this section", href: "/learn/leadership/about" },
];

/** The leadership styles lead this page; everything else is one click away. */
export default function LeadershipHome() {
  const section = `${currentUnit().short} Leadership`;
  return <div className="leadership-focus">
    <header className="leadership-focus-head">
      <h1>{section}</h1>
      <p>The ways leaders use authority, share decisions and develop people, and how each one shapes the people you lead. Start with one you recognize in yourself, or <a href="#find-a-style">find a style to explore</a>.</p>
    </header>

    <section className="leadership-card"><h2>Find a tool for your work</h2><p>Choose a practical tool for a decision, conversation, service barrier or change you want to examine.</p><Link href="/learn/tools">Explore tools for staff and leaders</Link></section>
    <section className="leadership-card" aria-labelledby="development-sequence-title">
      <h2 id="development-sequence-title">Develop your inclusive leadership practice</h2>
      <p>Build from foundations to advanced organizational change through six stages and twenty-four applied modules. Connect leadership approaches with intercultural understanding, rehearse decisions, use editable work tools and return to what happened.</p>
      <p><Link href="/learn/leadership/development">Explore the full development sequence</Link> · <Link href="/learn/leadership/development/framework">See the intercultural crosswalk</Link></p>
    </section>
    <section className="equity-bar" data-palette="2" aria-labelledby="equity-title">
      <h2 id="equity-title">How the styles relate to advancing equity</h2>
      <p className="equity-sub">Where each style tends to sit, from approaches that undermine equity to those that most directly advance it.</p>
      <div className="equity-scale" aria-hidden="true"><span>Works against equity</span><span>Most directly advances equity</span></div>
      <ol className="equity-zones">{EQUITY_ZONES.map(zone => <li key={zone.id} className={`equity-zone equity-zone-${zone.id}`}>
        <span className="equity-node" aria-hidden="true" />
        <h3>{zone.label}</h3>
        <p>{zone.note}</p>
        <ul>{zone.styles.map(slug => { const style = getStyle(slug)!; return <li key={slug} className={`equity-chip style-group-${style.group}`}><Link href={styleHref(slug)}>{style.name.replace(/ leadership$/, "")}</Link></li>; })}</ul>
      </li>)}</ol>
      <p className="equity-note">Placement follows the program&apos;s leadership styles guide. Any style can be used well or poorly, and strong leaders move between styles on purpose. In a representative survey of Norway&apos;s workforce, passive, hands-off leadership was the most common harmful leadership behavior, more common than harsh, controlling leadership (<a href="https://doi.org/10.1111/j.1467-8551.2009.00672.x">Aasland and colleagues, British Journal of Management, 2010</a>).</p>
    </section>

    <div id="styles" className="leadership-styles">
      {styleGroups.map(group => <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className={`style-group-block style-group-${group.id}`}>
        <h2 id={`${group.id}-title`} className="style-group-name">{group.title}</h2>
        <ul className="style-cards">{stylesInGroup(group.id).map(style => <li key={style.slug} className="style-tile">
          <h3><Link href={styleHref(style.slug)} className="style-tile-link">{style.name.replace(/ leadership$/, "")}</Link></h3>
          <p>{style.summary}</p>
        </li>)}</ul>
      </section>)}
    </div>

    <StyleFinder styles={allStyles.map(st => ({ slug: st.slug, name: st.name.replace(/ leadership$/, ""), summary: st.summary, href: styleHref(st.slug) }))} />

    <nav className="leadership-more-row" aria-label="More for leaders">
      <h2>More for leaders</h2>
      <ul>{MORE.map(item => <li key={item.href}><Link href={item.href}>{item.title}</Link></li>)}</ul>
    </nav>
  </div>;
}
