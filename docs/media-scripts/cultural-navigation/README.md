# Cultural Navigation: media scripts and casting

Scripts for the Cultural Navigation pathway. The first course is What a Cultural Navigator Does (`cn-what-a-navigator-does`), the Foundation course proposed in the November 2026 cultural navigators research brief. Nothing here is recorded yet.

## What is here

- `<course>.podcast.md` and `<course>.podcast.json`: a two-voice audio discussion of about three minutes. The JSON follows `public/learning/course-podcasts/<id>/episode.json`, without the audio, caption and transcript fields that recording adds. Its `status` is `script`. Until it is recorded, the course page shows the conversation as text (`lib/content/courses/authored/gap-completion/podcast-conversations.json`).
- `<course>.video.md`: a short scenario video for the recurring cast.

## Voices

The podcast uses one female voice and one male voice: `host1` (Host, female) and `geffen` (Co-host, male), the approved podcast pair. The hosts are not named on air. In the video, women in the cast (C2, C3, C5, C8) use the female voice and men (C1, C4, C6, C7) the male voice.

## Who appears

Each lesson opens its practice case with a photograph of the people in it, made from the approved cast portraits (C1 to C8) without changing them.

| Course | Cover | Lesson 1 | Lesson 2 | Lesson 3 | Lesson 4 |
| --- | --- | --- | --- | --- | --- |
| cn-what-a-navigator-does | C1, C8, C5 | C5 | C7, C5 | C8, C1 | C6, C2 |

Roles: C1 navigator, C2 program manager, C3 narrator, C5 case manager, C6 supervisor, C7 newer colleague, C8 assessor. The navigator is C1, the figure who plays the community partner elsewhere, because a navigator usually works from a community organization. The assessor is C8, so authority is spread across the cast. People served are described but not shown, so no cast member is placed in a particular community. The program owner may recast any role.

## Recording the podcast

The Culture and Well-Being recorder also records this episode, with the same voices and steps (see `docs/media-scripts/culture-wellbeing/README.md`):

```
npm run record:culture-wellbeing-podcasts -- --course cn-what-a-navigator-does
```
