"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function LeadersSignIn({ usesStarterKey }: { usesStarterKey: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <>
      {searchParams?.get("denied") === "1" ? (
        <p className="notice notice--stop mt-6 max-w-md" role="alert">The access key did not match. Check it and try again.</p>
      ) : null}
      <form method="post" action="/api/leaders/login" className="card mt-6 max-w-md">
        <input type="hidden" name="returnTo" value={pathname ?? "/data/equity-baseline"} />
        <div className="field">
          <label htmlFor="leaders-key">Leaders access key</label>
          <p className="help m-0">
            {usesStarterKey
              ? "Private sign-in has not been set up yet. Ask the Equity and Inclusion Operations Consultant to set up access before sharing this page."
              : "This page is for Disability Services Division managers and supervisors and the Equity and Inclusion Operations Consultant. Enter the access key you were given."}
          </p>
          <input id="leaders-key" name="key" type="password" autoComplete="current-password" required />
        </div>
        <button type="submit" className="btn btn--primary">Open the equity baseline</button>
      </form>
    </>
  );
}
