"use client";

import Link from "@/components/app-link";
import { useEffect, useState } from "react";

/**
 * Shows "Analyze this policy for equity" whenever the Equity workspace answers (it is open without sign-in by owner decision, November 6, 2026; otherwise only to people signed in to the Equity workspace
 * (the consultant or the One DSD Team). The policy page itself stays static: the check runs
 * in the browser, and everyone else sees nothing.
 */
export function AnalyzePolicyLink({ policyId }: { policyId: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/equity-workspace/policy-analysis", { credentials: "same-origin", cache: "no-store", headers: { accept: "application/json" }, signal: controller.signal })
      .then(response => { if (response.status === 200) setAllowed(true); })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (!allowed) return null;
  return (
    <Link href={`/equity-workspace/policy-analyzer?policy=${encodeURIComponent(policyId)}`} className="inline-flex min-h-11 items-center rounded bg-[#1f4e79] px-4 font-semibold text-white">
      Analyze this policy for equity
    </Link>
  );
}
