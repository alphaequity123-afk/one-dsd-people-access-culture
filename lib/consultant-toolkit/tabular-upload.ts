import "server-only";
import { extname } from "node:path";
import ExcelJS from "exceljs";
import { fromBuffer, type ZipFile } from "yauzl";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_TEXT, UploadError, type ExtractedUpload } from "@/lib/consultant-analysis/uploads";

export const isTabularUpload = (name: string) => [".csv", ".tsv", ".xlsx"].includes(extname(name).toLowerCase());
const MAX_EXPANDED = 40 * 1024 * 1024;
const MAX_ROWS = 2000;
const MAX_COLUMNS = 80;

function finish(text: string, note: string): ExtractedUpload {
  const combined = `Reading notes: ${note}\n\n${text}`;
  if (!text.trim()) throw new UploadError("No readable cells were found. Attach a worksheet or paste the figures you want to examine.");
  if (combined.length > MAX_UPLOAD_TEXT) throw new UploadError("This table is too large for one source. Export a smaller selection, including its headings, dates and definitions.", 413);
  return { text: combined, note };
}

/** Validate and actually decompress every ZIP entry under a shared limit before ExcelJS reads it. */
export async function checkWorkbook(bytes: Uint8Array) {
  await new Promise<void>((resolve, reject) => {
    let archive: ZipFile | undefined;
    let ended = false, expanded = 0;
    const names = new Set<string>();
    const timer = setTimeout(() => fail("Reading this workbook took too long. Export the relevant worksheet as CSV."), 15000);
    const fail = (reason: string) => { if (ended) return; ended = true; clearTimeout(timer); archive?.close(); reject(new UploadError(reason)); };
    fromBuffer(Buffer.from(bytes), { lazyEntries: true, validateEntrySizes: true, strictFileNames: true }, (error, zip) => {
      if (error || !zip) return fail("This workbook could not be opened. Save an unprotected XLSX or CSV copy.");
      archive = zip;
      if (ended) { zip.close(); return; }
      if (zip.entryCount > 1500) return fail("This workbook has too many parts. Export the relevant worksheet as CSV.");
      zip.on("error", () => fail("This workbook is damaged or protected. Save a new copy."));
      zip.on("end", () => { if (!ended) { ended = true; clearTimeout(timer); resolve(); } });
      zip.on("entry", entry => {
        if (names.has(entry.fileName) || /(^|\/)\.\.(\/|$)|vbaProject\.bin$/i.test(entry.fileName) || entry.fileName.startsWith("/") || (entry.generalPurposeBitFlag & 1)) return fail("Use an unprotected workbook without macros.");
        names.add(entry.fileName);
        if (entry.uncompressedSize > MAX_EXPANDED) return fail("This workbook expands beyond the reading limit. Export a smaller selection.");
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) return fail("This workbook could not be read.");
          stream.on("error", () => fail("This workbook could not be read."));
          stream.on("data", (chunk: Buffer) => { expanded += chunk.length; if (expanded > MAX_EXPANDED) { stream.destroy(); fail("This workbook expands beyond the reading limit. Export a smaller selection."); } });
          stream.on("end", () => { if (!ended) zip.readEntry(); });
        });
      });
      zip.readEntry();
    });
  });
}

function parseDelimited(text: string, separator: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false;
  const pushCell = () => { row.push(cell); cell = ""; closed = false; if (row.length > MAX_COLUMNS) throw new UploadError("Use a table with 80 columns or fewer.", 413); };
  const pushRow = () => { pushCell(); if (row.some(value => value.length)) rows.push(row); row = []; if (rows.length > MAX_ROWS) throw new UploadError("Use a selection with 2,000 rows or fewer.", 413); };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } } else cell += c; }
    else if (c === '"') { if (cell || closed) throw new UploadError("A quoted cell is malformed. Save a new CSV copy."); quoted = true; }
    else if (c === separator) pushCell();
    else if (c === "\r" || c === "\n") { if (c === "\r" && text[i + 1] === "\n") i++; pushRow(); }
    else { if (closed) throw new UploadError("A quoted cell is malformed. Save a new CSV copy."); cell += c; }
    if (cell.length > MAX_UPLOAD_TEXT) throw new UploadError("A cell is too long. Upload a smaller selection.", 413);
  }
  if (quoted) throw new UploadError("A quoted cell is incomplete. Save a new CSV copy.");
  if (cell || row.length || closed) pushRow();
  return rows;
}

export async function extractTabularUpload(name: string, bytes: Uint8Array): Promise<ExtractedUpload> {
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw new UploadError("Choose a nonempty file no larger than 20 MB.", 413);
  const extension = extname(name).toLowerCase();
  if (extension === ".csv" || extension === ".tsv") {
    let text: string;
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, ""); } catch { throw new UploadError("Save this table as UTF-8 CSV or XLSX and try again."); }
    if (text.length > MAX_UPLOAD_TEXT) throw new UploadError("Export a smaller selection, including its column headings and definitions.", 413);
    const rows = parseDelimited(text, extension === ".tsv" ? "\t" : ",");
    return finish(rows.map((values, i) => `Row ${i + 1}: ${JSON.stringify(values)}`).join("\n"), "Cells are read as text; formulas are not executed. Keep headings, reporting periods, units, filters and suppressed values with the selected data.");
  }
  if (extension !== ".xlsx") throw new UploadError("Use XLSX, UTF-8 CSV or TSV for spreadsheet evidence.");
  await checkWorkbook(bytes);
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(Buffer.from(bytes) as unknown as Parameters<typeof workbook.xlsx.load>[0]); } catch { throw new UploadError("This workbook could not be read. Export the relevant worksheet as CSV."); }
  if (workbook.worksheets.length > 20) throw new UploadError("Use a workbook with 20 worksheets or fewer.", 413);
  const lines: string[] = []; let chars = 0, rows = 0, formulas = 0;
  const add = (line: string) => { chars += line.length + 1; if (chars > MAX_UPLOAD_TEXT - 600) throw new UploadError("This workbook is too large for one source. Export the relevant selection with headings and definitions.", 413); lines.push(line); };
  for (const sheet of workbook.worksheets) {
    if (sheet.rowCount > MAX_ROWS || sheet.columnCount > MAX_COLUMNS) throw new UploadError("Use worksheets with 2,000 rows and 80 columns or fewer. Export a smaller selection.", 413);
    if (!sheet.actualRowCount) continue;
    add(`Worksheet: ${sheet.name}${sheet.state === "visible" ? "" : " (hidden in the original workbook)"}`);
    sheet.eachRow((row, rowNumber) => {
      if (++rows > MAX_ROWS) throw new UploadError("Use a selection with 2,000 populated rows or fewer across all worksheets.", 413);
      const values: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, column) => {
        if (column > MAX_COLUMNS) throw new UploadError("Use a table with 80 columns or fewer.", 413);
        const value = cell.value;
        if (value && typeof value === "object" && ("formula" in value || "sharedFormula" in value)) {
          formulas++; values.push(cell.text ? `${cell.text} [cached formula result; not recalculated]` : "[formula has no cached result]");
        } else values.push(value instanceof Date ? value.toISOString() : cell.text);
      });
      add(`Row ${rowNumber}: ${JSON.stringify(values)}`);
    });
  }
  return finish(lines.join("\n"), `Cell text from all populated worksheets, including hidden sheets. Charts, images, comments and formatting are not interpreted. External links are not followed; formulas are not calculated.${formulas ? ` ${formulas} formula cells use saved results that may be stale.` : ""} Check the reporting period, units and denominators before comparison.`);
}
