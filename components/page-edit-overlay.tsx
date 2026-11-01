"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { normalizePagePath } from "@/lib/content/page-edit-keys";
import { createPageEditEngine, type PageEditEngine } from "@/lib/content/page-edit-dom";
import type { PageEditControlsProps, PageEditsResponse } from "./page-edit-controls";

/**
 * Shows the owner's saved page edits to every reader, on every page, after hydration and on each
 * client navigation. It renders nothing itself. The editing controls are a separate file loaded
 * only after the server confirms a signed-in owner, so readers never receive them.
 * Failure at any step leaves the page showing its original wording.
 */
export function PageEditOverlay() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const routerRef = useRef(router);
  const [engine, setEngine] = useState<PageEditEngine | null>(null);
  const [data, setData] = useState<{ path: string; response: PageEditsResponse } | null>(null);
  const [Controls, setControls] = useState<ComponentType<PageEditControlsProps> | null>(null);

  useEffect(() => { routerRef.current = router; }, [router]);

  useEffect(() => {
    const created = createPageEditEngine(document, (href) => {
      if (href.startsWith("https://")) window.location.assign(href);
      else if (href.startsWith("#")) window.location.hash = href;
      else routerRef.current.push(href);
    });
    setEngine(created);
    return () => created.stop();
  }, []);

  useEffect(() => {
    if (!engine) return;
    const path = normalizePagePath(pathname);
    // Wording saved for the previous page must not touch this one, even for a moment.
    engine.setEdits({ page: {}, site: engine.edits().site }, { newPage: true });
    if (!path) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/page-edits?path=${encodeURIComponent(path)}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const body = (await response.json()) as PageEditsResponse;
        if (controller.signal.aborted || !body || body.ok !== true) return;
        engine.setEdits({ page: body.page ?? {}, site: body.site ?? {} });
        setData({ path, response: body });
      } catch {
        // No connection or an aborted request: the page keeps its original wording.
      }
    })();
    return () => controller.abort();
  }, [pathname, engine]);

  // Controls loaded for one page are never shown on the next.
  const current = data && data.path === normalizePagePath(pathname) ? data : null;
  const canEdit = current?.response.canEdit === true;
  useEffect(() => {
    if (!canEdit || Controls) return;
    let cancelled = false;
    import("./page-edit-controls")
      .then((loaded) => { if (!cancelled) setControls(() => loaded.PageEditControls); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [canEdit, Controls]);

  if (!canEdit || !Controls || !engine || !current) return null;
  return (
    <Controls
      key={current.path}
      path={current.path}
      engine={engine}
      data={current.response}
      onChange={(response) => {
        engine.setEdits({ page: response.page ?? {}, site: response.site ?? {} });
        setData({ path: current.path, response });
      }}
    />
  );
}
