// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const h = vi.hoisted(() => ({ path: "/library/ja-language-access-checklist", askProps: [] as Array<Record<string, unknown>> }));
vi.mock("next/navigation", () => ({ usePathname: () => h.path, useRouter: () => ({ push: () => undefined }), useSearchParams: () => new URLSearchParams() }));
vi.mock("next/image", () => ({ default: () => null }));
// The Ask window itself has its own tests; here it only records what the header gives it.
vi.mock("next/dynamic", () => ({ default: () => (props: Record<string, unknown>) => { h.askProps.push(props); return null; } }));
vi.mock("@/components/site-search", () => ({ SiteSearch: () => null }));
vi.mock("@/components/role-bar", () => ({ RoleBar: () => null }));
import { DsdProgramHeader } from "@/components/dsd-program-header";

afterEach(() => { cleanup(); h.askProps.length = 0; document.body.innerHTML = ""; document.title = ""; });

function openAsk(path: string, heading: string | null, title = "") {
  h.path = path;
  document.title = title;
  render(<div>
    <DsdProgramHeader ask={{ copy: {}, researchAvailable: true }} />
    <main id="main">{heading === null ? null : <h1>{heading}</h1>}<textarea defaultValue="notes typed on the page" /></main>
  </div>);
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  return h.askProps.at(-1)!;
}

it("opens Ask with the page's address and heading, and nothing typed on the page", () => {
  const props = openAsk("/library/ja-language-access-checklist", "Language access checklist", "Language access checklist | One DSD People, Access and Culture");
  expect(props.page).toEqual({ path: "/library/ja-language-access-checklist", title: "Language access checklist" });
  expect(JSON.stringify(props.page)).not.toContain("notes typed");
});

it("falls back to the browser title when the page has no main heading", () => {
  const props = openAsk("/equity-policy", null, "DHS Equity Policy | One DSD People, Access and Culture");
  expect(props.page).toEqual({ path: "/equity-policy", title: "DHS Equity Policy" });
});

it("opens Ask without a page on Home and in a person's own work", () => {
  expect(openAsk("/home", "Learning for the work you do").page).toBeUndefined();
  cleanup();
  expect(openAsk("/my-work/plan", "Your practice plans.").page).toBeUndefined();
});
