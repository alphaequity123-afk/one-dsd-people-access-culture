import type { Metadata } from "next";
import Link from "@/components/app-link";
import { RESOURCE_THEMES } from "@/lib/content/resource-organization";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";

export const metadata: Metadata = { title: "Explore collections by theme" };

export default function ThemeCollectionsPage() {
  return <div className={base.page}><div className={base.content}>
    <header className={base.intro}>
      <p className={base.eyebrow}>One DSD People, Access and Culture</p>
      <h1>Explore by theme</h1>
      <p className={base.lede}>Choose a subject to find related learning, practical resources, reading, research and listening together.</p>
      <p>Topics overlap. A resource may appear under more than one theme when it helps with different kinds of work; each link opens the same resource.</p>
    </header>
    <aside className={base.continue} aria-labelledby="clas-collection-title"><h2 id="clas-collection-title">CLAS curriculum collection</h2><p>Nine connected lessons, with videos, discussion audio, practice and planning resources in one shareable collection.</p><p><Link href="/learn/clas/collection">Open the collection</Link></p></aside>
    <ul className={styles.doors} aria-label="Themes">{RESOURCE_THEMES.map(theme => <li key={theme.id}>
      <Link className={styles.door} href={`/collections/${theme.id}`}><span className={styles.doorTitle}>{theme.title}</span><span>{theme.description}</span><span className={styles.doorAction}>Explore this theme</span></Link>
    </li>)}</ul>
    <aside className={base.continue} aria-labelledby="other-starts-title"><h2 id="other-starts-title">Another way to begin</h2><p><Link href="/learn/collections">Browse course collections</Link><Link href="/leading">Start with a leadership decision</Link><Link href="/practice">Choose a practical task</Link><Link href="/support/right-person">Find a person or office</Link></p></aside>
  </div></div>;
}
