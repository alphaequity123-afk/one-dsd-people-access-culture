import Link from "next/link";
import { DsdReflection } from "@/components/dsd-reflection";
export const metadata = { title: "Practice reflection" };
export default function ReflectionPage() {
  return <article className="dsd-shell dsd-stage"><header className="dsd-page-heading"><p className="dsd-eyebrow">Learning from experience</p><h1>Notice what changed.</h1><p className="dsd-lede">Use a concrete observation to examine the relationship between an action and its effects. Consider the perspectives that informed your conclusion, acknowledge what remains uncertain, and identify a reasonable next step.</p></header><DsdReflection /><nav className="dsd-next"><Link href="/program/progress">Review progress</Link><Link href="/program/impact">Consider lasting change</Link></nav></article>;
}
