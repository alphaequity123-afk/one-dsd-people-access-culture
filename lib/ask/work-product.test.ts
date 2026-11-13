import { expect, it } from "vitest";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { cleanFollowUps, usableWorkDraft, workProductDocument, type AskWorkProduct } from "./work-product";
import { renderResourceDocument } from "@/lib/downloads/render";

const work: AskWorkProduct = {
  title: "Community discussion plan", format: "xlsx",
  sections: [{ heading: "Discussion", paragraphs: ["Example planning draft; adapt the questions."], headers: ["Topic", "Question"], rows: [["Access", "What would make participation easier?"], ["Literal text", "=HYPERLINK(\"https://example.org\")"]] }],
  sources: [{ title: "Program reading", href: "/learn" }, { title: "External source", href: "https://www.pacer.org/" }, { title: "Rejected", href: "javascript:alert(1)" }],
};
it("creates a real workbook with editable table rows and source links, without executing cell text", async () => {
  const data = await renderResourceDocument(workProductDocument(work, "https://example.org"), "xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(new Uint8Array(data).buffer);
  const sheet = workbook.getWorksheet("Discussion")!;
  expect(sheet.getRow(1).getCell(1).text).toBe("Topic");
  expect(sheet.getRow(2).getCell(2).text).toBe("What would make participation easier?");
  expect(sheet.getRow(3).getCell(2).type).toBe(ExcelJS.ValueType.String);
  expect(workbook.getWorksheet("Sources")!.getRow(2).getCell(2).hyperlink).toBe("https://example.org/learn");
  expect(workbook.getWorksheet("Sources")!.rowCount).toBe(3);
});
it("creates a Word document with the requested narrative, table and attribution", async () => {
  const data = await renderResourceDocument(workProductDocument({ ...work, format: "docx" }, "https://example.org"), "docx");
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file("word/document.xml")!.async("string");
  expect(xml).toContain("What would make participation easier?");
  expect(xml).toContain("Working draft");
  expect(xml).toContain("Program reading");
});
it("rejects empty, oversized or misaligned work products instead of making misleading files", () => {
  const draft = { title: work.title, format: work.format, sections: work.sections };
  expect(usableWorkDraft(draft)).toBeTruthy();
  expect(usableWorkDraft({ ...draft, sections: [{ heading: "", paragraphs: [], headers: [], rows: [] }] })).toBeUndefined();
  expect(usableWorkDraft({ ...draft, sections: [{ ...draft.sections[0], rows: [["Missing a cell"]] }] })).toBeUndefined();
});
it("keeps at most three distinct suggestions and removes the current question", () => {
  expect(cleanFollowUps(["Why?", " why? ", "What evidence supports this?", "What else?", "What else?", "Draft a plan.", "Fourth"], "Why?")).toEqual(["What evidence supports this?", "What else?", "Draft a plan."]);
});
