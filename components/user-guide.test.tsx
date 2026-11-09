import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async original => ({ ...await original<typeof import("next/navigation")>(), usePathname: () => "/user-guide", useRouter: () => ({ push() {} }), useSearchParams: () => new URLSearchParams() }));

import UserGuide from "@/app/user-guide/page";
import { USER_GUIDE } from "@/lib/program/user-guide";

const root = process.cwd();
const html = renderToStaticMarkup(<UserGuide />).replaceAll("&#x27;", "'").replaceAll("&amp;", "&");
const visibleWords = [USER_GUIDE.title, USER_GUIDE.lede, ...USER_GUIDE.sections.flatMap(s => [s.title, ...s.paras, ...s.links.map(l => l[1])]), ...USER_GUIDE.choices.flatMap(c => [c.title, c.body, c.action])].join("\n");

// The guide is generated from one source with its text download; the page and file must agree,
// every link must lead to a page in this app, and the wording follows the owner's rules.
describe("end-user guide", () => {
  it("renders every section in a closed panel with its id", () => {
    for (const section of USER_GUIDE.sections) {
      expect(html).toContain(`id="${section.id}"`);
      expect(html).toContain(section.title);
    }
    expect(html).not.toMatch(/<details[^>]*class="course-more-item"[^>]*\sopen/);
  });
  it("offers a download whose words match the page", () => {
    const file = path.join(root, "public", USER_GUIDE.download);
    expect(existsSync(file)).toBe(true);
    const text = readFileSync(file, "utf8");
    for (const section of USER_GUIDE.sections) for (const para of section.paras) expect(text).toContain(para);
    expect(html).toContain(`href="${USER_GUIDE.download}"`);
  });
  it("links only to pages that exist in this app", () => {
    const hrefs = [...USER_GUIDE.sections.flatMap(s => s.links.map(l => l[0])), ...USER_GUIDE.choices.map(c => c.href)].filter(h => h.startsWith("/"));
    for (const href of hrefs) {
      const dir = path.join(root, "app", href.split(/[?#]/)[0]);
      expect(existsSync(path.join(dir, "page.tsx")), href).toBe(true);
    }
    for (const choice of USER_GUIDE.choices.filter(c => c.href.startsWith("#"))) expect(html).toContain(`id="${choice.href.slice(1)}"`);
  });
  it("follows the wording rules", () => {
    expect(visibleWords).not.toMatch(/\boffice\b/i);
    expect(visibleWords).not.toMatch(/\b(AI|tutor|chatbot|bot)\b/);
    expect(visibleWords).not.toMatch(/\b(ADSA|DSD division|CLAS)\b/);
  });
  it("is linked from the landing page", () => {
    const home = readFileSync(path.join(root, "app/home/page.tsx"), "utf8");
    expect(home).toContain('href="/user-guide"');
  });
});
