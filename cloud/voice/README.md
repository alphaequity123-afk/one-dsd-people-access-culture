# Hosted approved Qwen voice

Status: implementation prepared and locally tested; cloud account, billing approval, deployment, and live GPU verification are pending. Do not describe this as active until the acceptance checks below pass.

The selected voice is Host 1, the opening speaker in **The Water We Swim In**. Use the locked `permanent-podcast-voices-audio18-balanced-v1` profile. The model is `Qwen/Qwen3-TTS-12Hz-0.6B-Base` at revision `5d83992436eae1d760afd27aff78a71d676296fc`. It uses the approved identity embedding with the approved delivery reference, matching the locally verified sample.

## Hosting

Modal runs the GPU independently of the user's computer. The app scales to zero after 60 seconds without requests and allows at most two L4 containers, each handling one request at a time. Each container requests two CPU cores and 8 GiB RAM. Idle shutdown saves expense but introduces a cold start on the next request. Measure cold and warm latency before promising response times.

Use a Starter workspace, set the user-approved monthly spend limit before deployment, and keep proxy authentication enabled. The cost estimate on 2026-11-12 is $0.957456 per running container-hour for the configured L4, CPU and memory; billing also depends on applicable storage, egress, build usage, and credits. See https://modal.com/pricing and https://modal.com/docs/guide/budgets.

## Deployment

1. Authenticate the approved Modal account and set its approved spending limit. Any account terms or payment entry must be handled through the appropriate user approval flow.
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
- Canceling playback disconnects the stream; no new segments are generated after the current GPU segment finishes.
- The live Ask page handles spoken input, obtains an answer, plays the approved voice, and obeys Stop and Mute.
- Concurrent requests do not mix answers or audio between visitors.
- With the local worker stopped, voice continues to work; after idle shutdown, a new request starts the cloud worker automatically.
- Confirm the monthly spending limit in the Modal dashboard.

Local checks: `python -m unittest discover -s cloud/voice -p 'test_*.py'`, the hosted voice Vitest tests, TypeScript, lint, and importing `modal_app.py` without deploying. Cloud performance and live end-to-end acceptance remain unverified until provisioned.
