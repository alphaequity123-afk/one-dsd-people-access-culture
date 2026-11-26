import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PillarHub } from "@/components/pillar-hub";
import styles from "@/components/pillar-hub.module.css";
import { KnowledgeBrowser } from "@/components/knowledge-browser";
import { knowledgeRows, learningPaths } from "@/lib/program/knowledge-index";

export const metadata: Metadata = { title: "Knowledge" };

/**
 * Knowledge pillar. Owner decision 2026-11-25: follows the Gemini overhaul's progressive learning — start, apply,
 * lead — and its single library. Learning here is voluntary: nothing is tracked or scored.
 * v2 prototype (2026-11-26): a filterable browser of every course, guide, reading, policy reference and podcast,
 * then the curated groups, then the official routing block. Policy numbers, titles and contacts are those the DHS
 * Equity Policy, Version 2.0 lists (checked against the published policy, 2026-11-26).
 */
const POLICY_URL = "https://mn.gov/dhs/assets/equity-policy_tcm1053-646921.pdf";
export default function KnowledgePillar() {
  return <PillarHub
    id="knowledge"
    title="Knowledge"
    lede="Learning and reference in one place. Start with the foundations, apply them to your work, then lead change. Learning here is voluntary and your own: nothing is tracked, scored or counted toward training credit."
    primary={{ label: "Open Learn", href: "/learn" }}
    groups={[
      { title: "Start", intro: "Shared understanding for everyone.", links: [
        { label: "Begin with equity", href: "/begin-with-equity", description: "Five values to guide the work, and a situation to practise applying them." },
        { label: "Core courses", href: "/learn/core-15", description: "The short set of courses most staff start with." },
        { label: "DHS Equity Policy in plain language", href: "/equity-policy", description: "What the policy asks of DHS staff, with the official source." },
        { label: "Disability, Rights, Identity, and Belonging", href: "/learning/self-directed/index.html?course=F09", description: "See disability as part of a person's identity and culture." },
        { label: "Learning paths", href: "/learn/paths", description: "A suggested order of courses for a goal or role." },
      ] },
      { title: "Apply", intro: "Skills for the work in front of you.", links: [
        { label: "Cultural Humility", href: "/trainings/cultural-humility", description: "Interactive training with a version for each job family." },
        { label: "Psychological Safety", href: "/trainings/psychological-safety", description: "Build a team where people can speak up, ask and admit mistakes." },
        { label: "National CLAS Standards", href: "/learn/clas", description: "Culturally and Linguistically Appropriate Services, explained for daily work." },
        { label: "Rewrite it in plain language", href: "/practice/plain-language", description: "Practice turning dense notice language into words people can act on." },
      ] },
      { title: "Lead", intro: "Understand and change the conditions people work and live in.", links: [
        { label: "Racism and anti-racism in practice", href: "/learn/racism-and-antiracism", description: "Cases and work tools for service access, workplace concerns and organizational change." },
        { label: "One DSD Leadership", href: "/leadership", description: "Six stages of leadership practice and sixteen leadership styles." },
        { label: "Intercultural learning", href: "/learn/intercultural", description: "How culture shapes communication, decisions and services." },
        { label: "People and Growth", href: "/people-and-growth", description: "Mentoring, career growth and strong teams." },
      ] },
      { title: "Library and listening", links: [
        { label: "Library", href: "/library", description: "Resources, guides and policy summaries, each with its source." },
        { label: "Readings", href: "/learn/readings", description: "Short readings and book summaries with discussion questions." },
        { label: "Listen", href: "/audio-library", description: "Podcasts with chapters, speed control and transcripts." },
        { label: "Courses", href: "/courses", description: "Every course, arranged by outcome area." },
      ] },
      { title: "Find an answer or a person", links: [
        { label: "Ask", href: "/ask", description: "A clear answer in plain language, with the sources behind it." },
        { label: "Search", href: "/search", description: "Search every course, resource and page." },
        { label: "Find the right person", href: "/support/right-person", description: "Official decisions stay with DHS HR, learning systems and equity leaders. Find who to contact." },
      ] },
    ]}
    lead={<KnowledgeBrowser rows={knowledgeRows()} paths={learningPaths()} />}
  >
    <section className={styles.panel} aria-labelledby="routing-title">
      <h2 id="routing-title">When something is formal, it goes to the office responsible</h2>
      <p>Everything here is voluntary learning and preparation. Required training, formal equity analysis approvals, accommodations and workplace concerns stay with the offices that own them.</p>
      <ul>
        <li><strong>Equity analysis approvals:</strong> your supervisor and your business area&apos;s Equity Director, at <a href="mailto:equity.directors.dhs@state.mn.us">equity.directors.dhs@state.mn.us</a>.</li>
        <li><strong>Disability access and accommodations:</strong> HR/LR Policy #1358, Americans with Disabilities Act (ADA), Title II, and HR/LR Policy #1433, ADA Reasonable Accommodation.</li>
        <li><strong>Workplace concerns:</strong> HR/LR Policy #1432, Respectful Workplace; #1436, Harassment and Discrimination Prohibited; #1329, Sexual Harassment Prohibited; and #1444, Workplace Violence Prohibited. Contact <a href="mailto:workplace_policies@state.mn.us">workplace_policies@state.mn.us</a>.</li>
        <li><strong>Required training and credit:</strong> the agency&apos;s learning system. Nothing in this program counts toward it.</li>
      </ul>
      <p>These policies and contacts are listed in the <Link href={POLICY_URL} original>DHS Equity Policy, Version 2.0</Link>. To find the right person for anything else, see <Link href="/support/right-person">find the person or area responsible</Link>.</p>
    </section>
  </PillarHub>;
}
