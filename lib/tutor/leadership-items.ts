/**
 * Guided-practice items for the leadership-styles pathway. Each option is a
 * possible response or analysis; the correct option is the one that best meets
 * the pathway's eight-point practice rubric. Responses are scored, never people:
 * no item asks about the learner, classifies a style or predicts behavior.
 *
 * Pure and dependency-free (types only), so the browser panel can load it
 * without pulling the full pathway content into the client bundle.
 */
import type { TutorItem } from "./items";

export const LEADERSHIP_CAPSTONE_LESSON_ID = "ls01";
export const LEADERSHIP_SCENARIO_LESSON_ID = "ls02";
export const LEADERSHIP_LESSON_ID = /^ls0[1-9]$/;

type RawItem = { question: string; options: { text: string; feedback: string; correct?: true }[]; reflection: string };
type RawLesson = { id: string; title: string; items: RawItem[] };

const LESSONS: readonly RawLesson[] = [
  {
    id: LEADERSHIP_CAPSTONE_LESSON_ID,
    title: "Leadership capstone: rewrite the response",
    items: [
      {
        question: "A supervisor tells the employee in “Who gets the visible work?”: “We are an inclusive team. Everyone has the same opportunity.” What is the main problem with these two sentences?",
        options: [
          { text: "They state as facts things no one has checked. The assignment history has not been reviewed.", feedback: "Yes. This meets the rubric point “avoided unsupported assumptions.” The employee's concern is exactly that opportunity has not been the same, so the claim needs evidence before it can be made.", correct: true },
          { text: "They are too short to persuade the employee.", feedback: "Length is not the issue. Rubric point 4 asks whether the response avoids unsupported assumptions. A longer version of the same claim would still lack evidence." },
          { text: "They should have been said in a team meeting instead of in private.", feedback: "The setting is not the main problem, and a public discussion could expose the employee. Look at whether the claims are supported by any evidence." },
          { text: "They are fine, because the team does value inclusion.", feedback: "Valuing inclusion is not evidence that opportunities were shared fairly. Rubric point 4 asks you to check what is being assumed without evidence." },
        ],
        reflection: "What would you need to look at before saying opportunities have been the same?",
      },
      {
        question: "The supervisor adds: “If you want more visibility, speak up more.” What burden does this shift to the employee?",
        options: [
          { text: "It makes the employee fix an allocation pattern the supervisor controls, even though speaking up already led to a dismissal.", feedback: "Yes. This connects to rubric point 7, “assigned responsibility.” The supervisor decides assignments, so the supervisor owns the fix, not the person who raised the concern.", correct: true },
          { text: "It asks the employee to improve a skill they clearly lack.", feedback: "This assumes a deficit before anyone has reviewed the process, which rubric point 4 warns against. The employee did speak up and was dismissed." },
          { text: "No burden. It is helpful career advice.", feedback: "Advice can still shift responsibility. Rubric point 7 asks who owns each step. Here the supervisor controls assignments but hands the problem back to the employee." },
          { text: "It shifts the burden to the colleague who interrupted.", feedback: "The statement does not mention the colleague at all. Look at whose behavior the supervisor is asking to change." },
        ],
        reflection: "Who controls the assignments, and who is being asked to change?",
      },
      {
        question: "Which choice correctly separates the conduct concern from the allocation concern?",
        options: [
          { text: "Conduct: the interruption and dismissal in the team discussion. Allocation: how visible assignments are distributed.", feedback: "Yes. This meets rubric point 1, “identified the actual problem.” Each concern needs its own response, and the conduct concern may need an authorized process.", correct: true },
          { text: "Conduct: the employee's tone. Allocation: the employee's workload.", feedback: "This moves both concerns onto the employee. Rubric point 1 asks you to name what actually needs a response: what happened in the discussion and how assignments are made." },
          { text: "There is only one concern: a personality clash between two coworkers.", feedback: "Treating everything as a personality clash is the weaker sign for rubric point 1. It hides both the dismissal and the allocation pattern." },
          { text: "Conduct: the supervisor's intentions. Allocation: the team's values.", feedback: "Intentions and values are not the conduct or the allocation. Rubric point 1 asks for the specific matters that need a response." },
        ],
        reflection: "Why might the two concerns need different processes?",
      },
      {
        question: "What evidence is most needed before deciding whether assignments have been fair?",
        options: [
          { text: "Who received high-visibility assignments over a set period, how they were offered, what criteria were used, and who received preparation or sponsorship.", feedback: "Yes. This meets rubric points 3 and 4: it looks at power and access, and it checks evidence instead of assuming the answer.", correct: true },
          { text: "A team vote on whether people feel the process is fair.", feedback: "A vote lets the people who benefited decide whether the pattern was fair. Rubric point 2 warns against turning a concern into a vote." },
          { text: "The employee's past performance reviews, to see whether they are ready.", feedback: "This starts by examining the employee instead of the process, and it uses private records. Rubric points 4 and 5 point toward the assignment pattern instead." },
          { text: "The supervisor's own memory of being fair.", feedback: "Personal recollection is not a record of who received opportunities. Rubric point 4 asks for evidence that does not depend on anyone's intentions." },
        ],
        reflection: "Which records would show the pattern without exposing anyone's private details?",
      },
      {
        question: "Which response best meets all eight points of the practice rubric?",
        options: [
          { text: "“You've raised two things: what happened in the meeting and how visible work is assigned. I'll follow the response process for the first. For the second, I'll review the assignment history and criteria with the right partners, not assume it was fair. No one will be treated worse for raising this. I'll update you by the 20th.”", feedback: "Yes. It names both problems, keeps the formal concern in the right process, protects against adverse treatment, avoids assumptions, commits to specific action, owns the work and sets a follow-up date.", correct: true },
          { text: "“Thanks for raising this. Our team really does value everyone, and I'll keep it in mind.”", feedback: "This offers reassurance but no action, owner or follow-up. Look at rubric points 6, 7 and 8." },
          { text: "“Let's bring it to the team at our next meeting and see whether others agree.”", feedback: "This turns a possible formal concern into a group discussion and may expose the employee. Look at rubric points 2 and 5." },
          { text: "“I'll handle it. Leave it with me.”", feedback: "This takes responsibility, which is good, but it does not name the problems, the process, what will be reviewed or when the employee will hear back. Look at rubric points 1, 6 and 8." },
        ],
        reflection: "Which rubric point is easiest to forget under time pressure?",
      },
      {
        question: "Which follow-up would best show that things have improved?",
        options: [
          { text: "A set date to report back to the employee, a review after one or two quarters of who receives visible work, and a check that no one was treated worse for raising the concern.", feedback: "Yes. This meets rubric point 8, “planned follow-up.” It sets a date and names the evidence that would show change in both access and safety to speak up.", correct: true },
          { text: "Asking the employee in a month whether they feel better.", feedback: "How people feel matters, but this puts the burden back on the employee and does not check whether assignments changed. Rubric point 8 asks what evidence you will look at." },
          { text: "Holding a team training on inclusion.", feedback: "Training may help, but it does not show whether visible work is now shared fairly. Rubric point 8 asks how you will know things changed." },
          { text: "Counting how many people attended presentations.", feedback: "Attendance does not show who was given the chance to present. Look for a measure of who receives visible work." },
        ],
        reflection: "What would you look at in six months to know the change lasted?",
      },
    ],
  },
  {
    id: LEADERSHIP_SCENARIO_LESSON_ID,
    title: "Leadership style scenarios",
    items: [
      {
        question: "A manager filled a three-month acting lead role by offering it in a hallway conversation. A staff member asks how the choice was made. Which response is strongest?",
        options: [
          { text: "“Thank you for asking. I'll check which human resources process applies to acting roles. From now on, every acting role will be posted with criteria and a deadline everyone can meet. I'll follow up with you by the 15th.”", feedback: "Yes. It protects the person who asked, checks the applicable process, makes future opportunities visible and sets a follow-up date. This combines procedural and transactional strengths.", correct: true },
          { text: "“I needed someone fast and picked the person I knew could do it. That's my call.”", feedback: "This uses directive authority to close the question. “Someone I knew” is the pattern being asked about. Look at rubric points 3 and 4." },
          { text: "“Let's set up a development plan so you're ready next time.”", feedback: "This assumes the staff member was not ready, when the problem was that they never heard about the opening. Look at rubric point 4." },
          { text: "“Let's ask the team whether they think the choice was fair.”", feedback: "A team poll is the wrong tool for a question about selection and may expose the person who asked. Look at rubric points 2 and 5." },
        ],
        reflection: "Who on your team would be least likely to hear about an opportunity offered in a hallway?",
      },
      {
        question: "A staff member tells their supervisor that long video meetings are hard because of a disability and asks about joining by phone or getting materials in writing. What should the supervisor do?",
        options: [
          { text: "Connect the staff member to the accommodation process the same day, keep the disclosure private, and start sending written materials ahead of meetings for everyone.", feedback: "Yes. It routes the request to the right process, protects privacy and removes a barrier for everyone without singling anyone out.", correct: true },
          { text: "Ask the team whether phone-in options should be allowed.", feedback: "This turns one person's accommodation request into a group vote and exposes a private disclosure. Access is not something a team votes on. Look at rubric points 2 and 5." },
          { text: "Ask for details about the diagnosis so the supervisor can decide.", feedback: "Supervisors should not ask for medical details or decide whether a disability is real. The accommodation process handles that. Look at rubric point 5." },
          { text: "Say, “Let me know if it keeps being a problem.”", feedback: "This leaves the barrier in place and puts the follow-up on the staff member. Look at rubric points 6, 7 and 8." },
        ],
        reflection: "Which access features could become the default so fewer people need to ask?",
      },
      {
        question: "Families in listening sessions ask for evening, interpreted sessions and a plain-language notice. Meeting all of it would delay launch by six weeks, and a senior leader prefers to launch on time. Which response is strongest?",
        options: [
          { text: "Tell participants what can change and what cannot, make the changes that are possible, explain the rest, and report back to them by a set date.", feedback: "Yes. This is participative leadership done well: honest about limits, showing how input changed the result, and returning to the people who gave it.", correct: true },
          { text: "“We held the required number of sessions. That box is checked.”", feedback: "This measures completion, not influence. Nothing changed because of what families said. Look at rubric points 3 and 6." },
          { text: "“I know these families well. Trust me, they'll be glad we launched on time.”", feedback: "This replaces what families actually said with one leader's confidence. Look at rubric points 3 and 4." },
          { text: "Delay the launch until every participant agrees with the plan.", feedback: "Waiting for full agreement avoids making a decision and may delay help for everyone. Participation means input can change the result, not that every person must agree." },
        ],
        reflection: "How would you tell participants honestly what their input can and cannot change?",
      },
      {
        question: "Two teams want the same small budget: one to translate a widely used notice, the other to train staff. The disagreement is getting tense. What is the strongest first step?",
        options: [
          { text: "Name who decides and by when, agree on criteria before comparing options, and use the Equity Analysis Toolkit to compare who benefits and who is left out under each.", feedback: "Yes. Agreeing on criteria first turns a contest between teams into a comparison of options. The Equity Analysis Toolkit is an existing agency requirement for this kind of decision.", correct: true },
          { text: "Tell the two team leads to work it out between themselves.", feedback: "This leaves a decision the leader owns to an informal contest, where the team with more influence wins. Look at rubric point 7." },
          { text: "Choose the option the leader feels more strongly about.", feedback: "Enthusiasm is not a criterion. Look at rubric points 3 and 4: who benefits, who is left out, and what evidence shows it." },
          { text: "Split the money evenly so no one is upset.", feedback: "An even split may avoid conflict, but it skips the criteria and may leave both needs underfunded. Look at rubric point 1: what is the actual problem to solve?" },
        ],
        reflection: "Why should the criteria be agreed on before the options are compared?",
      },
      {
        question: "During a reorganization, an African American staff member raises detailed concerns about a new case model. Afterward, a manager calls her “not a team player.” What should a leader do?",
        options: [
          { text: "Address the label directly, make sure it does not affect her assignments or evaluations, and test the model where her concerns are strongest, with a set review date.", feedback: "Yes. This protects against adverse treatment, treats the concerns as information and plans follow-up. It combines ethical and adaptive strengths.", correct: true },
          { text: "Remind everyone that change is hard and the team needs to be on board with the vision.", feedback: "This recasts disagreement as resistance and leaves the label in place. Look at rubric points 2 and 5." },
          { text: "Say that people who cannot support the decision should think about whether this is the right place for them.", feedback: "This punishes disagreement with an implied threat. It is the authoritarian pattern. Look at rubric point 5." },
          { text: "Let it go, because it was only one comment in one conversation.", feedback: "A label like this can shape assignments and evaluations. If it leads to worse treatment, it may become retaliation. Look at rubric points 2 and 5." },
        ],
        reflection: "Who is most likely to be labeled for raising concerns during a change, and why?",
      },
      {
        question: "A manager credited the wrong staff member for an analysis at a leadership briefing. The two staff members are both Southeast Asian American, and the manager has confused their names before. Which repair is strongest?",
        options: [
          { text: "Acknowledge the specific mistake and the pattern privately, correct the credit with everyone who was at the briefing, change a practice so it does not happen again, and do not ask the staff member for reassurance.", feedback: "Yes. A repair names the specific harm, corrects it where it happened and changes practice, without asking the person harmed to do emotional work for the leader.", correct: true },
          { text: "“I'm terrible with names. Everyone knows that about me!”", feedback: "This turns the mistake into a personal quirk and ignores that the confusion is not random and cost someone credit. Look at rubric points 1 and 4." },
          { text: "“It was an honest mistake. Let's not make a big deal of it.”", feedback: "The manager decides how much the mistake matters for the person who was harmed. Look at rubric points 1 and 6." },
          { text: "Apologize at an all-staff meeting about how bad the manager feels, and ask the staff member to say it is okay.", feedback: "This centers the manager's feelings and puts the staff member on the spot in public. Look at rubric point 5." },
        ],
        reflection: "What separates an apology from a repair?",
      },
    ],
  },
];

