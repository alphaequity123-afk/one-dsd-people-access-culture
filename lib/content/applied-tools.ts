import type { PillarGroup } from "@/components/pillar-hub";

/**
 * The nine applied tools at the top of Practice. Owner decision 2026-11-25: wording follows the Gemini overhaul
 * (content/applied-tools.json in one-dsd-pac-overhaul-repo.zip), checked against the program writing standard.
 * Each tool opens the working page carried over from the live One DSD site ("Tools for your work").
 * Claims the overhaul made about required steps are stated only as far as the linked source supports them.
 */
export const APPLIED_TOOLS: PillarGroup[] = [
  { title: "Before you respond or decide", links: [
    { label: "Observation and interpretation check", href: "/learn/leadership/development/observe-before-interpreting#work-tool", description: "Understand a concern before responding. Separate what you noticed from the meaning you added, then choose one respectful clarifying question." },
    { label: "Trace a service barrier", href: "/learn/leadership/development/trace-a-service-barrier#work-tool", description: "When someone meets a barrier in a service, follow their real journey, offer an immediate way through and work toward a lasting fix." },
    { label: "Engagement before design", href: "/learn/leadership/development/engage-before-design#work-tool", description: "Invite community input early. Be clear about what is open, who can take part and how people will hear back before the plan is set." },
  ] },
  { title: "Fair decisions and resources", links: [
    { label: "DHS Equity Analysis Toolkit", href: "/learn/equity-toolkit", description: "Apply the department's equity analysis to the work and decisions it covers, before a decision moves forward." },
    { label: "Budget for access", href: "/learn/leadership/development/budget-for-access#work-tool", description: "Make a resource or funding decision with its purpose, access needs and consequences for the people affected in view from the start." },
    { label: "Assignment offer", href: "/learn/leadership/development/offer-real-opportunity#work-tool", description: "Offer a fair development opportunity. Be clear about the work, the invitation, decision authority, time and support." },
  ] },
  { title: "Check the work and its effects", links: [
    { label: "Plain language and accessible documents checklist", href: "/r/plain-language-and-accessible-documents-checklist", description: "Check a notice or document for plain language, accessible structure and clear instructions for requesting an accommodation." },
    { label: "Effects and evidence review", href: "/learn/leadership/development/evaluate-distribution#work-tool", description: "After a change, look at benefits, burdens, missing perspectives and other explanations to learn whether it helped." },
    { label: "Racism and anti-racism in practice", href: "/learn/racism-and-antiracism", description: "Use a case and a work tool to examine how racism can shape service access, workplace concerns or organizational change." },
  ] },
];
