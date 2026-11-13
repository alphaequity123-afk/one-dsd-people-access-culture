
import { SourceLink } from "@/components/app-link";
import styles from '@/app/welcome.module.css';

export function WelcomeClasShare() {
  return <section className={styles.clasShare} aria-label="Open One DSD">
    <SourceLink href="/home"><img src="/images/welcome/one-dsd-home-qr.svg" width="320" height="320" alt="Scan to open the One DSD app" /></SourceLink>
  </section>;
}
