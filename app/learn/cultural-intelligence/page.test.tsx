import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: async () => "dsd" }));
vi.mock("@/lib/content/cultural-intelligence-publication", () => ({ culturalIntelligenceHubAvailable: async () => true }));
vi.mock("@/lib/content/staff-surface-registry", () => ({ stringValue: (values: Record<string, unknown>, key: string) => typeof values[key] === "string" ? values[key] : "" }));
vi.mock("@/lib/content/cultural-intelligence-collection", () => ({
  culturalIntelligenceCollection: async () => ({ communities: [], ownCulture: [], courseGroups: [], frameworks: [], leader: { courses: [], groups: [], divisionRoute: false }, facilitation: [], resources: [], journeyResources: [], interculturalAvailable: false }),
}));
vi.mock("@/components/editable-surface", () => ({
  prepareEditableSurface: async () => ({
    available: true, canEdit: false, definition: { fields: [] },
    values: { title: "Cultural Intelligence collection", intro: "A locally edited introduction.", scopeLine: "The four CQ® capabilities are our foundation.", foundationTitle: "Foundation", foundationBody: "One DHS and One DSD share one foundation: careful research on culture.", centralMessage: "Listen to people affected.", exploreOwnCulture: "David Livermore explains culture.", applyQuestions: "The book offers questions.", applyRoutine: "CQ Strategy offers a routine." },
  }),
  EditableSurfaceRegion: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import CulturalIntelligencePage from "./page";

describe("Cultural Intelligence page", () => {
  it("renders broad framing while suppressing retired saved wording and its cover", async () => {
    const view = render(await CulturalIntelligencePage());
    expect(screen.getByText(/This is a multidisciplinary program/)).toBeTruthy();
    expect(screen.getByText(/not a validated agency-wide assessment or an official classification/)).toBeTruthy();
    expect(screen.getByText("A locally edited introduction.")).toBeTruthy();
    expect(view.container.textContent).not.toMatch(/livermore|leading with cultural intelligence|\bCQ\b|the book/i);
    expect(view.container.querySelector('img[src*="cultural-intelligence-3e"]')).toBeNull();
  });
});
