import type { Metadata } from "next";
import { PillarHub } from "@/components/pillar-hub";

export const metadata: Metadata = { title: "Leadership" };

/**
 * Leadership pillar. Owner decision 2026-11-25: organization and wording follow the Gemini overhaul
 * (content/leadership.json): six stages of the One DSD leadership program, then the leadership styles and the
 * supports around them. Every link opens a page carried over from the live One DSD site or already in this app.
 * The overhaul's "Intercultural Crosswalk" stage labels are left out: the program does not label people's
 * intercultural orientation, and a stage label invites that reading.
 */
export default function LeadershipPillar() {
  return <PillarHub
    id="leadership"
    title="One DSD Leadership"
    lede="Leadership shapes whether people get service that is fair, respectful and easy to understand. Work through the program one stage at a time, or start with the leadership styles and how each one affects the people you lead."
    primary={{ label: "Explore One DSD Leadership", href: "/learn/leadership" }}
    groups={[
    { title: "Stage 1: Foundations", intro: "See the decision differently.", links: [
        { label: "What your authority makes possible", href: "/learn/leadership/development/purpose-and-power" },
        { label: "Separate the observation from the story", href: "/learn/leadership/development/observe-before-interpreting" },
        { label: "Understand the intercultural orientations in leadership", href: "/learn/leadership/development/orientations-in-decisions" },
        { label: "Use direction without closing down learning", href: "/learn/leadership/development/choose-authority" },
    ] },
    { title: "Stage 2: Relationships", intro: "Make participation possible.", links: [
        { label: "Listen for what your process misses", href: "/learn/leadership/development/listen-and-adapt" },
        { label: "Make participation possible before the decision closes", href: "/learn/leadership/development/participation-before-decision" },
        { label: "Give feedback that helps the next attempt", href: "/learn/leadership/development/feedback-across-difference" },
        { label: "Handle disagreement and repair trust", href: "/learn/leadership/development/conflict-and-repair" },
    ] },
    { title: "Stage 3: Developing people", intro: "Share opportunity and authority.", links: [
        { label: "Who gets to lead the next project?", href: "/learn/leadership/development/offer-real-opportunity" },
        { label: "Move from advice to supported development", href: "/learn/leadership/development/coach-and-sponsor" },
        { label: "Recognize capability beyond familiarity", href: "/learn/leadership/development/fair-evidence-of-capability" },
        { label: "Delegate authority and make hidden work visible", href: "/learn/leadership/development/workload-and-real-delegation" },
    ] },
    { title: "Stage 4: Programs", intro: "Change the conditions of access.", links: [
        { label: "Trace a barrier through the whole service journey", href: "/learn/leadership/development/trace-a-service-barrier" },
        { label: "Keep the person's choices at the center", href: "/learn/leadership/development/person-directed-decisions" },
        { label: "Invite community influence while choices are open", href: "/learn/leadership/development/engage-before-design" },
        { label: "Test a change without hiding the tradeoffs", href: "/learn/leadership/development/test-accessible-change" },
    ] },
    { title: "Stage 5: Systems", intro: "Use resources and influence responsibly.", links: [
        { label: "Turn equity expertise into an accountable decision", href: "/learn/leadership/development/partner-with-equity-professionals" },
        { label: "Make access part of the resource decision", href: "/learn/leadership/development/budget-for-access" },
        { label: "Resolve the barrier between organizations", href: "/learn/leadership/development/cross-boundary-accountability" },
        { label: "Lead change while keeping dissent useful", href: "/learn/leadership/development/lead-change-with-dissent" },
    ] },
    { title: "Stage 6: Advanced practice", intro: "Sustain and examine change.", links: [
        { label: "Find out who benefited and who did not", href: "/learn/leadership/development/evaluate-distribution" },
        { label: "Hold commitments accountable while protecting learning", href: "/learn/leadership/development/accountability-without-surveillance" },
        { label: "Make the improvement survive a leadership transition", href: "/learn/leadership/development/sustain-capability" },
        { label: "Lead a change and return to the evidence", href: "/learn/leadership/development/capstone-equity-in-action" },
    ] },
    { title: "Leadership styles", intro: "Sixteen styles, from those that work against equity to those that most directly advance it.", links: [
        { label: "The leadership styles", href: "/learn/leadership", description: "How each style works, what it helps, where it falls short and how it affects fair service." },
        { label: "Which styles do you reach for?", href: "/learn/leadership#find-a-style", description: "Six quick situations that point to styles worth exploring." },
        { label: "Team discussion kits", href: "/learn/leadership/team-kits", description: "A printable 20-minute discussion for your next team meeting." },
    ] },
    { title: "Practice and go deeper", links: [
        { label: "Leadership simulations", href: "/learn/leadership/practice", description: "Make space to consider a leadership decision, with room to try another approach." },
        { label: "Leadership courses", href: "/learn/leadership/courses", description: "Courses for supervisors, managers and directors." },
        { label: "Tools for your work", href: "/learn/tools", description: "Start with the decision in front of you and take a practical next step." },
        { label: "Research and guidance", href: "/learn/leadership/research", description: "What studies and practice guidance can and cannot tell us." },
        { label: "Why leadership matters here", href: "/learn/leadership/about", description: "How leadership connects to the people DSD serves." },
    ] },
    { title: "For your role", links: [
        { label: "What are you deciding?", href: "/leading", description: "Start from the decision or team moment in front of you." },
        { label: "Suggested paths", href: "/leading/paths", description: "Paths for first-year supervisors, experienced leaders, managers of managers and senior leaders." },
        { label: "Equity leadership and growth in DSD", href: "/one-dsd/leadership", description: "How leaders in the Disability Services Division carry this work forward." },
        { label: "People and Growth", href: "/people-and-growth", description: "Mentoring, career growth, coaching and team development." },
    ] },
    ]}
  />;
}
