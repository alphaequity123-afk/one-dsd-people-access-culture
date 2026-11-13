import Link from "@/components/app-link";
import { RESOURCE_THEMES } from "@/lib/content/resource-organization";

export function ResourceThemeNav({ basePath, className, gridClassName }: { basePath: "/learn" | "/library" | "/learn/sources" | "/audio-library"; className?: string; gridClassName?: string }) {
  return <section className={className} aria-labelledby="resource-themes-title">
    <h2 id="resource-themes-title">Explore by theme</h2>
    <p>Find related learning, useful tools, and ways to apply them in your work.</p>
    <ul className={gridClassName}>{RESOURCE_THEMES.map(theme => <li key={theme.id}>
      <h3><Link href={`${basePath}?theme=${theme.id}`}>{theme.title}</Link></h3>
      <p>{theme.description}</p>
    </li>)}</ul>
  </section>;
}
