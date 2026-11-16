import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { directorTemplate } from "@/lib/content/director-toolkit";
import { DirectorToolkitTemplate } from "./director-toolkit-template";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;

async function mount(id: string) {
  document.body.innerHTML = "<div id='root'></div>";
  root = createRoot(document.getElementById("root")!);
  await act(async () => { root.render(<DirectorToolkitTemplate template={directorTemplate(id)!} sectionTitle="Area" />); });
}
const button = (name: string) => [...document.querySelectorAll("button")].find(item => item.textContent === name)! as HTMLButtonElement;
function type(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")!.set!;
  setter.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}
afterEach(() => { act(() => root.unmount()); vi.restoreAllMocks(); localStorage.clear(); });

describe("Equity Director toolkit template", () => {
  it("renders labeled fields, keeps everything in the page and copies the filled text", async () => {
    await mount("decision-log");
    expect(document.querySelector("#template-decision-log")).not.toBeNull();
    expect(document.body.textContent).not.toContain("Project recommendation");
    const subject = document.querySelector<HTMLInputElement>("#template-decision-log-subject")!;
    await act(async () => { type(subject, "Notice redesign"); });
    const cells = document.querySelectorAll("tbody tr");
    expect(cells).toHaveLength(3);
    await act(async () => { button("Add a row").click(); });
    expect(document.querySelectorAll("tbody tr")).toHaveLength(4);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await act(async () => { button("Copy as text").click(); });
    expect(writeText.mock.calls[0][0]).toContain("Decision or review this log covers: Notice redesign");
    expect(localStorage.length).toBe(0);
  });

  it("marks only this template for printing, then clears the mark", async () => {
    await mount("tribal-screening");
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    vi.useFakeTimers();
    await act(async () => { button("Print this template").click(); });
    expect(document.body.dataset.directorPrint).toBe("tribal-screening");
    expect(document.querySelector("#template-tribal-screening")?.getAttribute("data-printing")).toBe("true");
    await act(async () => { vi.runAllTimers(); });
    expect(print).toHaveBeenCalled();
    await act(async () => { window.dispatchEvent(new Event("afterprint")); });
    expect(document.body.dataset.directorPrint).toBeUndefined();
    vi.useRealTimers();
  });
});
