# Hosted approved Qwen voice

Status on 2026-11-12: card-free CPU service deployed and verified to generate the approved voice. Unauthorized access returned 401; authenticated health verified both reference hashes; two streamed requests completed with valid WAV packets. The generated sample transcribed correctly through the live site's transcription service. Railway integration and browser acceptance must also pass before describing the full feature as active. The owner has not authorized additional charges.

The selected voice is Host 1, the opening speaker in **The Water We Swim In**. Use the locked `permanent-podcast-voices-audio18-balanced-v1` profile. The model is `Qwen/Qwen3-TTS-12Hz-0.6B-Base` at revision `5d83992436eae1d760afd27aff78a71d676296fc`. It uses the approved identity embedding with the approved delivery reference, matching the locally verified sample.

## Hosting

Modal runs Qwen independently of the user's computer. Its GPU service requires a payment method, so this card-free configuration uses the identical pinned Qwen model and approved hybrid voice prompt on CPU (float32). The app scales to zero after 15 seconds without requests and allows one container handling one request at a time; concurrent visitors queue. The container requests two CPU cores and 8 GiB RAM. This conserves the small free allowance, but introduces a cold start on the next request. Measure cold and warm latency before promising response times.

The deployed account must remain on Starter without a payment method. On 2026-11-12 its dashboard confirmed **$1 included compute per month and a provider-enforced $1 usage limit**; adding a payment method is required to raise that limit and unlock the advertised $30 credits. With no payment method and usage capped at the included credits, out-of-pocket spending is zero. Do not add a payment method or raise the cap without explicit owner authorization. If the account is later changed, enforce a custom **$0 net spend limit**, separately from its pre-credit usage budget, before continuing. Keep proxy authentication enabled. Exhausting the free allowance must pause speech rather than charge the owner or substitute another voice. This is a limited free service, not unlimited capacity.

The resource estimate on 2026-11-12 is $0.158256 per running container-hour for two CPU cores and 8 GiB memory before credits; billing also depends on actual allocation, storage, egress, build usage, and credits. See https://modal.com/pricing and https://modal.com/docs/guide/budgets.

## Deployment

1. Authenticate the approved Modal account and verify its card-free $1 credit / $1 hard usage cap (or an explicitly enforced $0 net spend limit). Any account terms or payment entry must be handled through the appropriate user approval flow. Do not activate paid plans or overages.
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
