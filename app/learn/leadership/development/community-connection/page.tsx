import Link from "next/link";
import { AskForm } from "@/components/dsd-live/ask-form";

export const metadata = { title: "Community Connection" };
export default function CommunityConnection() {
  return <><nav className="crumbs" aria-label="Breadcrumb"><Link href="/learn">Learn</Link> › Community Connection</nav>
    <header className="development-hero"><p className="development-kicker">Community, culture and service</p><h1>Community Connection</h1><p>Every person brings a life beyond the form in front of us: relationships, experiences, strengths and priorities. Community knowledge can help us ask better questions and build services with people, not simply for them.</p></header>
    <section><h2>Begin with a person, look at the whole experience</h2><p>What might we miss when we look at disability, culture, language or service rules one at a time? Explore how they meet in a person's life and in the choices an organization makes.</p><p><Link href="/learn/leadership/development/community-intersectionality">Explore intersectionality through community and disability</Link></p></section>
    <section><h2>Learn about a community</h2><p>The community briefs bring together history, voices, organizations and service considerations. Use them to prepare for a conversation, then ask the person what matters to them.</p><p><Link href="/minnesota-communities">Explore Minnesota communities</Link> · <Link href="/r/community-somali--disability-and-access">Explore disability and access in the Somali brief</Link></p></section>
    <section><h2>Turn understanding into a relationship</h2><p>Good engagement begins while a decision can still change. Invite people affected to shape the question, explain what influence they will have and return with what you heard and what happened next.</p><p><Link href="/r/dc-l43-meaningful-community-engagement-for-leaders">Meaningful community engagement for leaders</Link> · <Link href="/learn/leadership/development/communication">Intercultural communication and community values</Link></p></section>
    <section><h2>Continue with Ask</h2><p>Ask about a community relationship, an access barrier or a decision you are working on.</p><AskForm compact learningTopic="intercultural-communication" /></section>
  </>;
}
