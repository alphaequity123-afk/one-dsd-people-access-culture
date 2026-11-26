# Cultural Navigation: media scripts and casting

Scripts for the seven-course Cultural Navigation pathway proposed in the November 2026 cultural navigators research brief. Nothing here is recorded yet.

| Course | Level | Audience |
| --- | --- | --- |
| What a Cultural Navigator Does (`cn-what-a-navigator-does`) | Foundation | All staff |
| Working Alongside a Cultural Navigator (`cn-working-alongside-a-navigator`) | Intermediate | Assessors, case managers, county and tribal partners |
| Navigating Disability Services with a Family (`cn-navigating-disability-services-with-a-family`) | Intermediate | Navigators and peer supporters |
| Culture in Informed Choice (`cn-culture-in-informed-choice`) | Intermediate | Assessors and case managers |
| Building a Cultural Navigator Role (`cn-building-a-navigator-role`) | Advanced | Supervisors, managers, HR |
| Navigators and System Change (`cn-navigators-and-system-change`) | Advanced | Leaders and policy staff |
| Sustaining the Navigator (`cn-sustaining-the-navigator`) | Micro | Navigators and supervisors |

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
| cn-working-alongside-a-navigator | C1, C5, C8 | C5, C1 | C8, C1 | C6, C1 | C7, C2 |
| cn-navigating-disability-services-with-a-family | C1, C4, C5 | C1 | C4, C1 | C5, C1 | C1, C5, C4 |
| cn-culture-in-informed-choice | C8, C5, C6 | C8 | C5, C7 | C5, C1 | C6, C8 |
| cn-building-a-navigator-role | C2, C6, C1 | C2 | C2, C6 | C6, C5 | C6, C1 |
| cn-navigators-and-system-change | C2, C1, C6 | C2, C1 | C2, C7 | C6, C2 | C2, C1, C8 |
| cn-sustaining-the-navigator | C1, C6, C4 | C1 | C6, C1 | none | none |

Roles: C1 navigator, C2 program manager, C3 narrator, C4 peer supporter, C5 case manager, C6 supervisor, C7 newer colleague, C8 assessor. The navigator is C1, the figure who plays the community partner elsewhere, because a navigator usually works from a community organization. The assessor is C8, so authority is spread across the cast. People served are described but not shown, so no cast member is placed in a particular community. The program owner may recast any role.

## Recording the podcast

The Culture and Well-Being recorder also records these episodes, with the same voices and steps (see `docs/media-scripts/culture-wellbeing/README.md`). Record one course at a time with `--course`, or all of them with no option:

```
npm run record:culture-wellbeing-podcasts -- --course cn-what-a-navigator-does
```
