import "server-only";
import { createHash } from "node:crypto";
import { indexedProgramResources } from "@/lib/intelligence/retrieval/program-resources";
import { indexedStaffDocs } from "@/lib/intelligence/retrieval/staff-search";
import { searchDocs, type Doc } from "@/lib/intelligence/retrieval/search";
import { organizationalDocs, organizationalMaintenance } from "@/lib/intelligence/memory/organization";
import { staffProgramScope } from "@/lib/content/staff-publications";
import goals from "@/lib/program/equity-goals.json";
import type { ToolkitRequest } from "./schema";
import { LTSS_GUIDANCE, LTSS_RESOURCES } from "./ltss";

type Source = ToolkitRequest["sources"][number];
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
function boundedExcerpt(text: string, maximum: number): string {
  if (text.length <= maximum) return text;
  const note = "\n[Source excerpt truncated to fit the analysis context; the full source was not included.]";
  return text.slice(0, Math.max(0, maximum - note.length)) + note;
}

/** Queries stay on this server; only current published program documents enter this index. */
export async function toolkitProgramContext(request: ToolkitRequest): Promise<{ sources: Source[]; note: string }> {
  const scope = staffProgramScope();
  const query = [request.title, request.question, request.context, ...request.programs].join(" ").slice(0, 16000);
  const [index, staff] = await Promise.all([indexedProgramResources(scope), indexedStaffDocs(scope)]);
  const docs = [...index.destinations, ...staff, ...organizationalDocs()];
  const unique = new Map<string, Doc>();
  for (const doc of docs) if (!unique.has(doc.id)) unique.set(doc.id, doc);
  const ranked = searchDocs(query, [...unique.values()], { limit: 10 });
  const candidates: Source[] = ranked.map(hit => {
    const doc = unique.get(hit.id)!;
    const provenance = doc.evidenceRevisions?.map(revision => JSON.stringify(revision)).join("; ") || `Code-defined source snapshot SHA-256 ${hash(doc.text)}`;
    const text = [`Source category: published application resource or referenced organizational evidence.`, `Authority: ${doc.authority}. Scope: ${doc.scope}. Status: ${doc.status}.`, `Resource location: ${doc.href}`, `Source review date: ${doc.reviewDate || "No review date recorded; verify currentness for this decision."}`, `Provenance: ${provenance}`, "Source text:", boundedExcerpt(doc.text, 6500)].join("\n");
    return { id: `program-${hash(doc.id + text).slice(0, 24)}`, title: doc.title.slice(0, 300), text, ...(/^https?:\/\//.test(doc.href) ? { url: doc.href } : {}) };
  });
  if (/\b(?:ltss|hcbs|waiver|disabilit\w*|aging|long.term services|community.based services|dsd|adsa)\b/i.test(query)) {
    candidates.unshift(...LTSS_RESOURCES.map(resource => ({
      id: `program-${resource.id}`, title: resource.title, url: resource.url, date: "2026-10-15",
      text: [`Official source entry point checked 2026-10-15: ${resource.title}.`, "Application summary of the linked resource (not a quotation from the linked DHS page):", resource.description, `Location: ${resource.url}`, "No dashboard dataset was downloaded or supplied by this reference. This entry does not establish any numerical finding.", "Application analysis guidance (not a quotation from the linked DHS page):", ...LTSS_GUIDANCE].join("\n"),
    })));
  }
  const selectedGoals = goals.goals.filter(goal => request.goals.includes(goal.id));
  if (selectedGoals.length) {
    const text = [goals.goalAuthority, goals.mappingAuthority, ...selectedGoals.map(goal => `Goal ${goal.number}: ${goal.title}\n${goal.summary}\n${goal.focus}\n${goal.antiRacism}`)].join("\n\n");
    candidates.unshift({ id: `program-adsa-${hash(text).slice(0, 24)}`, title: "Selected ADSA equity goals and program companion guidance", text });
  }
  // Explicit provenance, not an id-prefix guess: user documents retain their
  // identity even when named program-*. Previous generated context is refreshed
  // against the current publication index and selected goals on every run.
  const current = request.sources.filter(source => source.origin !== "application-context");
  const refreshed = request.sources.length - current.length;
  const ids = new Set(current.map(source => source.id));
  let remaining = 360000 - current.reduce((sum, source) => sum + source.text.length, 0);
  let added = 0;
  for (const candidate of candidates) {
    if (current.length >= 40 || remaining < 800) break;
    if (ids.has(candidate.id)) continue;
    const source: Source = { ...candidate, origin: "application-context", text: boundedExcerpt(candidate.text, Math.min(remaining, 8500)) };
    current.push(source); ids.add(source.id); remaining -= source.text.length; added++;
  }
  const maintenance = organizationalMaintenance();
  return { sources: current, note: `${added} relevant published program or organizational sources were added from the ${scope === "dsd" ? "One DSD" : "One DHS"} collection. ${refreshed ? `${refreshed} previous application-context references were replaced with this current selection. ` : ""}This is a selected reference collection, not a verified inventory of every DHS program. Organizational source baseline: ${maintenance.version}. ${maintenance.refreshDue.length ? "Some organizational references need a current-source review. " : ""}Private case contents were not submitted to public web search. ${added < candidates.length ? "The source limit prevented some additional context from being included." : ""}`.trim() };
}
