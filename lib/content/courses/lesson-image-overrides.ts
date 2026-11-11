// Keep the recovered source unchanged; these editorial replacements remove
// repeated or unsuitable imagery from published lesson pages.
export const lessonImageOverrides: Record<string, { src: string; alt: string; caption?: string }> = {
  "/images/course-61/cover-huddle.jpg": {
    src: "/images/lessons/change-management-intro.webp",
    alt: "Four colleagues review a process timeline together at a table.",
  },
  "/images/course-61/repair-huddle.jpg": {
    src: "/images/lessons/change-management-repair.webp",
    alt: "Three colleagues mark up a one-page change brief together.",
  },
  "/images/course-9/cover-meeting.jpg": {
    src: "/images/lessons/accessibility-leadership-meeting.webp",
    alt: "Colleagues hold an accessible meeting with a wheelchair user and caption display.",
    caption: "Access is visible in who can enter, hear, speak, and participate as an equal colleague.",
  },
  "/images/course-el/cover-lead.jpg": {
    src: "/images/lessons/equity-leadership-systems.webp",
    alt: "Three leaders consider a process map together in an office.",
    caption: "Leadership is the next decision: what will this group change in the process?",
  },
  "/images/course-el/huddle.jpg": {
    src: "/images/lessons/equity-leadership-huddle.webp",
    alt: "A process map and notes are spread across a working table.",
    caption: "Coaching is work, not a stage or a verdict on a person.",
  },
  "/images/course-hw/cover-kitchen.jpg?v=2": {
    src: "/images/covers/catalog/other-P981.webp",
    alt: "A man using a wheelchair chops vegetables at a lowered counter while a support worker stands by and an older woman sits at the table.",
    caption: "Wellness looks like a person doing a real thing with support nearby. Safety is not a locked door.",
  },
  "/images/course-hw/listening.jpg": {
    src: "/images/lessons/health-wellness-listening.webp",
    alt: "A support worker listens as a man with a walker describes what he wants.",
  },
  "/images/course-la/cover-counter.jpg": {
    src: "/images/lessons/language-access-counter.webp",
    alt: "A visitor and staff member use a remote interpretation tablet at a service counter.",
  },
  "/images/course-min/front-desk.jpg": {
    src: "/images/lessons/data-minimization-counter.webp",
    alt: "An accessible reception counter offers standard and large-print forms.",
  },
  "/images/course-rec/huddle.jpg": {
    src: "/images/lessons/the-record-packet.webp",
    alt: "Two colleagues review a case packet and checklist together.",
  },
  "/images/course-so/cover-outreach.jpg": {
    src: "/images/lessons/sourcing-outreach.webp",
    alt: "Community outreach staff speak with an older visitor at a resource table.",
  },
  "/images/course-vs/cover-survey.jpg": {
    src: "/images/lessons/viewpoint-surveys.webp",
    alt: "A tablet, paper survey cards, and a feedback box sit on a table.",
  },
  "/images/course-61/memo-wall.jpg": {
    src: "/images/covers/catalog/other-P629.webp",
    alt: "Four colleagues of different ages and backgrounds read a one-page memo pinned to a corridor notice board.",
  },
  "/images/course-9/hallway-pace.jpg": {
    src: "/images/covers/catalog/other-P634.webp",
    alt: "A supervisor walks at the same pace as a colleague using forearm crutches and a younger colleague in an office hallway.",
  },
  "/images/course-9/table-prepared.jpg": {
    src: "/images/covers/catalog/other-P637.webp",
    alt: "A meeting table set up before a meeting, with one chair moved aside to leave space for a wheelchair.",
  },
  "/images/course-ea/worksheet.jpg": {
    src: "/images/covers/catalog/other-P660.webp",
    alt: "A blank one-page worksheet and a pen on an office desk.",
  },
  "/images/course-ef/benefits-table.jpg": {
    src: "/images/covers/catalog/other-P661.webp",
    alt: "A pay stub, a benefits planning worksheet, glasses and a transit pass on a table.",
  },
  "/images/course-ei/cover-system.jpg": {
    src: "/images/covers/catalog/other-P667.webp",
    alt: "Six colleagues of different ages and backgrounds, one using a wheelchair, work over a process map on a conference table.",
  },
  "/images/course-lg/plan-table.jpg": {
    src: "/images/covers/catalog/other-P695.webp",
    alt: "A profile sheet, an intake form, a pen and a house key on a planning table.",
  },
  "/images/course-bi/cover-table.jpg": {
    src: "/images/course-bi/cover-table.jpg",
    alt: "Three adults plan at a kitchen table: a Black man holding a mug, an East Asian woman at a laptop and a white woman who uses a manual wheelchair writing in a notebook.",
  },
  "/images/course-fn/plan-table.jpg": {
    src: "/images/course-fn/plan-table.jpg",
    alt: "A wooden kitchen table seen from above with a blank calendar pad, one mug of black coffee, a house key, a phone lying face-down, a pen and a few blank cards.",
  },
};
