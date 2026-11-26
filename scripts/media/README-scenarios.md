# Approved scenario video workflow

The 13 navigator and wellbeing scenarios use their scripted character voices and the original C1–C8 portraits. John is C4, the white man in the blue polo; Kelly is C3, the white woman in the white blouse. Portrait and voice-reference SHA-256 identities are recorded in `config/character-voices.json`. Private voice references are never uploaded.

These are illustrated scenario videos with static character portraits, scene descriptions, speaker labels and open captions. They are not lip-synchronized character animation. Important actions and scene changes are spoken by the narrator. Off-camera roles remain off camera.

## Record and render

Use the local Qwen/Whisper Python environment, with its installed models cached locally:

```powershell
python scripts/media/record-approved-local.py --scenarios --references <private-reference-folder>
python scripts/media/render-scenarios.py --portraits <approved-learning-guides-folder>
python scripts/media/verify-scenarios.py
```

Add `--course <id>` to record or render one scenario. Compressed sentence caches allow resuming. The recorder retains the original dialogue and adds spoken versions of scene and action descriptions. Automatic speech and voice checks run before a sentence is retained. Review any `speechDifferences` in the rendered verification reports. Captions map authored words to recognition word timestamps; they retain speaker labels and authored wording. Do not claim human listening or full accessibility conformance from these checks.

Outputs are in `output/scenario-recordings/` and `output/scenario-videos/`. Local frame images and sentence caches are build intermediates and are not committed. Final release manifests and verification receipts are retained under `config/scenario-video-releases/`.

## Publish

Provide the existing Railway service's `PAC_PUBLIC_MEDIA_STORE=bucket` and `PAC_MEDIA_BUCKET_*` values through the environment, without logging secrets. Run:

```powershell
node scripts/media/publish-scenarios.mjs
```

The publisher requires all 13 complete verified packages, checks identities, uploads content-addressed assets and verifies each stored object before publishing its manifest. The existing course-media player discovers published manifests, so publishing media does not require a new UI component. Verify both live sites' course-media registrations, complete asset hashes, captions, transcripts, posters and media byte ranges after publication. Inspect the player, captions and keyboard controls in a browser.

## Future podcast casting

The owner approved four saved pairs: Kelly/John, Brian/LaToya, Susan/Robert and Takoda/Noor. Other combinations of the eight voices are allowed for future courses. Set each podcast script's `voiceAssignments` explicitly. Do not retroactively recast existing podcasts solely for variety. John and Kelly are appropriate for equity content generally and material addressing the dominant community; their shared race is not a reason to override the owner's pairing.
