import Link from "@/components/app-link";
import { AskClient } from "@/components/ask-client";
import { prepareAsk } from "@/app/ask/ask-view";

/**
 * v2 rebuild: pages carried over from the live One DSD site keep their "Continue with Ask" sections, but the
 * answer comes from this application's Ask, the same one in the banner on every page. The live site's own Ask
 * used a separate database that this application does not share.
 */
export async function AskForm({ compact = false, initialQuestion = "" }: {
  compact?: boolean;
  initialQuestion?: string;
  leadershipModule?: string;
  learningTopic?: string;
  returnTarget?: { kind: "practice" | "resource" | "community"; id: string; href: string };
}) {
  let ask: Awaited<ReturnType<typeof prepareAsk>> | null = null;
  try { ask = await prepareAsk(); } catch (error) {
    console.error("embedded Ask unavailable", error instanceof Error ? `${error.name}: ${error.message}` : error);
  }
  if (!ask?.enabled) return <p><Link href={initialQuestion ? `/ask?q=${encodeURIComponent(initialQuestion)}` : "/ask"}>Open Ask</Link> to ask a question about this topic.</p>;
  return <AskClient compact={compact} initialQuestion={initialQuestion} researchAvailable={Boolean(ask.research?.enabled)} intakeEnabled={false} copy={ask.copy} />;
}
