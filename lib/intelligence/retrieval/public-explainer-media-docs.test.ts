import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import explainers from "@/lib/program/explainer-videos.json";
import { publicExplainerMediaDocs } from "./public-explainer-media-docs";

type Clip = { src: string; poster: string; captions: string; transcript: string };
const clip = (id: string) => (explainers as Record<string, Clip>)[id];
function addClip(root: string, id: string, transcript: string) {
  for (const [url, body] of [[clip(id).src, Buffer.concat([Buffer.from("0000ftyp"), Buffer.alloc(1024)])], [clip(id).poster, "poster"], [clip(id).captions, "WEBVTT\n\n"], [clip(id).transcript, transcript]] as const) {
    const file = path.join(root, ...url.split("?")[0].split("/").filter(Boolean));
    mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, body);
  }
}
/** Every explainer id a page or component renders with <ExplainerVideo id="...">. */
function renderedExplainers(): Set<string> {
  const ids = new Set<string>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const file = path.join(dir, name);
      if (statSync(file).isDirectory()) walk(file);
      else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) for (const match of readFileSync(file, "utf8").matchAll(/<ExplainerVideo id="([a-z0-9-]+)"/g)) ids.add(match[1]);
    }
  };
  for (const dir of ["app", "components"]) walk(path.join(process.cwd(), dir));
  return ids;
}

const roots: string[] = [];
function rootWithCore() {
  const root = mkdtempSync(path.join(os.tmpdir(), "public-explainer-")); roots.push(root);
  const folder = path.join(root, "videos", "explainers", "core-fifteen"); mkdirSync(folder, { recursive: true });
  writeFileSync(path.join(folder, "video-1080p.mp4"), Buffer.concat([Buffer.from("0000ftyp"), Buffer.alloc(1024)]));
  writeFileSync(path.join(folder, "poster.jpg"), "poster"); writeFileSync(path.join(folder, "captions.vtt"), "WEBVTT\n\n");
  writeFileSync(path.join(folder, "transcript.txt"), "This is the exact public source text. ".repeat(25));
  return root;
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
describe("public explainer and scenario transcripts", () => {
  it("indexes exact citation-sized passages only with the parent publication and complete public assets", () => {
    const root = rootWithCore();
    expect(publicExplainerMediaDocs("dsd", new Set(), root)).toEqual([]);
    const docs = publicExplainerMediaDocs("dsd", new Set(["learn.page"]), root);
    expect(docs.length).toBeGreaterThan(1);
    expect(docs.every(doc => doc.href === "/videos/explainers/core-fifteen/transcript.txt" && doc.text.length <= 300)).toBe(true);
    expect(docs.map(doc => doc.text).join(" ")).toBe("This is the exact public source text. ".repeat(25).trim());
    rmSync(path.join(root, "videos", "explainers", "core-fifteen", "captions.vtt"));
    expect(publicExplainerMediaDocs("dsd", new Set(["learn.page"]), root)).toEqual([]);
  });
  it("requires both published practice path and shell for path-video transcripts", () => {
    const root = rootWithCore();
    const folder = path.join(root, "videos", "explainers", "draft-review"); mkdirSync(folder, { recursive: true });
    writeFileSync(path.join(folder, "video-1080p.mp4"), Buffer.concat([Buffer.from("0000ftyp"), Buffer.alloc(1024)]));
    writeFileSync(path.join(folder, "poster.jpg"), "poster"); writeFileSync(path.join(folder, "captions.vtt"), "WEBVTT\n\n"); writeFileSync(path.join(folder, "transcript.txt"), "A public draft review transcript.");
    expect(publicExplainerMediaDocs("dsd", new Set(["graduation-path.gp-9"]), root)).toEqual([]);
    const docs = publicExplainerMediaDocs("dsd", new Set(["graduation-path.gp-9", "practice.path-shell"]), root);
    expect(docs.some(doc => doc.href === "/videos/explainers/draft-review/transcript.txt")).toBe(true);
    expect(publicExplainerMediaDocs("dsd", new Set(["practice.path-shell"]), root)).toEqual([]);
  });
  it("indexes only currently published scenario transcript text, not user responses", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "public-scenario-")); roots.push(root);
    const docs = publicExplainerMediaDocs("dsd", new Set(["dsd-scenario.dsd-interpreter-first-contact"]), root);
    expect(docs.length).toBeGreaterThan(1);
    expect(docs.every(doc => doc.href.startsWith("/one-dsd/scenarios/dsd-interpreter-first-contact#"))).toBe(true);
    expect(docs.map(doc => doc.text).join(" ")).toContain("qualified interpretation");
    expect(publicExplainerMediaDocs("dsd", new Set(), root)).toEqual([]);
  });
  it("indexes every explainer a current page renders once its gates are published", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "dsd-explainers-")); roots.push(root);
    const rendered = [...renderedExplainers()];
    expect(rendered.length).toBeGreaterThanOrEqual(9);
    for (const id of rendered) addClip(root, id, `Exact ${id} narration.`);
    const gates = new Set(["learn.page", "communities.index", "practice.path-shell", "graduation-path.gp-9", "graduation-path.gp-12", "practice.page", "equity-toolkit.home", "support.page", "support.right-person"]);
    const docs = publicExplainerMediaDocs("dsd", gates, root);
    for (const id of rendered) {
      expect(docs.find(doc => doc.href === clip(id).transcript)?.text, id).toBe(`Exact ${id} narration.`);
    }
  });
  it("relates each explainer to every published page that plays it", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "dsd-explainer-pages-")); roots.push(root);
    for (const id of ["learning-journey", "right-person"]) addClip(root, id, `${id} narration.`);
    const related = (published: string[], id: string) => publicExplainerMediaDocs("dsd", new Set(published), root).find(doc => doc.href === clip(id).transcript)?.graphRelated;
    expect(related([], "learning-journey")).toEqual(["/learn/paths", "/my-work"]);
    expect(related(["support.right-person", "support.page"], "right-person")).toEqual(["/support/right-person", "/support"]);
    expect(related(["support.page"], "right-person")).toEqual(["/support"]);
    expect(related([], "right-person")).toBeUndefined();
  });
});
