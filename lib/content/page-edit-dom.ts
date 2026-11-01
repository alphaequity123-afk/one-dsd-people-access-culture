import { comparableText, pageEditKey } from "@/lib/content/page-edit-keys";

/**
 * Applies the owner's page edits to the rendered page.
 *
 * React keeps references to the text nodes it rendered, so this only ever changes the data of an
 * existing text node and the href of an existing link. It never adds, removes or replaces nodes
 * and never writes HTML. It also waits for a part of the page to finish hydrating before changing
 * it, so React never finds wording it did not render.
 */
export type PageEditMaps = { page: Record<string, string>; site: Record<string, string> };

export type TextRun = {
  kind: "text";
  nodes: Text[];
  parent: HTMLElement;
  /** The wording as rendered, before any edit. */
  original: string;
  occurrence: number;
  key: string;
  siteKey: string;
  inMain: boolean;
};

export type LinkRun = {
  kind: "link";
  element: HTMLAnchorElement;
  original: string;
  occurrence: number;
  key: string;
  siteKey: string;
  inMain: boolean;
};

type RunMemory = { originals: string[]; original: string; applied: string };
type LinkMemory = { original: string; applied: string };
export type DomMemory = { runs: WeakMap<Text, RunMemory>; links: WeakMap<Element, LinkMemory> };

export function createDomMemory(): DomMemory {
  return { runs: new WeakMap(), links: new WeakMap() };
}

/** Never edited: form values, code, media, live messages, other editors, and these controls. */
const SKIP = [
  "script", "style", "noscript", "template", "textarea", "input", "select", "option",
  "svg", "canvas", "iframe", "object", "embed", "audio", "video", "next-route-announcer",
  "[contenteditable]", "[data-pac-editor]", "[data-pac-page-edit-ui]", "[role=status]", "[role=alert]",
].join(",");

const UI = "[data-pac-editor],[data-pac-page-edit-ui]";

function hasReactKey(element: Element, prefix: string): unknown {
  for (const key of Object.keys(element)) {
    if (key.startsWith(prefix)) return (element as unknown as Record<string, unknown>)[key];
  }
  return undefined;
}

/**
 * True while an element sits in a part of the page React has not hydrated yet. React marks each
 * element when it takes it over. Unmarked content under a marked ancestor is still waiting, unless
 * that ancestor deliberately rendered raw HTML, whose content React never takes over. This reads
 * React's private markers, so the engine also stops waiting after a time limit.
 */
export function hydrationPending(element: Element): boolean {
  if (hasReactKey(element, "__reactFiber$")) return false;
  for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
    if (!hasReactKey(ancestor, "__reactFiber$")) continue;
    const props = hasReactKey(ancestor, "__reactProps$") as { dangerouslySetInnerHTML?: unknown } | undefined;
    return !props?.dangerouslySetInnerHTML;
  }
  return false;
}

function joined(nodes: Text[]): string {
  return nodes.map((node) => node.data).join("");
}

/** Every piece of editable wording in document order. Adjacent text nodes count as one piece. */
export function collectTextRuns(root: Element, memory: DomMemory): TextRun[] {
  const runs: TextRun[] = [];
  const seen = new Map<string, number>();

  const finish = (nodes: Text[], parent: HTMLElement, inMain: boolean) => {
    if (!nodes.length) return;
    const current = joined(nodes);
    const remembered = memory.runs.get(nodes[0]);
    // If the wording is not what was last written here, React changed it: that is the new original.
    const original = remembered && remembered.applied === current ? remembered.original : current;
    if (remembered && remembered.applied !== current) memory.runs.delete(nodes[0]);
    const comparable = comparableText(original);
    if (!comparable) return;
    const occurrence = seen.get(comparable) ?? 0;
    seen.set(comparable, occurrence + 1);
    runs.push({
      kind: "text", nodes, parent, original, occurrence, inMain,
      key: pageEditKey("text", comparable, occurrence),
      siteKey: pageEditKey("text", comparable, 0),
    });
  };

  const visit = (element: Element, insideMain: boolean) => {
    const inMain = insideMain || element.tagName === "MAIN";
    let nodes: Text[] = [];
    for (let child = element.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 3) {
        nodes.push(child as Text);
      } else if (child.nodeType === 1) {
        finish(nodes, element as HTMLElement, inMain);
        nodes = [];
        if (!(child as Element).matches(SKIP)) visit(child as Element, inMain);
      }
      // Comment nodes (React's text separators) do not break a piece of wording.
    }
    finish(nodes, element as HTMLElement, inMain);
  };

  if (!root.matches(SKIP)) visit(root, false);
  return runs;
}

