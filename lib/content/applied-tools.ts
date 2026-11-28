import type { PillarGroup } from "@/components/pillar-hub";

/**
 * The nine applied tools at the top of Practice. Owner decision 2026-11-25: wording follows the Gemini overhaul
 * (content/applied-tools.json in one-dsd-pac-overhaul-repo.zip), checked against the program writing standard.
 * Each tool opens the working page carried over from the live One DSD site ("Tools for your work").
 * Claims the overhaul made about required steps are stated only as far as the linked source supports them.
 */
export const APPLIED_TOOLS: PillarGroup[] = [
  { title: "Before you respond or decide", links: [
    { label: "Observation and interpretation check", href: "/learn/leadership/development/observe-before-interpreting#work-tool", description: "Understand a concern before responding. Separate what you noticed from the meaning you added, then choose one respectful clarifying question.", ask: "How do I separate what I observed from my interpretation before I respond to a concern?" },
    { label: "Trace a service barrier", href: "/learn/leadership/development/trace-a-service-barrier#work-tool", description: "When someone meets a barrier in a service, follow their real journey, offer an immediate way through and work toward a lasting fix.", ask: "How do I trace a service barrier through someone's whole journey and find a lasting fix?" },
    { label: "Engagement before design", href: "/learn/leadership/development/engage-before-design#work-tool", description: "Invite community input early. Be clear about what is open, who can take part and how people will hear back before the plan is set.", ask: "How do I invite community input while the plan is still open to change?" },
  ] },
  { title: "Fair decisions and resources", links: [
    { label: "DHS Equity Analysis Toolkit", href: "/learn/equity-toolkit", description: "Apply the department's equity analysis to the work and decisions it covers, before a decision moves forward.", ask: "When does my work need an equity analysis, and how do I prepare for one?" },
    { label: "Budget for access", href: "/learn/leadership/development/budget-for-access#work-tool", description: "Make a resource or funding decision with its purpose, access needs and consequences for the people affected in view from the start.", ask: "How do I build access needs into a budget or resource decision from the start?" },
    { label: "Assignment offer", href: "/learn/leadership/development/offer-real-opportunity#work-tool", description: "Offer a fair development opportunity. Be clear about the work, the invitation, decision authority, time and support.", ask: "How do I offer a development opportunity fairly and clearly?" },
  ] },
  { title: "Check the work and its effects", links: [
    { label: "Plain language and accessible documents checklist", href: "/r/plain-language-and-accessible-documents-checklist", description: "Check a notice or document for plain language, accessible structure and clear instructions for requesting an accommodation.", ask: "How do I check a notice for plain language and accessibility?" },
    { label: "Effects and evidence review", href: "/learn/leadership/development/evaluate-distribution#work-tool", description: "After a change, look at benefits, burdens, missing perspectives and other explanations to learn whether it helped.", ask: "How do I review whether a change helped, and who it benefited or burdened?" },
    { label: "Racism and anti-racism in practice", href: "/learn/racism-and-antiracism", description: "Use a case and a work tool to examine how racism can shape service access, workplace concerns or organizational change.", ask: "How can racism shape service access in DSD work, and what can I do about it?" },
  ] },
];

/** Planning tools for larger pieces of DSD and ADSA work (v2 prototype, "Specialized DSD and ADSA planning tools"). */
export const PLANNING_TOOLS: PillarGroup[] = [
  { title: "Plan larger pieces of work", links: [
    { label: "Plan a legislatively required working group", href: "/equity-review/working-group-plan", description: "Turn a working group's legal charge into a month-by-month plan, with a worked example.", ask: "How do I plan a legislatively required working group?" },
    { label: "ADSA goals planner", href: "/learn/equity-toolkit/goals", description: "The Aging and Disability Services Administration's six equity goals and work plan, and how your area's work connects to them.", ask: "How does my team's work connect to the ADSA six equity goals?" },
    { label: "Equity Director toolkit", href: "/equity-review/director-toolkit", description: "Tools for Equity Directors and the leaders who work with them." },
    { label: "Find the person or area responsible", href: "/support/right-person", description: "Formal decisions stay with DHS HR, Tribal relations, the Equity Directors and other offices. Find who to contact." },
  ] },
];
