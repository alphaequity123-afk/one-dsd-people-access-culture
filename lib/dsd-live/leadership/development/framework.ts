/** Original program design. Orientation descriptions are concise paraphrases of the IDC;
 * applications to agency decisions are teaching interpretations, not assessment items. */
export const PROGRAM_ROOT = "/learn/leadership/development";
export const PROGRAM_TITLE = "Inclusive leadership in practice";
export const SOURCES = [
  { id: "idc", title: "Intercultural Development Continuum: orientations", url: "https://www.idiinventory.com/idc", use: "Framework definitions. Agency cases and crosswalks are original teaching applications, not validated indicators or assessment items." },
  { id: "idi", title: "IDI assessment, reports and development plans", url: "https://www.idiinventory.com/assessment-and-reports", use: "Distinction between learning about orientations and interpreting an assessment." },
  { id: "training", title: "CDC Quality Training Standards", url: "https://www.cdc.gov/training-development/php/qts/", use: "Objectives, realistic practice, feedback and follow-up. Adapted to this program; no claim of CDC certification." },
  { id: "transfer", title: "Evaluate learning and workplace application", url: "https://www.cdc.gov/training-development/php/about/evaluate-training-measuring-effectiveness.html", use: "Evaluate learning separately from transfer and workplace effects." },
] as const;

export const ORIENTATIONS = [
  { id: "denial", name: "Denial", meaning: "Cultural differences may be overlooked or avoided.", question: "What difference in experience have we not yet noticed?", practice: "Notice a specific difference without explaining it away. Ask about an actual experience rather than generalizing about a group." },
  { id: "polarization", name: "Polarization", meaning: "Cultural differences may be judged through opposing camps, including idealizing another culture.", question: "What judgment about a group is substituting for an explanation?", practice: "Describe the particular concern, examine your own group's variation, and seek an explanation that does not rank cultures." },
  { id: "minimization", name: "Minimization", meaning: "Emphasis on commonality can obscure meaningful differences; downplaying difference may also be a way of navigating dominant expectations.", question: "What does our common approach assume everyone can do?", practice: "Examine your own norms alongside others' experiences. Preserve a shared purpose while investigating differences in meaning, access and power." },
  { id: "acceptance", name: "Acceptance", meaning: "Different cultural perspectives are understood, although an effective response may still be uncertain.", question: "How should this understanding change the next decision?", practice: "Compare perspectives without stereotyping. Choose a response you can try, and notice what you learn from it." },
  { id: "adaptation", name: "Adaptation", meaning: "Perspective and behavior shift appropriately across cultural contexts.", question: "How will we check whether our adaptation works for the people involved?", practice: "Try a change, invite correction and refine it. Then ask whether the conditions around the decision also need to change." },
] as const;
export type OrientationId = typeof ORIENTATIONS[number]["id"];

export const STAGES = [
  { id: "foundations", title: "Foundations: see the decision differently", purpose: "Understand equity, culture and authority before choosing a response.", checkpoint: "Explain a real decision, distinguish observation from interpretation, and identify who can influence it." },
  { id: "relationships", title: "Relationships: make participation possible", purpose: "Practice listening, disagreement, feedback and repair across differences.", checkpoint: "Rehearse a difficult conversation twice, incorporating another perspective without abandoning a legitimate responsibility." },
  { id: "developing-people", title: "Developing people: share opportunity and authority", purpose: "Turn inclusive intentions into assignments, coaching, hiring and workload decisions.", checkpoint: "Use a revised people practice and examine whether the promised opportunity and support were real." },
  { id: "programs", title: "Programs: change the conditions of access", purpose: "Trace barriers, involve people in decisions, and test service changes.", checkpoint: "Test one authorized process change and explain what the evidence does and does not establish." },
  { id: "systems", title: "Systems: use resources and influence responsibly", purpose: "Work with equity professionals and partners on priorities, funding and institutional change.", checkpoint: "Present an actionable decision brief with alternatives, resource commitments, unresolved concerns and accountable owners." },
  { id: "stewardship", title: "Advanced practice: sustain and examine change", purpose: "Evaluate consequences, respond to resistance and build capability that lasts beyond one leader.", checkpoint: "Complete and revisit a capstone, including an honest account of remaining barriers and the next decision." },
] as const;
export type StageId = typeof STAGES[number]["id"];

export const RESPONSIBILITIES = [
  { id: "emerging", title: "Emerging or informal leader", task: "Start with a decision you can influence. Who could help you turn an idea into action?" },
  { id: "supervisor", title: "Supervisor or team lead", task: "Bring a team decision to the practice. Consider who has a voice, what support people need and how you will follow up." },
  { id: "program", title: "Manager or program leader", task: "Look at how a decision affects staff, partners and the people who use the service. What would it take to try a better approach?" },
  { id: "executive", title: "Director or executive", task: "Consider how policy, funding and leadership decisions shape the conditions people work and live in. What can you change, and how will you know it helped?" },
] as const;

export const PROGRAM_GUIDANCE = {
  sequence: "Follow the six stages from the beginning, or start with a decision you are facing now. Wherever you begin, you can return to the earlier modules as your questions change.",
  pace: "Try one module a week, allowing 30–45 minutes to learn and practice, plus time to apply what you discover. Take the time you need to revisit what happened before moving on.",
  privacy: "You can connect this learning to your IDI experience in whatever way is useful to you. You will not be asked to share your results, debrief or development plan. When you practice with others, use a fictional example or leave out identifying details.",
  partnership: "Equity work is stronger when leaders, equity professionals, staff and the people affected by a decision work together. Bring their perspectives in while there is still room to make changes, and be clear about who can make the decision and what support will be needed.",
  evidence: "After you try something, come back to it. Ask the people affected what worked and what got in their way. Look at who benefited, who may have been left out and what you might need to change next. Finishing a course is a beginning; the difference shows up in the work that follows.",
};
