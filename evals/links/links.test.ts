import { describe, expect, it } from "vitest";
import { linkPath, linksInText } from "./links.ts";
import { matchRoutes, type Route } from "./routes.ts";

const route = (path: string, kind: Route["kind"] = "page"): Route => {
  const segments = path.split("/").filter(Boolean).map(part => /^\[\.\.\.(.+)\]$/.test(part) ? { kind: "catchall" as const, name: part, optional: false } : /^\[(.+)\]$/.test(part) ? { kind: "param" as const, name: part } : { kind: "static" as const, value: part });
  return { path, file: `app${path}/page.tsx`, kind, segments, dynamic: segments.some(s => s.kind !== "static") };
};

describe("A10 link resolution", () => {
  it("normalizes links: no query or fragment, placeholders for data", () => {
    expect(linkPath("/library/abc?x=1#top")).toEqual({ path: "/library/abc", templated: false });
    expect(linkPath("/courses/${course.id}/")).toEqual({ path: "/courses/:param", templated: true });
    expect(linkPath("/practice/[id]")).toEqual({ path: "/practice/:param", templated: true });
  });

  it("matches static routes before dynamic ones and never treats a placeholder as a static page", () => {
    const routes = [route("/learn/[stage]"), route("/learn/clas"), route("/docs/[...slug]")];
    expect(matchRoutes(routes, "/learn/clas").map(m => m.route.path)).toEqual(["/learn/clas", "/learn/[stage]"]);
    expect(matchRoutes(routes, "/learn/:param").map(m => m.route.path)).toEqual(["/learn/[stage]"]);
    expect(matchRoutes(routes, "/docs/a/b")[0].params).toEqual(["a", "b"]);
    expect(matchRoutes(routes, "/nowhere")).toEqual([]);
  });

  it("extracts links from JSX, data, navigation calls, markdown and concatenation", () => {
    const text = [
      "<Link href=\"/library\">Library</Link>",
      "const item = { href: `/courses/${id}`, title: \"x\" };",
      "redirect(\"/start\");",
      "const body = \"See [the guide](/user-guide) first.\";",
      "<a href={\"/share/library/\" + encodeURIComponent(id)}>Share</a>",
      "fetch(\"/api/internal\");",
    ].join("\n");
    expect(linksInText("components/x.tsx", text).map(l => l.path).sort()).toEqual(["/courses/:param", "/library", "/share/library/:param", "/start", "/user-guide"]);
  });
});
