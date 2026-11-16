
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import { Suspense } from "react";
import { PageIntro } from "@/components/ui";
import { ownerConfigured, ownerKeyIsDevDefault } from "@/lib/auth/owner";
import { editingModeFromCookies, ownerFromCookies } from "@/lib/auth/request";
import { PROGRAM, ROUTES } from "@/lib/constants";
import { getStore, storeIsPersistent } from "@/lib/intelligence/memory/store";
import { generativeStatus } from "@/lib/intelligence/providers";
import { getPolicy } from "@/lib/intelligence/policy";
import { ParticipationNotice } from "@/components/participation-notice";
import { ConsultantSignIn } from "@/components/consultant-sign-in";
import { ResourceCreationLink } from "@/components/resource-creation-link";
import { ConsultantContextNotices } from "@/components/consultant-context-notices";
import { headers } from "next/headers";
import { isLoopbackHost, offlineConnectorsFile } from "@/lib/offline/mode";

export const dynamic = "force-dynamic";

const WORK_LEVEL: Record<string, string> = {
  A0: "review and summarize only",
  A1: "offer suggestions for your decision",
  A2: "prepare editable drafts for your approval",
  A3: "organize and route work with a way to reverse changes",
  A4: "complete an approved program review with checks and reversal",
  A5: "prepare program improvements for your approval",
};

/**
 * Consultant Workspace shell. Unsigned visitors see the access-key form.
 * A live owner session is required before workspace data or children render.
 */
export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const owner = await ownerFromCookies();
  if (!owner) {
    const configured = ownerConfigured();
    return (
      <>
        <PageIntro kicker="Consultant only" title="Consultant Workspace" lede={`Protected workspace for the ${PROGRAM.practiceOwnerRole} to examine priorities and evidence, prepare guidance and recommendations, and review program work and follow-through.`} />
        <div className="wrap py-8">
          <ParticipationNotice surface="consultant_sign_in" />
          {configured ? (
            <Suspense fallback={null}>
              <ConsultantSignIn usesStarterKey={ownerKeyIsDevDefault()} />
            </Suspense>
          ) : (
            <div className="card mt-6 max-w-2xl">
              <p className="kicker">Locked</p>
              <p className="m-0">This private workspace is locked because an access key has not been added.</p>
              <details className="mt-3 text-sm">
                <summary>Help with access</summary>
                <p>Add a private value for PAC_OWNER_KEY in the hosting settings, then publish the update. A stronger sign-in method is still planned.</p>
              </details>
            </div>
          )}
          <p className="mt-4 text-sm">
            <Link href={ROUTES.home.href}>Back to {PROGRAM.staffBrand}</Link>
          </p>
        </div>
      </>
    );
  }

  const store = getStore();
  const gen = generativeStatus();
  const policy = await getPolicy();
  const editing = await editingModeFromCookies();
  return (
    <>
      <div className="bg-navy-deep text-white">
        <div className="wrap flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
          <nav aria-label="Consultant Workspace" className="flex flex-wrap gap-4">
            <Link href="/consultant/program" className="font-bold text-white">Program work</Link>
            <Link href="/consultant/outcomes" className="font-bold text-white">Shared results</Link>
            <Link href="/consultant/toolkit" className="font-bold text-white">Equity Analysis Toolkit</Link>
            <Link href="/equity-workspace/policy-analyzer" className="font-bold text-white">Equity Policy Analyzer</Link>
            <Link href="/equity-workspace" className="font-bold text-white">Equity workspace</Link>
            <Link href="/consultant/analysis" className="font-bold text-white">Research and policy analysis</Link>
            <Link href="/consultant/data" className="font-bold text-white">Data exploration</Link>
            <Link href="/consultant/workforce" className="font-bold text-white">Workforce map</Link>
            <Link href="/consultant/orchestrator" className="font-bold text-white">
              Program reviews
            </Link>
            <Link href="/consultant/research" className="font-bold text-white">
              External research
            </Link>
            <Link href="/consultant/registry" className="font-bold text-white">
              Program settings
            </Link>
            <Link href="/consultant/evals" className="font-bold text-white">
              Readiness checks
            </Link>
            <Link href="/consultant/activation" className="font-bold text-white">Activation status</Link>
            <Link href="/consultant/review" className="font-bold text-white">
              Content review
            </Link>
            <Link href="/consultant/resources" className="font-bold text-white">
              Resource review
            </Link>
            <ResourceCreationLink className="font-bold text-white" />
            <Link href="/consultant/ask-records" className="font-bold text-white">ASK response records</Link>
            {offlineConnectorsFile() && isLoopbackHost((await headers()).get("host")) ? <Link href="/consultant/connectors" className="font-bold text-white">Connected services</Link> : null}
            <Link href="/consultant/audit" className="font-bold text-white">
              Activity record
            </Link>
            <Link href={ROUTES.oneDsdTeam.href} className="font-bold text-white">
              {ROUTES.oneDsdTeam.label}
            </Link>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <p className="m-0">
              {editing
                ? <>Page editing is on for this browser. <SourceLink className="font-bold text-white underline" href="/api/consultant/editing?mode=off&next=/consultant/program">Turn it off</SourceLink></>
                : <SourceLink className="font-bold text-white underline" href="/api/consultant/editing?mode=on&next=/">Turn on page editing and open the site</SourceLink>}
            </p>
            <form method="post" action="/api/consultant/logout">
              <button type="submit" className="btn btn--ghost" style={{ minHeight: 32, padding: "0.2rem 0.7rem" }}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
      <ConsultantContextNotices><div className="wrap pt-4">
        <div className="notice notice--warn m-0 text-sm">
          <p className="m-0">
            <strong>Workspace status. </strong>
            {storeIsPersistent(store) ? "Program records saved here are kept. " : "Program records saved here are temporary and may be lost when the program restarts. "}
            {gen.active ? "The answer service is connected. " : "The answer service is not connected; some features use the program's standard wording. "}
            {policy.killed ? "You have paused program reviews." : `Program reviews may ${WORK_LEVEL[policy.max_autonomy] ?? "work only within the limit you selected"}.`}
          </p>
          <details className="mt-2">
            <summary>About saving and drafting</summary>
            <p className="mb-0">
              Program records use {storeIsPersistent(store) ? "lasting storage" : "temporary storage"}. Individual tools explain where they save your work. The answer service is {gen.active ? "connected" : gen.pilotFlag ? "selected, but its connection still needs to be completed" : "off"}. Program reviews may {WORK_LEVEL[policy.max_autonomy] ?? "work only within the limit you selected"}.
            </p>
          </details>
        </div>
        <div className="mt-4">
          <ParticipationNotice surface="consultant_workspace" />
        </div>
      </div>
      </ConsultantContextNotices>
      {children}
    </>
  );
}
