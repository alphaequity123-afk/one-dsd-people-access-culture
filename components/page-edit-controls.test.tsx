// @vitest-environment jsdom
import React, { act, useState } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPageEditEngine, hydrationPending, type PageEditEngine } from "@/lib/content/page-edit-dom";
import { pageEditKey } from "@/lib/content/page-edit-keys";
import { PageEditControls, type PageEditsResponse } from "./page-edit-controls";
import { PageEditOverlay } from "./page-edit-overlay";

vi.mock("next/navigation", () => ({
  usePathname: () => "/about",
  useRouter: () => ({ push: vi.fn() }),
}));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const emptyResponse: PageEditsResponse = { ok: true, canEdit: true, page: {}, site: {}, entries: [] };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function typeInto(field: HTMLTextAreaElement | HTMLInputElement, value: string) {
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function buttonNamed(name: string): HTMLButtonElement {
  const found = Array.from(document.querySelectorAll("button")).find((button) => button.textContent === name);
  if (!found) throw new Error(`No button named ${name}`);
  return found;
}

function click(element: Element) {
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("with real React hydration", () => {
  function Page() {
    const [count, setCount] = useState(0);
    return (
      <main>
        <h1 id="title">Page title</h1>
        <p id="counted">Count {count}</p>
        <p id="mixed">Read <a href="/old" id="link">this link</a> today</p>
        <div id="raw" dangerouslySetInnerHTML={{ __html: "<p id=\"inner\">Raw lesson text</p>" }} />
        <button id="add" onClick={() => setCount((value) => value + 1)}>Add</button>
      </main>
    );
  }

  async function hydrate() {
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(<Page />);
    const recoverable = vi.fn();
    let root: Root;
    await act(async () => {
      root = hydrateRoot(container, <Page />, { onRecoverableError: recoverable });
    });
    return { container, recoverable, unmount: () => act(async () => root.unmount()) };
  }

  it("relies on markers the installed React actually sets", async () => {
    const { unmount } = await hydrate();
    expect(hydrationPending(document.getElementById("title")!)).toBe(false);
    // Raw HTML content has no marker of its own, and is not waiting for React.
    expect(Object.keys(document.getElementById("inner")!).some((key) => key.startsWith("__reactFiber$"))).toBe(false);
    expect(hydrationPending(document.getElementById("inner")!)).toBe(false);
    await unmount();
  });

  it("applies edits after hydration with no recoverable error, and React keeps working", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { recoverable, unmount } = await hydrate();
    const engine = createPageEditEngine(document, () => undefined);
    await act(async () => {
      engine.setEdits({
        page: {
          [pageEditKey("text", "Page title", 0)]: "Edited title",
          [pageEditKey("text", "this link", 0)]: "that link",
          [pageEditKey("text", "Raw lesson text", 0)]: "Edited lesson",
          [pageEditKey("link", "/old", 0)]: "/new",
        },
        site: {},
      });
    });
    expect(document.getElementById("title")!.textContent).toBe("Edited title");
    expect(document.getElementById("mixed")!.textContent).toBe("Read that link today");
    expect(document.getElementById("inner")!.textContent).toBe("Edited lesson");
    expect(document.getElementById("link")!.getAttribute("href")).toBe("/new");

    // React updates neighbouring text through the nodes it holds, untroubled by the edits.
    await act(async () => { document.getElementById("add")!.click(); });
    expect(document.getElementById("counted")!.textContent).toBe("Count 1");
    expect(document.getElementById("title")!.textContent).toBe("Edited title");

    engine.stop();
    await unmount();
    expect(recoverable).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("reapplies an edit when React re-renders the same text node", async () => {
    vi.useFakeTimers();
    try {
      function Counted() {
        const [count, setCount] = useState(0);
        return <main><p id="p">{count === 0 ? "Fixed" : "Fixed"}</p><p id="q">{`Value ${count}`}</p><button id="go" onClick={() => setCount((value) => value + 1)}>Go</button></main>;
      }
      const container = document.createElement("div");
      document.body.appendChild(container);
      let root: Root;
      await act(async () => { root = createRoot(container); root.render(<Counted />); });
      const engine = createPageEditEngine(document, () => undefined);
      await act(async () => { engine.setEdits({ page: { [pageEditKey("text", "Value 1", 0)]: "Edited one" }, site: {} }); });
      expect(document.getElementById("q")!.textContent).toBe("Value 0");
      await act(async () => { document.getElementById("go")!.click(); });
      await act(async () => { await vi.advanceTimersByTimeAsync(200); });
      expect(document.getElementById("q")!.textContent).toBe("Edited one");
      engine.stop();
      await act(async () => root.unmount());
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("the overlay", () => {
  async function mountOverlay() {
    const container = document.createElement("div");
    container.id = "overlay";
    document.body.appendChild(container);
    let root: Root;
    await act(async () => {
      root = createRoot(container);
      root.render(<PageEditOverlay />);
    });
    return { unmount: () => act(async () => root.unmount()) };
  }

  it("shows readers saved wording and no editing controls, with one request", async () => {
    document.body.innerHTML = "<main><p id='p'>Original</p></main>";
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true, canEdit: false, page: { [pageEditKey("text", "Original", 0)]: "Edited" }, site: {} }));
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = await mountOverlay();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]).toEqual(expect.arrayContaining([expect.stringContaining("/api/page-edits?path=%2Fabout")]));
    expect(document.getElementById("p")!.textContent).toBe("Edited");
    expect(document.querySelector("[data-pac-page-edit-ui]")).toBeNull();
    expect(document.getElementById("overlay")!.innerHTML).toBe("");
    await unmount();
  });

  it("leaves the page alone when the request fails or the store is missing", async () => {
    document.body.innerHTML = "<main><p id='p'>Original</p></main>";
    const before = document.querySelector("main")!.innerHTML;
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const { unmount } = await mountOverlay();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect(document.querySelector("main")!.innerHTML).toBe(before);
    expect(document.querySelector("[data-pac-page-edit-ui]")).toBeNull();
    await unmount();
  });

  it("shows the owner the controls only after the server confirms the owner", async () => {
    document.body.innerHTML = "<main><p>Text</p></main>";
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(emptyResponse)));
    const { unmount } = await mountOverlay();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 200)); });
    expect(document.querySelector("[data-pac-page-edit-ui]")).not.toBeNull();
    expect(buttonNamed("Edit this page").getAttribute("aria-pressed")).toBe("false");
    await unmount();
  });
});

