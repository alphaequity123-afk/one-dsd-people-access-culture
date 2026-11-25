# Culture and Well-Being: media scripts and casting

Scripts for the six Culture and Well-Being courses. Nothing here is recorded yet, and the app does not read this folder, so no course shows a broken player.

## What is here

- `<course>.podcast.md` and `<course>.podcast.json`: a two-voice audio discussion of about three minutes for each course. The JSON follows `public/learning/course-podcasts/<id>/episode.json`, without the audio, caption and transcript fields that recording adds. Its `status` is `script`.
- `<course>.video.md`: the short scenario video from the approved course drafts in `handoff/culture-wellbeing-courses`, unchanged.

## Voices

Every podcast uses one female voice and one male voice: `host1` (Host, female) and `geffen` (Co-host, male), the approved podcast pair. The hosts are not named on air. In the videos, women in the cast (C2, C3, C5, C8) use the female voice and men (C1, C4, C6, C7) the male voice.

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

One command records all six episodes, writes their audio, captions and transcripts to `public/learning/course-podcasts/<course>/`, and registers them in `lib/content/courses/completed-podcasts.json`, which puts the player on each course page. Run it on the computer that has the approved voice references, because they are not in Git.

1. **Voice service (once).** The recorder uses the overview voice service, `cloud/voice/overview_app.py`, which has both podcast voices. If it isn't deployed yet, stage the approved references and deploy it with Modal 1.6.4:
   ```
   python cloud/voice/prepare_overview_bundle.py <folder with the approved voice profile locks>
   modal deploy cloud/voice/overview_app.py
   ```
   It runs on two CPU cores and stops 30 seconds after the last request. Recording six short episodes should stay well inside Modal's included $30 monthly credit (an estimate; the Modal dashboard shows the real figure).
2. **Credentials.** Add three lines to `.env.local` in this folder (Git ignores it): `PAC_OVERVIEW_VOICE_URL` (the deployed app's `https://….modal.run` address with `/speech` on the end), `PAC_HOSTED_VOICE_KEY` and `PAC_HOSTED_VOICE_SECRET` (the Modal proxy token the site already uses). The recorder never prints them.
3. **Check, then record.**
   ```
   npm install
   npm run record:culture-wellbeing-podcasts -- --check
   npm run record:culture-wellbeing-podcasts
   ```
   `--check` only confirms the service has both voices. A full run records every line in its approved voice, refuses any clip the service hasn't verified, and caches finished lines in `output/culture-wellbeing-recording/`, so running it again after a stop continues where it left off. `--course <id>` records one course.
4. **Listen, then send.** Play each `episode.mp3`. The recorder prints the Git commands that put the files on a new branch for review. The MP3s are committed as plain files, like the course images.
