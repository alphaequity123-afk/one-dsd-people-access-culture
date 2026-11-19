# Hosted approved Qwen voice

Status on 2026-11-12: card-free CPU service deployed and verified to generate the approved voice (superseded by the GPU setup below). Unauthorized access returned 401; authenticated health verified both reference hashes; two streamed requests completed with valid WAV packets. The generated sample transcribed correctly through the live site's transcription service. Railway integration and browser acceptance must also pass before describing the full feature as active. On 2026-11-15 the owner approved paid GPU time within a monthly budget under $30.

On 2026-11-15 the owner chose the approved GEFen voice for Ask read-aloud, served by `geffen_public_app.py` with the locked `approved-geffen-read-aloud-v1` profile. The earlier Host 1 setup in `modal_app.py` (the opening speaker in **The Water We Swim In**, locked `permanent-podcast-voices-audio18-balanced-v1` profile) stays on CPU and is not the Ask voice. Both use the model `Qwen/Qwen3-TTS-12Hz-0.6B-Base` at revision `5d83992436eae1d760afd27aff78a71d676296fc`. It uses the approved identity embedding with the approved delivery reference, matching the locally verified sample. GEFen uses its single approved identity reference for both identity and delivery, and each rendered clip must match it before it is sent.

## Hosting

Status on 2026-11-15: the owner approved paid GPU time on Modal, a 300 second idle window (`scaledown_window=300`) and a monthly budget under $30. The 2026-11-12 card-free CPU setup is replaced. Before deploying, set that budget in the Modal dashboard; do not raise it without the owner's approval.

The Ask app, `geffen_public_app.py`, runs the pinned Qwen model on one GPU in bfloat16 (float16 on cards without bfloat16), with the fallback list `["L4", "A10", "T4", "L40S"]`: cheapest first, and the wider list waits less when Modal is short of one card type. It scales to zero after 300 seconds without requests, keep one container handling one request at a time, and request two CPU cores and 8 GiB RAM. Idle time inside the window is billed. A cold start still has to wait for a free GPU and load the model.

On 2026-11-13 Modal support confirmed that the 2026-11-12 cold-start stalls came from Modal's GPU capacity, not the workspace quota. When a request has not started responding within 150 seconds, Modal returns HTTP 303 to the same endpoint with one opaque result parameter. The server follows up to three of these with GET, keeping the proxy credentials in headers and refusing any other host, path or parameter (`postToModal` in `lib/intelligence/clone/hosted-voice.ts`). Ask read-aloud and the overview voices share it.

List prices on 2026-11-15, before credits: L4 $0.000222, A10 $0.000306, T4 $0.000164 and L40S $0.000542 per second. Each wake from zero on an L4 bills about $0.07 of idle time with the 300 second window. Starter includes $30 of credits a month. See https://modal.com/pricing and https://modal.com/docs/guide/budgets.

`modal_app.py` (Host 1) and `geffen_public_app.py` (GEFen) both deploy as the Modal app `one-dsd-approved-voice`, so whichever is deployed last serves `PAC_HOSTED_VOICE_URL`. Deploy only `geffen_public_app.py` for Ask. The authenticated `/health` response should report `"voice": "geffen"`.

## Deployment

1. Authenticate the approved Modal account and confirm the monthly budget above is set. Any account terms or payment entry must be handled through the appropriate user approval flow.
2. Install `modal==1.6.4` in an isolated deployment environment.
3. Stage the approved GEFen reference with `python cloud/voice/prepare_geffen_bundle.py <absolute-path-to-approved-profile.lock.json>`. This verifies the hash. The bundle folders are deliberately excluded from Git. This step does not upload files.
4. Deploy with `modal deploy cloud/voice/geffen_public_app.py`. This uploads the reference into the private image and downloads the pinned model during image build. The service has no dependency on any local file after deployment.
5. Use the dedicated Modal proxy token for this voice deployment. Do not reuse the Railway local-worker credential or place any credential in source code, browser storage, logs, or client bundles.
6. Verify that the authenticated `/health` endpoint reports the GEFen voice, and test a streamed `/speech` response. Verify that unauthenticated requests are denied. Measure one cold and one warm first-audio time.
7. Set Railway server environment variables `PAC_HOSTED_VOICE_URL` (the exact HTTPS `.modal.run` URL ending in `/speech`), `PAC_HOSTED_VOICE_KEY`, and `PAC_HOSTED_VOICE_SECRET`. Store values through secure tool input, without printing them.
8. Deploy the application integration. `GET /api/ask/voice` reports availability from complete hosted configuration without waking the GPU. A provider failure returns a readable error; it never changes voice or falls back to the user's computer.
9. Rollback: redeploy the previous app version in Modal, or point `PAC_HOSTED_VOICE_URL` back at a known-good endpoint.

## Data handling

Only the approved GEFen reference and its locked profile are packaged for Ask; no Host 1 or Host 2 references are needed. The service receives the text being read aloud, renders it in memory, and streams WAV packets. Application code does not save request text or generated audio. Modal's own service terms and retention still apply. The provider endpoint uses Modal proxy authentication; credentials remain on Railway. Existing origin checks, pause controls and per-request limits continue to apply on the site.

## Acceptance checks

- Approved reference hashes pass during model loading.
- Unauthenticated provider access returns an authorization error.
- Cold and warm requests generate valid WAV chunks and a final completion packet.
- Canceling playback disconnects the stream; no new segments are generated after the current generation segment finishes.
- The live Ask page handles spoken input, obtains an answer, plays the approved voice, and obeys Stop and Mute. On GPU, warm requests reached first audio in 2.4–2.8 seconds on 2026-11-12. Cold starts depend on GPU capacity (34.55 seconds on L40S, 107.45 seconds on A10 that day). The earlier CPU setup took 12.34–31.72 seconds to first audio after a 17.28 second model start.
- Concurrent requests do not mix answers or audio between visitors.
- With the local worker stopped, voice continues to work; after idle shutdown, a new request starts the cloud worker automatically.
- A cold request that waits past 150 seconds is followed through Modal's 303 result redirect and still plays.
- Confirm the monthly budget under $30 in the Modal dashboard.

Local checks: `python -m unittest discover -s cloud/voice -p 'test_*.py'`, the hosted-voice and overview-voice Vitest tests, TypeScript, lint, and importing `geffen_public_app.py` without deploying. Full live browser acceptance is tracked separately from provider verification.
