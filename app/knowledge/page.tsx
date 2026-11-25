import type { Metadata } from "next";
import { PillarHub } from "@/components/pillar-hub";

export const metadata: Metadata = { title: "Knowledge" };

export default function KnowledgePillar() {
  return <PillarHub
    id="knowledge"
    title="Knowledge"
    lede="Courses, readings, podcasts and the library in one place. Learn in the time you have, and use Ask or Search when you need an answer with its source."
    primary={{ label: "Open Learn", href: "/learn" }}
    groups={[
      { title: "Learn", intro: "Courses at foundational, intermediate and advanced levels.", links: [
        { label: "Courses", href: "/courses", description: "Every course, arranged by outcome area." },
        { label: "Learning paths", href: "/learn/paths", description: "A suggested order of courses for a goal or role." },
        { label: "Core courses", href: "/learn/core-15", description: "The short set of courses most staff start with." },
        { label: "National CLAS Standards", href: "/learn/clas", description: "Culturally and Linguistically Appropriate Services, explained for daily work." },
        { label: "Intercultural learning", href: "/learn/intercultural", description: "Understand how culture shapes communication, decisions and services." },
      ] },
      { title: "Read and listen", links: [
        { label: "Library", href: "/library", description: "Resources, guides and policy summaries, each with its source." },
        { label: "Readings", href: "/learn/readings", description: "Short readings and book summaries with discussion questions." },
        { label: "Listen", href: "/audio-library", description: "Podcasts with chapters, speed control and transcripts." },
        { label: "Themes and collections", href: "/collections", description: "Resources gathered around a theme." },
      ] },
      { title: "Find an answer", links: [
        { label: "Search", href: "/search", description: "Search every course, resource and page." },
        { label: "Ask", href: "/ask", description: "A direct answer from the application's material, with the sources behind it." },
        { label: "Find the right person", href: "/support/right-person", description: "Reach the person or area responsible for a question." },
        { label: "Understanding DHS", href: "/understanding-dhs", description: "People, programs and partnerships across the department." },
      ] },
    ]}
  />;
}
