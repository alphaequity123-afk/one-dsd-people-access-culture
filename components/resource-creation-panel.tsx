"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { localStudyHref } from "@/lib/client/resource-study-links";
import { resourceArtifactKinds, type ArtifactResourceLink, type ArtifactResourceSearch, type ResourceArtifact, type ResourceArtifactKind } from "@/lib/learning/resource-artifact-types";
import { ResourceCreationMedia, ResourceCreationPreview, type ResourceCreationFile } from "./resource-creation-preview";

type JobStatus = "queued" | "generating" | "rendering" | "ready" | "failed" | "stale";
type CreationJob = {
  id: string;
  resourcePath: string;
  title: string;
  kind: ResourceArtifactKind;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  error?: string;
  artifact?: ResourceArtifact;
  files?: ResourceCreationFile[];
};

const endpoint = "/api/consultant/resource-creation";
const statusText: Record<JobStatus, string> = {
  queued: "Queued",
  generating: "Preparing the draft",
  rendering: "Rendering media",
  ready: "Ready to review",
  failed: "Could not finish",
  stale: "Source changed",
};
const formatHelp: Record<ResourceArtifactKind, string> = {
  "study-guide": "Key ideas and practice suggestions with citations.",
  quiz: "Questions, answers and explanations.",
  flashcards: "Practice cards with a question on one side and an answer on the other.",
  "mind-map": "A main topic and connected ideas arranged in branches.",
  slides: "An editable PowerPoint with slide content, speaker notes and citations.",
  infographic: "A visual draft with labeled sections, source links and an HTML download.",
  "audio-overview": "A short discussion between two hosts, with a transcript.",
  "video-overview": "A narrated video with captions and a transcript.",
};
const formats = Object.entries(resourceArtifactKinds) as [ResourceArtifactKind, string][];

async function jsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (response.status === 401 || response.status === 403) {
    throw new Error("Sign in to the Consultant Workspace again to continue.");
  }
  if (!response.ok || !data) {
    throw new Error(typeof data?.error === "string" ? data.error : "The request could not be completed. Please try again.");
  }
  return data as T;
}

function sourceFromInput(value: string) {
  const text = value.trim();
  if (!text.startsWith("/") && !/^https?:\/\//i.test(text)) return "";
  try {
    const url = new URL(text, window.location.origin);
    const path = url.pathname + url.search;
    return url.origin === window.location.origin && localStudyHref(path) ? path : "";
  } catch {
    return "";
  }
}

function activeJob(job: CreationJob) {
  return job.status === "queued" || job.status === "generating" || job.status === "rendering";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium", timeStyle: "short",
  }).format(date);
}

async function loadCatalog(query: string, offset: number, signal: AbortSignal) {
  const params = new URLSearchParams({ search: query, offset: String(offset) });
  return jsonResponse<ArtifactResourceSearch>(await fetch(`${endpoint}?${params}`, { cache: "no-store", signal }));
}

