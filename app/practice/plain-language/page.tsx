import Link from "next/link";
import { PlainLanguageRewrite } from "@/components/dsd-live/plain-language-rewrite";
import { rewriteItems } from "@/lib/dsd-live/practice/plain-language";
import { currentUnit } from "@/lib/dsd-live/unit";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return { title: "Rewrite it in plain language" };
}

export default function PlainLanguagePage() {
  const unit = currentUnit();
  return <div className="shell planner-page">
    <p className="crumbs">{unit.id === "dsd" ? <Link href="/practice/disability">Practice</Link> : <Link href="/learn">Learn</Link>}</p>
    <header className="planner-head">
      <p className="eyebrow">Try it</p>
      <h1>Rewrite it in plain language</h1>
      <p className="planner-lede">A notice only works if people can understand it and act on it. Rewrite each sentence from a fictional notice, watch the checks as you type, then compare your version with a stronger one.</p>
    </header>
    <PlainLanguageRewrite items={rewriteItems(unit.id)} />
  </div>;
}
