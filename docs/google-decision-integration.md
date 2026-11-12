# Google decision integration

Set `PAC_DECISION_PROVIDER=gemini` and `GEMINI_API_KEY` in private server hosting variables. The existing Ask planner and boundary review use Google Gemini Decision 1 through the Decisions REST API. The response schema, confidence threshold, privacy screening, tool permissions, and request ledger remain in place. No browser receives the credential.

Requests have a five-second timeout and are not retried. Existing answer fallback behavior applies when the service is unavailable. Operational `decision_used` logs identify the provider, stage and trace without storing question or answer text.

Qwen speech and transcription settings are independent and unchanged. Roll back provider selection to `jev` to use the existing Typesafe credential.

Validation: `node node_modules/vitest/vitest.mjs run --config decision-validation.config.mts`.

API contract: https://aistudio.google.com/docs/decisions-api
