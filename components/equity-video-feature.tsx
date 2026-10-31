import Link from "next/link";
import styles from "@/app/learn/equity-in-practice/equity-in-practice.module.css";
export function EquityVideoFeature() {
  return <section className={`dsd-shell ${styles.feature}`} aria-labelledby="equity-video-feature-title">
    <div><p className={styles.eyebrow}>From shared purpose to everyday work</p><h2 id="equity-video-feature-title">People, Access and Culture in practice</h2><p>Understand the Equity Outcome Map, then follow DSD examples that connect the six goals of the Aging and Disability Services Administration (ADSA) with useful tools and learning.</p></div>
    <Link href="/learn/equity-in-practice">Watch the two-part story <span aria-hidden="true">→</span></Link>
  </section>;
}