/** Guided-practice items for one leadership lesson, in the same shape as the curriculum items. */
export function leadershipTutorItems(lessonId: string): TutorItem[] {
  if (!LEADERSHIP_LESSON_ID.test(lessonId)) return [];
  const lesson = LESSONS.find(entry => entry.id === lessonId);
  if (!lesson) return [];
  return lesson.items.flatMap((item, n) => {
    // A fixed rotation per item, so the strongest option is not always first and
    // the server and the browser agree on the order without any randomness.
    const shift = (n * 3 + 1) % item.options.length;
    const options = item.options.map((_, index) => item.options[(index - shift + item.options.length) % item.options.length]);
    const flagged = options.map((option, index) => (option.correct ? index : -1)).filter(index => index >= 0);
    if (flagged.length !== 1 || options.length < 2) return [];
    return [{
      lessonId,
      itemId: String(n + 1).padStart(2, "0"),
      lessonTitle: lesson.title,
      question: item.question,
      options: options.map(({ text, feedback }) => ({ text, feedback })),
      correctIndex: flagged[0],
      reflection: item.reflection,
    }];
  });
}

export function leadershipLessonIds(): string[] {
  return LESSONS.map(lesson => lesson.id);
}

export function leadershipLessonTitle(lessonId: string): string | undefined {
  return LESSONS.find(lesson => lesson.id === lessonId)?.title;
}
