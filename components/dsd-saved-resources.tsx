"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { canSaveResource, changeSavedResource, readSavedResources, SAVED_RESOURCES_EVENT, SAVED_RESOURCES_KEY } from "@/lib/client/dsd-saved-resources";

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

export function ResourceActions() {
  const path = usePathname();
  return canSaveResource(path) ? <ResourceActionsForPath key={path} path={path} /> : null;
}

function ResourceActionsForPath({ path }: { path: string }) {
  const saved = useSavedResources();
  const current = saved.items.find(item => item.href === path);
  function toggle() {
    const title = document.querySelector("main h1")?.textContent?.trim() || document.title.split("|")[0].trim();
    saved.setNotice(changeSavedResource({ href: path, title, savedAt: new Date().toISOString() }, Boolean(current)).message);
  }
  // One quiet control. Finding another resource is the Learn menu's job; using a saved
  // resource in a practice plan is offered once the resource is saved.
  return <aside className="dsd-shell dsd-resource-actions" aria-label="Resource actions">
    <button type="button" aria-pressed={Boolean(current)} onClick={toggle}>{current ? "Saved to My work" : "Save resource"}</button>
    {current ? <Link href="/my-work/plan">Use it in a practice plan</Link> : null}
    {saved.notice ? <p role="status">{saved.notice}</p> : null}
  </aside>;
}

export function SavedResourceShelf() {
  const saved = useSavedResources();
  return <section className="dsd-saved-shelf" aria-labelledby="saved-resources-heading">
    <div className="dsd-section-heading"><div><p className="dsd-eyebrow">Your collection</p><h2 id="saved-resources-heading">Saved resources</h2></div><Link href="/library">Find a resource →</Link></div>
    {!saved.available ? <div role="status"><p>{saved.message}</p><button type="button" onClick={saved.refresh}>Try opening saved resources again</button></div>
      : saved.items.length ? <ul>{saved.items.map(item => <li key={item.href}><Link href={item.href}>{item.title}</Link><button type="button" aria-label={`Remove ${item.title} from saved resources`} onClick={() => saved.setNotice(changeSavedResource(item, true).message)}>Remove</button></li>)}</ul>
      : <div className="dsd-empty-state"><p>Keep useful learning and tools close to your work.</p><p>Choose <strong>Save resource</strong> on a course, community brief, tool, or practice guide. Your collection stays on this device.</p></div>}
    {saved.notice ? <p role="status">{saved.notice}</p> : null}
  </section>;
}
