import "server-only";
import ExcelJS from "exceljs";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { checkWorkbook } from "@/lib/consultant-toolkit/tabular-upload";

const DEMOGRAPHICS = "https://mn.gov/dhs/assets/LTSS%20Program%20Demographics_tcm1053-631765.xlsx";
const PERFORMANCE = "https://mn.gov/dhs/assets/LTSS-Performance-Measures_tcm1053-492103.xlsx";
const MAX_BYTES = 20 * 1024 * 1024;

async function download(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(60_000) });
  if (!response.ok || !response.body || new URL(response.url).hostname !== "mn.gov") throw new Error("LTSS source unavailable");
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_BYTES) throw new Error("LTSS workbook too large");
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
  try {
    for (;;) { const part = await reader.read(); if (part.done) break; total += part.value.byteLength; if (total > MAX_BYTES) { await reader.cancel(); throw new Error("LTSS workbook too large"); } chunks.push(part.value); }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks);
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) throw new Error("Invalid LTSS workbook");
  await checkWorkbook(bytes);
  return bytes;
}

export async function readDemographics(bytes: Uint8Array) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(bytes) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.getWorksheet("Summary"); if (!sheet) throw new Error("Missing LTSS summary");
  const headers = ["Program Population", "County (COFR)", "Month Year", "Race Summary", "Age Summary", "# of People", "% of Program Population"];
  if (headers.some((name, i) => sheet.getRow(1).getCell(i + 1).value !== name)) throw new Error("Changed LTSS summary headers");
  const rows = new Map<string, number>();
  sheet.eachRow((row, number) => {
    if (number === 1) return;
    const [program, county, period, race, age, count] = [1,2,3,4,5,6].map(i => row.getCell(i).value);
    if (typeof program !== "string" || typeof county !== "string" || typeof race !== "string" || typeof age !== "string") return;
    const p = program.trim();
    if (county.trim() !== "Statewide" || race.trim() !== "All Race/Ethnicities" || age.trim() !== "All Ages" || !["Total LTSS Population", "Total HCBS Population"].includes(p)) return;
    if (!(period instanceof Date) || !Number.isFinite(period.getTime()) || typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) throw new Error("Invalid LTSS summary row");
    const key = `${period.toISOString().slice(0,7)}|${p}`;
    if (rows.has(key)) throw new Error("Ambiguous LTSS summary row");
    rows.set(key, count);
  });
  const periods = [...new Set([...rows.keys()].map(key => key.slice(0,7)))].sort().reverse();
  const period = periods.find(value => rows.has(`${value}|Total LTSS Population`) && rows.has(`${value}|Total HCBS Population`));
  if (!period) throw new Error("No complete statewide LTSS totals");
  return { period, ltss: rows.get(`${period}|Total LTSS Population`)!, hcbs: rows.get(`${period}|Total HCBS Population`)! };
}

async function retrieve() {
  const [demographics, performance] = await Promise.all([download(DEMOGRAPHICS), download(PERFORMANCE)]);
  const snapshot = await readDemographics(demographics);
  const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
  return { checkedAt: new Date().toISOString(), snapshot, sources: { demographics: { url: DEMOGRAPHICS, sha256: hash(demographics) }, performance: { url: PERFORMANCE, sha256: hash(performance) } } };
}

let inFlight: ReturnType<typeof retrieve> | undefined;
/** A separate key each calendar month lets the first scheduled check populate a fresh result. */
export function monthlyLtssData() {
  if (inFlight) return inFlight;
  const month = new Date().toISOString().slice(0, 7);
  inFlight = unstable_cache(retrieve, ["public-ltss-data-v1", month], { revalidate: 2678400 })().finally(() => { inFlight = undefined; });
  return inFlight;
}
