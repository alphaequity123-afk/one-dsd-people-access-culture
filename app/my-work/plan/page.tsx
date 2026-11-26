import Link from "@/components/app-link";
import { DsdPracticePlanner } from "@/components/dsd-practice-planner";

export const metadata = { title: "Your practice plans" };

export default function PracticePlanPage() {
  return <article className="dsd-shell dsd-stage">
    <header className="dsd-page-heading"><p className="dsd-eyebrow">Preparing to act</p><h1>Your practice plans.</h1><p className="dsd-lede">Connect what you are learning with a decision or practice you can influence. Describe the question, think about the people affected, and choose an action and a way to review it.</p></header>
    <DsdPracticePlanner />
    <nav className="dsd-next" aria-label="Related work"><Link href="/my-work">My work</Link><Link href="/learn/equity-toolkit">Open the Equity Analysis Toolkit</Link></nav>
  </article>;
}
