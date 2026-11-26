import Link from "next/link";
import { AssumptionCards } from "@/components/dsd-live/assumption-cards";

export function generateMetadata() {
  return { title: "Check your assumptions" };
}

export default function AssumptionsPage() {
  return <div className="shell planner-page">
    <p className="crumbs"><Link href="/minnesota-communities">Communities</Link></p>
    <header className="planner-head">
      <p className="eyebrow">Communities</p>
      <h1>Check your assumptions</h1>
      <p>Everyone carries assumptions into a conversation. These twelve come up often in public service. React to each one honestly, then turn the card to see what tends to be true and what to try instead.</p>
    </header>
    <AssumptionCards />
    <p className="assume-next">Ready to plan? <Link href="/minnesota-communities/prepare">Prepare for a conversation</Link></p>
  </div>;
}
