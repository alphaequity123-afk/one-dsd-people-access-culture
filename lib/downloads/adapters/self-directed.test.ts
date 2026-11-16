import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { DOWNLOAD_KINDS, downloadHref, isDownloadKind } from "../catalog";
import { DOWNLOAD_FORMATS, type ResourceDocument } from "../model";

// The route reads the program view from the visitor's cookie; a fixed view stands in here.
vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: async () => "dsd" }));

const SCOPE: StaffProgramScope = "dsd";
const TIMEOUT = 600_000;

const [adapter, resolve, render, text, retired] = await Promise.all([
  import("./self-directed"),
  import("../resolve"),
  import("../render"),
  import("../exporters/text"),
  import("@/lib/program/retired-features"),
]);
const NUMBERS = await adapter.selfDirectedDownloadIds();

async function expectRenders(document: ResourceDocument): Promise<void> {
  for (const format of DOWNLOAD_FORMATS) {
    const buffer = await render.renderResourceDocument(document, format);
    expect(buffer.subarray(0, format === "pdf" ? 4 : 2).toString("latin1"), `${document.title} as ${format}`).toBe(format === "pdf" ? "%PDF" : "PK");
  }
}

describe("self-directed course downloads", () => {
  it("is a download kind with one link per format", () => {
    expect(isDownloadKind("self-directed-course")).toBe(true);
    expect(DOWNLOAD_KINDS).toContain("self-directed-course");
    expect(downloadHref("self-directed-course", "F07", "docx")).toBe("/api/downloads/self-directed-course/F07?format=docx");
    expect(downloadHref("self-directed-course", "F07", "pdf")).toBe("/api/downloads/self-directed-course/F07?format=pdf");
  });

  it("lists the 72 courses the page lists, none of them referral only", () => {
    expect(NUMBERS).toHaveLength(72);
    expect(new Set(NUMBERS).size).toBe(72);
    for (const number of NUMBERS) {
      expect(number).toMatch(adapter.SELF_DIRECTED_COURSE_NUMBER);
      expect(retired.REFERRAL_ONLY_COURSE_IDS.has(number)).toBe(false);
    }
  });

  it("builds every course from its data file with pages, explanations and sources", async () => {
    for (const number of NUMBERS) {
      const document = await resolve.resolveDownloadDocument("self-directed-course", number, SCOPE);
      expect(document, number).not.toBeNull();
      expect(document!.title.trim(), number).not.toBe("");
      expect(document!.meta.find((row) => row.label === "Course")?.value).toBe(number);
      const headings = document!.sections.map((entry) => entry.heading ?? "");
      expect(headings[0], number).toBe("What you can practice in this course");
      const pages = headings.filter((value) => /^Page \d+/.test(value));
      expect(pages.length, number).toBeGreaterThan(5);
      expect(pages.map((value) => Number(value.match(/^Page (\d+)/)![1])), number).toEqual(pages.map((_, index) => index + 1));
      expect(document!.sources?.length, number).toBeGreaterThan(0);
      const plain = text.renderText(document!).toString("utf8");
      expect(plain, number).toContain("Learning explanation");
      expect(plain, number).toContain("Responses to consider");
      expect(plain, number).toContain("Explanation for A. ");
      expect(plain, number).not.toMatch(/^(?:Continue learning|Try another response)$/m);
      expect(plain, number).not.toMatch(/In Slide Show view/);
      expect(plain.length, number).toBeLessThan(120_000);
    }
  }, TIMEOUT);

  it("renders a course from each level as Word, Excel, PowerPoint and PDF", async () => {
    for (const number of ["F07", "I12", "A21"]) {
      const document = await adapter.selfDirectedCourseDocument(number, SCOPE);
      await expectRenders(document!);
    }
  }, TIMEOUT);

  it("keeps the page order and puts each hidden explanation with the response that opens it", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "self-directed-download-"));
    try {
      const folder = path.join(root, "learning", "self-directed");
      await mkdir(path.join(folder, "data"), { recursive: true });
      const entry = { number: "F01", title: "Listening well", level: "Foundation", audience: "All staff", curriculum: true, dataFile: "data/F01-0123456789ab.json" };
      await writeFile(path.join(folder, "index.html"), `<script id="course-data" type="application/json">${JSON.stringify([entry, { number: "F02", title: "Unsafe", dataFile: "../outside.json" }])}</script>`);
      await writeFile(path.join(folder, entry.dataFile), JSON.stringify({
        number: "F01", title: "Listening well", level: "Foundation", audience: "All staff", outcomes: ["Listen first."],
        sources: [{ title: "A program course", url: "/courses/example" }, { title: "A public source", url: "https://example.org/source" }],
        slides: [
          { number: 1, hidden: false, text: "Opening page\nFirst line.", narration: "Opening explanation.", links: [] },
          { number: 2, hidden: false, text: "A choice\nWhat would you do?\nA. Wait.\nB. Ask.\nIn Slide Show view, select a response to explore its effects.", narration: "Think it through.", links: [{ name: "Answer 1", text: "A. Wait.", target: 3 }, { name: "Answer 2", text: "B. Ask.", target: 4 }] },
          { number: 3, hidden: true, text: "Waiting\nWaiting leaves the question open.\nContinue learning\nTry another response", narration: "Waiting explanation.", links: [{ name: "Continue learning", text: "Continue learning", target: 5 }, { name: "Try another response", text: "Try another response", target: 2 }] },
          { number: 4, hidden: true, text: "Asking\nAsking invites the person in.\nContinue learning", narration: "Asking explanation.", links: [{ name: "Continue learning", text: "Continue learning", target: 5 }] },
          { number: 5, hidden: false, text: "Closing page\nLast line.", narration: "Closing explanation.", links: [] },
        ],
      }));
      expect(await adapter.selfDirectedDownloadIds(root)).toEqual(["F01"]);
      expect(await adapter.selfDirectedCourseDocument("F02", SCOPE, root)).toBeNull();
      const document = (await adapter.selfDirectedCourseDocument("F01", SCOPE, root))!;
      expect(document.title).toBe("Listening well");
      expect(document.subtitle).toBe("Foundation · All staff");
      expect(document.meta.find((row) => row.label === "Curriculum")?.value).toBe("Equity in Policy and Legislative Practice");
      expect(document.meta.find((row) => row.label === "Pages")?.value).toBe("3");
      expect(document.sections.map((entry) => entry.heading)).toEqual(["What you can practice in this course", "Page 1: Opening page", "Page 2: A choice", "Page 3: Closing page"]);
      expect(document.sources).toEqual([{ title: "A program course", note: "program page /courses/example" }, { title: "A public source", href: "https://example.org/source" }]);
      const plain = text.renderText(document).toString("utf8");
      const order = ["Opening explanation.", "What would you do?", "Think it through.", "Responses to consider", "Explanation for A. Wait.", "Waiting leaves the question open.", "Waiting explanation.", "Explanation for B. Ask.", "Asking explanation.", "Closing explanation."].map((part) => plain.indexOf(part));
      expect(order.every((position) => position >= 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      expect(plain).not.toMatch(/Continue learning|Try another response|Slide Show/);
      // The answer lines are listed once as responses and once with their explanation, not repeated in the page text.
      expect(plain.match(/A\. Wait\./g)).toHaveLength(2);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("serves Word, Excel, PDF and plain text through the downloads route", async () => {
    const { GET } = await import("@/app/api/downloads/[kind]/[id]/route");
    const get = (id: string, format: string) => GET(new NextRequest(`https://example.test/api/downloads/self-directed-course/${id}?format=${format}`), { params: Promise.resolve({ kind: "self-directed-course", id }) });
    for (const [format, signature] of [["docx", "PK"], ["xlsx", "PK"], ["pdf", "%PDF"]] as const) {
      const response = await get("F07", format);
      expect(response.status, format).toBe(200);
      expect(response.headers.get("content-disposition"), format).toContain(`microaggressions-recognizing-messages-and-responding-with-care.${format}`);
      expect(response.headers.get("x-download-fallback"), format).toBeNull();
      expect(Buffer.from(await response.arrayBuffer()).subarray(0, signature.length).toString("latin1"), format).toBe(signature);
    }
    const plain = await get("F07", "txt");
    expect(plain.status).toBe(200);
    expect((await plain.text()).split(/\r?\n/)[1]).toBe("Microaggressions: Recognizing Messages and Responding with Care");
    expect((await get("F99", "pdf")).status).toBe(404);
    expect((await get("F07", "exe")).status).toBe(400);
  }, TIMEOUT);

  it("returns nothing for unknown, malformed or referral-only ids", async () => {
    for (const id of ["F00", "F25", "B01", "f07", "F07/../x", "", "self-directed-F07", ...retired.REFERRAL_ONLY_COURSE_IDS]) {
      expect(await adapter.selfDirectedCourseDocument(id, SCOPE), id).toBeNull();
      expect(await resolve.resolveDownloadDocument("self-directed-course", id, "one-dhs"), id).toBeNull();
    }
  });
});
