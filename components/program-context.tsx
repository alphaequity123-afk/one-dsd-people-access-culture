"use client";

import Link from "@/components/app-link";
import { useRouter } from "next/navigation";
import {
  DEFAULT_PRODUCT_CONTEXT,
  PRODUCT_CONTEXT_COOKIE,
  resolveProductContext,
  type ProductContextId,
} from "@/lib/product/federation";
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";
import { useStorageNotice } from "@/lib/client/storage";

const CONTEXT_CHANGE_EVENT = "one-dhs-pac-context-change";

type ProgramContextValue = {
  context: ProductContextId;
  chooseContext: (context: ProductContextId) => void;
  copy: EditableSurfaceValues;
  copyAvailable: boolean;
};

const ProgramContext = createContext<ProgramContextValue | null>(null);

function subscribeToContext(onChange: () => void): () => void {
  window.addEventListener(CONTEXT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener(CONTEXT_CHANGE_EVENT, onChange);
  };
}

/** Query parameter a shared link can carry to select the view (mirrors lib/product/request-context.ts). */
const CONTEXT_QUERY = "view";

function parseContextView(value: string | null): ProductContextId | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "one_dsd" || normalized === "dsd") return "one_dsd";
  if (normalized === "one_dhs" || normalized === "dhs") return "one_dhs";
  return undefined;
}

function readContextPreference(): ProductContextId {
  try {
    const cookieValue = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${PRODUCT_CONTEXT_COOKIE}=`))
      ?.slice(PRODUCT_CONTEXT_COOKIE.length + 1);
    return resolveProductContext(cookieValue);
  } catch {
    return DEFAULT_PRODUCT_CONTEXT;
  }
}

export function ProgramContextProvider({
  children,
  initialContext = DEFAULT_PRODUCT_CONTEXT,
  copy,
  copyAvailable,
}: {
  children: React.ReactNode;
  initialContext?: ProductContextId;
  copy: EditableSurfaceValues;
  copyAvailable: boolean;
}) {
  const router = useRouter();
  const storageNotice = useStorageNotice();
  const context = useSyncExternalStore(
    subscribeToContext,
    readContextPreference,
    () => initialContext,
  );
  const chooseContext = useCallback((next: ProductContextId) => {
    const resolved = resolveProductContext(next);
    try {
      document.cookie = `${PRODUCT_CONTEXT_COOKIE}=${resolved}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      // The preference is optional; the page remains on the server-confirmed default.
    }
    window.dispatchEvent(new Event(CONTEXT_CHANGE_EVENT));
    router.refresh();
  }, [router]);

  // A shared link can carry `?view=one_dsd` (or `one_dhs`). Honor it once on arrival: store the
  // preference, drop the parameter from the address bar, and re-render with the chosen view.
  useEffect(() => {
    let requested: ProductContextId | undefined;
    let url: URL | undefined;
    try {
      url = new URL(window.location.href);
      requested = parseContextView(url.searchParams.get(CONTEXT_QUERY));
    } catch {
      return;
    }
    if (!requested || !url) return;
    url.searchParams.delete(CONTEXT_QUERY);
    const cleaned = url.toString();
    // Browsers normally never get here: proxy.ts redirects a page visit to the address without
    // `?view=`. When they do, wait until Next's router has taken over the history API, and pass
    // null so the router records the cleaned address too; otherwise a later refresh would
    // re-send the old view and override the person's own choice.
    window.setTimeout(() => {
      try {
        window.history.replaceState(null, "", cleaned);
      } catch {
        // Leaving the parameter in place is harmless; the view is still applied below.
      }
    }, 0);
    if (requested !== readContextPreference()) chooseContext(requested);
  }, [chooseContext]);

  const value = useMemo<ProgramContextValue>(() => ({
    context,
    chooseContext,
    copy,
    copyAvailable,
  }), [chooseContext, context, copy, copyAvailable]);

  return <ProgramContext.Provider value={value}>
    {storageNotice ? <div role="alert" className="wrap my-3 border border-line p-4">{storageNotice}</div> : null}
    {children}
  </ProgramContext.Provider>;
}

export function useProgramContext(): ProgramContextValue {
  const value = useContext(ProgramContext);
  if (!value) throw new Error("Program context must be used within its provider.");
  return value;
}

export function ContextSwitcher() {
  return null;
}

export function ProgramContextNote() {
  const { copy, copyAvailable } = useProgramContext();
  if (!copyAvailable) return null;
  return <aside className="scope-note" aria-label="Resource context in One DSD">
    <details><summary>Resource context: One DSD</summary><p>One DSD is the equity program of the Disability Services Division (DSD). It connects learning with practical equity work in the division.</p><p>Department-wide DHS resources are also here, next to DSD examples.</p><p>Who can open or change a resource depends on its source and on your authorization. Choosing a resource does not give you authority to change a policy or service.</p></details>
    <p><Link href="/one-dsd">{textValue(copy, "oneDsdLinkLabel") || "DSD programs and services"}</Link> · <Link href="/program/model">How the program works</Link></p>
  </aside>;
}

export function OneDsdContextPanel() {
  const { copy, copyAvailable } = useProgramContext();
  if (!copyAvailable) return null;
  return <div className="notice"><strong>One DSD People, Access and Culture. </strong>{textValue(copy, "oneDsdActiveNote")}</div>;
}

function textValue(values: EditableSurfaceValues, key: string): string {
  return typeof values[key] === "string" ? values[key] as string : "";
}
