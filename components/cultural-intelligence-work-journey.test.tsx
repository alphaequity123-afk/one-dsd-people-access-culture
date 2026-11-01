import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CulturalIntelligenceWorkJourney } from "./cultural-intelligence-work-journey";

afterEach(cleanup);

describe("Cultural Intelligence work journey", () => {
  it.each(["Services, programs and the people we serve", "The workplace: hiring, supervision, development and belonging"]) (
    "keeps the %s journey usable without retired book references",
    (path) => {
      const view = render(<CulturalIntelligenceWorkJourney resources={[]} />);
      fireEvent.click(screen.getByLabelText(path));
      fireEvent.click(screen.getByLabelText("Start with a situation or decision in my work"));
      for (let step = 0; step < 30; step++) {
        expect(view.container.textContent).not.toMatch(/livermore|leading with cultural intelligence|the book|vitalsource/i);
        const next = screen.getByRole("button", { name: "Next" }) as HTMLButtonElement;
        if (next.disabled) return;
        fireEvent.click(next);
      }
      throw new Error("Journey did not reach its final step");
    },
  );
});
