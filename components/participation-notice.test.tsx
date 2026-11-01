import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { participationContract } from "@/lib/participation/contracts";
import { ParticipationNotice } from "./participation-notice";

describe("Ask participation disclosure", () => {
  it("tells users that outside services may receive their conversation and does not claim current full response records", () => {
    render(<ParticipationNotice surface="ask" />);
    expect(screen.getByText(/question and recent conversation may be sent to outside services/i)).toBeTruthy();
    const contract = participationContract("ask");
    expect(contract.creates).not.toContain("ask_response_record");
    expect(contract.disclosure.privacy).toMatch(/earlier versions may have retained separate records/i);
    expect(contract.disclosure.retention).toMatch(/external services have their own data-handling terms/i);
  });
});
