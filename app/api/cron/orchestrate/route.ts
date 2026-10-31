export const maxDuration = 300;
import { NextResponse, type NextRequest } from "next/server";
import { runCycle } from "@/lib/intelligence/agents/cycle";

/** Private scheduled cycle; the scheduler must send its bearer credential. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const report = await runCycle("cron");
  // runCycle catches failures so its decision report remains inspectable. The
  // HTTP receipt must therefore confirm cleanup steps rather than treating a
  // returned report (or a 200 response) as proof that retention succeeded.
  const completed = report.steps.some(step => step.name === "apply consultation retention" && step.outcome === "done");
  const securityCleanupCompleted = report.steps.some(step => step.name === "purge expired security records" && step.outcome === "done");
  return NextResponse.json({
    id: report.id,
    effective_ceiling: report.effective_ceiling,
    expired_consultations: report.expired_consultations.length,
    retention: { completed, security_cleanup_completed: securityCleanupCompleted },
    triaged: report.triaged.length,
    proposals: report.proposals.length,
    exceptions: report.exceptions.length,
    summary: report.summary,
  }, { status: completed && securityCleanupCompleted ? 200 : 503, headers: { "cache-control": "no-store" } });
}
