"use client";
import Link from "@/components/app-link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { canSaveResource, changeSavedResource, readSavedResources, SAVED_RESOURCES_EVENT, SAVED_RESOURCES_KEY } from "@/lib/client/dsd-saved-resources";
import { mayStudyPage, resourceStudyHref } from "@/lib/client/resource-study-links";
import { useProgramContext } from "./program-context";
import { ResourceCreationLink } from "./resource-creation-link";

function useSavedResources() {
  const [saved, setSaved] = useState(readSavedResources);
  const [notice, setNotice] = useState("");
  const refresh = () => setSaved(readSavedResources());
  useEffect(() => {
    const update = () => setSaved(readSavedResources());
    const external = (event: StorageEvent) => { if (event.key === SAVED_RESOURCES_KEY || event.key === null) update(); };
    window.addEventListener(SAVED_RESOURCES_EVENT, update);
    window.addEventListener("storage", external);
    return () => { window.removeEventListener(SAVED_RESOURCES_EVENT, update); window.removeEventListener("storage", external); };
  }, []);
  return { ...saved, notice, setNotice, refresh };
}

export function ResourceActions({ canCreate = false }: { canCreate?: boolean } = {}) {
  const path = usePathname();
  const { context } = useProgramContext();
  const canSave = canSaveResource(path);
  const canStudy = mayStudyPage(path);
  const canCreateFromWater = canCreate && /^\/learn\/water-we-swim-in(?:\/module-[1-6])?\/?$/.test(path);
  return canSave || canStudy || canCreateFromWater
    ? <ResourceActionsForPath key={`${context}:${path}`} path={path} canSave={canSave} canStudy={canStudy} canCreate={canCreate} checkSource={canStudy || canCreateFromWater} />
    : null;
}

function ResourceActionsForPath({ path, canSave, canStudy, canCreate, checkSource }: {
  path: string; canSave: boolean; canStudy: boolean; canCreate: boolean; checkSource: boolean;
}) {
  const saved = useSavedResources();
  const current = saved.items.find(item => item.href === path);
  const [studyAvailable, setStudyAvailable] = useState(false);
  useEffect(() => {
    if (!checkSource) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ resourcePath: path });
    fetch(`/api/learn/resources?${query}`, { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(body => {
        if (!controller.signal.aborted && body?.available === true) setStudyAvailable(true);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [path, checkSource]);

  function toggle() {
    const title = document.querySelector("main h1")?.textContent?.trim() || document.title.split("|")[0].trim();
    saved.setNotice(changeSavedResource({ href: path, title, savedAt: new Date().toISOString() }, Boolean(current)).message);
  }
  if (!canSave && !studyAvailable) return null;
  return <aside className="dsd-shell dsd-resource-actions" aria-label="Resource actions">
    {canSave ? <button type="button" aria-pressed={Boolean(current)} onClick={toggle}>{current ? "Saved to My work" : "Save resource"}</button> : null}
    {current ? <Link href="/my-work/plan">Use it in a practice plan</Link> : null}
    {canStudy && studyAvailable ? <Link href={resourceStudyHref(path)} prefetch={false} className="inline-flex min-h-11 items-center underline underline-offset-4">Study this resource</Link> : null}
    {canCreate && studyAvailable ? <ResourceCreationLink resourcePath={path} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" /> : null}
    {saved.notice ? <p role="status">{saved.notice}</p> : null}
  </aside>;
}

export function SavedResourceShelf() {
  const saved = useSavedResources();
  return <section className="dsd-saved-shelf" aria-labelledby="saved-resources-heading">
    <div className="dsd-section-heading"><div><p className="dsd-eyebrow">Your collection</p><h2 id="saved-resources-heading">Saved resources</h2></div><Link href="/library">Find a resource</Link></div>
    {!saved.available ? <div role="status"><p>{saved.message}</p><button type="button" onClick={saved.refresh}>Try opening saved resources again</button></div>
      : saved.items.length ? <ul>{saved.items.map(item => <li key={item.href}><Link href={item.href}>{item.title}</Link><button type="button" aria-label={`Remove ${item.title} from saved resources`} onClick={() => saved.setNotice(changeSavedResource(item, true).message)}>Remove</button></li>)}</ul>
      : <div className="dsd-empty-state"><p>Keep useful learning and tools close to your work.</p><p>Choose <strong>Save resource</strong> on a course, community brief, tool, or practice guide.</p></div>}
    {saved.notice ? <p role="status">{saved.notice}</p> : null}
  </section>;
}
