# Culture and Well-Being self-directed courses (approved drafts)

These six courses fill the two framework domains that have no outcome area of their own: Culture and Well-Being. The program owner approved the drafts on November 24, 2026. The content follows the self-directed series (F01 to A24): about 22 slides, three practice slides with A, B and C responses and feedback, a rewrite activity, the "Shared culture, real responsibilities" slide, narration and a short scenario video.

| Course | Title | Level | Family |
| --- | --- | --- | --- |
| F25 | Culture: How Everyday Norms Shape the Work | Foundation | Culture and organizational norms |
| I25 | Pace, Pressure and Decision Quality | Intermediate | Culture and organizational norms |
| A25 | Building a Learning Organization | Advanced | Culture and organizational norms |
| F26 | Well-Being at Work: Sustainable Pace and Meaningful Work | Foundation | Well-being at work |
| I26 | Workload, Burnout and Team Practices That Help | Intermediate | Well-being at work |
| A26 | Trauma-Informed Practice for Teams and Leaders | Advanced | Well-being at work |

## What is in this folder

- `F25-…md` to `A26-…md`: each course in full. That covers the header fields, the slide outline, the practice slides with feedback, narration, the video script, the next step and a design note with sources to confirm.
- `catalog-entries.json`: the six courses in the same shape as `lib/content/self-directed-data.json` (number, title, level, curriculum, audience, outcomes, family, summary, body, cover). It also carries a `practice` list with each option's feedback, which the slide decks need for their answer slides.
- `narration/<course>.json`: narration drafts in the shape of `public/learning/audio-discussions/<course>.json`. They hold text only. The opening is a single `host1` turn for now. The `src` and `durationSeconds` fields are added once the approved voices record it.

## Cast and voices

The video scripts use the program's eight-person recurring cast, the same one as `docs/media-scripts/CAST.md` in the other course script pull requests: portraits C1 to C8 from the narrated trainings in the One DHS PAC code (`lib/trainings/schema.ts`, `data/trainings/BRIEF.md`). Nobody has a name. People are described by role and, where a pronoun is needed, "they". The women (C2, C3, C5, C8) use the Host voice (`host1`) and the men (C1, C4, C6, C7) use the Co-host voice (`host2`), the pairing in `scripts/trainings/prepare-recording.mjs`.

| Role in these scripts | Cast member | Voice |
| --- | --- | --- |
| Narrator | C3 | host1 (Host) |
| Supervisor | C6 | host2 (Co-host) |
| Case manager | C5 | host1 (Host) |
| Program manager | C2 | host1 (Host) |
| New colleague | C7 | host2 (Co-host) |
| County partner | C1 | host2 (Co-host) |

C8 and C4 host the audio discussions. In A26, C4 also plays a parent with no lines. A25 has a voice-only director, and A26 a voice-only security officer and staff member. Each course file lists who appears in its video under the video script heading.

Some scenes pair speakers who share a voice, such as the supervisor and the new colleague in I26. The recording should keep them distinct by delivery, or the program owner may recast one of them.

## Not live yet

Nothing in this folder is read by the application, so the live catalog, the course viewer and the downloads are unchanged. The courses are kept out of `self-directed-data.json` on purpose. An entry there shows in the catalog, and it would point to slide images and course data that don't exist yet.

To publish the courses, these steps remain:

1. **Slide decks:** build each `courses/One DSD - <number> - <title>.pptx` with linked answer slides for each practice response, then render `build/<number>/renders/slide-NNN.png` and the per-course data file the viewer loads.
2. **Narration:** record the opening and guidance audio in the approved voices, and move each narration file to `public/learning/audio-discussions/`.
3. **Video:** produce each scenario video with the recurring cast as listed in each course with captions, a transcript and a poster, and publish it to the course media store.
4. **Catalog:** add the entries from `catalog-entries.json` to `lib/content/self-directed-data.json`, without the `practice` field. Then check how `lib/content/self-directed.ts` maps the two new family names to themes, roles and areas.

## Still to confirm

- Course numbers F25, I25, A25, F26, I26 and A26.
- The agency's Employee Assistance Program details for F26 and A26.
- Whether the U.S. 988 line fits the audience for F26 and A26.
- The sources listed in each course's design note.

All people, places and events in these courses are invented examples.
