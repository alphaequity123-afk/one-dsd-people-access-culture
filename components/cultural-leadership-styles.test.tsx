import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CulturalLeadershipStyles } from "./cultural-leadership-styles";

describe("leadership approaches learning", () => {
  it("makes approaches, their limits and supporting sources available without scoring people", () => {
    const { container } = render(<CulturalLeadershipStyles />);
    for (const label of [
      "Servant leadership",
      "Autocratic and authoritarian leadership",
      "Laissez-faire leadership",
      "Transformational leadership",
      "Transformative leadership",
      "Charismatic leadership",
      "Democratic and participatory leadership",
    ]) {
      const summary = screen.getByText(label);
      expect(summary.tagName).toBe("SUMMARY");
      expect(summary.closest("details")?.querySelectorAll("p").length).toBe(3);
    }
    expect(screen.getByText(/not labels, scores or a complete list/i)).toBeTruthy();
    expect(screen.getByText(/not interchangeable with, transformational leadership/i)).toBeTruthy();
    expect(screen.getByText(/race, gender, disability, language/i)).toBeTruthy();
    expect(container.querySelectorAll("a[href^='https://']").length).toBeGreaterThanOrEqual(5);
  });
});
