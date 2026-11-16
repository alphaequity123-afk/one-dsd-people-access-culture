
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/ui";
import { OrchestratorClient } from "@/components/orchestrator-client";
import { ownerPageGuard } from "@/lib/auth/owner-page";
import { listCycles, listProposals } from "@/lib/intelligence/agents/cycle";
import { getPolicy } from "@/lib/intelligence/policy";
import { AGENTS } from "@/lib/intelligence/registry/agents";
import { flagList } from "@/lib/intelligence/registry/flags";
import { generativeStatus } from "@/lib/intelligence/providers";
import { cloneAgentsEnabled } from "@/lib/intelligence/clone/config";

export const metadata: Metadata = { title: "Program reviews" };
export const dynamic = "force-dynamic";

export default async function OrchestratorPage() {
  if (!(await ownerPageGuard())) return null;
  const [policy, cycles, proposals] = await Promise.all([getPolicy(), listCycles(10), listProposals()]);
  const agents = AGENTS.map((a) => ({ agent_id: a.agent_id, staff_label: a.staff_label, ceiling: a.autonomy_ceiling, enabled: a.enabled, purpose: a.purpose }));
  const flags = flagList().map((f) => ({ key: f.key, description: f.description, value: f.value, source: f.source }));
  const gen = generativeStatus();
  const scheduleReady = Boolean(process.env.CRON_SECRET?.trim());
  const clone = cloneAgentsEnabled();
  return (
    <>
      <PageIntro kicker="You set the boundaries" title="Program reviews" lede="A program review can organize consultation requests, update heads-up packets, point out content that may be out of date, check accessibility, and prepare changes for your decision. You can reverse changes from a review. Use Stop program reviews for an immediate pause, or choose a lower work level to narrow what may happen." />
      <div className="wrap py-8">
        {clone ? <section className="mb-8 rounded-xl border p-5 space-y-3" aria-labelledby="clone-agents-heading">
          <h2 id="clone-agents-heading" className="text-xl font-bold">Ask pilot</h2>
          <p>Jev supports routing and answer boundary review. Specialists handle resources, public research, learning, equity drafts, accessibility, and development practice. Content changes remain proposals for your review.</p>
          <p>Jev credential: {process.env.TYPESAFE_API_KEY ? "configured" : "missing"}. Full answers and public web search: {process.env.OPENAI_API_KEY ? "connected" : "missing"}. Public research service: {process.env.PERPLEXITY_API_KEY ? "connected" : "not connected; public web search through the second answer service is used instead"}.</p>
          <p>Ask carries no allowance and no permission ceiling: every question is answered in full, with public research when the question calls for it. Ask keeps no record of questions or runs, not even counts. Cost and reliability are checked with test questions: the Ask evals in the repository.</p>
          <p>Daily content and accessibility review: {process.env.PAC_CLONE_DAILY_REVIEW === "on" ? "enabled while this service is running, once a day" : "off"}. Review findings and proposed changes below. Stop program reviews also stops Ask and the daily agent review.</p>
          <p><SourceLink className="underline" href="/consultant/program">Review specialist work, record your assessment, and track follow-through</SourceLink></p>
          <p>Answer quality is judged on test questions, never on what staff asked: run the Ask evals before expanding the pilot.</p>
        </section> : null}
        <OrchestratorClient policy={policy} cycles={cycles} proposals={proposals} agents={agents} flags={flags} generative={gen} scheduleReady={scheduleReady} cloneSchedule={clone ? (process.env.PAC_CLONE_DAILY_REVIEW === "on" ? "on" : "off") : undefined} />
      </div>
    </>
  );
}