export function collectLinks(root: Element, memory: DomMemory): LinkRun[] {
  const links: LinkRun[] = [];
  const seen = new Map<string, number>();
  for (const element of Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"))) {
    if (element.closest(UI)) continue;
    const current = element.getAttribute("href") ?? "";
    const remembered = memory.links.get(element);
    const original = remembered && remembered.applied === current ? remembered.original : current;
    if (remembered && remembered.applied !== current) memory.links.delete(element);
    const subject = original.trim();
    if (!subject) continue;
    const occurrence = seen.get(subject) ?? 0;
    seen.set(subject, occurrence + 1);
    links.push({
      kind: "link", element, original, occurrence,
      inMain: Boolean(element.closest("main")),
      key: pageEditKey("link", subject, occurrence),
      siteKey: pageEditKey("link", subject, 0),
    });
  }
  return links;
}

/** Put wording into a run, keeping the spacing around it that separates it from nearby markup. */
export function writeRun(run: TextRun, value: string, memory: DomMemory): void {
  const lead = /^\s*/.exec(run.original)?.[0] ?? "";
  const trail = /\s*$/.exec(run.original)?.[0] ?? "";
  const desired = lead + value + trail;
  const remembered = memory.runs.get(run.nodes[0]);
  const originals = remembered && remembered.applied === joined(run.nodes) ? remembered.originals : run.nodes.map((node) => node.data);
  run.nodes.forEach((node, index) => {
    const next = index === 0 ? desired : "";
    if (node.data !== next) node.data = next;
  });
  memory.runs.set(run.nodes[0], { originals, original: run.original, applied: desired });
}

function restoreRun(run: TextRun, memory: DomMemory): void {
  const remembered = memory.runs.get(run.nodes[0]);
  if (!remembered) return;
  run.nodes.forEach((node, index) => {
    const next = remembered.originals[index] ?? "";
    if (node.data !== next) node.data = next;
  });
  memory.runs.delete(run.nodes[0]);
}

function own(map: Record<string, string>, key: string): string | undefined {
  return Object.hasOwn(map, key) ? map[key] : undefined;
}

export type ApplyResult = {
  /** Edits held back because that part of the page has not hydrated. */
  pending: number;
  /** Edits currently showing. */
  active: number;
  /** Keys whose original text or link is on the page right now. */
  present: Set<string>;
};

export function applyEdits(root: Element, maps: PageEditMaps, memory: DomMemory, options: { force?: boolean } = {}): ApplyResult {
  const result: ApplyResult = { pending: 0, active: 0, present: new Set() };

  for (const run of collectTextRuns(root, memory)) {
    result.present.add(run.key);
    const siteValue = run.inMain ? undefined : own(maps.site, run.siteKey);
    if (!run.inMain) result.present.add(run.siteKey);
    const value = own(maps.page, run.key) ?? siteValue;
    if (value === undefined) {
      restoreRun(run, memory);
      continue;
    }
    const lead = /^\s*/.exec(run.original)?.[0] ?? "";
    const trail = /\s*$/.exec(run.original)?.[0] ?? "";
    if (joined(run.nodes) !== lead + value + trail) {
      if (!options.force && hydrationPending(run.parent)) {
        result.pending += 1;
        continue;
      }
      writeRun(run, value, memory);
    }
    result.active += 1;
  }

  for (const link of collectLinks(root, memory)) {
    result.present.add(link.key);
    if (!link.inMain) result.present.add(link.siteKey);
    const value = own(maps.page, link.key) ?? (link.inMain ? undefined : own(maps.site, link.siteKey));
    const remembered = memory.links.get(link.element);
    if (value === undefined) {
      if (remembered) {
        link.element.setAttribute("href", remembered.original);
        link.element.removeAttribute("data-pac-edited-href");
        memory.links.delete(link.element);
      }
      continue;
    }
    if (link.element.getAttribute("href") !== value) {
      if (!options.force && hydrationPending(link.element)) {
        result.pending += 1;
        continue;
      }
      link.element.setAttribute("href", value);
      link.element.setAttribute("data-pac-edited-href", "true");
      memory.links.set(link.element, { original: link.original, applied: value });
    }
    result.active += 1;
  }

  return result;
}

