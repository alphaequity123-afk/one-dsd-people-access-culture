import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { indexedStaffDocs } from "./staff-search";
import { programResourceDefinitions, indexedProgramResources } from "./program-resources";
import { contentGraphForDocs } from "@/lib/content/knowledge-graph";
import { curriculumDocs, selfDirectedCurriculumDocs } from "./brain-content";
import { expandThroughGraph } from "./brain";
import { searchDocs } from "./search";
import { additionalPublicRouteDocs, culturalIntelligenceSearchValues, leadershipLearningDocs, publishedLeadershipVideoDocs, themeCollectionDocs } from "./public-learning-docs";

describe("public learning retrieval and graph", () => {
  it("indexes only the active self-directed course file, with a course-specific link and no hidden slides", () => {
    const fixtureParent = path.join(process.cwd(), ".data");
    mkdirSync(fixtureParent, { recursive: true });
    const root = mkdtempSync(path.join(fixtureParent, "pac-course-index-"));
    try {
      mkdirSync(path.join(root, "data"));
      const active = "data/F01-111111111111.json";
      const metadata = [{ number: "F01", dataFile: active }, { number: "F02", dataFile: "data/../../private.json" }];
      writeFileSync(path.join(root, "index.html"), `<script type="application/json" id="course-data">${JSON.stringify(metadata)}</script>`);
      writeFileSync(path.join(root, active), JSON.stringify({ number: "F01", title: "Active learning", slides: [{ text: "A public lesson", hidden: false }, { text: "Hidden slide sentinel", hidden: true }] }));
      writeFileSync(path.join(root, "data/F01-222222222222.json"), JSON.stringify({ number: "F01", title: "Old discarded version", slides: [{ text: "Stale text" }] }));
      const docs = selfDirectedCurriculumDocs("dsd", root);
      expect(docs).toHaveLength(1);
      expect(docs[0].href).toBe("/learning/self-directed/index.html?course=F01");
      expect(docs[0].text).toContain("A public lesson");
      expect(docs[0].text).not.toMatch(/Hidden slide sentinel|Stale text|Old discarded version/);
      const graph = contentGraphForDocs(docs);
      const node = graph.nodesForDocument(docs[0].id)[0];
      expect(graph.neighbors(node).some(({ node: target }) => target.id === "self-directed-F01")).toBe(true);
    } finally {
      const resolved = realpathSync(root), parent = realpathSync(fixtureParent);
      if (!resolved.startsWith(parent + path.sep)) throw new Error("Unsafe fixture cleanup path");
      rmSync(resolved, { recursive: true, force: true });
    }
  });

  it("indexes the visible projection of edited cultural learning, not retired or unrelated stored fields", () => {
    const values = culturalIntelligenceSearchValues({ intro: "An unrelated owner edit", scopeLine: "The four CQ capabilities define this program", foundationBook: "David Livermore's retired book", privateDraft: "Private sentinel" });
    expect(values.intro).toBe("An unrelated owner edit");
    expect(String(values.scopeLine)).not.toMatch(/\bCQ\b/);
    expect(JSON.stringify(values)).not.toMatch(/Livermore|Private sentinel|foundationBook/);
  });

  it("keeps leadership lessons out after parent withdrawal and gates theme context links", () => {
    expect(leadershipLearningDocs("dsd", new Set())).toEqual([]);
    const docs = leadershipLearningDocs("dsd", new Set(["learn.cultural-intelligence"]));
    expect(docs.length).toBeGreaterThanOrEqual(11);
    expect(docs.every(doc => doc.href.startsWith("/learn/cultural-intelligence#"))).toBe(true);
    const identity = themeCollectionDocs("dsd", new Set()).find(doc => doc.id === "collection-theme-identity")!;
    expect(identity.graphRelated).not.toContain("/learn/cultural-intelligence");
    expect(identity.graphRelated).not.toContain("/minnesota-communities");
    const available = themeCollectionDocs("dsd", new Set(["learn.cultural-intelligence", "communities.index"]))
      .find(doc => doc.id === "collection-theme-identity")!;
    expect(available.graphRelated).toEqual(expect.arrayContaining(["/learn/cultural-intelligence", "/minnesota-communities"]));
  });

  it("makes a specific leadership approach searchable and connects it to its thematic collection", () => {
    const docs = [...leadershipLearningDocs("dsd", new Set(["learn.cultural-intelligence"])), ...themeCollectionDocs("dsd", new Set())];
    const hits = searchDocs("servant leadership removing barriers", docs, { limit: 5 });
    const servant = hits.find(hit => hit.id === "leadership-approach-servant");
    expect(servant).toBeDefined();
    const graph = contentGraphForDocs(docs);
    const node = graph.nodesForDocument(servant!.id)[0];
    expect(graph.neighbors(node).some(({ node: neighbor }) => neighbor.id === "theme:leadership")).toBe(true);
    expect(expandThroughGraph([servant!], docs, "leadership development").some(hit => hit.id === "collection-theme-leadership")).toBe(true);
    const withdrawnTargets = docs.filter(doc => doc.id !== "collection-theme-leadership");
    const withdrawnGraph = contentGraphForDocs(withdrawnTargets);
    expect(withdrawnGraph.neighbors(withdrawnGraph.nodesForDocument(servant!.id)[0]).some(({ node: neighbor }) => neighbor.id === "theme:leadership")).toBe(false);
  });

  it("indexes actual curriculum lessons and connects transcripts only while the parent is available", () => {
    const withdrawn = curriculumDocs("dsd", new Set());
    expect(withdrawn.some(doc => doc.id.includes("equity-everyday-decisions"))).toBe(false);
    expect(withdrawn.some(doc => doc.id.includes("intercultural-curriculum"))).toBe(false);
    const available = curriculumDocs("dsd", new Set(["equity-toolkit.home", "learn.intercultural"]));
    const lesson = available.find(doc => doc.id === "learning-lesson-equity-everyday-decisions-01")!;
    expect(lesson.text).toContain("Start with a decision and the people it affects");
    expect(lesson.href).toBe("/learn/equity-toolkit/curriculum/01");
    const transcript = available.find(doc => doc.id === "curriculum-equity-everyday-decisions-01")!;
    expect(transcript).toBeDefined();
    const graph = contentGraphForDocs(available);
    expect(graph.neighbors(graph.nodesForDocument(transcript.id)[0]).some(({node}) => graph.nodesForDocument(lesson.id).includes(node.id))).toBe(true);
  });

  it("gates ADSA goals and retains the current leadership privacy boundary", () => {
    const withdrawn = additionalPublicRouteDocs("dsd", new Set());
    expect(withdrawn.some(doc => doc.id === "public-adsa-equity-goals")).toBe(false);
    const privacy = withdrawn.find(doc => doc.id === "public-leadership-participation")!;
    expect(privacy.text).toMatch(/does not intentionally save a question-and-answer copy/i);
    expect(privacy.text).toMatch(/earlier versions may have retained separate records/i);
    expect(privacy.text).toMatch(/outside services/i);
    const published = additionalPublicRouteDocs("dsd", new Set(["equity-toolkit.home"]));
    expect(published.find(doc => doc.id === "public-adsa-equity-goals")?.text).toMatch(/Eliminate Disparities/);
  });

  it("omits protected contributor surfaces and retired consultation entry points", () => {
    const routes = programResourceDefinitions().map(item => item.route);
    expect(routes).not.toContain("/contribute");
    expect(routes).not.toContain("/support/request");
    expect(routes).not.toContain("/support/track");
  });

  it("retrieves the shared multidisciplinary framing and a named servant leader from the full scoped index", async () => {
    const docs = [...await indexedStaffDocs("dsd"), ...(await indexedProgramResources("dsd")).destinations];
    const servant = searchDocs("How can a servant leader remove barriers for employees with disabilities?", docs, { limit: 5 });
    expect(servant.some(hit => hit.href === "/learn/cultural-intelligence#leadership-style-servant")).toBe(true);
    const interdisciplinary = searchDocs("How do sociology, anthropology, disability justice and power shape cultural intelligence?", docs, { limit: 5 });
    expect(interdisciplinary.some(hit => hit.href === "/learn/cultural-intelligence#broader-practice-title")).toBe(true);
    const doc = docs.find(item => item.href === "/learn/cultural-intelligence#broader-practice-title")!;
    expect(doc.text).toMatch(/ethnography/i);
    expect(doc.text).toMatch(/not a validated agency-wide assessment/i);
    const ethnography = searchDocs("How can ethnography and cross-cultural communication help a DSD team understand its assumptions?", docs, { limit: 5 });
    expect(ethnography.some(hit => hit.title === "Ethnography")).toBe(true);
    expect(ethnography.some(hit => hit.title === "Cross-cultural learning and communication")).toBe(true);
    expect(leadershipLearningDocs("dsd", new Set()).some(item => item.href === doc.href)).toBe(false);
  }, 120000);

  it("only indexes a complete, hash-matched published video transcript and stops on withdrawal", async () => {
    const content = "Democratic leaders invite staff to shape open decisions.";
    const transcriptHash = createHash("sha256").update(content).digest("hex");
    const video = "a".repeat(64) + ".mp4", captions = "b".repeat(64) + ".vtt", transcript = transcriptHash + ".txt";
    const manifest = { format: "leadership-video-v1", style: "democratic", video: `/learning/leadership-videos/${video}`, captions: `/learning/leadership-videos/${captions}`, transcript: `/learning/leadership-videos/${transcript}` };
    const read = vi.fn(async (name: string, method?: "GET" | "HEAD") => {
      if (name === "democratic.json") return Response.json(manifest);
      if (method === "HEAD" && (name === video || name === captions)) return new Response(null, { status: 200 });
      if (name === transcript) return new Response(content);
      return new Response(null, { status: 404 });
    });
    const allowed = new Set(["learn.cultural-intelligence"]);
    const docs = await publishedLeadershipVideoDocs("dsd", allowed, read);
    expect(docs).toHaveLength(1);
    expect(docs[0].text).toBe(content);
    expect(searchDocs("democratic leaders staff decisions", docs, { limit: 1 })[0].id).toBe("leadership-video-democratic");
    read.mockClear();
    expect(await publishedLeadershipVideoDocs("dsd", new Set(), read)).toEqual([]);
    expect(read).not.toHaveBeenCalled();
    const badRead = async (name: string, method?: "GET" | "HEAD") => name === transcript ? new Response("Changed text") : read(name, method);
    expect(await publishedLeadershipVideoDocs("dsd", allowed, badRead)).toEqual([]);
    const missingCaption = async (name: string, method?: "GET" | "HEAD") => name === captions ? new Response(null, { status: 404 }) : read(name, method);
    expect(await publishedLeadershipVideoDocs("dsd", allowed, missingCaption)).toEqual([]);
  });
});
