/**
 * "Find a style to explore" on the Leadership page (owner decision 2026-11-22): a few everyday situations; each answer
 * points to styles worth reading about. It describes approaches, never the person, gives no label or score, and keeps
 * nothing the reader chooses.
 */
export type FinderOption = { text: string; styles: string[] };
export type FinderQuestion = { id: string; prompt: string; options: FinderOption[] };

export const FINDER_QUESTIONS: FinderQuestion[] = [
  {
    id: "deadline",
    prompt: "A deadline moves up by a week. What do you usually do first?",
    options: [
      { text: "Decide the plan myself and hand out assignments.", styles: ["directive", "authoritarian"] },
      { text: "Pull the team together and ask how we can make it work.", styles: ["participative", "shared"] },
      { text: "Check who is already stretched, and protect them.", styles: ["servant", "ethical"] },
      { text: "Trust people to adjust on their own.", styles: ["laissez-faire", "empowering"] },
    ],
  },
  {
    id: "mistake",
    prompt: "Someone on your team makes a mistake that reaches a member of the public. You…",
    options: [
      { text: "Correct it quickly and make sure the procedure is followed next time.", styles: ["procedural", "transactional"] },
      { text: "Talk it through with them and ask what they would do differently.", styles: ["coaching", "adaptive-situational"] },
      { text: "Look at what in the process made the mistake easy to make.", styles: ["transformative", "servant"] },
      { text: "Fix it myself so it doesn't happen again.", styles: ["directive", "authoritarian"] },
    ],
  },
  {
    id: "idea",
    prompt: "A colleague brings you an idea that would change how your team works. You…",
    options: [
      { text: "Help them shape it and give them room to lead it.", styles: ["empowering", "coaching"] },
      { text: "Ask who the change would affect, and bring those people in.", styles: ["inclusive", "participative"] },
      { text: "Connect it to the bigger purpose and rally people behind it.", styles: ["transformational", "charismatic"] },
      { text: "Check it against the rules and the measures before going further.", styles: ["procedural", "transactional"] },
    ],
  },
  {
    id: "meeting",
    prompt: "In your meetings, who usually does most of the talking?",
    options: [
      { text: "I do. People look to me for direction.", styles: ["directive", "charismatic"] },
      { text: "A few confident people. I'd like to hear from more.", styles: ["participative", "inclusive"] },
      { text: "It's spread out. People take turns leading parts.", styles: ["shared", "empowering"] },
      { text: "Whoever is closest to the work being discussed.", styles: ["adaptive-situational", "servant"] },
    ],
  },
  {
    id: "unfair",
    prompt: "You notice a result that looks unfair to one group of people you serve. You…",
    options: [
      { text: "Name it openly and look for where it starts in the process.", styles: ["transformative", "ethical"] },
      { text: "Ask the people affected what they're experiencing.", styles: ["inclusive", "servant"] },
      { text: "Make sure everyone follows the procedure consistently.", styles: ["procedural", "transactional"] },
      { text: "Wait to see whether it continues before acting.", styles: ["laissez-faire"] },
    ],
  },
  {
    id: "growth",
    prompt: "When someone on your team wants to grow, what do you reach for?",
    options: [
      { text: "Regular conversations about their goals.", styles: ["coaching", "adaptive-situational"] },
      { text: "A real responsibility they can own.", styles: ["empowering", "shared"] },
      { text: "A clear vision of what they could become.", styles: ["transformational", "charismatic"] },
      { text: "Clear targets, with recognition when they meet them.", styles: ["transactional", "directive"] },
    ],
  },
];

/** Styles that most directly build fair service; one is always offered as a next step. */
export const STRETCH_STYLES = ["inclusive", "transformative", "coaching", "servant", "ethical", "empowering"];
