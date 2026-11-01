import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { publicExplainerMediaDocs } from "./public-explainer-media-docs";

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
});
