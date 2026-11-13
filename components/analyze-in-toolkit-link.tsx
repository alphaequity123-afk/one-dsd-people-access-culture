"use client";
import { SourceLink } from "@/components/app-link";


import { useEffect, useState } from "react";
import { linkedSourceAllowed, linkedSourceHref, type LinkedSourceKind } from "@/lib/consultant-toolkit/linked-source";

/**
 * "Analyze in the Equity Analysis Toolkit", shown only to the signed-in consultant. The page
 * stays the same for everyone: the browser asks the server whether this is the consultant's
 * session, and everyone else sees nothing. Nothing about the visit is recorded.
 */
export function AnalyzeInToolkitLink({ kind, id }: { kind: LinkedSourceKind; id: string }) {
  const [allowed, setAllowed] = useState(false);
  const offered = linkedSourceAllowed(kind, id);

  useEffect(() => {
    if (!offered) return;
    const controller = new AbortController();
    fetch("/api/consultant/session", { credentials: "same-origin", cache: "no-store", headers: { accept: "application/json" }, signal: controller.signal })
      .then(response => { if (response.status === 200) setAllowed(true); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [offered]);

  if (!offered || !allowed) return null;
  return (
    <p className="mt-3 print:hidden" data-consultant-only="true">
      <SourceLink href={linkedSourceHref(kind, id)} className="btn btn--light !min-h-0 !px-3 !py-1 !text-sm">
        Analyze in the Equity Analysis Toolkit
      </SourceLink>
    </p>
  );
}
