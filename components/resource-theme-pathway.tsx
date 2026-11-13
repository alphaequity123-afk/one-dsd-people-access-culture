import Link from "@/components/app-link";
import { RESOURCE_PATHWAYS, publishedPathwayChoices } from "@/lib/content/resource-pathways";
import type { ContentItem } from "@/lib/content/types";
import { selfDirectedHref } from "@/lib/content/self-directed";

export function ResourceThemePathway({ theme, items, className }: { theme: string; items: readonly ContentItem[]; className?: string }) {
  const pathway = RESOURCE_PATHWAYS[theme];
  if (!pathway) return null;
  const choices = publishedPathwayChoices(pathway, items);
  if (!choices.length) return null;
  return <section className={className} aria-labelledby="resource-theme-practice-title">
    <h2 id="resource-theme-practice-title">{pathway.title}</h2>
    <p>{pathway.introduction}</p>
    <div className="resource-entry-grid">{choices.map(choice => <article key={choice.label}>
      <h3>{choice.label}</h3><p>{choice.purpose}</p>
      <ul>{choice.resources.map(item => <li key={item.id}><Link href={selfDirectedHref(item.id) ?? (item.id.startsWith("course-") ? "/courses/" + encodeURIComponent(item.id.slice(7)) : "/library/" + encodeURIComponent(item.id))}>{item.title}</Link></li>)}</ul>
    </article>)}</div>
    <h3>What you can take back to your work</h3><p>{pathway.workProduct}</p><p>{pathway.intendedBenefit}</p>
  </section>;
}
