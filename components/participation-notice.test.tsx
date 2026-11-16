import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { participationContract } from "@/lib/participation/contracts";
import { ParticipationNotice } from "./participation-notice";

describe("participation notice", () => {
  it("renders nothing on staff pages", () => {
    for (const surface of ["start_routing", "support_routing", "ask", "learning", "path_practice", "my_work", "consultation_preview", "consultation_submission", "consultation_tracking"] as const) {
      const view = render(<ParticipationNotice surface={surface} />);
      expect(view.container.innerHTML, surface).toBe("");
      view.unmount();
    }
  });
  it("keeps the panel in the consultant and One DSD Team areas", () => {
    render(<ParticipationNotice surface="consultant_workspace" />);
    expect(screen.getByRole("heading", { name: "How the Consultant Workspace works" })).toBeTruthy();
    expect(screen.getByText("Who can see it")).toBeTruthy();
  });
});

describe("Ask participation contract", () => {
  it("does not claim current full response records", () => {
    const contract = participationContract("ask");
    expect(contract.creates).not.toContain("ask_response_record");
    expect(contract.disclosure.privacy).toMatch(/earlier versions may have retained separate records/i);
    expect(contract.disclosure.retention).toMatch(/external services have their own data-handling terms/i);
  });
});
