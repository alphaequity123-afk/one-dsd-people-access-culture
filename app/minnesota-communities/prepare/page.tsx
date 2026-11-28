import Link from "next/link";
import { ConversationPlanner } from "@/components/dsd-live/conversation-planner";

export const metadata = { title: "Prepare for a conversation" };

/** Owner decision 2026-11-22: an interactive planner for conversations with communities. */
export default function PreparePage() {
  return <div className="shell planner-page">
    <p className="crumbs"><Link href="/minnesota-communities">Communities</Link></p>
    <header className="planner-head">
      <p className="eyebrow">Try it</p>
      <h1>Prepare for a conversation</h1>
      <p className="planner-lede">Good conversations with communities start before anyone sits down. Answer three short questions and get a plan you can bring with you: what to do beforehand, respectful questions to ask, the access and language arrangements to make, and how to follow through.</p>
    </header>
    <ConversationPlanner />
    <p className="assume-next">Before you go, <Link href="/minnesota-communities/assumptions">check your assumptions</Link>: twelve that often come up, and what tends to be true instead.</p>
  </div>;
}
