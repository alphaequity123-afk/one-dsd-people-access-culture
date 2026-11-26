/**
 * "Prepare for a conversation" (owner decision 2026-11-22): choose what the conversation is for, the community you are
 * preparing to meet, and the access and language arrangements needed; get a plan to copy or print. Nothing chosen is kept.
 */
export type Purpose = { id: string; label: string; hint: string; before: string[]; questions: string[]; after: string[] };

export const PURPOSES: Purpose[] = [
  {
    id: "decision",
    label: "Invite people into a decision",
    hint: "A listening session or outreach about a service change, a new rule or a plan.",
    before: [
      "Be clear about what people can still influence, and what has already been decided.",
      "Share the background a week ahead, in plain language and the formats people need.",
      "Ask a trusted community partner how and where people would prefer to meet.",
    ],
    questions: [
      "What would make this change work well for you and your family?",
      "What could get in the way of using this service the way it's intended?",
      "Who else should be part of this conversation, and how can they be reached?",
      "What has worked, or not worked, when the agency has asked for your input before?",
      "How would you like to hear back about what happens with your ideas?",
    ],
    after: [
      "Within a few weeks, explain what changed because of people's input, and what didn't and why.",
      "Thank partners and people who took part in the way they prefer, and keep the door open.",
    ],
  },
  {
    id: "services",
    label: "Talk with someone about their services",
    hint: "A one-to-one conversation about support, a plan or a change in services.",
    before: [
      "Review what the person has already shared, so they don't have to repeat their story.",
      "Ask ahead of time how they'd like to communicate and who they'd like with them.",
      "Leave time; a rushed conversation rarely surfaces what matters most.",
    ],
    questions: [
      "What matters most to you right now?",
      "What's going well, and what would you like to be different?",
      "How would you like to make this decision, and who would you like involved?",
      "Is there anything about your culture, faith or family life that's important for us to know?",
      "What questions do you have for me?",
    ],
    after: [
      "Confirm what you heard and what happens next, in the way the person prefers.",
      "Follow through on anything you said you'd do, and let them know when it's done.",
    ],
  },
  {
    id: "event",
    label: "Plan a community event or meeting",
    hint: "A gathering, information session or community meeting.",
    before: [
      "Plan with the community, not for it: invite a partner into the planning early.",
      "Check the date against the Culture Calendar and important observances.",
      "Choose a place that's accessible, familiar and reachable by transit.",
    ],
    questions: [
      "What time and place would make it easiest for people to come?",
      "What would make people feel welcome when they walk in?",
      "Who should welcome people or speak first?",
      "Is food, childcare or transportation needed for people to take part?",
      "How should people be invited so the invitation reaches them?",
    ],
    after: [
      "Share what was discussed, and what happens next, with everyone who came.",
      "Ask partners what to do differently next time.",
    ],
  },
  {
    id: "feedback",
    label: "Ask for feedback on a draft",
    hint: "A notice, form, letter or set of materials, before it goes out.",
    before: [
      "Pick the parts where feedback can still change the draft, and say so.",
      "Offer the draft in the languages and formats reviewers need.",
      "Offer to pay or recognize people for their time, where your area allows it.",
    ],
    questions: [
      "What is this asking you to do, in your own words?",
      "Is anything confusing, missing or worrying?",
      "What words would you use instead?",
      "Would you know who to contact if you had a question?",
      "Who else should read this before it goes out?",
    ],
    after: [
      "Show reviewers the final version and what changed because of them.",
      "Keep their contact, with permission, for the next draft.",
    ],
  },
  {
    id: "relationship",
    label: "Build a relationship with a community organization",
    hint: "A first or early conversation with a partner organization.",
    before: [
      "Learn the organization's history, leadership and current priorities first.",
      "Arrive to listen, not to ask for something.",
      "Be honest about what you can and can't offer.",
    ],
    questions: [
      "What is your organization focused on right now?",
      "How has working with the state gone for you in the past?",
      "What would a good partnership look like from your side?",
      "How do people in your community prefer to get information?",
      "How would you like to stay in touch?",
    ],
    after: [
      "Follow up when you said you would, even if there's no news.",
      "Look for a way to support their work, not only to ask for help with yours.",
    ],
  },
];

