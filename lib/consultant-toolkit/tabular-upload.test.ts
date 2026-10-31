import { describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
vi.mock("server-only", () => ({}));
import { extractTabularUpload } from "./tabular-upload";
const bytes = (text: string) => new TextEncoder().encode(text);

describe("tabular evidence extraction", () => {
  it("preserves quoted labels, suppressed values, zero, blanks and formula text distinctly", async () => {
    const result = await extractTabularUpload("selected.csv", bytes('Group,Count,Notes\r\n"A, B",0,"line one\nline two"\r\nC,*,\r\nD,,=2+2'));
    expect(result.text).toContain('["A, B","0","line one\\nline two"]');
    expect(result.text).toContain('["C","*",""]');
    expect(result.text).toContain('["D","","=2+2"]');
    expect(result.note).toContain("formulas are not executed");
  });
  it("reads TSV and rejects malformed or excessive selections", async () => {
    expect((await extractTabularUpload("selected.tsv", bytes('Year\tMeasure\n2024\t12%'))).text).toContain('["2024","12%"]');
    await expect(extractTabularUpload("bad.csv", bytes('a,"unfinished'))).rejects.toThrow("incomplete");
    await expect(extractTabularUpload("bad.csv", bytes('a,"closed"tail'))).rejects.toThrow("malformed");
    await expect(extractTabularUpload("wide.csv", bytes(Array(81).fill("a").join(",")))).rejects.toThrow("80 columns");
    await expect(extractTabularUpload("long.csv", bytes(Array(2001).fill("a").join("\n")))).rejects.toThrow("2,000 rows");
    await expect(extractTabularUpload("bad.csv", new Uint8Array([255]))).rejects.toThrow("UTF-8");
  });
  it("reads XLSX cell positions and cached values, discloses hidden sheets and does not recalculate", async () => {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("Measures");
    sheet.addRow(["Year", "Population", "Count"]);
    sheet.addRow([2024, null, 0]);
    sheet.getCell("C3").value = { formula: "2+2", result: 7 };
    sheet.getCell("C4").value = { formula: "3+3" };
    book.addWorksheet("Notes", { state: "hidden" }).addRow(["Suppressed is not zero"]);
    const result = await extractTabularUpload("evidence.xlsx", new Uint8Array(await book.xlsx.writeBuffer()));
    expect(result.text).toContain('["2024","","0"]');
    expect(result.text).toContain("7 [cached formula result; not recalculated]");
    expect(result.text).toContain("[formula has no cached result]");
    expect(result.text).toContain("Notes (hidden in the original workbook)");
    expect(result.note).toContain("2 formula cells");
  });
  it("rejects invalid or empty files without returning invented table content", async () => {
    await expect(extractTabularUpload("bad.xlsx", bytes("not a workbook"))).rejects.toThrow("could not be opened");
    await expect(extractTabularUpload("empty.csv", bytes("\n"))).rejects.toThrow("No readable cells");
    const book = new ExcelJS.Workbook(); book.addWorksheet("Empty");
    await expect(extractTabularUpload("empty.xlsx", new Uint8Array(await book.xlsx.writeBuffer()))).rejects.toThrow("No readable cells");
  });
});
