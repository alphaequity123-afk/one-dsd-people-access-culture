import Link from "@/components/app-link";
import { WATER_FOUNDATION } from "@/lib/learning/water-foundation";
import styles from "./water-foundation-course.module.css";

export function WaterFoundationFeature() {
  // Owner decision 2026-11-21: the course and its video are retired; nothing is shown.
  return null;

  return <section className={styles.feature} aria-labelledby="water-foundation-title">
    <div>
      <p className={styles.eyebrow}>Featured course · About 1 hour</p>
      <h2 id="water-foundation-title">The Water We Swim In</h2>
      <p>Look at how familiar cultural assumptions shape public services, workplace decisions and whose experience counts. Connect that understanding to culturally responsive action.</p>
      <Link className={styles.primary} href={WATER_FOUNDATION.href}>Open the course</Link>
      <p className={styles.related}><Link href="/learn/water-we-swim-in/collection">Explore the briefs and practice collection</Link></p>
    </div>
    <video className={styles.video} controls controlsList="nodownload" playsInline preload="metadata" poster={WATER_FOUNDATION.poster} aria-label="Watch The Water We Swim In">
      <source src={WATER_FOUNDATION.video} type="video/mp4" />
      <track kind="captions" src={WATER_FOUNDATION.captions} srcLang="en" label="English" />
      <p><Link href={WATER_FOUNDATION.href}>Open the course and transcript</Link></p>
    </video>
  </section>;
}
