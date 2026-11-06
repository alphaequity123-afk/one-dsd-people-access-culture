// Errors the Equity Policy Analyzer returns to the person using it. Messages are
// written for that person; nothing private or technical is ever placed in one.

export type PolicyErrorCode =
  | "unavailable"
  | "storage_unavailable"
  | "invalid"
  | "not_found"
  | "conflict"
  | "transition"
  | "too_large"
  | "timeout"
  | "provider_failed"
  | "invalid_response"
  | "source_unreadable"
  | "source_unsupported"
  | "busy";

export const DRAFTING_UNAVAILABLE_MESSAGE = "Drafting is not available in this deployment. You can still write the analysis notes and recommended changes yourself and record decisions.";
export const SOURCE_UNREADABLE_MESSAGE = "The official source could not be read automatically. Open it from the policy page, then attach or paste the text.";

const MESSAGES: Record<PolicyErrorCode, [string, number]> = {
  unavailable: [DRAFTING_UNAVAILABLE_MESSAGE, 503],
  storage_unavailable: ["Private case saving is unavailable. Your open work is unchanged.", 503],
  invalid: ["This request could not be read. Check its fields and try again.", 400],
  not_found: ["This case was not found.", 404],
  conflict: ["This case changed in another window. Reopen the saved version before saving again.", 409],
  transition: ["This step is not available for the case in its current state.", 409],
  too_large: ["This case holds too much material to save. Shorten or remove a source and try again.", 413],
  timeout: ["The drafting service took longer than allowed. Your saved case is unchanged; no automatic retry was made.", 504],
  provider_failed: ["The drafting service could not complete this request. Your saved case is unchanged.", 502],
  invalid_response: ["The draft could not be checked against its questions and sources. Your saved case is unchanged.", 502],
  source_unreadable: [SOURCE_UNREADABLE_MESSAGE, 502],
  source_unsupported: ["The official source is a file that cannot be read here. Download it from the policy page, then attach it to the case.", 415],
  busy: ["Several requests are being prepared. Please try again shortly.", 429],
};

export class PolicyAnalysisError extends Error {
  readonly status: number;
  constructor(public readonly code: PolicyErrorCode, message?: string, status?: number) {
    super(message ?? MESSAGES[code][0]);
    this.status = status ?? MESSAGES[code][1];
    this.name = "PolicyAnalysisError";
  }
}
