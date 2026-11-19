/**
 * The connected program can be reached through two front doors: One DHS (the agency) and One DSD.
 * When the browser is on a One DSD address, the program presents One DSD and keeps people there.
 * Set NEXT_PUBLIC_DSD_FRONT_DOOR_ORIGIN to the One DSD application's address; optional extra
 * addresses that should also present One DSD go in NEXT_PUBLIC_DSD_FRONT_DOOR_HOSTS (comma separated).
 */
function hostOf(origin: string): string {
  try { return new URL(origin).host.toLowerCase(); } catch { return ""; }
}
function originOf(value: string): string {
  try { return new URL(value).origin; } catch { return ""; }
}

export const dsdFrontDoorOrigin = originOf(process.env.NEXT_PUBLIC_DSD_FRONT_DOOR_ORIGIN || "");

export function dsdFrontDoorHosts(origin = dsdFrontDoorOrigin, extra = process.env.NEXT_PUBLIC_DSD_FRONT_DOOR_HOSTS || ""): string[] {
  return [hostOf(origin), ...extra.split(",").map(h => h.trim().toLowerCase())].filter((h, i, all) => h && all.indexOf(h) === i);
}

/** Runs before the page paints, so the right name shows from the first frame. */
export function frontDoorScript(hosts = dsdFrontDoorHosts()): string {
  if (!hosts.length) return "";
  // On a One DSD address the page is marked so One DSD shows. Anywhere else (One DHS) the tab title is kept on
  // One DHS as well, including after moving between pages, because the title is written once for both.
  return `(function(){try{if(${JSON.stringify(hosts)}.indexOf(location.host.toLowerCase())>-1){document.documentElement.setAttribute("data-pac-unit","dsd");return}var f=function(){var t=document.title;if(t.indexOf("One DSD People, Access and Culture")>-1)document.title=t.split("One DSD People, Access and Culture").join("One DHS People, Access and Culture")};f();new MutationObserver(f).observe(document.head,{subtree:true,childList:true,characterData:true})}catch(e){}})();`;
}

/** An agency link becomes the same page on the One DSD front door. */
export function toFrontDoor(href: string, agencyOrigin: string, frontDoor = dsdFrontDoorOrigin): string {
  const from = originOf(agencyOrigin);
  if (!from || !frontDoor) return href;
  try {
    const url = new URL(href);
    return url.origin === from ? frontDoor + url.pathname + url.search + url.hash : href;
  } catch { return href; }
}

export const onDsdFrontDoor = () => typeof document !== "undefined" && document.documentElement.dataset.pacUnit === "dsd";
