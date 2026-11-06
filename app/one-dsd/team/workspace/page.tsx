import type { Metadata } from "next";
import Link from "next/link";
import { OneDsdTeamClient } from "@/components/one-dsd-team-client";
import { Notice, PageIntro } from "@/components/ui";
import { ParticipationNotice } from "@/components/participation-notice";
import { EquityWorkspaceLinks } from "@/components/policy-analysis/equity-workspace-links";
import { analysisRoleFromCookies } from "@/lib/auth/consultant-or-team";
import { ownerFromCookies } from "@/lib/auth/request";
import { getMicrosoftBridgeState } from "@/lib/collaboration/microsoft-boundary";
import { readOneDsdTeamWorkspace } from "@/lib/collaboration/store";
import { toOneDsdTeamWorkspaceView } from "@/lib/collaboration/view";
import { PROGRAM } from "@/lib/constants";

export const metadata: Metadata = { title: `${PROGRAM.oneDsdTeamName} space` };
export const dynamic = "force-dynamic";

export default async function OneDsdTeamWorkspacePage() {
  const authorized = await ownerFromCookies();

  if (!authorized) {
    // A One DSD Team sign-in (not the owner) reaches the shared Equity workspace instead of a dead end.
    const role = await analysisRoleFromCookies();
    const teamMember = role === "team";
    return (
      <div className="wrap py-8">
        <Link href="/one-dsd/team">Back to {PROGRAM.oneDsdTeamName}</Link>
        <PageIntro
          kicker={PROGRAM.oneDsdProgramName}
          title={`${PROGRAM.oneDsdTeamName} space`}
          lede="This working space is for reading and downloading; it does not take or save what you write."
        />
        {role ? (
          <EquityWorkspaceLinks intro={teamMember ? "You are signed in as the One DSD Team. Your shared work happens in the Equity workspace: analyze documents and policies for equity, decide on recommended changes, and download the finished documents." : "The Equity workspace is open: analyze documents and policies for equity, decide on recommended changes, and download the finished documents."} />
        ) : (
          <Notice>
            <strong>Team writes are closed. </strong>
            Browse published One DSD pages and downloads. The working space loads only for the Consultant Workspace owner.
          </Notice>
        )}
        <p className="mt-6"><Link href="/one-dsd">Open One DSD</Link> · <Link href="/consultant">Consultant Workspace</Link></p>
      </div>
    );
  }

  const [workspaceState, microsoft] = await Promise.all([
    readOneDsdTeamWorkspace(),
    Promise.resolve(getMicrosoftBridgeState()),
  ]);
  const workspace = toOneDsdTeamWorkspaceView(workspaceState);

  return (
    <>
      <div className="wrap pt-6">
        <Link href="/one-dsd/team">Back to {PROGRAM.oneDsdTeamName}</Link>
      </div>
      <PageIntro
        kicker={PROGRAM.oneDsdProgramName}
        title={`${PROGRAM.oneDsdTeamName} space`}
        lede={`A working space for the standing volunteer equity committee serving the ${PROGRAM.oneDsdScope}.`}
      />
      <div className="wrap flex flex-wrap items-start justify-between gap-4 pt-8">
        <ParticipationNotice surface="one_dsd_team" />
        <form method="post" action="/api/consultant/logout">
          <button type="submit" className="btn">Sign out</button>
        </form>
      </div>
      <OneDsdTeamClient initialState={workspace} microsoftConnection={microsoft.status} />
      <div className="wrap pb-8"><EquityWorkspaceLinks /></div>
    </>
  );
}
