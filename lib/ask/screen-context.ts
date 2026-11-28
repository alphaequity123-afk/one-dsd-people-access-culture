/**
 * Ask Live (owner decision 2026-11-27): Ask sees the screen the person is on. Rather than capturing pixels, the page
 * tells Ask what it shows: the address, the title, the passage in the middle of the screen and the main text.
 * Only the site's own content is read; form fields, buttons, closed sections and the Ask panel are left out.
 * Nothing here is stored beyond the open page, and nothing is sent until the person asks a question.
 */
export type ScreenContext = { path: string; title: string; focus?: string; text?: string };

const clean = (value: string | null | undefined, max: number) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const ASK_PANEL = "#dsd-ask-panel, [data-ask-panel], .ask-panel";

/** The page's own content, without the Ask panel, the site menus, form fields, buttons or hidden parts. */
function readable(root: Element): string {
  const copy = root.cloneNode(true) as Element;
  copy.querySelectorAll(`input, textarea, select, button, script, style, noscript, [hidden], [aria-hidden='true'], nav, .rise-side, ${ASK_PANEL}`).forEach(node => node.remove());
  // A closed section shows only its heading on screen, so only the heading is read.
  copy.querySelectorAll("details:not([open]) > :not(summary)").forEach(node => node.remove());
  // A copy has no layout, so breaks between blocks are added by hand; otherwise words from separate lines run together.
  copy.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, div, section, article, figure, figcaption, summary, td, th, br, dt, dd, a").forEach(node => node.after(" "));
  return copy.textContent ?? "";
}

function mainArea(): Element | null {
  return document.querySelector("main#main") ?? document.querySelector("main");
}

/** The block nearest the middle of the screen: a course block, a section or a passage. */
function inView(main: Element): string {
  const middle = window.innerHeight / 2;
  const blocks = Array.from(main.querySelectorAll(".rise-b, .rise-band, section, article, figure, p, li, h2, h3"))
    .filter(element => !element.closest(`${ASK_PANEL}, nav, .rise-side`));
  let best: Element | undefined;
  let bestDistance = Infinity;
  let bestHeight = Infinity;
  for (const block of blocks) {
    const box = block.getBoundingClientRect();
    if (box.height < 12 || box.bottom < 0 || box.top > window.innerHeight) continue;
    const distance = box.top <= middle && box.bottom >= middle ? 0 : Math.min(Math.abs(box.top - middle), Math.abs(box.bottom - middle));
    // Among blocks at the same distance, the smallest is the passage itself rather than a container around it.
    if (distance < bestDistance || (distance === bestDistance && box.height < bestHeight)) { best = block; bestDistance = distance; bestHeight = box.height; }
  }
  if (!best) return "";
  // A course block is the natural unit. Otherwise use the enclosing section when it is short, or the passage
  // itself with the heading above it when the section is the whole page.
  const block = best.closest(".rise-b, .rise-band");
  if (block) return clean(readable(block), 1500);
  const section = best.closest("section, article");
  if (section && clean(readable(section), 1600).length < 1500) return clean(readable(section), 1500);
  const heading = headingBefore(best, main);
  return clean((heading ? heading + ": " : "") + readable(best), 1500);
}

/** The nearest heading above an element, within the main area. */
function headingBefore(element: Element, main: Element): string {
  const headings = Array.from(main.querySelectorAll("h1, h2, h3, h4"));
  let found = "";
  for (const heading of headings) {
    if (heading === element || heading.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) found = heading.textContent ?? "";
    else break;
  }
  return clean(found, 200);
}

/* The Ask panel covers the page while it is open, so the passage the person was reading is remembered
   as they scroll and just before they open Ask. Kept in this page only. */
let remembered: { path: string; focus: string } | undefined;
function askPanelOpen() {
  const panel = document.querySelector(ASK_PANEL) as HTMLElement | null;
  return !!panel && !panel.hidden && panel.offsetHeight > 0;
}
function remember() {
  if (askPanelOpen()) return;
  const main = mainArea();
  if (!main) return;
  const focus = inView(main);
  if (focus) remembered = { path: window.location.pathname, focus };
}
if (typeof window !== "undefined") {
  let timer: number | undefined;
  const soon = () => { window.clearTimeout(timer); timer = window.setTimeout(remember, 250); };
  window.addEventListener("scroll", soon, { passive: true });
  window.addEventListener("resize", soon, { passive: true });
  // Pressing Ask (or anything else) records the view before the panel opens.
  window.addEventListener("pointerdown", remember, { capture: true, passive: true });
  window.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") remember(); }, { capture: true });
  window.addEventListener("load", remember);
}

export function captureScreen(): ScreenContext | undefined {
  if (typeof document === "undefined") return undefined;
  const path = window.location.pathname;
  // On the Ask page itself the screen is the conversation; there is nothing else to see.
  if (/^\/(ask|embedded-tools\/ask)(\/|$)/.test(path)) return undefined;
  const main = mainArea();
  if (!main) return undefined;
  const live = askPanelOpen() ? "" : inView(main);
  const focus = live || (remembered?.path === path ? remembered.focus : "");
  return {
    path: path.slice(0, 300),
    title: clean(document.title, 300),
    focus: focus || undefined,
    text: clean(readable(main), 6000) || undefined,
  };
}
