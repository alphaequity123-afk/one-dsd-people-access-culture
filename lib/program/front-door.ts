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

const DSD_NAME = "One DSD People, Access and Culture";
const DHS_NAME = "One DHS People, Access and Culture";

/** The agency address, when this program also serves as part of One DHS. */
export const agencyHost = process.env.NEXT_PUBLIC_DHS_AGENCY_ZONE === "1" ? hostOf(process.env.NEXT_PUBLIC_DHS_AGENCY_ORIGIN || "") : "";

/** On the One DHS address, the browser tab names One DHS rather than One DSD. */
export function agencyTitle(title: string): string {
  return title.split(DSD_NAME).join(DHS_NAME);
}

/**
 * Runs before the page paints. On a One DSD address it marks the page so the header shows One DSD from the
 * first frame. On the One DHS address it keeps the tab title naming One DHS, including after in-app navigation.
 */
export function frontDoorScript(hosts = dsdFrontDoorHosts(), agency = agencyHost): string {
  if (!hosts.length && !agency) return "";
  return `(function(){try{var h=location.host.toLowerCase();`
    + `if(${JSON.stringify(hosts)}.indexOf(h)>-1){document.documentElement.setAttribute("data-pac-unit","dsd");return}`
    + `if(h!==${JSON.stringify(agency)})return;`
    + `var fix=function(){var t=document.title,n=t.split(${JSON.stringify(DSD_NAME)}).join(${JSON.stringify(DHS_NAME)});if(n!==t)document.title=n};`
    + `fix();new MutationObserver(fix).observe(document.head,{subtree:true,childList:true,characterData:true})`
    + `}catch(e){}})();`;
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
