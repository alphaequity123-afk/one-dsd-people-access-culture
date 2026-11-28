import type { RiseCourse } from "./types";

const P = "/images/courses/equity-vs-equality/";
const img = (name: string, alt: string) => ({ src: `${P}${name}.webp`, alt });
/** Recurring cast (docs/media-scripts/CAST.md): people are named by role, never by a character name. */
const cast = (n: number, role: string, alt: string) => ({ src: `/images/cast/C${n}.webp`, alt, role });

/** Equity vs. equality, rebuilt as the first Rise-style course (owner, 2026-11-27). Lesson ids match the earlier course. */
export const equityVsEquality: RiseCourse = {
  id: "dc-s3-equity-vs-equality",
  title: "Equity vs. equality",
  eyebrow: "Start here · For all staff",
  summary: "Two questions that make everyday work fairer: is the rule the same for everyone, and can everyone actually use it?",
  description: [
    "Fairness in public service often comes down to two questions. Equality asks whether a rule or opportunity is the same for everyone. Equity asks whether everyone can actually use it. You need both.",
    "In this course you’ll follow a service team that sends everyone the same online form. You’ll look closely at who can use it, separate what the work requires from how people are asked to do it, hear from the people affected, weigh possible changes, read the results honestly and finish with a clear question and next step for your own work.",
  ],
  cover: img("cover", "A staff member explains a form to a man who uses a wheelchair at an accessible service counter."),
  outcomes: [
    "Explain equality and equity in your own words, and why you need both.",
    "Tell the difference between a requirement and the way people are asked to meet it.",
    "Ask about access without guessing what someone needs.",
    "Compare possible changes against the same shared purpose.",
    "Read a difference in numbers as a question to explore, not an answer.",
    "Bring one clear equity question and next step to your own work.",
  ],
  sections: [
    {
      title: "Understanding the idea",
      lessons: [
        {
          id: "dc-s3-equity-vs-equality-1",
          title: "Equality and equity are partners, not opposites",
          minutes: 9,
          blocks: [
            { kind: "text", paragraphs: [
              "Picture a service team that sends every person the same online form, with the same link and the same deadline. It looks fair. Everyone got exactly the same thing.",
              "But that link can’t tell you whether people could read the instructions, use the form with a screen reader or find the information it asks for. Asking those questions doesn’t mean throwing out the rules. It means looking at what the work really requires, and where something gets in the way that doesn’t need to.",
            ] },
            { kind: "image", image: img("l1-a", "Two coworkers compare the same form, one on paper and one on a tablet.") },
            { kind: "text", heading: "Two words, two questions", paragraphs: [
              "In this course, equality means holding everyone to the same standard or offering everyone the same opportunity. Equity adds attention to the barriers and circumstances that shape whether people can actually reach it. The DHS Equity Policy describes equity as ongoing action, not a one-time statement.",
            ] },
            { kind: "twoColumn", columns: [
              { heading: "Equality asks", text: "Is the rule or opportunity the same for everyone? Are we explaining it the same accurate way to each person?" },
              { heading: "Equity asks", text: "Can everyone actually use it? What gets in the way, and is that barrier part of the requirement or only part of the route?" },
            ] },
            { kind: "statement", text: "A person’s disability, language or background doesn’t tell you what they need. Ask, and look at the work itself." },
            { kind: "accordion", heading: "Make the difference useful", intro: "Select each heading to read more.", items: [
              { title: "Consistency", body: "Clear, consistent instructions cut down on confusion and on decisions that depend on who you happen to talk to. Everyone should hear the same accurate explanation of what’s required. That’s equality doing its job, but it doesn’t tell you whether the online form itself works for people." },
              { title: "Usability", body: "Someone can be eligible and eager to take part and still be unable to get through a form. Before reading a missing response as lack of interest, look at the route itself. The question is about how the work is designed, which you can check, not about the person." },
              { title: "Choice", body: "Give people a real chance to say what they need or prefer. Don’t pick an alternative for someone because of a group they belong to. A good response removes a barrier the person has named and keeps their choices open within what the work requires." },
            ] },
            { kind: "continue" },
            { kind: "flashcards", heading: "Turn each card", intro: "See how we use these words in this course.", cards: [
              { front: "Equality", back: "Holding everyone to the same standard or offering the same opportunity. It doesn’t mean every method has to be identical." },
              { front: "Equity", back: "Ongoing attention to the barriers, power and circumstances that shape access, opportunity and results." },
              { front: "The same route", back: "Everyone is offered one way in. On its own, that doesn’t show that everyone could use it." },
              { front: "An assumption", back: "A conclusion about what someone needs, wants or can do that nobody has checked with them." },
            ] },
            { kind: "tabs", heading: "What does it really show?", intro: "Select each tab.", items: [
              { label: "Same link", body: "Sending one link shows that the team offered one route. It doesn’t show that the route worked for everyone, or that the access arrangements people are entitled to were in place. Keep “we sent it” separate from “people could use it.”" },
              { label: "A different route", body: "Another way to respond, such as by phone or on paper, can remove a practical barrier while the requirements stay exactly the same. Whether it can be offered is a decision for the person or area responsible for the process." },
              { label: "A group label", body: "Labels like “older adult” or “person with a disability” are not an access assessment. Ask about the task and the barrier. A pattern across a group can be a good reason to look closer, but it doesn’t explain each person’s experience." },
            ] },
            { kind: "image", image: img("l1-b", "An older woman holds a phone close as she reads an online form at her kitchen table.") },
            { kind: "sorting", heading: "Sort it out", intro: "Some statements describe a standard that should stay the same for everyone. Some ask whether people can actually use the route. Some are guesses about people that nobody has checked. Place each card where it belongs.", categories: ["Same standard", "Access question", "Untested guess"], items: [
              { text: "State the information requirement clearly.", category: 0 },
              { text: "Use the same definition when reviewing every response.", category: 0 },
              { text: "Can the form be used with the person’s screen reader?", category: 1 },
              { text: "What keeps someone from getting the information they need?", category: 1 },
              { text: "Everyone in this group needs the same help.", category: 2 },
              { text: "Sending the same link proves equal access.", category: 2 },
            ], done: "All sorted. The standards and the access questions sit side by side: you need both." },
            { kind: "scenario", image: img("l1-a", "Two coworkers compare the same form."), character: cast(2, "A program specialist", "A colleague in a coral blouse, speaking."), title: "Your team’s online form", setup: "Your team calls its online-only invitation equitable because everyone got the same link. Nobody has looked at whether people could use it.", lines: [{ cast: 2, role: "A program specialist", text: "Everyone got the same link and the same deadline. That's equal, isn't it?" }, { cast: 6, role: "A case manager", text: "Equal to send, maybe. I'm not sure everyone could open it, read it or finish it." }], question: "What’s the most useful next step?", options: [
              { text: "Agree that the shared link settles it.", feedback: "Sending the link matters, but it doesn’t show that people could use it." },
              { text: "Confirm which requirements must stay the same, and find out whether the form is usable.", feedback: "Good choice. This keeps the rules steady and asks a real access question, without jumping to exceptions.", best: true },
              { text: "Send everyone over 65 a paper version instead.", feedback: "Age alone doesn’t tell you what someone needs or prefers. Some would rather use the form." },
            ] },
            { kind: "check", question: "What does sending everyone the same link show?", options: [
              { text: "Everyone had the same real chance to respond." },
              { text: "The team offered one route. Whether people could use it still needs a look.", correct: true },
              { text: "Anyone who didn’t respond wasn’t interested." },
              { text: "Equity means a different rule for each person." },
            ], right: "Sending one link shows what was offered, not who could use it. The equality question and the equity question both help you look at the same process.", wrong: "One link can’t show whether everyone could use it, or why someone didn’t respond. And equity doesn’t mean a separate rule for each person. Look for the requirement, the possible barrier and what you’d need to find out next." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Fair rules and usable access can serve the same purpose.",
              "Offering everyone the same method doesn’t show that everyone could use it.",
              "Who someone is doesn’t tell you what they need. Ask.",
            ] },
            { kind: "useAtWork", tool: "DHS Equity Analysis Toolkit", step: "Step 1: Set desired results and outcomes", href: "/equity-review/toolkit", text: "Use the equality and equity questions to name who a change in your work affects differently." },
            { kind: "note", lead: "Try it this week.", text: "Think of one process in your work that everyone goes through the same way. What is it for, and what’s one question about whether everyone can actually use it?" },
          ],
        },
        {
          id: "dc-s3-equity-vs-equality-2",
          title: "Separate the requirement from the route",
          minutes: 8,
          blocks: [
            { kind: "text", paragraphs: [
              "Every process mixes two kinds of choices. Some are requirements: the information or conditions a program genuinely needs to make a decision. Others are about the route: how the team asks for that information, receives it and reviews it.",
              "Treat them as one rule and every problem looks impossible to fix. Pull them apart and you can often find a barrier in the route that can be repaired while the requirement stays exactly the same.",
            ] },
            { kind: "image", image: img("l2-a", "Colleagues trace the steps of a process on a whiteboard.") },
            { kind: "text", heading: "The upload step", paragraphs: [
              "Back to our service form. The team needs an address and a supporting document. The form makes people upload a scan before they can move to the next page.",
              "A staff member hears that some people have the document but can’t get through the upload control. That’s a specific question about the route: does it have to be an upload, can the control be fixed, and is there another permitted way to send the same document? It isn’t a sign that people lack the document, and it isn’t a reason to drop the requirement.",
            ] },
            { kind: "statement", text: "Trouble with the method doesn’t mean someone failed to meet the requirement." },
            { kind: "process", title: "Trace the task, step by step", intro: "Follow a person through the process from start to finish. Where exactly does it get hard?", steps: [
              { title: "The invitation", body: "How did the person learn about the form, and could they read and understand the instructions?" },
              { title: "What’s needed", body: "Which information does the program actually require, and where does that requirement come from?" },
              { title: "How it’s sent", body: "What equipment, file type, timing or skills does the route assume? Could someone have the information and still get stuck here?" },
              { title: "The handoff", body: "Once something is sent, who receives it and how does it reach the person making the decision? A route that loses information along the way isn’t a working route." },
              { title: "Confirmation", body: "Does the person know their response arrived and what happens next?" },
            ] },
            { kind: "continue" },
            { kind: "flashcards", heading: "Four words for this lesson", cards: [
              { front: "Requirement", back: "The information, condition or decision rule that applies under the program." },
              { front: "Route", back: "The way people are asked to provide information or take part." },
              { front: "Task step", back: "One action or handoff inside a larger process." },
              { front: "Authority check", back: "Confirming who can approve a change, and which requirements limit it." },
            ] },
            { kind: "tabs", heading: "Three responses to the upload problem", intro: "Select each tab to compare them.", items: [
              { label: "Keep it as is", body: "Keeping the upload because it’s familiar avoids a change but leaves the problem unanswered. Before defending it as necessary, check what it’s for and what access responsibilities apply." },
              { label: "Waive everything", body: "Dropping the requirement may feel helpful, but it can go beyond what staff are allowed to decide and change the outcome without a sound reason. Separate the barrier from the requirement and look for an approved response." },
              { label: "Review the method", body: "Look at whether the upload can be fixed, or whether another permitted route can collect the same information. Check the whole handoff and the person’s access before promising any result." },
            ] },
            { kind: "image", image: img("l2-b", "A blind man reads a laptop screen with a braille display and headphones.") },
            { kind: "sorting", heading: "Requirement, route or who decides?", intro: "Place each question where it belongs.", categories: ["The requirement", "The route", "Who decides"], items: [
              { text: "Which rule says this document is needed?", category: 0 },
              { text: "What does the decision-maker actually look at?", category: 0 },
              { text: "Can the person operate the upload control?", category: 1 },
              { text: "How does a mailed copy reach the person deciding?", category: 1 },
              { text: "Who can approve another way to send it?", category: 2 },
              { text: "Which access responsibilities apply to this service?", category: 2 },
            ], done: "Nicely done. Keeping these three apart is what makes a fix possible." },
            { kind: "scenario", image: img("l2-a", "Colleagues working through a process."), character: cast(6, "A case manager", "A colleague in a maroon polo, speaking."), title: "Stuck at the upload", setup: "A person has the document but can’t get through the upload step. A colleague suggests either denying the request right away or waiving every requirement.", lines: [{ cast: 6, role: "A case manager", text: "She has the document right here. The upload button just won't work for her." }, { cast: 2, role: "A program specialist", text: "Then we either deny it today or waive everything. Which is faster?" }], question: "What’s a sound next step?", options: [
              { text: "Pick whichever option is faster.", feedback: "Neither shortcut looks at the actual barrier or at who can decide." },
              { text: "Describe the step, look at the permitted ways to send the document and keep the decision rules the same.", feedback: "Yes. This ties the access problem to the real process without promising an outcome.", best: true },
              { text: "Guess what the person can do based on a group they belong to.", feedback: "A label can’t tell you what happened when this person tried the task." },
            ] },
            { kind: "check", question: "What does the upload problem show?", options: [
              { text: "One step in collecting the document may be a barrier. The requirement and the possible routes need a proper review.", correct: true },
              { text: "Anyone who struggles with the upload isn’t eligible." },
              { text: "The supporting document should be dropped for everyone." },
              { text: "A familiar process can’t be questioned." },
            ], right: "It points to a specific step without deciding eligibility or making an exception nobody approved.", wrong: "Trouble with an upload doesn’t settle eligibility, and it doesn’t mean a requirement can be ignored. Being familiar doesn’t make a step necessary, either. Describe the step and take it to the right review." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Why something is required and how it’s collected are different questions.",
              "Trace the task instead of explaining the difficulty through who someone is.",
              "Any fix has to fit what the program requires and who can approve it.",
            ] },
            { kind: "useAtWork", tool: "DHS Equity Analysis Toolkit", step: "Step 4: Benefits and burdens", href: "/equity-review/toolkit", text: "Separate the requirement from the route in your own analysis, and change the route where it creates the burden." },
            { kind: "note", lead: "Try it this week.", text: "Pick a task in your work and sketch it in five parts: the requirement, the route, a possible barrier, the handoff and who would review a change." },
          ],
        },
        {
          id: "dc-s3-equity-vs-equality-3",
          title: "Ask about access, don’t assume it",
          minutes: 7,
          blocks: [
            { kind: "text", paragraphs: [
              "The people who use a process often notice a step that a staff-only review misses. What they tell you is valuable evidence. It isn’t a reason to assume that everyone who shares their identity has the same experience.",
              "Ask about the particular task, what got in the way and what might help. And never make someone share personal details as the price of having a concern taken seriously.",
            ] },
            { kind: "image", image: img("l3-a", "A staff member listens closely as a woman explains something, with an interpreter beside them.") },
            { kind: "text", heading: "Two people, two different problems", paragraphs: [
              "In our form review, one person says they couldn’t move through the upload control. Another says the instructions didn’t explain which documents were acceptable. Both accounts matter, and they point to different fixes. Repairing the control won’t clear up the instructions, and rewriting the instructions won’t make the control usable.",
              "Write them down as two separate questions, then look for more evidence on each.",
            ] },
            { kind: "statement", text: "One focused account is useful. It doesn’t have to speak for a whole group." },
            { kind: "accordion", heading: "Make listening practical", intro: "Select each heading to read more.", items: [
              { title: "Ask about the task", body: "Ask which step didn’t work and what happened next. That gives you a usable description of the process without asking anyone to explain a diagnosis or prove they belong to a group. If more information really is needed, use the procedure that applies to your role." },
              { title: "Keep accounts separate", body: "Keep the navigation problem and the instructions problem apart. Folding them into one story about a group can hide the actual fix. Look for what’s shared and what’s different in the work, not a fixed trait in people." },
              { title: "Close the loop", body: "Tell people what you learned, what will be checked and what’s still open. If their input leads to no change, explain why. Taking part doesn’t guarantee the outcome someone hoped for, and silence doesn’t mean someone was unwilling to help." },
            ] },
            { kind: "continue" },
            { kind: "flashcards", heading: "Four ideas for this lesson", cards: [
              { front: "Affected perspective", back: "What someone knows because a decision affects their participation or their work." },
              { front: "Focused question", back: "A question about the specific task and the next step, not someone’s whole history." },
              { front: "Variation", back: "People who share a category can face different barriers and want different things." },
              { front: "What we can change", back: "The part of a decision the team can actually change, or pass to the right person to review." },
            ] },
            { kind: "tabs", heading: "Ways to hear from people", intro: "Select each tab.", items: [
              { label: "One volunteer", body: "One person can point you to an important barrier. Their account doesn’t show how common it is, or speak for everyone affected. Use it to shape a question, then look for more evidence." },
              { label: "Speaking for a group", body: "Asking someone to speak for a whole group puts pressure on them and hides individual preferences. Invite their experience of the task without asking them to explain their identity or represent everyone." },
              { label: "Several ways in", body: "Written, spoken and supported ways to take part can bring in different knowledge. Check that each one actually reaches the people making the decision; offering options isn’t the same as meaningful participation." },
            ] },
            { kind: "image", image: img("l3-b", "A Deaf woman signs with an interpreter while a staff member listens.") },
            { kind: "sorting", heading: "Useful input or overreach?", intro: "Place each card where it belongs.", categories: ["Focused input", "Good follow-through", "Overreach"], items: [
              { text: "The upload control didn’t work with a keyboard.", category: 0 },
              { text: "The instructions didn’t say which documents were acceptable.", category: 0 },
              { text: "Ask the right person to check the control’s accessibility.", category: 1 },
              { text: "Explain why an instruction is staying the same.", category: 1 },
              { text: "Everyone in this group has the same barrier.", category: 2 },
              { text: "Sharing more personal history makes a concern more valid.", category: 2 },
            ], done: "That’s it. Hear the specific experience, follow through, and don’t stretch one account into a rule about a group." },
            { kind: "scenario", image: img("l3-a", "A conversation in a meeting room."), character: cast(8, "A Human Services Supervisor", "A colleague in a mauve hijab, speaking."), title: "The follow-up question", setup: "A participant points out a navigation barrier. A team member asks them to explain what everyone with the same disability needs.", lines: [{ cast: 8, role: "A Human Services Supervisor", text: "Thank you for telling us about the navigation problem." }, { cast: 1, role: "A team lead", text: "Could you also tell us what everyone with your disability needs?" }], question: "How should the question change?", options: [
              { text: "Ask about this specific task and what might help, without asking them to speak for a group.", feedback: "Exactly. This respects what they shared and gives the team something it can test.", best: true },
              { text: "Ask for a detailed diagnosis before looking into the concern.", feedback: "Medical details aren’t needed to look at how a task works." },
              { text: "Treat the first account as the answer for everyone.", feedback: "One account can’t show how common something is or what everyone prefers." },
            ] },
            { kind: "check", question: "What should the team write down from the two accounts?", options: [
              { text: "Two separate barriers, the questions each one raises and who will look into them.", correct: true },
              { text: "One need that applies to every person with a disability." },
              { text: "A score for how much personal history each person shared." },
              { text: "Proof that the whole process is unusable for everyone." },
            ], right: "That respects each contribution and gives the team specific problems to work on.", wrong: "Personal details and group labels can’t stand in for evidence about the task. Two accounts can show two different barriers without proving how common either one is." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Ask what happened in the task and what would make it work.",
              "One account can reveal a concern without speaking for everyone.",
              "Collect and share only the information your role and purpose call for.",
            ] },
            { kind: "useAtWork", tool: "DHS Equity Analysis Toolkit", step: "Step 3: Engaging communities", href: "/equity-review/toolkit", text: "Plan engagement that asks about the task, not about who people are." },
            { kind: "note", lead: "Try it this week.", text: "Write one question you could ask about a task in your work that focuses on what happened, not on who the person is." },
          ],
        },
      ],
    },
    {
      title: "Putting it to work",
      lessons: [
        {
          id: "dc-s3-equity-vs-equality-4",
          title: "Weigh changes against a shared purpose",
          minutes: 7,
          blocks: [
            { kind: "text", paragraphs: [
              "Once you’ve found a barrier, it’s tempting to grab the first fix. But a different route isn’t automatically better, and the same route isn’t automatically good enough.",
              "Compare your options against what the work is for: usable access, accurate information, privacy, a reasonable workload and the right people making the decision. Put those standards on the table before you choose.",
            ] },
            { kind: "image", image: img("l4-a", "A team arranges option cards in columns on a table.") },
            { kind: "tabs", heading: "Three options for the form", intro: "Select each tab to compare them.", items: [
              { label: "Leave it", body: "No new work, but the known navigation problem stays unsolved. If evidence later shows the form is usable, say so; don’t lean on habit or on how many people received it." },
              { label: "Fix and test it", body: "Repairing the upload control can help people use the main route on their own, with the same requirements. Test it on the real problem and check for other barriers. A technical fix is good evidence, not proof that everything is done." },
              { label: "Add another way", body: "A second permitted route, such as assisted submission, may remove a barrier. It still needs approval and privacy and handoff checks. Never push someone onto a separate route because of who they are." },
            ] },
            { kind: "statement", text: "A good recommendation explains the benefit, the burden, what’s still uncertain and who decides." },
            { kind: "accordion", heading: "Look closely at any fix", intro: "Select each heading to read more.", items: [
              { title: "Does it fit the barrier?", body: "Fixing the control helps with navigation. It doesn’t clear up unclear instructions. Be specific about which problem each option solves and which it leaves open." },
              { title: "Who carries the extra work?", body: "An assisted route might mean appointments, travel or telling your story again. Trace those steps before calling it easier. Check the staff handoff too: information has to reach the right person accurately." },
              { title: "How will we know it works?", body: "Test the fix through the right process. One good example isn’t a guarantee for everyone. A clear check names the task, the evidence and who reviews it." },
            ] },
            { kind: "continue" },
            { kind: "flashcards", heading: "Four words for this lesson", cards: [
              { front: "Criterion", back: "A standard you use to compare options." },
              { front: "Burden", back: "The time, effort, cost or difficulty an option puts on someone." },
              { front: "Conditional recommendation", back: "A proposal that says what must be checked or approved before it goes ahead." },
              { front: "Choice", back: "A person’s real say in how they take part, never assigned because of a group." },
            ] },
            { kind: "image", image: img("l4-b", "A supervisor and an employee review a page together.") },
            { kind: "sorting", heading: "Sort the details", intro: "Place each card where it belongs.", categories: ["Benefit to check", "Condition to confirm", "Shortcut"], items: [
              { text: "A fixed control may let people submit on their own.", category: 0 },
              { text: "Another permitted route may remove a remaining barrier.", category: 0 },
              { text: "The information reaches the person who decides.", category: 1 },
              { text: "The fix is tested through the right access process.", category: 1 },
              { text: "A different route is always fairer.", category: 2 },
              { text: "The same route is always good enough.", category: 2 },
            ], done: "Good. Benefits and conditions belong together; shortcuts skip the checking." },
            { kind: "scenario", image: img("l4-a", "A team weighing options."), character: cast(5, "A program manager", "A colleague in a royal blue blouse, speaking."), title: "The assisted route", setup: "Your team wants to offer an assisted route, but hasn’t checked appointment times, privacy, handoffs or whether people would choose it.", lines: [{ cast: 5, role: "A program manager", text: "Let's offer assisted submission. Problem solved." }, { cast: 7, role: "A management analyst", text: "Have we checked appointment times, privacy and whether people would even choose it?" }], question: "What should happen before calling it a good response?", options: [
              { text: "Call it a success because another route now exists.", feedback: "Offering a route doesn’t show that it works in practice." },
              { text: "Check that it fits the barrier, who approves it, any new burdens and the full handoff, while still reviewing the main form.", feedback: "Right. You’re testing the response itself, not just its label.", best: true },
              { text: "Require everyone with a disability to use assistance.", feedback: "Assigning people to a route by group can create a new barrier and takes away their choice." },
            ] },
            { kind: "check", question: "What makes a conditional recommendation useful?", options: [
              { text: "It ties the response to the barrier, names the burdens and says what evidence and approval are still needed.", correct: true },
              { text: "It sounds innovative." },
              { text: "It gives an unexplained fairness score." },
              { text: "It sends everyone in one group to a separate process." },
            ], right: "It gives the person responsible something specific to weigh, and it’s honest about what isn’t settled yet.", wrong: "Novelty, a precise-looking score and group assignment don’t make a sound response. Compare purpose, barrier, burden, choice and who decides, and say what evidence would support the next step." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "A different method isn’t automatically a fairer one.",
              "Check who carries any new burden, and how the route reaches a decision.",
              "Every recommendation needs a reason and the right approval.",
            ] },
            { kind: "useAtWork", tool: "DHS Equity Analysis Toolkit", step: "Step 5: Implementation", href: "/equity-review/toolkit", text: "Turn the option you chose into a plan with a responsible role, a date and resources." },
            { kind: "note", lead: "Try it this week.", text: "Take one change you’re considering and compare two or three options by purpose, barrier, burden, choice and who would approve it." },
          ],
        },
        {
          id: "dc-s3-equity-vs-equality-5",
          title: "Let the numbers raise good questions",
          minutes: 7,
          blocks: [
            { kind: "text", paragraphs: [
              "After a change, look at whether it actually helped. Counting how many invitations went out tells you about activity. Looking at whether people could finish the task answers a different question. Match the measure to the question, and be honest about its limits.",
            ] },
            { kind: "image", image: img("l5-a", "An analyst studies a bar chart on a large monitor with a colleague.") },
            { kind: "text", heading: "Same count, different story", paragraphs: [
              "Our team sees 30 completed forms from 40 invitations in one test group, and 30 from 60 in another. The counts match, but the rates don’t: 75 percent and 50 percent, a difference of 25 percentage points.",
              "These are practice numbers to show the arithmetic, not a DHS finding. They don’t tell you which barrier caused the gap, whether the two groups are comparable or whether the form was the only thing that mattered.",
            ] },
            { kind: "statement", text: "A difference tells you where to look. Evidence and context tell you what it means." },
            { kind: "accordion", heading: "Check the result before you explain it", intro: "Select each heading to read more.", items: [
              { title: "What’s the denominator?", body: "30 out of 40 isn’t the same as 30 out of 60. Know what you’re dividing by. And remember: counting invitations leaves out everyone who was never invited." },
              { title: "Can the groups be compared?", body: "Definitions, time periods and task conditions all matter. A group with a different deadline may not be comparable. Keep overlaps and missing information visible instead of quietly combining records." },
              { title: "What caused it?", body: "A gap in rates doesn’t explain itself. Look at the route and listen to the people affected, alongside the right evidence. A change after a fix may matter, but other things change too." },
            ] },
            { kind: "continue" },
            { kind: "flashcards", heading: "Four terms for this lesson", cards: [
              { front: "Count", back: "How many events or people were recorded in a defined group." },
              { front: "Rate", back: "A count divided by the right total, so groups of different sizes can be compared." },
              { front: "Percentage points", back: "The simple difference between two percentages, such as 75 minus 50." },
              { front: "Missing evidence", back: "Information the question needs that’s absent, unsuitable or not available for this use." },
            ] },
            { kind: "tabs", heading: "Three ways to report it", intro: "Select each tab.", items: [
              { label: "Same count", body: "“Thirty completions in each group” is accurate but misses the different totals. Give the denominators and say what the measure actually answers." },
              { label: "Difference with limits", body: "“The rates differ by 25 percentage points” is accurate. Add that the cause, how comparable the groups are and who wasn’t invited are still open questions." },
              { label: "A claim about people", body: "“This group doesn’t care” goes far beyond the numbers and brings in a stereotype. Look into the task and the invitation instead, and describe only what the numbers support." },
            ] },
            { kind: "image", image: img("l5-b", "Two coworkers discuss a printed chart.") },
            { kind: "sorting", heading: "Result, question or overreach?", intro: "Place each card where it belongs.", categories: ["What was recorded", "A question to explore", "Overreach"], items: [
              { text: "Thirty of forty invitations led to a completed form.", category: 0 },
              { text: "The rates differ by 25 percentage points.", category: 0 },
              { text: "Were the invitation conditions the same?", category: 1 },
              { text: "Which step might have stopped people finishing?", category: 1 },
              { text: "The gap proves the group wasn’t motivated.", category: 2 },
              { text: "Removing names makes any table safe to share.", category: 2 },
            ], done: "That’s the habit: say what was recorded, ask good questions and stop short of claims the numbers can’t carry." },
            { kind: "scenario", image: img("l5-a", "An analyst reviewing results."), character: cast(7, "A management analyst", "A colleague in an olive shirt, speaking."), title: "The team update", setup: "A colleague is about to tell the team that the 75 and 50 percent rates prove one group doesn’t care about the service.", lines: [{ cast: 7, role: "A management analyst", text: "Seventy-five percent in one group, fifty in the other." }, { cast: 5, role: "A program manager", text: "So the second group just doesn't care about the service?" }], question: "What should they say instead?", options: [
              { text: "Describe the rates, say what can’t be concluded and ask a question about the process.", feedback: "Yes. The finding stays useful without inventing a cause or a motive.", best: true },
              { text: "Offer a different explanation about the group, with no new evidence.", feedback: "Swapping one stereotype for another doesn’t improve the evidence." },
              { text: "Reassure everyone because 30 people finished in each group.", feedback: "The same count doesn’t mean the same rate, or the same real access." },
            ] },
            { kind: "check", question: "What can the practice figures tell you?", options: [
              { text: "The completion rates differ by 25 percentage points. The cause and any wider conclusions still need checking.", correct: true },
              { text: "A group’s identity caused the difference." },
              { text: "Equal counts prove equal access." },
              { text: "Missing information can be counted as success." },
            ], right: "The arithmetic is clear and it stays within its limits. The gap is a reason to look closer.", wrong: "Counts hide the totals, missing information can’t be filled in, and a group label isn’t a cause. Describe the rates, the limits and the next evidence you’d need." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "Counts and rates answer different questions.",
              "A difference can start an inquiry without explaining itself.",
              "Use evidence that’s right for the purpose, and protect small groups.",
            ] },
            { kind: "useAtWork", tool: "DHS Equity Analysis Toolkit", step: "Step 2: Data", href: "/equity-review/toolkit", text: "Break your numbers apart by group, and record what they can and can't tell you." },
            { kind: "note", lead: "Try it this week.", text: "Find one number you report or rely on. What’s its denominator, what can’t it tell you and what question does it raise?" },
          ],
        },
        {
          id: "dc-s3-equity-vs-equality-6",
          title: "Your equity question and next step",
          minutes: 9,
          blocks: [
            { kind: "text", paragraphs: [
              "Equality and equity become most useful when they sharpen a real question about your work. In this last lesson you’ll pull everything together into a short note: the purpose, what must stay the same, the possible barrier, what you know, an option worth reviewing and who takes the next step.",
            ] },
            { kind: "image", image: img("l6-a", "A staff member writes notes at her desk.") },
            { kind: "process", title: "Write your equity note", intro: "Six short parts. Use the practice form or a piece of your own work.", steps: [
              { title: "Purpose", body: "What is this process for? One sentence." },
              { title: "What stays the same", body: "Which requirements apply to everyone and aren’t yours to change?" },
              { title: "The possible barrier", body: "Where in the route might someone get stuck, and how do you know?" },
              { title: "What you know, and don’t", body: "What evidence do you have, and what can’t it tell you yet?" },
              { title: "An option to review", body: "What change might help, and what would it cost or require?" },
              { title: "Next step and who takes it", body: "Who can look at this, and how will you check whether a change worked?" },
            ] },
            { kind: "text", heading: "A completed practice note", paragraphs: [
              "Here is one possible note for the fictional upload problem. It models a question to investigate and a next step, not a finding about an actual DHS service.",
            ] },
            { kind: "numbered", heading: "From the question to a useful next step", items: [
              "Purpose: Collect the information needed to review the request and tell the person what happens next.",
              "What stays the same: The program's information requirements and decision criteria. Confirm the source of each requirement before proposing a change.",
              "Possible barrier: A person reports having the required document but being unable to operate the upload control. We need to test that step and ask which permitted route would work for them.",
              "Evidence and limits: We have a specific report about the upload step. The practice completion rates raise a further question, but they do not show that this control caused the gap or explain every person's experience.",
              "Option to review: Repair and test the upload control. Check whether an approved alternative is needed while that work happens, including privacy, staff time, confirmation of receipt and the handoff to the decision-maker.",
              "Next step: The process owner checks the requirements and available alternatives with the relevant staff. Agree who will test the revised task, when the team will review the result and how people who raised the concern will hear what changed.",
            ] },
            { kind: "text", heading: "Try the same reasoning in your role", paragraphs: [
              "The task might be an application, a meeting invitation, a training session or a staff handoff. Choose one small step you can describe accurately. Write one sentence for each part of the note using the fictional example or public, non-identifying details.",
              "Then check your draft: Have I separated a requirement from a method? Have I described a barrier without guessing someone's needs or motives? Have I named what I still need to learn, who can act and how we will check the result?",
            ] },
            { kind: "note", lead: "Use Ask to develop your reasoning.", text: "Open Ask from this lesson and try: Help me test this equity note. Ask one question at a time about the requirement, the barrier, missing evidence and the next step. Share only fictional or public, non-identifying details. Use the response to improve your draft and check it against the sources and the person responsible for the process." },
            { kind: "statement", text: "A good note is a strong start. It doesn’t replace the formal analysis some decisions require." },
            { kind: "accordion", heading: "Where your note fits", intro: "Select each heading to read more.", items: [
              { title: "Formal analysis", body: "The DHS Equity Policy calls for a formal analysis for actions with long-term impact that go to leadership for approval, using the DHS Analysis or Scan or a tool developed with an equity director. Your note prepares you for that work; it’s separate from it." },
              { title: "Support from the consultant", body: "The One DSD consultant leads the program and offers guidance, knowledge and feedback. You build your own skill in equity work; you don’t need anyone’s permission to ask a good question." },
              { title: "Following through", body: "Choose a check that matches the action. If the upload control is fixed, test the task and look for remaining barriers. Finishing a fix, or this course, is a step forward, not proof of equal results." },
            ] },
            { kind: "continue" },
            { kind: "tabs", heading: "Three ways to finish", intro: "Select each tab.", items: [
              { label: "The practice form", body: "Use the service form from this course and write your note. You get the full learning without using anyone’s real records." },
              { label: "Your own draft", body: "A draft from your own role makes it real. Keep protected records out of it, and keep any required review separate." },
              { label: "Declaring it done", body: "Saying everything is fully compliant because the note is written goes too far. Name the actual requirement that applies and the next responsible step instead." },
            ] },
            { kind: "image", image: img("l6-b", "Colleagues walk and talk together down an office corridor.") },
            { kind: "sorting", heading: "Preparation, next step or overreach?", intro: "Place each card where it belongs.", categories: ["Preparation", "Next step", "Overreach"], items: [
              { text: "Describe what the information is for and the possible upload barrier.", category: 0 },
              { text: "State the rate comparison and its limits.", category: 0 },
              { text: "Use the required analysis for a covered decision.", category: 1 },
              { text: "Name who can review the proposed route.", category: 1 },
              { text: "Six answers in a course fulfill every policy duty.", category: 2 },
              { text: "Finishing the course proves equal service results.", category: 2 },
            ], done: "Well sorted. Prepare honestly, name the next step and leave certification to the processes built for it." },
            { kind: "scenario", image: img("l6-a", "A staff member reviewing her notes."), character: cast(1, "A team lead", "A colleague in a sage shirt and glasses, speaking."), title: "Wrapping up", setup: "Your team finishes its note and wants to mark every access and equity obligation as complete, without the reviews that apply.", lines: [{ cast: 1, role: "A team lead", text: "Our note is done. Can we mark every access and equity duty complete?" }, { cast: 8, role: "A Human Services Supervisor", text: "The note is good preparation. The formal reviews still have to happen." }], question: "How should you describe the result?", options: [
              { text: "As full compliance, because the note is done.", feedback: "Writing the note doesn’t fulfill the other duties." },
              { text: "As good preparation, with clear evidence, limits and next steps, and the required processes kept separate.", feedback: "That’s it. You recognize real progress and keep the actual responsibilities in view.", best: true },
              { text: "As worthless until an actual agency decision is made.", feedback: "Practice builds real understanding, even before a live decision." },
            ] },
            { kind: "check", question: "What should your finished note claim?", options: [
              { text: "It’s preparation with clear next steps; any required analysis and other duties stay separate.", correct: true },
              { text: "Every Equity Policy obligation is now met." },
              { text: "The consultant must approve every equity question." },
              { text: "The practice numbers prove the service is fair." },
            ], right: "That describes the work accurately while keeping roles, evidence limits and policy responsibilities clear.", wrong: "A learning exercise can’t certify every duty or outcome, and guidance from the consultant isn’t an approval gate. Describe the issue, the evidence, the next step and who reviews it." },
            { kind: "numbered", heading: "Keep these in mind", items: [
              "A useful note connects purpose, barrier, evidence and who decides.",
              "Preparation is valuable, and it isn’t the same as compliance.",
              "You do this work yourself, with guidance and honest follow-through.",
            ] },
            { kind: "quote", text: "Equality is giving everyone the same form. Equity is making sure everyone can fill it in.", who: "A way to remember it" },
          ],
        },
      ],
    },
    {
      title: "Check your understanding",
      lessons: [
        {
          id: "dc-s3-equity-vs-equality-7",
          title: "Knowledge check",
          minutes: 5,
          blocks: [
            { kind: "text", paragraphs: ["Five questions to bring the course together. Each one shows you why the answer fits. There’s no score, and you can take them as many times as you like."] },
            { kind: "check", question: "A team sends the same form link to everyone. Which question does equity add?", options: [
              { text: "Did everyone receive the link?" },
              { text: "Can everyone actually use the form?", correct: true },
              { text: "Should every person get a different form?" },
            ], right: "Equality checks that the offer is the same; equity checks whether people can actually use it.", wrong: "Receiving the link is the equality question, and equity doesn’t mean a separate form for everyone. It asks whether the route works for the people it’s meant for." },
            { kind: "check", question: "Someone has the required document but can’t upload it. What is this?", options: [
              { text: "A sign they don’t meet the requirement." },
              { text: "A barrier in the route, to review without dropping the requirement.", correct: true },
              { text: "A reason to waive the document for everyone." },
            ], right: "The requirement and the route are different questions. This is a route problem.", wrong: "Having trouble with a method isn’t the same as not meeting a requirement, and dropping the requirement may go beyond what staff can decide." },
            { kind: "check", question: "One participant describes a barrier. What’s the best follow-up?", options: [
              { text: "Ask them to explain what everyone like them needs." },
              { text: "Ask about this task and what would help.", correct: true },
              { text: "Ask for their medical history first." },
            ], right: "Focused questions about the task respect the person and give you something you can test.", wrong: "No one should have to speak for a group or share personal history before a concern is looked at." },
            { kind: "check", question: "Which recommendation is strongest?", options: [
              { text: "Add an assisted route; another route is always fairer." },
              { text: "Fix and test the upload, check whether another permitted route is needed and name who reviews it.", correct: true },
              { text: "Leave the form as it is; the same route is always enough." },
            ], right: "It fits the barrier, names the checks and the approval, and stays honest about what isn’t settled.", wrong: "Neither a new route nor the old one is automatically right. Compare them against the purpose, the barrier, the burden and who decides." },
            { kind: "check", question: "Completion rates are 75 percent and 50 percent. What can you say?", options: [
              { text: "One group cares less about the service." },
              { text: "The rates differ by 25 percentage points; the cause still needs looking into.", correct: true },
              { text: "Thirty people finished in each group, so access was equal." },
            ], right: "Describe what was recorded and treat the gap as a question.", wrong: "A gap in rates doesn’t explain itself, and equal counts can hide unequal rates." },
            { kind: "note", lead: "You’ve finished the course.", text: "Keep the two questions close: is it the same for everyone, and can everyone actually use it? Bring your equity note to your next team conversation." },
          ],
        },
      ],
    },
  ],
  sources: [
    { title: "DHS Equity Policy", href: "https://mn.gov/dhs/assets/equity-policy_tcm1053-646921.pdf", note: "Definitions of equity, access and the equity lens, and when a formal analysis is required." },
    { title: "28 CFR 35.130, General prohibitions against discrimination", href: "https://www.ecfr.gov/current/title-28/chapter-I/part-35/subpart-B/section-35.130", note: "Why equal opportunity in public services doesn’t always mean an identical method." },
  ],
};
