import Image from "next/image";
import Link from "next/link";
import styles from "./welcome.module.css";

export default function WelcomePage() {
  return <section className={styles.welcome} aria-labelledby="welcome-title">
    <h1 id="welcome-title" className={styles.title}>One DSD People, Access and Culture</h1>
    <div className={styles.graphic}>
      <Image className={styles.artwork} src="/images/welcome/one-dsd-entry-larger-text-4k.png" width={3840} height={2160} preload quality={90} sizes="(max-width: 3840px) 100vw, 3840px" alt="One DSD People, Access and Culture. Practical support for DSD staff across equity, accessibility, intercultural practice, leadership, and engagement. Colleagues work together above a navy banner, with the Minnesota Department of Human Services logo and a QR code below." />
      <a className={styles.qrLink} href="/home" aria-label="Open One DSD People, Access and Culture from the QR code" />
    </div>
    <div className={styles.entry}>
      <Link className={styles.enter} href="/home">Enter One DSD <span aria-hidden="true">→</span></Link>
    </div>
    <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#334155", padding: "0 20px 20px", margin: 0 }}>Property of Gary Banks</p>
  </section>;
}
