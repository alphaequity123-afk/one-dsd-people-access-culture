# Leadership styles: video scripts

One script for each of the 16 style lessons in the Leadership Styles pathway (`/learn/leadership-styles/<slug>`). The earlier lesson films were retired, so the style pages now have no video. Each script is about 3 minutes and is written for the program's own cast.

- **Source:** every script is built from its lesson in `lib/content/leadership-styles-lessons.ts` and the pathway's common scenario in `lib/content/leadership-styles-pathway.ts`. The leader's "stronger" and "harmful" lines restate the lesson's own examples, and the scripts add no new research or claims.
- **Cast:** speakers are identified by role and played by the recurring cast; `docs/media-scripts/CAST.md` lists which cast member and voice takes each role. In the common scenario, the employee who raises the concern is described in the lesson as Black and is played by the case manager in every script (C5 in CAST.md); the program owner should confirm that casting.
- **Status:** scripts only. Nothing here is recorded or published, and nothing on the site changes when this is merged.
- **Publishing:** record with the approved voices, add captions (VTT) and a transcript, then publish through the course-media volume (`lib/content/course-media.ts`) for the page path in each script; the style page's `CourseMediaSlot` shows it. The seven styles that had films (authoritarian, participative, servant, charismatic, transformational, transformative, laissez-faire) can also use the older `leadership-video-v1` manifest (`components/leadership-style-video.tsx`).
