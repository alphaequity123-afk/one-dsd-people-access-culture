import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POLICY_CASE_CONTRACT_VERSION, type PolicyCase } from "@/lib/policy-analysis/contract";
import { PolicyAnalyzer } from "./policy-analyzer";
import type { CatalogPolicy, QuestionLabels } from "./labels";

const CATALOG: CatalogPolicy[] = [
  { id: "interpreter-access", title: "Interpreter access in assessments", kind: "department-policy", kindLabel: "Department of Human Services policies", summary: "Assessments offer an interpreter at no cost.", programs: ["Developmental Disabilities Waiver"], tags: ["language"], sourceTitle: "Policy page", sourceUrl: "https://example.test/policy", sourceDate: "February 1, 2026" },
  { id: "notice-timelines", title: "Notice timelines", kind: "rule", kindLabel: "Minnesota rules", summary: "Notices go out ten days ahead.", programs: [], tags: ["notices"], sourceTitle: "Rule", sourceUrl: "https://example.test/rule", sourceDate: "" },
];
const QUESTIONS: QuestionLabels = { "affected-1": { prompt: "Who uses the policy?", stage: "Who is affected", stageOrder: 0 } };
const NOW = "2026-11-05T12:00:00.000Z";

function sampleCase(overrides: Partial<PolicyCase> = {}): PolicyCase {
  return {
    kind: "policy-change", contractVersion: POLICY_CASE_CONTRACT_VERSION, id: "11111111-1111-4111-8111-111111111111", version: 3, status: "review",
    title: "Equity analysis: Interpreter access in assessments",
    policy: { catalogId: "interpreter-access", title: "Interpreter access in assessments", programs: [] },
    sources: [{ id: "paste-1", title: "Policy text", text: "Interpreters are offered at no cost.", origin: "user" }],
    context: "",
    analysis: {
      summary: "The policy offers interpreters but does not say how people learn about it.",
      answers: [
        { questionId: "affected-1", kind: "evidence", text: "People being assessed.", citations: [{ sourceId: "paste-1", excerpt: "Interpreters are offered at no cost." }] },
        { questionId: "affected-2", kind: "gap", text: "The sources do not say who is excluded.", citations: [] },
      ],
      principles: [{ principleId: "effective-communication", kind: "inference", finding: "Notices may not reach people who are deaf.", citations: [] }],
      limitations: ["Only one source."],
      generatedAt: NOW,
    },
    recommendations: [{
      id: "rec-1", type: "policy-wording", title: "Tell people about interpreters", change: "Add a sentence to every notice.",
      currentWording: "Interpreters are offered at no cost.", proposedWording: "Interpreters are offered at no cost. Call to ask for one.",
      equityConsideration: "People with limited English learn that help exists.", principleIds: ["effective-communication"], evidence: [],
      affectedPolicies: ["notice-timelines"], responsibleRole: "Disability Services Division policy area", effort: "low", history: [],
    }],
    formalization: null, createdAt: NOW, updatedAt: NOW, finalizedAt: null,
    ...overrides,
  };
}

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
}

function mockFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | undefined) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const handled = handler(url, init);
    if (handled) return handled;
    if (url === "/api/equity-workspace/policy-analysis") return json({ role: "team", roleLabel: "One DSD Team", analysisAvailable: true, analysisUnavailableReason: null, caseSavingAvailable: true, caseSavingUnavailableReason: null });
    return json({ error: "not mocked" }, 500);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Equity Policy Analyzer", () => {
  it("starts step 1 with the catalog policy named in the address", async () => {
    mockFetch(() => undefined);
    render(<PolicyAnalyzer catalog={CATALOG} kinds={[]} questions={QUESTIONS} initialCatalogId="interpreter-access" />);
    expect(screen.getByText("Assessments offer an interpreter at no cost.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Get the official text" })).toBeTruthy();
    expect((screen.getByLabelText("Name of this analysis") as HTMLInputElement).value).toBe("Equity analysis: Interpreter access in assessments");
    expect(screen.getByRole("button", { name: "Attach a document" })).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/recorded as the One DSD Team/)).toBeTruthy());
  });

  it("shows the analysis, gaps, changes and decision controls for a case waiting for decisions", async () => {
    const fetchMock = mockFetch((url, init) => {
      if (url.endsWith("/cases/11111111-1111-4111-8111-111111111111")) return json({ case: sampleCase() });
      if (url.endsWith("/decide")) {
        const body = JSON.parse(String(init?.body));
        expect(body).toMatchObject({ caseId: sampleCase().id, expectedVersion: 3, recommendationId: "rec-1", outcome: "deferred", reason: "Needs a budget", deferredUntil: "2027-01-15" });
        return json({ case: sampleCase({ version: 4, recommendations: [{ ...sampleCase().recommendations[0], decision: { outcome: "deferred", role: "team", reason: "Needs a budget", deferredUntil: "2027-01-15", at: NOW }, history: [{ outcome: "deferred", role: "team", reason: "Needs a budget", deferredUntil: "2027-01-15", at: NOW }] }] }) });
      }
      return undefined;
    });
    render(<PolicyAnalyzer catalog={CATALOG} kinds={[]} questions={QUESTIONS} initialCaseId="11111111-1111-4111-8111-111111111111" />);
    await screen.findByText("Information still needed");
    expect(screen.getAllByText("From the sources").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Policy wording change").length).toBe(2);
    expect(screen.getByRole("link", { name: "Notice timelines" }).getAttribute("href")).toBe("/community-outreach/policies/notice-timelines");
    fireEvent.click(screen.getByRole("button", { name: "Defer" }));
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Needs a budget" } });
    fireEvent.click(screen.getByRole("button", { name: "Record: deferred" }));
    expect(await screen.findByText("Choose the date to come back to this change.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Date to come back to it"), { target: { value: "2027-01-15" } });
    fireEvent.click(screen.getByRole("button", { name: "Record: deferred" }));
    await screen.findByText("The decision is recorded.");
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/decide"))).toBe(true);
    expect(screen.getByRole("button", { name: "Formalize the approved changes" }).hasAttribute("disabled")).toBe(true);
  });

  it("reloads the case and explains when it changed somewhere else", async () => {
    let reads = 0;
    mockFetch(url => {
      if (url.endsWith("/cases/11111111-1111-4111-8111-111111111111")) { reads += 1; return json({ case: sampleCase({ version: 2 + reads }) }); }
      if (url.endsWith("/decide")) return json({ error: "This case changed in another window.", code: "conflict" }, 409);
      return undefined;
    });
    render(<PolicyAnalyzer catalog={CATALOG} kinds={[]} questions={QUESTIONS} initialCaseId="11111111-1111-4111-8111-111111111111" />);
    fireEvent.click(await screen.findByRole("button", { name: "Approve" }));
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Clear and needed" } });
    fireEvent.click(screen.getByRole("button", { name: "Record: approved" }));
    expect(await screen.findByText(/changed somewhere else/)).toBeTruthy();
    expect(reads).toBe(2);
  });

  it("switches to writing changes by hand when the analysis service is not available", async () => {
    mockFetch(url => {
      if (url === "/api/equity-workspace/policy-analysis") return json({ role: "consultant", roleLabel: "Equity and Inclusion Operations Consultant", analysisAvailable: false, analysisUnavailableReason: "Drafting is not available in this deployment.", caseSavingAvailable: true, caseSavingUnavailableReason: null });
      if (url.endsWith("/cases/11111111-1111-4111-8111-111111111111")) return json({ case: sampleCase({ status: "draft", analysis: null, recommendations: [] }) });
      return undefined;
    });
    render(<PolicyAnalyzer catalog={CATALOG} kinds={[]} questions={QUESTIONS} initialCaseId="11111111-1111-4111-8111-111111111111" />);
    expect(await screen.findByText(/write the recommended changes yourself/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add a change" })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\bAI\b|artificial intelligence|tutor|\bbot\b|\bmodel\b/i);
  });
});