describe("editing", () => {
  let engine: PageEditEngine;
  let root: Root;
  let latest: PageEditsResponse | null;

  async function mountControls(data: PageEditsResponse = emptyResponse) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    engine = createPageEditEngine(document, () => undefined);
    engine.setEdits({ page: data.page, site: data.site });
    latest = null;
    const render = (current: PageEditsResponse) => root.render(
      <PageEditControls
        path="/about"
        engine={engine}
        data={current}
        onChange={(next) => {
          latest = next;
          engine.setEdits({ page: next.page, site: next.site });
          render(next);
        }}
      />,
    );
    await act(async () => {
      root = createRoot(container);
      render(data);
    });
  }

  async function turnOn() {
    await act(async () => { buttonNamed("Edit this page").click(); });
  }

  async function chooseParagraph(id = "p") {
    await act(async () => { click(document.getElementById(id)!); });
  }

  beforeEach(() => {
    document.body.innerHTML = "<header><a id='nav' href='/home'>Home</a></header><main><p id='p'>Original text</p><a id='link' href='/old'>A link</a><button id='real'>Real button</button><input id='field' value='typed'><img id='img' alt='x' src='/x.png'></main>";
    vi.spyOn(Element.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    engine.stop();
  });

  it("marks wording as reachable by keyboard only while editing, and removes every mark after", async () => {
    await mountControls();
    const paragraph = document.getElementById("p")!;
    expect(paragraph.hasAttribute("tabindex")).toBe(false);
    await turnOn();
    expect(paragraph.getAttribute("tabindex")).toBe("0");
    expect(buttonNamed("Done editing").getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector("[role=status]")!.textContent).toContain("Editing is on");
    await act(async () => { buttonNamed("Done editing").click(); });
    expect(paragraph.hasAttribute("tabindex")).toBe(false);
    expect(paragraph.hasAttribute("data-pac-page-edit-target")).toBe(false);
  });

  it("previews while typing, saves plain text, and moves focus into a labeled field", async () => {
    const saved = pageEditKey("text", "Original text", 0);
    const fetchMock = vi.fn(async () => jsonResponse({ ...emptyResponse, page: { [saved]: "<b>New</b>" }, entries: [{ key: saved, scope: "page", kind: "text", original: "Original text", value: "<b>New</b>", updatedAt: "x" }] }));
    vi.stubGlobal("fetch", fetchMock);
    await mountControls();
    await turnOn();
    await chooseParagraph();
    const box = document.querySelector("textarea")!;
    expect(document.activeElement).toBe(box);
    expect(box.closest("label")!.textContent).toContain("Text");
    expect(document.querySelector("[role=dialog]")!.getAttribute("aria-label")).toBe("Edit the selected text");
    await act(async () => { typeInto(box, "<b>New</b>"); });
    expect(document.getElementById("p")!.textContent).toBe("<b>New</b>");
    expect(document.getElementById("p")!.children).toHaveLength(0);
    await act(async () => { buttonNamed("Save").click(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string)).toEqual({ action: "save", path: "/about", kind: "text", original: "Original text", occurrence: 0, value: "<b>New</b>", scope: "page" });
    expect(latest).not.toBeNull();
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(document.getElementById("p")!.textContent).toBe("<b>New</b>");
    expect(document.querySelector("[role=status]")!.textContent).toContain("Saved");
  });

  it("does not operate the page while editing", async () => {
    await mountControls();
    const realClick = vi.fn();
    await turnOn();
    document.getElementById("real")!.addEventListener("click", realClick);
    document.addEventListener("click", realClick);
    await act(async () => { click(document.getElementById("real")!); });
    await act(async () => { click(document.getElementById("link")!); });
    expect(realClick).not.toHaveBeenCalled();
    document.removeEventListener("click", realClick);
  });

  it("discards an unsaved preview on Cancel, on Escape, and when editing is turned off", async () => {
    await mountControls();
    await turnOn();

    await chooseParagraph();
    await act(async () => { typeInto(document.querySelector("textarea")!, "Draft one"); });
    await act(async () => { buttonNamed("Cancel").click(); });
    expect(document.getElementById("p")!.textContent).toBe("Original text");

    await chooseParagraph();
    await act(async () => { typeInto(document.querySelector("textarea")!, "Draft two"); });
    await act(async () => { document.querySelector("textarea")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(document.getElementById("p")!.textContent).toBe("Original text");

    await chooseParagraph();
    await act(async () => { typeInto(document.querySelector("textarea")!, "Draft three"); });
    await act(async () => { buttonNamed("Done editing").click(); });
    expect(document.getElementById("p")!.textContent).toBe("Original text");

    await turnOn();
    await chooseParagraph();
    await act(async () => { typeInto(document.querySelector("textarea")!, "Draft four"); });
    document.getElementById("p")!.focus();
    await act(async () => { document.getElementById("p")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); });
    expect(document.getElementById("p")!.textContent).toBe("Original text");
    expect(document.querySelector("[role=dialog]")).toBeNull();
  });

  it("opens from the keyboard with Enter", async () => {
    await mountControls();
    await turnOn();
    const paragraph = document.getElementById("p")!;
    await act(async () => { paragraph.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); });
    expect((document.querySelector("textarea") as HTMLTextAreaElement).value).toBe("Original text");
  });

  it("offers the link address for links, and refuses an unsafe one without saving", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(emptyResponse));
    vi.stubGlobal("fetch", fetchMock);
    await mountControls();
    await turnOn();
    await chooseParagraph("link");
    const address = document.querySelector<HTMLInputElement>("[role=dialog] input[type=text]")!;
    expect(address.value).toBe("/old");
    expect(address.closest("label")!.textContent).toContain("Link address");
    await act(async () => { typeInto(address, "javascript:alert(1)"); });
    await act(async () => { buttonNamed("Save").click(); });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.querySelector("[role=alert]")!.textContent).toContain("https://");
    expect(document.getElementById("link")!.getAttribute("href")).toBe("/old");
  });

  it("offers every-page for the header and footer, on by default, and not for page content", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(emptyResponse));
    vi.stubGlobal("fetch", fetchMock);
    await mountControls();
    await turnOn();
    await chooseParagraph();
    expect(document.querySelector("[role=dialog] input[type=checkbox]")).toBeNull();
    await act(async () => { buttonNamed("Cancel").click(); });
    await chooseParagraph("nav");
    const box = document.querySelector("[role=dialog] input[type=checkbox]") as HTMLInputElement;
    expect(box.checked).toBe(true);
    await act(async () => { typeInto(document.querySelector("textarea")!, "Start"); });
    await act(async () => { buttonNamed("Save").click(); });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string)).toMatchObject({ kind: "text", value: "Start", scope: "site" });
  });

  it("keeps the panel open and reports the problem when a save fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "The change could not be saved." }, 503)));
    await mountControls();
    await turnOn();
    await chooseParagraph();
    await act(async () => { typeInto(document.querySelector("textarea")!, "Attempt"); });
    await act(async () => { buttonNamed("Save").click(); });
    expect(document.querySelector("[role=alert]")!.textContent).toBe("The change could not be saved.");
    expect(document.querySelector("textarea")!.value).toBe("Attempt");
    expect(latest).toBeNull();
  });

  it("does not offer form fields or images as text, and says so", async () => {
    await mountControls();
    await turnOn();
    await act(async () => { click(document.getElementById("img")!); });
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(document.querySelector("[role=status]")!.textContent).toContain("Pictures");
    await act(async () => { click(document.getElementById("field")!); });
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(document.querySelector("[role=status]")!.textContent).toContain("Form fields");
  });

  it("walks through wording with Next and Previous", async () => {
    await mountControls();
    await turnOn();
    await chooseParagraph();
    await act(async () => { buttonNamed("Next text").click(); });
    expect(document.querySelector("textarea")!.value).toBe("A link");
    await act(async () => { buttonNamed("Previous text").click(); });
    expect(document.querySelector("textarea")!.value).toBe("Original text");
  });

  it("lists edits, flags an original that is gone, and undoes it", async () => {
    const gone = pageEditKey("text", "Removed wording", 0);
    const here = pageEditKey("text", "Original text", 0);
    const data: PageEditsResponse = {
      ...emptyResponse,
      page: { [gone]: "Orphan replacement", [here]: "Showing now" },
      entries: [
        { key: gone, scope: "page", kind: "text", original: "Removed wording", value: "Orphan replacement", updatedAt: "x" },
        { key: here, scope: "page", kind: "text", original: "Original text", value: "Showing now", updatedAt: "x" },
      ],
    };
    const fetchMock = vi.fn(async () => jsonResponse({ ...emptyResponse, page: { [here]: "Showing now" }, entries: [data.entries![1]] }));
    vi.stubGlobal("fetch", fetchMock);
    await mountControls(data);
    await act(async () => { buttonNamed("Edits on this page (2)").click(); });
    const items = Array.from(document.querySelectorAll("[data-pac-page-edit-ui] li"));
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain("is not on this page right now");
    expect(items[1].textContent).not.toContain("is not on this page right now");
    await act(async () => { items[0].querySelector("button")!.click(); });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string)).toEqual({ action: "undo", path: "/about", key: gone, scope: "page" });
    expect(document.querySelectorAll("[data-pac-page-edit-ui] li")).toHaveLength(1);
  });

  it("says plainly when the saved edits cannot be read, and blocks editing", async () => {
    await mountControls({ ...emptyResponse, degraded: true });
    expect(document.querySelector("[role=alert]")!.textContent).toContain("could not be read");
    expect(buttonNamed("Edit this page").disabled).toBe(true);
  });
});
