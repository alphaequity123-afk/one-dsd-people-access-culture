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

## Before publishing audio

Recording uses the voice service, which has its own budget and owner credentials. Once recorded, each episode needs its MP3, captions and transcript under `public/learning/course-podcasts/<course>/` and an entry in the course media manifest.
