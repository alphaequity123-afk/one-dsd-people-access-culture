/** The owner's program-wide rule: everything here is voluntary and no training credits are offered. */
export const TRAINING_CREDIT_NOTICE =
  "Everything in this program is voluntary, and it does not offer training credits. The one exception is the Equity Analysis Toolkit, which is required.";

/** Shared reasoning context; staff receive the concise notice when they ask about credit. */
export function trainingCreditContext(): string {
  return [
    TRAINING_CREDIT_NOTICE,
    "Never describe any course, path or activity in this program as earning, counting toward or being eligible for training credit.",
  ].join("\n");
}
