/**
 * "Check your assumptions" (owner decision 2026-11-22): common assumptions staff can carry into a conversation, each
 * with what tends to be true instead and what to do. Cards are about assumptions, never about any one community, and
 * nothing the reader chooses is kept.
 */
export type AssumptionCard = { id: string; assumption: string; instead: string; doThis: string };

export const ASSUMPTIONS: AssumptionCard[] = [
  {
    id: "language-by-appearance",
    assumption: "I can tell which language someone prefers by looking at them or hearing their name.",
    instead: "Appearance and names say little about language. Many people from immigrant families speak English as a first language, and many people who look like the majority do not.",
    doThis: "Ask everyone the same question: \"What language would you like to use with us, for talking and for writing?\"",
  },
  {
    id: "family-interpreter",
    assumption: "If a family member offers to interpret, that saves everyone time.",
    instead: "Family members, and especially children, can soften, skip or change hard information, and the person may not feel free to speak openly in front of them.",
    doThis: "Offer a qualified interpreter every time, at no cost. If the person still prefers family, note it and check understanding directly.",
  },
  {
    id: "quiet-means-agreement",
    assumption: "If people don't object in a meeting, they agree.",
    instead: "Silence can mean disagreement, uncertainty, respect for authority, a language barrier, or not feeling safe to speak.",
    doThis: "Offer more than one way to respond: in writing, in small groups, afterward, or through a trusted partner.",
  },
  {
    id: "eye-contact",
    assumption: "Someone who avoids eye contact is hiding something or not paying attention.",
    instead: "Norms around eye contact vary by culture, by disability and by person. For some people, looking away is a sign of respect or a way to listen closely.",
    doThis: "Judge understanding by what people say and ask, not by where they look.",
  },
  {
    id: "one-voice",
    assumption: "A community leader can tell me what the whole community thinks.",
    instead: "No single person or organization speaks for everyone. Communities hold different views by age, gender, faith, disability, generation and politics.",
    doThis: "Seek several perspectives, including people who are rarely invited: young people, elders, people with disabilities and newer arrivals.",
  },
  {
    id: "no-show",
    assumption: "People who don't show up aren't interested.",
    instead: "Timing, transportation, work schedules, childcare, access needs, past experiences with government and how the invitation was shared all shape who can come.",
    doThis: "Ask partners what got in the way, and change the time, place or format before concluding people don't care.",
  },
  {
    id: "same-is-fair",
    assumption: "Treating everyone exactly the same is the fairest approach.",
    instead: "The same process can carry very different costs. A form, a deadline or a phone-only option can work well for some people and shut others out.",
    doThis: "Ask who a step is hardest for, and offer another route to the same result.",
  },
  {
    id: "translation-is-access",
    assumption: "Once a document is translated, it's accessible.",
    instead: "Translated text can still be hard to read, use unfamiliar terms, or reach people who prefer spoken information or don't read the written form of their language.",
    doThis: "Use plain language first, have a community reviewer check the translation, and offer the information by phone, video or in person too.",
  },
  {
    id: "disability-decisions",
    assumption: "A person with an intellectual or developmental disability needs someone else to make decisions for them.",
    instead: "People with disabilities have the right to make their own choices, with the support they want. Many decide with help from people they trust, without giving up control.",
    doThis: "Speak to the person directly, ask how they like to make decisions, and ask who, if anyone, they want involved.",
  },
  {
    id: "deaf-and-reading",
    assumption: "Deaf people can just read lips or written English.",
    instead: "For many Deaf people, ASL is their first language and English is a second one. Lip reading catches only part of speech.",
    doThis: "Ask about communication preferences, and book qualified ASL or tactile interpreting when it is requested.",
  },
  {
    id: "newcomers",
    assumption: "People from immigrant communities are recent arrivals who don't know how things work here.",
    instead: "Many families have been in Minnesota for generations. Others arrived recently. Experience with government systems varies widely within every community.",
    doThis: "Ask about the person's experience instead of guessing, and explain processes without talking down.",
  },
  {
    id: "asking-is-rude",
    assumption: "Asking about someone's culture or faith will offend them.",
    instead: "A respectful, relevant question usually shows care. What tends to offend is guessing, or asking only some people.",
    doThis: "Ask everyone, plainly: \"Is there anything about your culture, faith or family life that's important for us to know?\"",
  },
];

export const ASSUMPTION_REACTIONS = [
  { id: "right", label: "Sounds right" },
  { id: "unsure", label: "Not sure" },
  { id: "off", label: "Sounds off" },
] as const;
