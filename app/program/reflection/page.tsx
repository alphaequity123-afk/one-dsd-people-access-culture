import Link from "@/components/app-link";
import { DsdReflection } from "@/components/dsd-reflection";
export const metadata = { title: "Practice reflection" };
export default function ReflectionPage() {
  return <article className="dsd-shell dsd-stage"><header className="dsd-page-heading"><p className="dsd-eyebrow">Learning from experience</p><h1>Notice what changed.</h1><p className="dsd-lede">Start with something concrete you observed, and look at how an action connects to its effects. Think about the perspectives behind your conclusion, be honest about what is still uncertain, and choose a reasonable next step.</p></header><DsdReflection /><nav className="dsd-next"><Link href="/program/progress">Review progress</Link><Link href="/program/impact">Consider lasting change</Link></nav></article>;
}
