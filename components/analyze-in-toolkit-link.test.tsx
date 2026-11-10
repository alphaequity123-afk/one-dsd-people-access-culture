// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { REFERRAL_ONLY_COURSE_IDS } from "@/lib/program/retired-features";
import { AnalyzeInToolkitLink } from "./analyze-in-toolkit-link";

const BANNED = [/\bAI\b/, /tutor/i];
const answer = (status: number) => vi.fn(async (url: string) => ({ status, url }) as Response);

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("AnalyzeInToolkitLink", () => {
  it("shows the link to the consultant after the server confirms the session", async () => {
    const fetchMock = answer(200);
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<AnalyzeInToolkitLink kind="course" id="div-f02-microaggressions" />);
    expect(container.innerHTML).toBe("");
    const link = await screen.findByRole("link", { name: "Analyze in the Equity Analysis Toolkit" });
    expect(link.getAttribute("href")).toBe("/consultant/toolkit?source=course%3Adiv-f02-microaggressions");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/consultant/session");
    expect(container.querySelector("svg, img")).toBeNull();
    for (const pattern of BANNED) expect(container.textContent).not.toMatch(pattern);
  });

  it("links a self-directed course by its number", async () => {
    vi.stubGlobal("fetch", answer(200));
    render(<AnalyzeInToolkitLink kind="self-directed-course" id="F07" />);
    expect((await screen.findByRole("link")).getAttribute("href")).toBe("/consultant/toolkit?source=self-directed-course%3AF07");
  });

  it("shows nothing to everyone else", async () => {
    for (const status of [204, 401, 403, 500]) {
      const fetchMock = answer(status);
      vi.stubGlobal("fetch", fetchMock);
      const { container, unmount } = render(<AnalyzeInToolkitLink kind="course" id="div-f02-microaggressions" />);
      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      await Promise.resolve();
      expect(container.innerHTML, String(status)).toBe("");
      unmount();
    }
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const { container } = render(<AnalyzeInToolkitLink kind="course" id="div-f02-microaggressions" />);
    await Promise.resolve();
    expect(container.innerHTML).toBe("");
  });

  it("never asks or shows anything for a referral-only course, even for the consultant", async () => {
    const fetchMock = answer(200);
    vi.stubGlobal("fetch", fetchMock);
    for (const id of REFERRAL_ONLY_COURSE_IDS) {
      const { container, unmount } = render(<AnalyzeInToolkitLink kind="course" id={id} />);
      await Promise.resolve();
      expect(container.innerHTML, id).toBe("");
      unmount();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
