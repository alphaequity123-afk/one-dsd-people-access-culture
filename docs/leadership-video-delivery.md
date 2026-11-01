# Leadership video delivery

Each leadership style is published independently to a **public-only** directory beneath the configured durable volume. A style is available only when an owner has published a manifest referencing a verified video, captions and text transcript. The application must remain usable while any video is unavailable.

These routes provide transport and integrity checks. They do **not** establish that the video is the requested length, that its narration matches the text, that captions are correctly timed, or that its content meets the program's quality requirements. Complete and independently verify those checks before publishing. Never upload private records or secrets here.

## Configuration

The existing public media root must be exactly the `geffen-public` child of the configured Railway volume, and the existing owner upload switch must be enabled. The video route uses the same owner-session and same-origin checks and 2 GiB free-space reserve as the audio publisher. Only one volume publisher should write at a time: the free-space guard is not a cross-process reservation.

This content lives on the durable volume, not in Git or the deployment archive. Include it in volume backups and in any new-host migration plan.

## Publication order

1. Independently verify the final MP4, English WebVTT captions and UTF-8 plain-text transcript for the relevant style, including duration, audio/video playback, caption synchronization and source/content accuracy. Keep the evidence outside the public volume.
2. Authenticate as the owner without printing or persisting credentials. Send same-origin `POST` to `/api/owner/leadership-media/initialize` to create only the fixed public video directories. A missing, linked or incorrectly configured volume fails closed.
3. Calculate SHA-256 for each file. Upload each with `POST /api/owner/leadership-media/<sha256>.<ext>` using its exact bytes. Permitted extensions are `mp4`, `vtt` and `txt`; the MP4 limit is 32 MiB and each text asset is limited to 512 KiB. The server checks the name, hash, basic file signature, UTF-8 text and available space. Assets are immutable: an already-present identical file is accepted; a conflicting file is rejected.
4. Once all three uploads succeed, send a same-origin, owner-authenticated `POST` to `/api/owner/leadership-media/<style>.json`. The body uses **bare hash filenames**, not URLs, for example:

   ```json
   {
     "format": "leadership-video-v1",
     "style": "servant",
     "video": "<64 lowercase hex characters>.mp4",
     "captions": "<64 lowercase hex characters>.vtt",
     "transcript": "<64 lowercase hex characters>.txt"
   }
   ```

   The style must match the manifest filename and use lowercase letters, digits and hyphens. The server rechecks every referenced asset's hash and type before atomically publishing the manifest; extra JSON properties are discarded. A missing or corrupt file prevents publication.
5. Read `/learning/leadership-videos/<style>.json` back and verify its returned URLs, then independently download and check the three public assets. Check the MP4's byte-range behavior and play it with captions. A manifest URL returns 404 until that style is independently published.

Public manifests return the same `format` and `style` and same-origin `/learning/leadership-videos/<hash>.<ext>` paths. The client validates those paths before showing a player. Existing verified styles are unaffected by publishing a different style. Do not claim one style is ready based on a different style's manifest.

The published URLs are public by design. `initialize` and asset/manifest uploads require the configured owner session and same-origin request. A server signature/hash check is a transport safeguard, not proof of full multimedia quality or human review.
