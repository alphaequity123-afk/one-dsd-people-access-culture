import styles from '@/app/welcome.module.css';

export function WelcomeClasShare() {
  return <section className={styles.clasShare} aria-label="Open One DSD">
    <a href="/home"><img src="/images/welcome/one-dsd-home-qr.svg" width="320" height="320" alt="Scan to open the One DSD app" /></a>
  </section>;
}