/** How long to hold edits back for hydration before applying them anyway. */
const HYDRATION_WAIT_MS = 8_000;
const RETRY_DELAYS_MS = [60, 150, 300, 600, 1_000, 1_500, 2_000];
/** A safety stop: page activity can trigger reapplying edits, but never without limit. */
const MAX_PASSES_PER_WINDOW = 120;
const PASS_WINDOW_MS = 10_000;

export type PageEditEngine = ReturnType<typeof createPageEditEngine>;

export function createPageEditEngine(doc: Document, navigate: (href: string) => void) {
  const memory = createDomMemory();
  let maps: PageEditMaps = { page: {}, site: {} };
  let deadline = 0;
  let paused = false;
  let keepWatching = false;
  let showing = false;
  let stopped = false;
  let retry = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let windowStart = 0;
  let passes = 0;
  let present = new Set<string>();
  const listeners = new Set<() => void>();
  const view = doc.defaultView as (Window & typeof globalThis) | null;

  const Observer = view?.MutationObserver;
  const observer = Observer ? new Observer((records) => {
    const relevant = records.some((record) => {
      const element = record.target.nodeType === 1 ? (record.target as Element) : record.target.parentElement;
      return !element?.closest(UI);
    });
    if (relevant) schedule(60);
  }) : null;

  function schedule(delay: number) {
    if (stopped || paused) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; pass(); }, delay);
  }

  function watch(on: boolean) {
    observer?.disconnect();
    if (on && !stopped) {
      observer?.observe(doc.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["href"] });
    }
  }

  function hasEdits() {
    return Object.keys(maps.page).length > 0 || Object.keys(maps.site).length > 0;
  }

  function pass() {
    if (stopped || paused) return;
    // A page with no edits, and nothing to put back, is left completely alone.
    if (!hasEdits() && !showing && !keepWatching) {
      watch(false);
      return;
    }
    const now = Date.now();
    if (now - windowStart > PASS_WINDOW_MS) {
      windowStart = now;
      passes = 0;
    }
    passes += 1;
    if (passes > MAX_PASSES_PER_WINDOW) {
      schedule(PASS_WINDOW_MS);
      return;
    }
    // Stop watching while writing, so these writes can never cause another pass.
    watch(false);
    let pending = 0;
    try {
      const result = applyEdits(doc.body, maps, memory, { force: now >= deadline });
      pending = result.pending;
      showing = result.active > 0;
      present = result.present;
    } catch (error) {
      console.error("Page edits could not be applied.", error instanceof Error ? error.name : "Error");
    }
    watch(hasEdits() || showing || keepWatching);
    if (pending > 0) {
      schedule(RETRY_DELAYS_MS[Math.min(retry, RETRY_DELAYS_MS.length - 1)]);
      retry += 1;
    } else {
      retry = 0;
    }
    for (const listener of listeners) listener();
  }

  /**
   * next/link navigates from the address React rendered, not the one on the element, so a click on
   * a link whose address was edited is sent to the edited address here. Clicks that open a new tab
   * or window use the element's address already and are left to the browser.
   */
  function followEditedLink(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest?.("a[data-pac-edited-href]");
    if (!link || keepWatching || link.getAttribute("target") === "_blank" || link.hasAttribute("download")) return;
    const href = link.getAttribute("href");
    if (!href) return;
    event.preventDefault();
    event.stopPropagation();
    navigate(href);
  }
  view?.addEventListener("click", followEditedLink, true);

  return {
    memory,
    /** Show these edits. The wait for hydration restarts only when the page itself changes. */
    setEdits(next: PageEditMaps, options: { newPage?: boolean } = {}) {
      maps = next;
      if (options.newPage || !deadline) deadline = Date.now() + HYDRATION_WAIT_MS;
      retry = 0;
      pass();
    },
    edits: () => maps,
    present: () => present,
    /** Hold automatic changes while the owner is working on a piece of wording. */
    pause() {
      paused = true;
      if (timer) clearTimeout(timer);
      timer = null;
    },
    resume() {
      paused = false;
      pass();
    },
    /** Keep watching the page during edit mode, even with nothing saved yet. */
    setEditing(on: boolean) {
      keepWatching = on;
      pass();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    textRuns: () => collectTextRuns(doc.body, memory),
    links: () => collectLinks(doc.body, memory),
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      watch(false);
      view?.removeEventListener("click", followEditedLink, true);
      listeners.clear();
    },
  };
}
