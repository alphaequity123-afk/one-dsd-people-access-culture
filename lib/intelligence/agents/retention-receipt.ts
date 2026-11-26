/**
 * The scheduled retention receipt. pac.dsd_verify_retention_responses (pg_cron, every five minutes)
 * marks a daily retention dispatch completed only when every flag below is true, so each cleanup
 * step that runCycle records must be reported here by the exact step name it uses.
 */
export const RETENTION_RECEIPT_STEPS = {
  completed: "apply consultation retention",
  security_cleanup_completed: "purge expired security records",
  named_session_cleanup_completed: "purge expired named-session records",
  ask_response_cleanup_completed: "purge expired ASK response records",
} as const;

export type RetentionReceipt = { [K in keyof typeof RETENTION_RECEIPT_STEPS]: boolean };

export function retentionReceipt(steps: ReadonlyArray<{ name: string; outcome: string }>): RetentionReceipt {
  const done = (name: string) => steps.some(step => step.name === name && step.outcome === "done");
  return {
    completed: done(RETENTION_RECEIPT_STEPS.completed),
    security_cleanup_completed: done(RETENTION_RECEIPT_STEPS.security_cleanup_completed),
    named_session_cleanup_completed: done(RETENTION_RECEIPT_STEPS.named_session_cleanup_completed),
    ask_response_cleanup_completed: done(RETENTION_RECEIPT_STEPS.ask_response_cleanup_completed),
  };
}

export function retentionReceiptComplete(receipt: RetentionReceipt): boolean {
  return Object.values(receipt).every(Boolean);
}
