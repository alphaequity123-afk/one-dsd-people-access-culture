# Hosted approved Qwen voice

Status on 2026-11-12: the CPU service is live, but its latency was rejected by the owner. GPU validation is in progress. The owner authorized up to **$50/month in Modal charges after credits**. The newly verified Starter account currently permits only $42.50 total usage, so the saved controls are a **$12.50 net spend limit** and **$42.50 usage limit**, including $30 monthly credits. Do not raise either control beyond the owner's authorization. The production GPU request remained queued and returned Modal's HTTP 303 retry redirect without starting. The previously verified CPU deployment was restored on the original endpoint. The GPU test app was stopped. This branch remains draft; do not claim the fast rollout is complete.

The selected voice is Host 1, the opening speaker in **The Water We Swim In**. Use the locked `permanent-podcast-voices-audio18-balanced-v1` profile. The model is `Qwen/Qwen3-TTS-12Hz-0.6B-Base` at revision `5d83992436eae1d760afd27aff78a71d676296fc`. It uses the approved identity embedding with the approved delivery reference, matching the locally verified sample.

## Hosting

Modal runs the identical pinned Qwen model and approved hybrid voice prompt on an L40S GPU in bfloat16. The app allows one container handling one request at a time and scales to zero after five idle minutes. It requests two CPU cores and 8 GiB RAM. Memory snapshots are disabled: GPU and CPU snapshot configurations did not complete startup reliably during testing. Leading and trailing silence is trimmed with an 80 ms margin; the approved reference and synthesis settings are unchanged. Set `PAC_VOICE_APP_NAME=one-dsd-approved-voice-gpu-test` to benchmark an isolated deployment before replacing production.

Keep the account on Starter and keep proxy authentication enabled. Credits and the saved spending/usage limits provide bounded capacity, not unlimited hosting. Reaching the account limit must pause speech rather than substitute another voice. The service uses no Modal Volume, so no persistent volume storage is added. Payment verification was completed by the owner.

Pricing depends on allocated GPU/CPU/RAM, build usage and egress. See https://modal.com/pricing and https://modal.com/docs/guide/budgets. Warm GPU tests delivered the first audio in 2.4–2.8 seconds. Initial allocation was variable: the A10 baseline took 107 seconds; the L40S baseline took 34.5 seconds. These are measurements, not a latency guarantee. Final production timings must be recorded after promotion.

## Deployment

1. Authenticate the approved Modal account and verify the saved spending/usage controls against the owner's latest authorization. Do not enable a paid subscription or remove the spending cap.
2. Install `modal==1.6.4` in an isolated deployment environment.
3. Stage the two approved reference WAV files with `python cloud/voice/prepare_bundle.py --profile <absolute-path-to-approved-profile.lock.json>`. This verifies both hashes. `.private-voice/` is deliberately excluded from Git. This step does not upload files.
4. Deploy with `modal deploy cloud/voice/modal_app.py`. This uploads the two references into the private image and downloads the pinned model during image build. The service has no dependency on any local file after deployment.
5. Create a dedicated Modal proxy token for this voice deployment. Do not reuse the Railway local-worker credential or place any credential in source code, browser storage, logs, or client bundles.
6. Verify the authenticated `/health` endpoint and a streamed `/speech` response. Verify that unauthenticated requests are denied.
7. Set Railway server environment variables `PAC_HOSTED_VOICE_URL` (the exact HTTPS `.modal.run` URL ending in `/speech`), `PAC_HOSTED_VOICE_KEY`, and `PAC_HOSTED_VOICE_SECRET`. Store values through secure tool input, without printing them.
8. Deploy the application integration. `GET /api/ask/voice` reports availability from complete hosted configuration without repeatedly waking the GPU. A provider failure returns a readable error; it never changes voice or falls back to the user's computer.

## Data handling

Only the selected Host 1 identity and delivery references are packaged; no Host 2 or Geffen references are needed. The service receives the text being read aloud, renders it in memory, and streams WAV packets. Application code does not save request text or generated audio. Modal's own service terms and retention still apply. The provider endpoint uses Modal proxy authentication; credentials remain on Railway. Existing origin checks, pause controls and per-request limits continue to apply on the site.

## Acceptance checks

- Approved reference hashes pass during model loading.
- Unauthenticated provider access returns an authorization error.
- Cold and warm requests generate valid WAV chunks and a final completion packet.
- Canceling playback disconnects the stream; no new segments are generated after the current generation segment finishes.
- The live Ask page handles spoken input, obtains an answer, plays the approved voice, and obeys Stop and Mute. CPU generation is slow: initial cloud tests measured 17.28 seconds to start the model, then 12.34–31.72 seconds to the first audio and 35.84–51.08 seconds to generate an 11-word sample. Longer answers can have gaps between segments.
- Concurrent requests do not mix answers or audio between visitors.
- With the local worker stopped, voice continues to work; after idle shutdown, a new request starts the cloud worker automatically.
- Confirm the monthly spending limit in the Modal dashboard.

Local checks: `python -m unittest discover -s cloud/voice -p 'test_*.py'`, the hosted voice Vitest tests, TypeScript, lint, and importing `modal_app.py` without deploying. Full live browser acceptance is tracked separately from provider verification.
