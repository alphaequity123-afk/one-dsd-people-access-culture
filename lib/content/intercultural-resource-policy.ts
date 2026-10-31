export type RequestedResource = { title: string; href: string; note: string };
export type AvailableResource = RequestedResource;
export type ResourceResolverDependencies<Scope> = {
  course(scope: Scope, id: string): Promise<string | null>;
  library(scope: Scope, id: string): Promise<string | null>;
  surface(scope: Scope, path: string): Promise<string | null>;
};
/** External HTTPS sources retain their reviewed label. Internal links use current published titles. */
export async function resolveInterculturalResources<Scope>(scope: Scope, sources: readonly RequestedResource[], deps: ResourceResolverDependencies<Scope>): Promise<AvailableResource[]> {
  const items = await Promise.all(sources.map(async source => {
    const href = source.href;
    try {
      if (/^https:\/\//i.test(href) && !/[\u0000-\u0020\\]/.test(href)) {
        const url = new URL(href);
        if (url.protocol === "https:" && url.hostname && !url.username && !url.password) return source;
        return null;
      }
      if (!/^\/(?!\/)[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(href)) return null;
      const match = href.match(/^\/(courses|library)\/([A-Za-z0-9_-]+)$/);
      const title = match ? await (match[1] === "courses" ? deps.course(scope, match[2]) : deps.library(scope, match[2])) : await deps.surface(scope, href);
      return title ? { ...source, title } : null;
    } catch { return null; }
  }));
  return items.filter((item): item is AvailableResource => item !== null);
}
