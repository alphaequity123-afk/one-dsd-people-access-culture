import { Suspense } from "react";
import { cookies } from "next/headers";
import { PageIntro } from "@/components/ui";
import { LeadersSignIn } from "@/components/leaders-sign-in";
import { ownerFromCookies } from "@/lib/auth/request";
import { isLeadersSession, LEADERS_COOKIE, leadersConfigured, leadersKey, leadersKeyIsDevDefault } from "@/lib/auth/leaders";

export const dynamic = "force-dynamic";

/** Managers, supervisors and the consultant only. Unsigned visitors see the access-key form. */
export default async function EquityBaselineLayout({ children }: { children: React.ReactNode }) {
  let owner = false, leader = false;
  try { owner = await ownerFromCookies(); leader = isLeadersSession((await cookies()).get(LEADERS_COOKIE)?.value); } catch { owner = false; leader = false; }
  if (owner || leader) return (
    <>
      {owner && leadersKey() ? (
        <div className="wrap pt-4">
          {/* Consultant only: the shared key to hand to DSD managers and supervisors. Never shown to leaders sessions. */}
          <p className="notice max-w-3xl"><strong>Consultant note.</strong> Managers and supervisors open this page with the leaders access key: <code>{leadersKey()}</code>. Share it in person or by direct message, not in a group post.</p>
        </div>
      ) : null}
      {children}
    </>
  );
  return (
    <>
      <PageIntro kicker="Leaders only" title="Equity baseline" lede="Service access and outcomes by race and ethnicity for Disability Services Division employment services, with the six equity goals. For managers, supervisors and the consultant." />
      <div className="wrap py-8">
        {leadersConfigured() ? <Suspense><LeadersSignIn usesStarterKey={leadersKeyIsDevDefault()} /></Suspense>
          : <p className="notice notice--stop mt-6 max-w-md" role="alert">This page is locked until the Equity and Inclusion Operations Consultant sets up leaders access.</p>}
      </div>
    </>
  );
}
