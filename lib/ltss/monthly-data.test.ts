import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readDemographics } from "./monthly-data";
import metadata from "@/public/data/ltss/metadata.json";

describe("monthly LTSS data", () => {
  it("extracts the verified statewide snapshot from the published workbook", async () => {
    const bytes = await readFile("public/data/ltss/demographics.xlsx");
    expect(await readDemographics(bytes)).toEqual(metadata.snapshot);
  });
  it("rejects a workbook with changed headers rather than inventing figures", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Summary").addRow(["Different headings"]);
    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());
    await expect(readDemographics(bytes)).rejects.toThrow("Changed LTSS summary headers");
  });
});