export function ResourceCreationPanel({ resourcePath, resourceTitle }: { resourcePath: string; resourceTitle?: string }) {
  const [source, setSource] = useState<ArtifactResourceLink | null>(() =>
    resourcePath && resourceTitle ? { resourcePath, title: resourceTitle } : null);
  const [pathInput, setPathInput] = useState(resourcePath);
  const [kind, setKind] = useState<ResourceArtifactKind>("study-guide");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ArtifactResourceSearch | null>(null);
  const [searching, setSearching] = useState(true);
  const [searchError, setSearchError] = useState("");
  const searchRequest = useRef<AbortController | null>(null);
  const currentSearch = useRef("");
  const [jobs, setJobs] = useState<CreationJob[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creationError, setCreationError] = useState("");
  const [notice, setNotice] = useState("");
  const submitLock = useRef(false);
  const jobsSequence = useRef(0);

  const searchResources = useCallback(async (query: string, offset = 0) => {
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    currentSearch.current = query;
    setSearching(true);
    setSearchError("");
    try {
      const data = await loadCatalog(query, offset, controller.signal);
      if (!controller.signal.aborted) {
        setResults(current => offset && current
          ? { ...data, resources: [...new Map([...current.resources, ...data.resources].map(item => [item.resourcePath, item])).values()] }
          : data);
      }
    } catch (error) {
      if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : "Resources could not be loaded.");
    } finally {
      if (searchRequest.current === controller && !controller.signal.aborted) setSearching(false);
    }
  }, []);

  const refreshJobs = useCallback((signal?: AbortSignal) => {
    const sequence = ++jobsSequence.current;
    return fetch(endpoint, { cache: "no-store", signal })
      .then(response => jsonResponse<{ jobs: CreationJob[] }>(response))
      .then(({ jobs }) => {
        if (!signal?.aborted && sequence === jobsSequence.current) {
          setJobs(jobs);
          setSelectedId(current => jobs.some(job => job.id === current) ? current : jobs[0]?.id ?? "");
          setJobsError("");
        }
      })
      .catch(error => {
        if (!signal?.aborted && sequence === jobsSequence.current) setJobsError(error instanceof Error ? error.message : "Drafts could not be loaded.");
      })
      .finally(() => {
        if (!signal?.aborted && sequence === jobsSequence.current) setLoadingJobs(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const catalog = new AbortController();
    searchRequest.current = catalog;
    void loadCatalog("", 0, catalog.signal).then(data => {
      if (!catalog.signal.aborted) setResults(data);
    }).catch(error => {
      if (!catalog.signal.aborted) setSearchError(error instanceof Error ? error.message : "Resources could not be loaded.");
    }).finally(() => {
      if (!catalog.signal.aborted) setSearching(false);
    });
    void refreshJobs(controller.signal);
    return () => {
      controller.abort();
      searchRequest.current?.abort();
    };
  }, [refreshJobs]);

  const working = jobs.some(activeJob);
  useEffect(() => {
    if (!working || submitting) return;
    const controller = new AbortController();
    let updating = false;
    const timer = window.setInterval(async () => {
      if (updating) return;
      updating = true;
      try { await refreshJobs(controller.signal); } finally { updating = false; }
    }, 5000);
    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
  }, [working, submitting, refreshJobs]);

  function selectResource(resource: ArtifactResourceLink) {
    setSource(resource);
    setPathInput(resource.resourcePath);
    setCreationError("");
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    setCreationError("");
    setNotice("");
    const sourcePath = sourceFromInput(pathInput);
    if (!sourcePath) {
      setCreationError("Choose a published resource or paste a link from this application.");
      return;
    }
    submitLock.current = true;
    ++jobsSequence.current;
    setSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ resourcePath: sourcePath, kind }),
      });
      const { job } = await jsonResponse<{ job: CreationJob }>(response);
      setJobs(current => [job, ...current.filter(item => item.id !== job.id)]);
      setSelectedId(job.id);
      setNotice(job.status === "ready" ? "Your draft is ready to review." : "Draft creation started. Its status will update here.");
    } catch (error) {
      setCreationError(error instanceof TypeError
        ? "The connection ended before the request was confirmed. Check Recent drafts before starting another draft."
        : error instanceof Error ? error.message : "Draft creation could not start.");
      void refreshJobs();
    } finally {
      setSubmitting(false);
      setLoadingJobs(false);
      submitLock.current = false;
    }
  }

  const selected = jobs.find(job => job.id === selectedId);
  return <div className="wrap grid items-start gap-6 py-8 lg:grid-cols-2">
    <section className="card min-w-0 space-y-5" aria-labelledby="creation-source-heading">
      <h2 id="creation-source-heading" className="text-xl font-bold">Choose a resource</h2>
      <form onSubmit={event => { event.preventDefault(); void searchResources(search.trim()); }}>
        <label htmlFor="creation-search" className="block font-semibold">Search published resources</label>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <input id="creation-search" className="min-h-11 min-w-0 flex-1 rounded border border-line px-3" type="search" value={search} maxLength={150} onChange={event => setSearch(event.target.value)} />
          <button type="submit" className="btn min-h-11">Search</button>
        </div>
      </form>
      <p className="text-sm" role="status">{searchError || (searching ? "Finding resources…" : results?.total ? `${results.total} resources found` : "No matching resources.")}</p>
      {results?.resources.length ? <ul className="max-h-96 divide-y divide-line overflow-y-auto border-y border-line">
        {results.resources.map(item => <li key={item.resourcePath} className="space-y-1 py-2">
          <button type="button" className="min-h-11 text-left font-semibold underline underline-offset-4"
            aria-pressed={source?.resourcePath === item.resourcePath}
            onClick={() => selectResource(item)}>{item.title}</button>
          <p className="text-sm text-muted">{item.type.replace(/[-_]/g, " ")}</p>
          {item.related?.length ? <details className="text-sm">
            <summary className="min-h-11 cursor-pointer py-2">{item.relatedCount} related {item.relatedCount === 1 ? "resource" : "resources"}</summary>
            <ul className="list-disc space-y-1 pl-5">
              {item.related.map(related => <li key={related.resourcePath}>
                <button type="button" className="min-h-11 text-left underline" onClick={() => selectResource(related)}>{related.title}</button>
              </li>)}
            </ul>
          </details> : null}
        </li>)}
      </ul> : null}
      {results?.nextOffset !== undefined ? <button type="button" className="btn min-h-11"
        disabled={searching} onClick={() => void searchResources(currentSearch.current, results.nextOffset)}>Show more resources</button> : null}
      <form onSubmit={create} className="space-y-4 border-t border-line pt-4">
        {source ? <p><span className="font-semibold">Selected resource:</span> {source.title}</p> : null}
        <div>
          <label htmlFor="creation-path" className="block font-semibold">Resource link</label>
          <input id="creation-path" className="mt-2 min-h-11 w-full rounded border border-line px-3" value={pathInput}
            onChange={event => { setPathInput(event.target.value); setSource(null); }} maxLength={1000}
            placeholder="/library/ja-language-access-checklist" required />
        </div>
        <div>
          <label htmlFor="creation-format" className="block font-semibold">Draft format</label>
          <select id="creation-format" className="mt-2 min-h-11 w-full rounded border border-line px-3" value={kind}
            onChange={event => setKind(event.target.value as ResourceArtifactKind)} aria-describedby="creation-format-help">
            {formats.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <p id="creation-format-help" className="mt-2 text-sm text-muted">{formatHelp[kind]}</p>
        </div>
        <button type="submit" className="btn btn--primary min-h-11" disabled={submitting || !pathInput.trim()}>
          {submitting ? "Starting draft…" : "Create draft"}
        </button>
        <p role="status">{creationError || notice}</p>
      </form>
    </section>
    <section className="card min-w-0 space-y-4" aria-labelledby="creation-jobs-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="creation-jobs-heading" className="text-xl font-bold">Recent drafts</h2>
        <button type="button" className="btn min-h-11" onClick={() => void refreshJobs()}>Refresh</button>
      </div>
      {loadingJobs || jobsError || !jobs.length ? <p role="status">{jobsError || (loadingJobs ? "Loading drafts…" : "Completed and in-progress drafts will appear here.")}</p> : null}
      {jobs.length ? <ul className="max-h-64 divide-y divide-line overflow-y-auto border-y border-line">
        {jobs.map(job => <li key={job.id}>
          <button type="button" className="min-h-11 w-full py-2 text-left" aria-pressed={job.id === selectedId} onClick={() => setSelectedId(job.id)}>
            <span className="block font-semibold underline underline-offset-4">{job.title}</span>
            <span className="block text-sm text-muted">{resourceArtifactKinds[job.kind]} · {statusText[job.status]} · {formatDate(job.createdAt)}</span>
          </button>
        </li>)}
      </ul> : null}
      {selected ? <div>
        <p role="status"><strong>{statusText[selected.status]}.</strong> {selected.error}</p>
        {localStudyHref(selected.resourcePath) ? <Link href={selected.resourcePath} className="text-sm underline underline-offset-4">Open source resource</Link> : null}
        {selected.files?.length ? <ResourceCreationMedia files={selected.files} /> : null}
        {selected.artifact ? <ResourceCreationPreview artifact={selected.artifact} powerPointHref={
          selected.status === "ready" && selected.artifact.kind === "slides"
            ? `/api/consultant/resource-creation/${encodeURIComponent(selected.id)}/file?kind=pptx&download=1` : undefined
        } /> : null}
      </div> : null}
    </section>
  </div>;
}
