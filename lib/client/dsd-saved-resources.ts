export type SavedResource = { href: string; title: string; savedAt: string };
export const SAVED_RESOURCES_KEY = "one-dsd-saved-resources-v1";
export const SAVED_RESOURCES_EVENT = "one-dsd-saved-resources-changed";
export function canSaveResource(path: string) {
  // A saved link must remain the same eligible internal path when a browser
  // opens it. URL normalization otherwise lets dot segments escape the prefix.
  try {
    const base = "https://one-dsd.invalid";
    const parsed = new URL(path, base);
    if (parsed.origin !== base || parsed.pathname !== path || parsed.search || parsed.hash
      || /[\\\u0000-\u0020\u007f]/.test(path)) return false;
    const decoded = decodeURIComponent(path);
    if (/[\\\u0000-\u001f\u007f]/.test(decoded)
      || decoded.split("/").some(segment => segment === "." || segment === "..")) return false;
  } catch { return false; }
  return /^\/(courses|library|minnesota-communities|journeys|practice-guides|toolkit-studio)\/[^?#]+$/.test(path)
    || /^\/(learn\/equity-toolkit(?:\/[^?#]+)?|operationalizing-equity|practice\/[^?#]+)$/.test(path);
}
export function readSavedResources(): { items: SavedResource[]; available: boolean; message: string } {
  try {
    const raw = localStorage.getItem(SAVED_RESOURCES_KEY);
    if (!raw) return { items: [], available: true, message: "" };
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("version" in data) || data.version !== 1 || !("items" in data)
      || !Array.isArray(data.items) || !data.items.every(item => item && typeof item === "object"
        && typeof item.href === "string" && canSaveResource(item.href) && typeof item.title === "string"
        && item.title.length > 0 && typeof item.savedAt === "string")) throw new Error("Invalid saved resources");
    return { items: Array.from(new Map(data.items.map(item => [item.href, item as SavedResource])).values()), available: true, message: "" };
  } catch {
    return { items: [], available: false, message: "Your saved resources could not be opened. They have not been replaced. Try again when saving is available." };
  }
}
export function changeSavedResource(resource: SavedResource, remove: boolean): { ok: boolean; message: string } {
  const current = readSavedResources();
  if (!current.available) return { ok: false, message: current.message };
  if (!canSaveResource(resource.href) || !resource.title.trim()) return { ok: false, message: "This page could not be saved. Open the resource and try again." };
  const items = current.items.filter(item => item.href !== resource.href);
  if (!remove) items.unshift({ ...resource, title: resource.title.slice(0, 500) });
  try {
    localStorage.setItem(SAVED_RESOURCES_KEY, JSON.stringify({ version: 1, items }));
    window.dispatchEvent(new Event(SAVED_RESOURCES_EVENT));
    return { ok: true, message: remove ? "Removed from your saved resources." : "Saved to My work on this device." };
  } catch {
    return { ok: false, message: remove ? "This device could not remove that resource. It is still in your saved list." : "This device could not save the resource. Keep the page open or copy its address to return to it." };
  }
}
