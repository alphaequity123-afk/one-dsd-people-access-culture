import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", async original => ({ ...await original<typeof import("next/navigation")>(), useRouter: () => ({ push: router.push, replace() {} }) }));
import { matchingCatalogRows, PrivateCatalogForm, PrivateCatalogJump, PrivateCatalogProvider, PrivateCatalogResults, type CatalogChoice, type CatalogRow } from "./private-catalog";
import { BROWSER_STORAGE_KEYS, isPrivateBrowserStorageKey } from "@/lib/client/storage-keys";

afterEach(() => { cleanup(); window.sessionStorage.clear(); vi.unstubAllGlobals(); router.push.mockReset(); });

const row = (key: string, text: string, values: CatalogRow["values"] = {}): CatalogRow => ({ key, text, values, node: <li>{text}</li> });
const counties = [row("county-1", "Aitkin Aitkin County Health and Human Services", { letter: "A" }), row("county-2", "Anoka Anoka County Human Services", { letter: "A" }), row("county-3", "Becker Becker County Human Services", { letter: "B" })];

describe("long catalogs keep typed words out of the address (owner rule 2026-11-16)", () => {
  it("matches words, lists and fixed choices the same way the pages did", () => {
    const lists: CatalogChoice[] = [{ name: "program", label: "Program", allLabel: "All", options: [] }, { name: "kind", label: "Kind", allLabel: "All", options: [], navigates: true }];
    const rows = [row("a", "Waiver plan for brain injury", { program: ["Brain Injury Waiver"], kind: "plan" }), row("b", "Case management rule", { program: ["CADI"], kind: "rule" })];
    expect(matchingCatalogRows(rows, { q: "WAIVER injury", lists: {} }, lists).map(r => r.key)).toEqual(["a"]);
    expect(matchingCatalogRows(rows, { q: "", lists: { program: "cadi" } }, lists).map(r => r.key)).toEqual(["b"]);
    // A list that reloads the page is applied by the server, not again here.
    expect(matchingCatalogRows(rows, { q: "", lists: { kind: "plan" } }, lists).map(r => r.key)).toEqual(["a", "b"]);
    expect(matchingCatalogRows(rows, { q: "anything", lists: {} }, lists, new Set(["b"])).map(r => r.key)).toEqual(["b"]);
  });

  it("narrows a catalog in the page without changing the address", () => {
    const before = window.location.href;
    render(<PrivateCatalogProvider basePath="/community-outreach/county-agencies" rows={counties} choices={{ letter: "" }} perPage={12} initial={{ q: "", page: "" }}
      jump={{ name: "letter", label: "Counties by first letter", allLabel: "All", options: ["A", "B", "C"].map(l => ({ value: l, label: l })), keepEmpty: true }}>
      <PrivateCatalogForm ariaLabel="Find a county" searchLabel="County or agency" buttonLabel="Find" clearLabel="Show all counties" />
      <PrivateCatalogJump />
      <PrivateCatalogResults noun="county" nouns="counties" of={3} empty="No county matches that search." listLabel="Counties" pagerLabel="County result pages" />
    </PrivateCatalogProvider>);
    expect(screen.getByRole("status").textContent).toContain("Showing 1–3 of 3 counties.");
    const box = screen.getByLabelText("County or agency");
    expect(box.getAttribute("name")).toBeNull();
    fireEvent.change(box, { target: { value: "anoka" } });
    fireEvent.submit(box.closest("form")!);
    expect(screen.getByRole("status").textContent).toContain("Showing 1–1 of 1 matching county (3 in all).");
    fireEvent.click(screen.getByRole("button", { name: "Show all counties" }));
    const letters = screen.getByRole("navigation", { name: "Counties by first letter" });
    fireEvent.click(within(letters).getByRole("button", { name: "B" }));
    expect(screen.getByText(/Becker County/)).toBeTruthy();
    expect(screen.queryByText(/Anoka County/)).toBeNull();
    expect(within(letters).queryByRole("button", { name: "C" })).toBeNull();
    expect(window.location.href).toBe(before);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("sends words for a large catalog in a request body and draws only the matching rows", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ids: ["r2"] })));
    vi.stubGlobal("fetch", fetcher);
    const readings = [row("r1", "", { theme: ["identity"] }), row("r2", "", { theme: ["disability"] })].map((r, i) => ({ ...r, node: <li>Reading {i + 1}</li> }));
    render(<PrivateCatalogProvider basePath="/learn/readings" rows={readings} choices={{ theme: "" }} perPage={12} initial={{ q: "", page: "" }} endpoint="readings"
      lists={[{ name: "theme", label: "Subject", allLabel: "All subjects", options: [{ value: "identity", label: "Identity" }, { value: "disability", label: "Disability" }] }]}>
      <PrivateCatalogForm searchLabel="Find a reading" buttonLabel="Find readings" clearLabel="Clear choices" />
      <PrivateCatalogResults noun="reading" nouns="readings" of={2} listLabel="Readings" pagerLabel="Reading result pages" />
    </PrivateCatalogProvider>);
    fireEvent.change(screen.getByLabelText("Find a reading"), { target: { value: "access to care" } });
    await act(async () => { fireEvent.submit(screen.getByLabelText("Find a reading").closest("form")!); });
    expect(await screen.findByText("Reading 2")).toBeTruthy();
    expect(screen.queryByText("Reading 1")).toBeNull();
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("/api/catalog-search");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ catalog: "readings", q: "access to care" });
  });

  it("reloads for a fixed choice the page is drawn around, carrying the words in session storage only", () => {
    render(<PrivateCatalogProvider basePath="/learn/sources" rows={counties} choices={{ theme: "" }} perPage={12} initial={{ q: "", page: "" }}
      lists={[{ name: "theme", label: "Subject", allLabel: "All subjects", options: [{ value: "disability", label: "Disability" }], navigates: true }]}>
      <PrivateCatalogForm searchLabel="Search" buttonLabel="Show sources" clearLabel="View all sources" />
    </PrivateCatalogProvider>);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "olmstead plan" } });
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "disability" } });
    fireEvent.submit(screen.getByLabelText("Search").closest("form")!);
    expect(router.push).toHaveBeenCalledWith("/learn/sources?theme=disability");
    expect(router.push.mock.calls[0][0]).not.toContain("olmstead");
    expect(JSON.parse(window.sessionStorage.getItem(BROWSER_STORAGE_KEYS.catalogSearchHandoff)!)).toEqual({ path: "/learn/sources", q: "olmstead plan" });
    expect(isPrivateBrowserStorageKey("session", BROWSER_STORAGE_KEYS.catalogSearchHandoff)).toBe(true);
  });

  it("picks up words carried from the same catalog once and shows them in the box", async () => {
    window.sessionStorage.setItem(BROWSER_STORAGE_KEYS.catalogSearchHandoff, JSON.stringify({ path: "/community-outreach/county-agencies", q: "becker" }));
    await act(async () => {
      render(<PrivateCatalogProvider basePath="/community-outreach/county-agencies" rows={counties} choices={{}} perPage={12} initial={{ q: "", page: "" }}>
        <PrivateCatalogForm searchLabel="County or agency" buttonLabel="Find" clearLabel="Show all counties" />
        <PrivateCatalogResults noun="county" nouns="counties" of={3} listLabel="Counties" pagerLabel="County result pages" />
      </PrivateCatalogProvider>);
    });
    expect((screen.getByLabelText("County or agency") as HTMLInputElement).value).toBe("becker");
    expect(screen.getByRole("status").textContent).toContain("1 matching county");
    expect(window.sessionStorage.getItem(BROWSER_STORAGE_KEYS.catalogSearchHandoff)).toBeNull();
  });
});
