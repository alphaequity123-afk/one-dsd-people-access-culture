// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyEdits,
  collectLinks,
  collectTextRuns,
  createDomMemory,
  createPageEditEngine,
  hydrationPending,
  writeRun,
} from "./page-edit-dom";
import { pageEditKey } from "./page-edit-keys";

const none = { page: {}, site: {} };

function text(selector: string) {
  return document.querySelector(selector)?.textContent;
}

function markHydrated(element: Element, props: Record<string, unknown> = {}) {
  Object.assign(element, { "__reactFiber$abc": {}, "__reactProps$abc": props });
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("finding wording", () => {
  it("skips form values, code, media, live messages, other editors and contenteditable regions", () => {
    document.body.innerHTML = `<main><p>Keep</p>
      <textarea>no1</textarea><select><option>no2</option></select><script>no3</script><style>no4</style>
      <noscript>no5</noscript><template>no6</template><svg><text>no7</text></svg>
      <div role="status">no8</div><div role="alert">no9</div><div data-pac-editor="true"><p>no10</p></div>
      <div data-pac-page-edit-ui="true"><p>no11</p></div><div contenteditable="true"><p>no12</p></div></main>`;
    const found = collectTextRuns(document.body, createDomMemory()).map((run) => run.original);
    expect(found).toEqual(["Keep"]);
  });

  it("treats text split by React's comment separators as one piece, and elements as boundaries", () => {
    document.body.innerHTML = "<p>Hello <!-- -->name<strong>bold</strong> after</p>";
    const found = collectTextRuns(document.body, createDomMemory()).map((run) => run.original);
    expect(found).toEqual(["Hello name", "bold", " after"]);
  });

  it("numbers repeats in document order and knows what is inside main", () => {
    document.body.innerHTML = "<header><a href='/x'>Open</a></header><main><p>Open</p><p>Open</p></main>";
    const runs = collectTextRuns(document.body, createDomMemory());
    expect(runs.map((run) => [run.occurrence, run.inMain])).toEqual([[0, false], [1, true], [2, true]]);
  });
});

describe("applying edits", () => {
  it("does nothing at all to a page with no edits", () => {
    document.body.innerHTML = "<main><p>One <b>two</b></p><a href='/x'>Go</a></main>";
    const before = document.body.innerHTML;
    const result = applyEdits(document.body, none, createDomMemory());
    expect(document.body.innerHTML).toBe(before);
    expect(result.active).toBe(0);
    expect(result.pending).toBe(0);
  });

  it("changes the existing text node and keeps every node React rendered", () => {
    document.body.innerHTML = "<main><p>Read <a href='/x'>this</a> today</p></main>";
    const paragraph = document.querySelector("p")!;
    const nodes = Array.from(paragraph.childNodes);
    applyEdits(document.body, { page: { [pageEditKey("text", "this", 0)]: "that" }, site: {} }, createDomMemory());
    expect(paragraph.textContent).toBe("Read that today");
    expect(Array.from(paragraph.childNodes)).toEqual(nodes);
    expect(paragraph.querySelector("a")?.firstChild).toBe(nodes[1].firstChild);
  });

  it("keeps the spacing that separates wording from nearby markup", () => {
    document.body.innerHTML = "<main><p>Read <a href='/x'>this</a> today</p></main>";
    applyEdits(document.body, { page: { [pageEditKey("text", "Read", 0)]: "See" }, site: {} }, createDomMemory());
    expect(text("p")).toBe("See this today");
  });

  it("writes markup as literal characters, never as elements", () => {
    document.body.innerHTML = "<main><p>Original</p></main>";
    const value = "<img src=x onerror=alert(1)><b>bold</b>";
    applyEdits(document.body, { page: { [pageEditKey("text", "Original", 0)]: value }, site: {} }, createDomMemory());
    expect(text("p")).toBe(value);
    expect(document.querySelector("img, b")).toBeNull();
    expect(document.querySelector("p")!.children).toHaveLength(0);
  });

  it("applies only to the chosen repeat", () => {
    document.body.innerHTML = "<main><p id='a'>Open</p><p id='b'>Open</p></main>";
    applyEdits(document.body, { page: { [pageEditKey("text", "Open", 1)]: "Close" }, site: {} }, createDomMemory());
    expect([text("#a"), text("#b")]).toEqual(["Open", "Close"]);
  });

  it("does not shift repeats after an edit is applied", () => {
    document.body.innerHTML = "<main><p id='a'>Open</p><p id='b'>Open</p></main>";
    const memory = createDomMemory();
    const maps = { page: { [pageEditKey("text", "Open", 0)]: "First", [pageEditKey("text", "Open", 1)]: "Second" }, site: {} };
    applyEdits(document.body, maps, memory);
    applyEdits(document.body, maps, memory);
    expect([text("#a"), text("#b")]).toEqual(["First", "Second"]);
  });

  it("restores the exact original when an edit is removed, including split text", () => {
    document.body.innerHTML = "<main><p>Hello <!-- -->name</p></main>";
    const memory = createDomMemory();
    const before = document.querySelector("p")!.innerHTML;
    applyEdits(document.body, { page: { [pageEditKey("text", "Hello name", 0)]: "Changed" }, site: {} }, memory);
    expect(text("p")).toBe("Changed");
    applyEdits(document.body, none, memory);
    expect(document.querySelector("p")!.innerHTML).toBe(before);
  });

  it("takes React's new wording as the new original and does not put back the old one", () => {
    document.body.innerHTML = "<main><p>Before</p></main>";
    const memory = createDomMemory();
    const maps = { page: { [pageEditKey("text", "Before", 0)]: "Edited" }, site: {} };
    applyEdits(document.body, maps, memory);
    document.querySelector("p")!.firstChild!.nodeValue = "React update";
    applyEdits(document.body, maps, memory);
    expect(text("p")).toBe("React update");
    applyEdits(document.body, none, memory);
    expect(text("p")).toBe("React update");
  });

  it("applies every-page edits to all repeats outside main, never inside it", () => {
    document.body.innerHTML = "<header><a id='a' href='/x'>Home</a><a id='b' href='/y'>Home</a></header><main><p>Home</p></main>";
    applyEdits(document.body, { page: {}, site: { [pageEditKey("text", "Home", 0)]: "Start" } }, createDomMemory());
    expect([text("#a"), text("#b"), text("p")]).toEqual(["Start", "Start", "Home"]);
  });

  it("reports edits whose original is not on the page", () => {
    document.body.innerHTML = "<main><p>Here</p></main>";
    const here = pageEditKey("text", "Here", 0);
    const gone = pageEditKey("text", "Gone", 0);
    const result = applyEdits(document.body, { page: { [here]: "A", [gone]: "B" }, site: {} }, createDomMemory());
    expect(result.present.has(here)).toBe(true);
    expect(result.present.has(gone)).toBe(false);
    expect(result.active).toBe(1);
  });

  it("changes and restores a link address, marking it for the click handler", () => {
    document.body.innerHTML = "<main><a id='a' href='/old'>Go</a><a id='b' href='/old'>Go</a></main>";
    const memory = createDomMemory();
    applyEdits(document.body, { page: { [pageEditKey("link", "/old", 1)]: "https://mn.gov/" }, site: {} }, memory);
    const [a, b] = [document.querySelector("#a")!, document.querySelector("#b")!];
    expect(a.getAttribute("href")).toBe("/old");
    expect(b.getAttribute("href")).toBe("https://mn.gov/");
    expect(b.hasAttribute("data-pac-edited-href")).toBe(true);
    expect(collectLinks(document.body, memory)[1].original).toBe("/old");
    applyEdits(document.body, none, memory);
    expect(b.getAttribute("href")).toBe("/old");
    expect(b.hasAttribute("data-pac-edited-href")).toBe(false);
  });

  it("restores a preview that was never saved", () => {
    document.body.innerHTML = "<main><p>Original</p></main>";
    const memory = createDomMemory();
    const [run] = collectTextRuns(document.body, memory);
    writeRun(run, "Typing", memory);
    expect(text("p")).toBe("Typing");
    expect(collectTextRuns(document.body, memory)[0].original).toBe("Original");
    applyEdits(document.body, none, memory);
    expect(text("p")).toBe("Original");
  });
});

describe("hydration safety", () => {
  it("knows hydrated, waiting and raw-HTML content apart", () => {
    document.body.innerHTML = "<div id='shell'><p id='waiting'>x</p></div><div id='raw'><p id='inside'>y</p></div><p id='done'>z</p>";
    const element = (id: string) => document.getElementById(id)!;
    expect(hydrationPending(element("waiting"))).toBe(false);
    markHydrated(element("shell"));
    markHydrated(element("raw"), { dangerouslySetInnerHTML: { __html: "" } });
    markHydrated(element("done"));
    expect(hydrationPending(element("waiting"))).toBe(true);
    expect(hydrationPending(element("inside"))).toBe(false);
    expect(hydrationPending(element("done"))).toBe(false);
  });

  it("holds back an edit in content React has not hydrated, until forced", () => {
    document.body.innerHTML = "<main><p>Waiting</p></main>";
    markHydrated(document.querySelector("main")!);
    const maps = { page: { [pageEditKey("text", "Waiting", 0)]: "Done" }, site: {} };
    const memory = createDomMemory();
    const held = applyEdits(document.body, maps, memory);
    expect(held.pending).toBe(1);
    expect(text("p")).toBe("Waiting");
    markHydrated(document.querySelector("p")!);
    expect(applyEdits(document.body, maps, memory).pending).toBe(0);
    expect(text("p")).toBe("Done");
  });
});

describe("the engine", () => {
  async function settle() {
    await vi.advanceTimersByTimeAsync(200);
  }

  it("leaves a page with no edits completely alone and does not watch it", () => {
    document.body.innerHTML = "<main><p>Text</p></main>";
    const before = document.body.innerHTML;
    const observe = vi.spyOn(window.MutationObserver.prototype, "observe");
    const engine = createPageEditEngine(document, () => undefined);
    engine.setEdits(none);
    expect(observe).not.toHaveBeenCalled();
    expect(document.body.innerHTML).toBe(before);
    engine.stop();
  });

  it("applies edits to content that arrives later, and on React re-rendering it", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = "<main></main>";
    const engine = createPageEditEngine(document, () => undefined);
    engine.setEdits({ page: { [pageEditKey("text", "Later", 0)]: "Edited" }, site: {} });
    const paragraph = document.createElement("p");
    paragraph.textContent = "Later";
    document.querySelector("main")!.appendChild(paragraph);
    await vi.advanceTimersByTimeAsync(0);
    await settle();
    expect(paragraph.textContent).toBe("Edited");
    engine.stop();
  });

  it("does not trigger itself: applying once causes exactly one pass", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = "<main><p>Text</p></main>";
    const engine = createPageEditEngine(document, () => undefined);
    let passes = 0;
    engine.subscribe(() => { passes += 1; });
    engine.setEdits({ page: { [pageEditKey("text", "Text", 0)]: "Edited" }, site: {} });
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(text("p")).toBe("Edited");
    expect(passes).toBe(1);
    engine.stop();
  });

  it("ignores changes inside the editing controls", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = "<main><p>Text</p></main><div data-pac-page-edit-ui='true'><span>0</span></div>";
    const engine = createPageEditEngine(document, () => undefined);
    let passes = 0;
    engine.subscribe(() => { passes += 1; });
    engine.setEdits({ page: { [pageEditKey("text", "Text", 0)]: "Edited" }, site: {} });
    passes = 0;
    document.querySelector("[data-pac-page-edit-ui] span")!.textContent = "1";
    await vi.advanceTimersByTimeAsync(0);
    await settle();
    expect(passes).toBe(0);
    engine.stop();
  });

  it("stops reapplying when something keeps changing the page", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = "<main><p>Text</p></main>";
    const engine = createPageEditEngine(document, () => undefined);
    let passes = 0;
    engine.subscribe(() => { passes += 1; });
    engine.setEdits({ page: { [pageEditKey("text", "Text", 0)]: "Edited" }, site: {} });
    for (let round = 0; round < 400; round += 1) {
      document.querySelector("main")!.appendChild(document.createElement("i"));
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(70);
    }
    // 400 rounds of 70 ms is 28 s. The limit allows 120 per 10 s window.
    expect(passes).toBeLessThanOrEqual(360);
    expect(passes).toBeGreaterThan(0);
    engine.stop();
  });

  it("holds automatic changes while paused and catches up on resume", () => {
    document.body.innerHTML = "<main><p>Text</p></main>";
    const engine = createPageEditEngine(document, () => undefined);
    engine.pause();
    engine.setEdits({ page: { [pageEditKey("text", "Text", 0)]: "Edited" }, site: {} });
    expect(text("p")).toBe("Text");
    engine.resume();
    expect(text("p")).toBe("Edited");
    engine.stop();
  });

  it("sends a plain click on an edited link to the edited address, ahead of next/link", () => {
    document.body.innerHTML = "<main><a id='a' href='/old'>Go</a><a id='b' href='/other'>Other</a></main>";
    const navigate = vi.fn();
    const engine = createPageEditEngine(document, navigate);
    engine.setEdits({ page: { [pageEditKey("link", "/old", 0)]: "/new" }, site: {} });
    const frameworkHandler = vi.fn((event: Event) => event.preventDefault());
    document.addEventListener("click", frameworkHandler);
    document.querySelector("#a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(navigate).toHaveBeenCalledWith("/new");
    expect(frameworkHandler).not.toHaveBeenCalled();
    document.querySelector("#b")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(frameworkHandler).toHaveBeenCalledTimes(1);
    document.removeEventListener("click", frameworkHandler);
    engine.stop();
  });

  it("leaves new-tab clicks and download links to the browser", () => {
    document.body.innerHTML = "<main><a id='a' href='/old'>Go</a><a id='d' href='/file' download>File</a></main>";
    const navigate = vi.fn();
    const engine = createPageEditEngine(document, navigate);
    engine.setEdits({ page: { [pageEditKey("link", "/old", 0)]: "/new", [pageEditKey("link", "/file", 0)]: "/file2" }, site: {} });
    document.querySelector("#a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }));
    document.querySelector("#d")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(navigate).not.toHaveBeenCalled();
    engine.stop();
  });

  it("puts wording back when moving to a page without that edit", () => {
    document.body.innerHTML = "<header><p>Shared</p></header>";
    const engine = createPageEditEngine(document, () => undefined);
    engine.setEdits({ page: { [pageEditKey("text", "Shared", 0)]: "Page one" }, site: {} });
    expect(text("p")).toBe("Page one");
    engine.setEdits(none, { newPage: true });
    expect(text("p")).toBe("Shared");
    engine.stop();
  });
});