export const ACCESS = [
  { id: "interpreter", label: "Spoken-language interpreter", line: "Book a qualified interpreter early, and brief them beforehand. Never ask a family member or child to interpret." },
  { id: "asl", label: "ASL, tactile or DeafBlind interpreting", line: "Book ASL or tactile interpreting with enough lead time; ask whether the person prefers a specific interpreter." },
  { id: "plain", label: "Plain-language materials", line: "Rewrite materials in plain language: short sentences, everyday words, one idea at a time." },
  { id: "translated", label: "Translated written materials", line: "Have materials translated and reviewed by someone from the community before you share them." },
  { id: "formats", label: "Accessible formats", line: "Offer large print, screen-reader-ready files, Braille or easy-read versions, and check they work." },
  { id: "captions", label: "Captions for online meetings", line: "Turn on live captions, and check they're accurate for names and terms." },
  { id: "flexible", label: "A choice of time, place or way to take part", line: "Offer more than one way to take part: in person, by phone, online or in writing afterward." },
  { id: "support", label: "A support person welcome", line: "Let people know they're welcome to bring a support person, advocate or family member." },
];

export const REMINDERS = [
  "A community brief helps you prepare questions. It can't tell you what any one person wants or believes.",
  "Ask about language and communication preferences; don't assume them from someone's background.",
  "Disability access and language access are different needs. Arrange both where needed.",
  "Seek more than one perspective. No single person or organization speaks for a whole community.",
];

export const COMMUNITIES: [string, string][] = [["african-american", "African American in Minnesota"], ["american", "American culture in Minnesota"], ["amharic", "Amharic-speaking Minnesotans"], ["arabic-speaking", "Arabic-speaking Minnesotans"], ["bosnian", "Bosnian in Minnesota"], ["burmese", "Burmese and Myanmar-Origin Minnesotans"], ["chinese", "Chinese in Minnesota"], ["colombian", "Colombians in Minnesota"], ["cuban", "Cubans in Minnesota"], ["deaf-deafblind-hard-of-hearing", "Deaf, DeafBlind and Hard of Hearing Minnesotans"], ["ecuadorian", "Ecuadorians in Minnesota"], ["ethiopian", "Ethiopians in Minnesota"], ["european-american", "European Americans in Minnesota"], ["filipino", "Filipino in Minnesota"], ["french", "French-Heritage and French-Speaking Communities in Minnesota"], ["guatemalan", "Guatemalan Minnesotans"], ["hmong", "Hmong in Minnesota"], ["indian", "Indian in Minnesota"], ["japanese", "Japanese in Minnesota"], ["karen", "Karen in Minnesota"], ["kenyan", "Kenyans in Minnesota"], ["khmer", "Cambodian (Khmer) Minnesotans"], ["korean", "Koreans in Minnesota"], ["lao", "Lao in Minnesota"], ["latino", "Latino communities in Minnesota"], ["lebanese", "Lebanese in Minnesota"], ["liberian", "Liberians in Minnesota"], ["mexican", "Mexican in Minnesota"], ["minnesota", "Minnesotan culture"], ["nigerian", "Nigerians in Minnesota"], ["oromo", "Oromo in Minnesota"], ["puerto-rican", "Puerto Ricans in Minnesota"], ["rural", "Rural and Greater Minnesota"], ["russian-speaking", "Russian-speaking Minnesotans"], ["salvadoran", "Salvadorans in Minnesota"], ["somali", "Somali in Minnesota"], ["thai", "Thai in Minnesota"], ["ukrainian", "Ukrainians in Minnesota"], ["vietnamese", "Vietnamese in Minnesota"]];
