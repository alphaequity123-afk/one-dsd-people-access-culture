import Link from "@/components/app-link";
import styles from "./pillar-hub.module.css";

/**
 * v2 rebuild (2026-11-25): one pattern for every pillar page. Each page states its purpose, offers one main
 * action, and groups the existing pages beneath it so anything useful stays within three selections.
 * Ask opens from the banner on every page, so a pillar page only reminds people it is there.
 */
/** `ask` adds an "Ask about this tool" link that opens Ask with that question filled in. */
export type PillarLink = { label: string; href: string; description?: string; ask?: string };
export type PillarGroup = { title: string; intro?: string; links: PillarLink[] };

export function PillarHub({ id, title, lede, primary, groups, note, lead, children }: {
  id: string;
  title: string;
  lede: string;
  primary: { label: string; href: string };
  groups: PillarGroup[];
  note?: React.ReactNode;
  /** Shown right after the introduction, before the cards: a reminder or a search box. */
  lead?: React.ReactNode;
  /** Sections shown after the cards, before the closing note. */
  children?: React.ReactNode;
}) {
  return <div className={styles.hub}>
    <header className={styles.intro} aria-labelledby={`${id}-title`}>
      <h1 id={`${id}-title`}>{title}</h1>
      <p className={styles.lede}>{lede}</p>
      <p><Link className={styles.primary} href={primary.href}>{primary.label}</Link></p>
    </header>
    {lead ? <div className={styles.lead}>{lead}</div> : null}
    <div className={styles.groups}>
      {groups.map(group => <section key={group.title} className={styles.group} aria-labelledby={`${id}-${slug(group.title)}`}>
        <h2 id={`${id}-${slug(group.title)}`}>{group.title}</h2>
        {group.intro ? <p className={styles.groupIntro}>{group.intro}</p> : null}
        <ul>{group.links.map(link => <li key={link.href}>
          <Link href={link.href}><strong>{link.label}</strong>{link.description ? <span>{link.description}</span> : null}</Link>
        </li>)}</ul>
      </section>)}
    </div>
    {children ? <div className={styles.extra}>{children}</div> : null}
    <aside className={styles.note} aria-label="Using Ask on this page">
      {note ? <div>{note}</div> : null}
      <p>Have a question about this work? Open <strong>Ask</strong> at the top of any page. Leave out client, case, health and personnel details.</p>
    </aside>
  </div>;
}

/** Pillar cards inside an existing page, such as the applied tools at the top of Practice. */
export function PillarCards({ id, title, intro, groups }: { id: string; title: string; intro?: string; groups: PillarGroup[] }) {
  return <section className={styles.cards} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{title}</h2>
    {intro ? <p>{intro}</p> : null}
    <div className={styles.groups}>
      {groups.map(group => <section key={group.title} className={styles.group} aria-labelledby={`${id}-${slug(group.title)}`}>
        <h3 id={`${id}-${slug(group.title)}`}>{group.title}</h3>
        {group.intro ? <p className={styles.groupIntro}>{group.intro}</p> : null}
        <ul>{group.links.map(link => <li key={link.href}>
          <Link href={link.href}><strong>{link.label}</strong>{link.description ? <span>{link.description}</span> : null}</Link>
          {link.ask ? <Link className={styles.askLink} href={`/ask?q=${encodeURIComponent(link.ask)}`} aria-label={`Ask about ${link.label}`}>Ask about this tool</Link> : null}
        </li>)}</ul>
      </section>)}
    </div>
  </section>;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
