// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import CountyMap from "./county-map";

afterEach(cleanup);

describe("CountyMap", () => {
  it("renders the three tabs and a table with 88 rows", async () => {
    render(<CountyMap initialGroup="black" initialMeasure="services" />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map(t => t.textContent)).toEqual(["Map", "Ranked list", "Table"]);
    await userEvent.click(screen.getByRole("tab", { name: "Table" }));
    const table = screen.getByRole("table");
    const body = within(table).getAllByRole("rowgroup")[1];
    expect(within(body).getAllByRole("row")).toHaveLength(88);
  });

  it("filters and sorts the table", async () => {
    render(<CountyMap initialGroup="white" initialMeasure="population" />);
    await userEvent.click(screen.getByRole("tab", { name: "Table" }));
    await userEvent.type(screen.getByLabelText("Filter counties by name"), "henn");
    const body = within(screen.getByRole("table")).getAllByRole("rowgroup")[1];
    expect(within(body).getAllByRole("row")).toHaveLength(2); // Statewide plus Hennepin
    const header = screen.getByRole("columnheader", { name: /Share of county population/ });
    await userEvent.click(within(header).getByRole("button"));
    expect(header.getAttribute("aria-sort")).toBe("descending");
  });

  it("shows one county per focusable map shape, a legend with a too-few key, and the required note", () => {
    const { container } = render(<CountyMap initialGroup="hispanic" initialMeasure="comparison" />);
    expect(container.querySelectorAll("path[data-fips]")).toHaveLength(87);
    expect(container.querySelectorAll('path[data-fips][tabindex="0"]')).toHaveLength(1);
    expect(screen.getByText("Too few people to show or compare")).toBeTruthy();
    expect(
      screen.getByText(
        "County is the county responsible for paying for services, which may not be where a person lives. Figures describe groups and conditions, not any one person. Counts under 6 are not shown by the Department of Human Services.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Sources and dates")).toBeTruthy();
  });

  it("selects a county from the keyboard and shows its details", async () => {
    const { container } = render(<CountyMap initialGroup="black" initialMeasure="services" />);
    const first = container.querySelector('path[data-fips][tabindex="0"]') as SVGPathElement;
    first.focus();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    const details = screen.getByRole("complementary", { name: "Details for the selected place" });
    expect(within(details).getByRole("heading").textContent).toBe("Anoka");
  });

  it("locks to a fixed group and hides the group picker", () => {
    render(<CountyMap fixedGroup="american-indian" initialMeasure="population" compact />);
    expect(screen.queryByLabelText("Group")).toBeNull();
    expect(screen.getAllByText("American Indian or Alaska Native").length).toBeGreaterThan(0);
  });

  it("never uses banned words or acronyms in visible text", () => {
    const { container } = render(<CountyMap initialGroup="black" initialMeasure="comparison" />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\bAI\b|tutor/i);
    expect(text).not.toMatch(/\b(HCBS|LTSS|DHS|DSD|COFR|FIPS|SDC|ACS)\b/);
  });
});
