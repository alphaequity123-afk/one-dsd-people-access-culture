# Self-directed series: narrated discussion scripts

Scripts for the 68 courses in Practice for the Moments That Matter (`lib/content/self-directed-data.json`) that had no narrated discussion. A21, A22, F23 and F24 already have one in `public/learning/audio-discussions/` and are not repeated here.

Each file has the same shape as the published discussions (`public/learning/audio-discussions/A21.json`): an opening two-host conversation of 10 or 11 turns (about 4 to 5 minutes), plus two short guidance clips, an explainer at the course's key concept slide and a check-in near the close.

- **Status:** `script-awaiting-recording`. These files are not read by the app, so nothing changes on the site until audio exists.
- **Voices:** `host1` is cast member C8 in the Host voice and `host2` is C4 in the Co-host voice, from the recurring cast and the approved podcast voice profile (see `docs/media-scripts/CAST.md`).
- **To publish one course:** record the turns and each guidance clip, add `src` and `durationSeconds` to the discussion and to each clip, move the file to `public/learning/audio-discussions/<id>.json`, drop `status` and `voices`, and add the course to `public/learning/audio-discussions/index.json`. Keep each transcript identical to its recording (docs/WRITING-STANDARD.md).
- The scripts describe each practice situation without giving away its answer.
