import "server-only";
/**
 * Public pages of State of Minnesota agencies, read from their own websites for Ask and site search
 * (state-pages.json). Link-only agencies are not read. Each page is a document like any program page.
 */
import fs from "node:fs";
import path from "node:path";
import type { Doc } from "@/lib/intelligence/retrieval/search";

type StatePage = { agency: string; url: string; title: string; description: string; text: string };

let docs: Doc[] | undefined;
export function statePageDocs(): Doc[] {
  if (docs) return docs;
  const file = path.join(process.cwd(), "lib/content/state-pages.json");
  let pages: StatePage[] = [];
  try { pages = (JSON.parse(fs.readFileSync(file, "utf8")) as { pages: StatePage[] }).pages ?? []; } catch { pages = []; }
  return (docs = pages.map((page, index) => ({
    kind: "content", id: `state-page:${index}`, title: page.title || page.agency, href: page.url,
    authority: "external_verify", type: "state_page", status: "published", reviewDate: "", scope: "public",
    summary: page.description, text: [page.agency, page.description, page.text].join(" "), tags: [], intents: [],
  })));
}
