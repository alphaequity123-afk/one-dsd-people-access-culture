import Link from "@/components/app-link";
import type { Metadata } from "next";
import { RecordWorkbench } from "@/components/record-workbench";
import { REFLECTION_PROMPTS } from "@/lib/content/leadership-journey";

export const metadata: Metadata = { title: "Your reflection notebook" };

type Props = { searchParams: Promise<{ from?: string }> };

export default async function ReflectionsPage({ searchParams }: Props) {
  const { from } = await searchParams;
  const source = typeof from === "string" ? from.slice(0, 200) : "";
  return <div className="calm calm-narrow">
    <nav className="calm-crumbs" aria-label="Breadcrumb"><Link href="/my-work">My work</Link></nav>
    <p className="calm-kicker">Look back and learn</p>
    <h1>Your reflection notebook</h1>
    <p className="calm-lede">A few honest lines after a lesson, a hard moment or a finished piece of work. Three questions carry most of it: what happened, why it matters, and what you will do next.</p>
    <details>
      <summary>Questions for each kind of reflection</summary>
      <ul className="list-disc space-y-2 pl-6">
        {REFLECTION_PROMPTS.map(prompt => <li key={prompt.kind}><strong>{prompt.kind}.</strong> {prompt.when} {prompt.questions.join(" ")}</li>)}
      </ul>
      <p>Set a date to look back. When it arrives, the notebook shows you the reflection the next time you open this page.</p>
    </details>
    <RecordWorkbench kind="reflection" prefill={source ? { about: source, title: `Reflection: ${source}`.slice(0, 160) } : {}} />
    <p className="calm-muted calm-small">Part of <Link href="/leading/journey">your leadership journey</Link>, and open to everyone.</p>
  </div>;
}
