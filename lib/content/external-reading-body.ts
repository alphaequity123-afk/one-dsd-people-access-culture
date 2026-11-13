import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { externalReading, type ReadingEntry } from "./external-readings";

export type ReadingBody = ReadingEntry & {
  checkedAt: string;
  document?: string;
  sections?: { id: string; title: string; html: string }[];
  interactive?: { tag: string; src: string }[];
  attribution?: string;
  licenseUrl?: string;
};
export const loadExternalReading = cache(async (id: string): Promise<ReadingBody | null> => {
  if (!/^[a-f0-9]{20}$/.test(id) || !externalReading(id)) return null;
  try {
    const text = await readFile(path.join(process.cwd(), "data", "source-readings", `${id}.json`), "utf8");
    return JSON.parse(text) as ReadingBody;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
});
