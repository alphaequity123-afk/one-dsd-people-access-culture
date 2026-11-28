import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CulturalLeadershipCurriculum } from "./cultural-leadership-curriculum";

describe("leadership curriculum", () => {
  it("provides four actionable lessons without collecting or scoring personal information", () => {
    const { container } = render(<CulturalLeadershipCurriculum />);
    const topics = ["1. Leadership approaches and authority", "2. Power, intersectionality and disability justice", "3. Speaking up, psychological safety and accountability", "4. From stated commitments to organizational change"];
    for (const name of topics) {
      const summary = screen.getByText(name);
      expect(summary.tagName).toBe("SUMMARY");
      const lesson = summary.closest("details");
      expect(lesson).toBeTruthy();
      expect(within(lesson!).getByText("A situation to work through")).toBeTruthy();
      expect(within(lesson!).getByText("Try it")).toBeTruthy();
      expect(lesson!.querySelectorAll("ol li")).toHaveLength(3);
    }
    expect(screen.getByText(/don't collect responses or score people/i)).toBeTruthy();
    expect(screen.getByText(/for leaders, supervisors, managers and directors/i)).toBeTruthy();
    expect(container.querySelectorAll("input, textarea, select")).toHaveLength(0);
    expect(screen.getByRole("link", { name: /disability justice/i }).getAttribute("href")).toContain("sinsinvalid.org");
    expect(screen.getByRole("link", { name: /intersectionality/i }).getAttribute("href")).toContain("chicagounbound.uchicago.edu");
  });
});
