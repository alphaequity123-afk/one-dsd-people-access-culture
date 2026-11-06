import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ConsultantSignIn } from "@/components/consultant-sign-in";
import { TeamSignIn } from "@/components/team-sign-in";
import { PageIntro } from "@/components/ui";
import { analysisRoleFromCookies, ROLE_LABELS } from "@/lib/auth/consultant-or-team";
import { ownerKeyIsDevDefault } from "@/lib/auth/owner";
import { teamKeyIsDevDefault } from "@/lib/auth/team";

export const dynamic = "force-dynamic";
// The root layout already marks every page noindex and nofollow; repeat it here so this private area never depends on that.
export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

/**
 * The team key sign-in endpoint (/api/one-dsd/team/login) is retired and answers 410
 * (owner decision, September 9, 2026), so the shared team key form cannot sign anyone
 * in today. Set this to true once that endpoint issues the team session again; the form
 * below then appears for One DSD Team members.
 */
const TEAM_KEY_SIGN_IN_OPEN: boolean = false;

/** Signed-in workspace for the Equity and Inclusion Operations Consultant and the One DSD Team. */
export default async function EquityWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const role = await analysisRoleFromCookies();
  if (!role) {
    return (
      <>
        <PageIntro kicker="Signed-in work" title="Equity workspace" lede="A shared place for the Equity and Inclusion Operations Consultant and the One DSD Team to analyze documents and policies for equity, decide on recommended changes and produce the finished documents." />
        <div className="wrap py-8">
          <div className="grid gap-6 md:grid-cols-2">
            <section className="card" aria-labelledby="consultant-way-in">
              <h2 id="consultant-way-in" className="text-xl font-bold">Equity and Inclusion Operations Consultant</h2>
              <p className="m-0">Sign in with your Consultant Workspace access key. You return to this page after signing in.</p>
              <Suspense fallback={null}>
                <ConsultantSignIn usesStarterKey={ownerKeyIsDevDefault()} />
              </Suspense>
            </section>
            <section className="card" aria-labelledby="team-way-in">
              <h2 id="team-way-in" className="text-xl font-bold">One DSD Team</h2>
              {TEAM_KEY_SIGN_IN_OPEN ? (
                <>
                  <p className="m-0">Sign in with the One DSD Team key. After signing in, come back to this page.</p>
                  <Suspense fallback={null}>
                    <TeamSignIn usesStarterKey={teamKeyIsDevDefault()} />
                  </Suspense>
                </>
              ) : (
                <p className="m-0">Team sign-in with the shared One DSD Team key is not open at this time. Ask the Equity and Inclusion Operations Consultant to open it, or to work through an analysis with you.</p>
              )}
            </section>
          </div>
          <p className="mt-6 text-sm"><Link href="/community-outreach/policies">Policies that shape disability services</Link> stay open to everyone without signing in.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-navy-deep text-white">
        <div className="wrap flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
          <nav aria-label="Equity workspace" className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/equity-workspace" className="font-bold text-white">Workspace home</Link>
            <Link href="/equity-workspace/toolkit" className="font-bold text-white">Equity Analysis Toolkit</Link>
            <Link href="/equity-workspace/policy-analyzer" className="font-bold text-white">Equity Policy Analyzer</Link>
            <Link href="/community-outreach/policies" className="font-bold text-white">Policies that shape disability services</Link>
          </nav>
          <p className="m-0">Decisions here are recorded as the {ROLE_LABELS[role]}</p>
        </div>
      </div>
      {children}
    </>
  );
}
