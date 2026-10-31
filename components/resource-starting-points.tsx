import Link from "next/link";
import type { ContentItem } from "@/lib/content/types";

/** One set of entry links into existing resources; no additional copies of content. */
export function ResourceStartingPoints({ className, items, toolkitAvailable }: { className?: string; items: readonly ContentItem[]; toolkitAvailable: boolean }) {
  const available = new Set(items.filter(item => item.status === "approved").map(item => item.id));
  const toolkitLinks = [
    ...(toolkitAvailable ? [{ href:"/learn/equity-toolkit", label:"Start with the toolkit guide" }] : []),
    ...(available.has("ext-dhs-equity-toolkit") ? [{ href:"/library/ext-dhs-equity-toolkit", label:"Read the original DHS toolkit source" }] : []),
    ...(available.has("course-dhs-equity-analysis-toolkit") ? [{ href:"/courses/dhs-equity-analysis-toolkit", label:"Learn with the companion course" }] : []),
  ];
  return <section className={className} aria-labelledby="resource-start-title">
    <h2 id="resource-start-title">What would help with your work?</h2>
    <p>Go straight to a useful tool, prepare a piece of work, or build your understanding. Choose the support that fits your question.</p>
    <div className="resource-entry-grid">
      {toolkitLinks.length ? <article><h3><Link href={toolkitLinks[0].href}>Examine a policy or decision</Link></h3><p>Consider who is affected, compare choices, and prepare a reasoned recommendation.</p><ul>{toolkitLinks.map(link=><li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></article> : null}
      <article><h3><Link href="/practice-guides/clearer-processes">Make information easier to use</Link></h3><p>Help people understand a notice, form, or next step without losing the meaning.</p><ul>{available.has("ja-plain-language") ? <li><Link href="/library/ja-plain-language">Use the plain language and access checklist</Link></li> : null}{available.has("self-directed-F16") ? <li><Link href="/learning/self-directed/index.html?course=F16">Learn plain language through practice</Link></li> : null}<li><Link href="/practice-guides/clearer-processes">Work through a process improvement</Link></li></ul></article>
      <article><h3><Link href="/practice">Prepare for a real situation</Link></h3><p>Find a starting point for a meeting, service change, community conversation, or review.</p><ul><li><Link href="/practice-guides/inclusive-meetings">Prepare accessible participation</Link></li><li><Link href="/practice">Choose a guided work path</Link></li><li><Link href="/practice-guides/review-a-change">Learn from what changed</Link></li></ul></article>
    </div>
  </section>;
}
