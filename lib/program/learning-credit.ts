/** No program training credits; distinguish optional learning from official work and training duties. */
export const TRAINING_CREDIT_NOTICE =
  "This program does not offer training credits. Optional learning here supports DHS responsibilities under the Equity Policy, including applicable equity-analysis requirements and assigned agency training. Complete required training through the agency's designated process.";

/** Shared reasoning context; staff receive the concise notice when they ask about credit. */
export function trainingCreditContext(): string {
  return [
    TRAINING_CREDIT_NOTICE,
    "Never describe any course, path or activity in this program as earning, counting toward or being eligible for training credit.",
  ].join("\n");
}
