// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { AnalysisSource } from "@/lib/analysis/contract";
import ltssData from "@/public/data/ltss/metadata.json";

vi.mock("@/components/analysis/source-intake", () => ({
  SourceIntake: ({ sources, onChange, multimedia, uploadUrl }: { sources: AnalysisSource[]; onChange: (value: AnalysisSource[]) => void; multimedia: boolean; uploadUrl: string }) => <div>
    <span>{multimedia ? `Media enabled at ${uploadUrl}` : "Documents only"}</span>
    {sources.map(source => <p key={source.id}>{source.title}: {source.text}</p>)}
    <button onClick={() => onChange([...sources, { id: "my-data", title: "My scheduling data", text: "A staff source" }])}>Add my data</button>
  </div>,
}));
import { AnalyzeWorkspace } from "./analyze-workspace";

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("adds the practice situation without replacing staff data, and submits the equity instrument", async () => {
  const request = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ error: "Temporarily unavailable" }), { status: 503, headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", request);
  render(<AnalyzeWorkspace communities={[]} toolkit />);
  expect(screen.getByText(/Media enabled at \/api\/ask-attachment/)).toBeTruthy();
  expect(screen.getByText(/linked data are not automatically included/i)).toBeTruthy();
  fireEvent.click(screen.getByText("Add my data"));
  fireEvent.click(screen.getByText("Add the service-scheduling example"));
  fireEvent.click(screen.getByText("Add statewide LTSS data"));
  expect(screen.getByText(/My scheduling data: A staff source/)).toBeTruthy();
  expect(screen.getByText(/Practice situation, not an actual DHS record/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Analyze" }));
  await waitFor(() => expect(request).toHaveBeenCalled());
  const body = JSON.parse(request.mock.calls[0][1]?.body as string);
  expect(body.instrumentId).toBe("equity-analysis");
  expect(body.sources).toHaveLength(3);
  expect(body.sources[2].text).toContain(ltssData.snapshot.ltss.toLocaleString("en-US"));
  expect(body.sources[2].text).toContain(new Date(`${ltssData.snapshot.period}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }));
  expect(body.context).toMatch(/scheduling/);
  await waitFor(() => expect(screen.getByText(/Worksheet:/)).toBeTruthy());
});
