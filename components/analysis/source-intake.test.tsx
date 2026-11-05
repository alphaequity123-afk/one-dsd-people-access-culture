// @vitest-environment jsdom
import React, { useState } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYSIS_LIMITS, analysisSourceSchema, type AnalysisSource } from "@/lib/analysis/contract";
import { INTAKE_HELP, SourceIntake } from "./source-intake";

const BANNED = [/\bAI\b/, /tutor/i, /recommend/i];

function Harness({ initial = [] as AnalysisSource[], onChange = (): void => undefined, disabled = false }: { initial?: AnalysisSource[]; onChange?: (sources: AnalysisSource[]) => void; disabled?: boolean }) {
  const [sources, setSources] = useState<AnalysisSource[]>(initial);
  return <SourceIntake sources={sources} disabled={disabled} onChange={next => { setSources(next); onChange(next); }} />;
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); });

describe("SourceIntake", () => {
  it("renders both buttons, the help text and no banned words", () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole("button", { name: "Attach documents" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Paste a document" })).toBeTruthy();
    expect(screen.getByText(INTAKE_HELP)).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
    const input = container.querySelector("input[type=file]") as HTMLInputElement;
    expect(input.accept).toBe(".pdf,.docx,.pptx,.txt,.csv,.tsv,.xlsx");
    expect(input.multiple).toBe(true);
    for (const pattern of BANNED) expect(container.innerHTML).not.toMatch(pattern);
    expect(container.innerHTML).toContain("m8 12 7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3a2 2 0 0 1 3 3L5 17");
  });

  it("adds a pasted source, edits its text and title, then removes it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Paste a document" }));
    const first = onChange.mock.calls[0][0] as AnalysisSource[];
    expect(first).toHaveLength(1);
    expect(first[0].id).toMatch(/^paste-/);
    expect(first[0].title).toBe("");
    expect(screen.getByText("Source 1")).toBeTruthy();
    expect(screen.getByText("0 of 50,000 characters.")).toBeTruthy();

    await user.type(screen.getByLabelText("Title"), "Policy draft");
    await user.type(screen.getByLabelText("Text"), "Services are described here.");
    const latest = onChange.mock.calls.at(-1)![0] as AnalysisSource[];
    expect(latest[0].title).toBe("Policy draft");
    expect(latest[0].text).toBe("Services are described here.");
    expect(analysisSourceSchema.safeParse(latest[0]).success).toBe(true);
    expect(screen.getByText("28 of 50,000 characters.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove Policy draft" })).toBeTruthy();
    for (const pattern of BANNED) expect(container.innerHTML).not.toMatch(pattern);

    await user.click(screen.getByRole("button", { name: "Remove Policy draft" }));
    expect((onChange.mock.calls.at(-1)![0] as AnalysisSource[])).toHaveLength(0);
    expect(screen.queryByLabelText("Text")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Removed Policy draft");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("flags text over the character limit beside the textarea", () => {
    const long = "x".repeat(ANALYSIS_LIMITS.sourceCharacters + 5);
    render(<Harness initial={[{ id: "paste-1", title: "Long", text: long }]} />);
    const textarea = screen.getByLabelText("Text");
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText(/shorten this text by 5\./)).toBeTruthy();
  });

  it("rejects an unsupported file before any request", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<Harness />);
    const input = container.querySelector("input[type=file]") as HTMLInputElement;
    await user.upload(input, new File(["x"], "notes.exe", { type: "application/octet-stream" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("notes.exe"));
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Text")).toBeNull();
  });

  it("uploads a supported file, adds the returned source and shows its note", async () => {
    const user = userEvent.setup();
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ source: { id: "upload-123e4567-e89b-12d3-a456-426614174000", title: "notes.txt", text: "Line one" }, note: "Text imported. Review it before analysis." }),
    });
    const onChange = vi.fn();
    const { container } = render(<Harness onChange={onChange} />);
    const input = container.querySelector("input[type=file]") as HTMLInputElement;
    await user.upload(input, new File(["Line one"], "notes.txt", { type: "text/plain" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("1 document added"));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe("/api/analyze/upload");
    const added = onChange.mock.calls.at(-1)![0] as AnalysisSource[];
    expect(added[0]).toMatchObject({ id: "upload-123e4567-e89b-12d3-a456-426614174000", title: "notes.txt", text: "Line one", note: "Text imported. Review it before analysis." });
    expect(screen.getByText("Text imported. Review it before analysis.")).toBeTruthy();
    expect((screen.getByLabelText("Text") as HTMLTextAreaElement).value).toBe("Line one");
    expect(screen.getByRole("alert").textContent).toBe("");
  });

  it("shows the server message when an upload is refused", async () => {
    const user = userEvent.setup();
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, json: async () => ({ error: "No readable text was found." }) });
    const { container } = render(<Harness />);
    await user.upload(container.querySelector("input[type=file]") as HTMLInputElement, new File(["%PDF-"], "scan.pdf", { type: "application/pdf" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("No readable text was found."));
    expect(screen.queryByLabelText("Text")).toBeNull();
  });

  it("disables every control when disabled", () => {
    render(<Harness disabled initial={[{ id: "paste-1", title: "One", text: "Some text" }]} />);
    expect((screen.getByRole("button", { name: "Attach documents" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Paste a document" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Remove One" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Text") as HTMLTextAreaElement).disabled).toBe(true);
  });
});
