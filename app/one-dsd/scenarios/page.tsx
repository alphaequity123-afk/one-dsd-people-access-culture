import type { Metadata } from "next";
import Link from "next/link";
import { loadDsdInventory } from "@/lib/dsd/published";
import { stringValue } from "@/lib/content/staff-surface-registry";

export const metadata: Metadata = { title: "DSD work situations" };

export default async function DsdScenariosPage() {
  const prefix = "dsd-scenario.";
  const scenarios = (await loadDsdInventory()).filter(item => item.surfaceId.startsWith(prefix));
  return <article className="pilot-topic">
    <header>
      <Link href="/one-dsd">Back to One DSD</Link>
      <h1>DSD work situations</h1>
      <p>Choose a situation from everyday DSD work.</p>
    </header>
    <section aria-label="Work situations">
      {scenarios.length ? <ul className="pilot-topic-rows">{scenarios.map(scenario => <li key={scenario.surfaceId}>
        <Link href={`/one-dsd/scenarios/${scenario.surfaceId.slice(prefix.length)}`}>
          <strong>{stringValue(scenario.values, "title")}</strong>
        </Link>
      </li>)}</ul> : <p>No work situations are available right now.</p>}
    </section>
  </article>;
}
