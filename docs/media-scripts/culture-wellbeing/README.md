# Culture and Well-Being: media scripts and casting

Scripts for the six Culture and Well-Being courses. All six podcasts have been recorded with Kelly and John. Their audio, captions, transcripts and verification receipts are in `public/learning/course-podcasts/`, and the completed-podcast registry activates their course players. Scenario videos remain scripts.

## What is here

- `<course>.podcast.md` and `<course>.podcast.json`: a two-voice audio discussion of about three minutes for each course. The JSON follows `public/learning/course-podcasts/<id>/episode.json`, without the audio, caption and transcript fields that recording adds. Its `status` is `script`.
- `<course>.video.md`: the short scenario video from the approved course drafts in `handoff/culture-wellbeing-courses`, unchanged.

## Voices

All two-voice training and module podcasts use Kelly (C3) and John (C4), as confirmed by Gary on November 26, 2026. The legacy script speaker IDs `host1` and `geffen` map to those local references for these recordings. Each of the eight recurring characters uses their own approved voice in scenario recordings. See `config/character-voices.json` and `docs/media-scripts/CAST.md`.

## Who appears in each course

Every lesson opens its practice case with a photograph of the people in it, made from the approved cast portraits (C1 to C8) without changing them. Each course mixes single portraits, pairs and groups so the same faces don't repeat in the same way.

| Course | Cover | Lesson 1 | Lesson 2 | Lesson 3 | Lesson 4 |
| --- | --- | --- | --- | --- | --- |
| cw-everyday-norms | C6, C5, C7 | C5, C7 | C1, C2 | C6 | C7, C6 |
| cw-sustainable-pace | C5, C8, C7 | C5 | C5, C8 | C5, C6 | C7, C5 |
| cw-pace-pressure-decisions | C2, C6, C1 | C6 | C2 | C5, C4 | C2, C1 |
| cw-workload-burnout | C6, C5, C7 | C6, C5, C8, C7 | C6, C5 | C7, C4 | C6, C2 |
| cw-learning-organization | C8, C2, C1 | C8 | C5, C8 | C3, C6, C5 | C2, C1 |
| cw-trauma-informed-teams | C2, C5, C1 | C2, C1 | C5 | C2, C6 | C2, C8, C4 |

Roles: C1 county partner, C2 program manager, C3 narrator or facilitator, C4 colleague, C5 case manager, C6 supervisor, C7 newer colleague, C8 director or colleague. In cw-learning-organization, C8 plays the director.

## Recording the podcasts

Use `scripts/media/record-approved-local.py --references <private-reference-folder>` with the local Qwen/Whisper Python environment. Add `--check` to verify all eight reference checksums and the podcast casting without recording, or `--course <id>` to record one episode. The recorder uses only Kelly and John for every two-voice episode, verifies speech against the script and checks speaker similarity, and resumes from compressed sentence caches. It writes the MP3, captions, transcripts and voice-verification receipt, then registers the course player. Private voice references stay outside the repository.

The legacy hosted recorder refuses these scripts because it cannot verify the newly approved local voice profile. Generated episodes require review before publication.
