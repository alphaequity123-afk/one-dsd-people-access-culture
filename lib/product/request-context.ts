import "server-only";
import { cookies } from "next/headers";
import { parseProductContextView, PRODUCT_CONTEXT_COOKIE, resolveProductContext } from "./federation";


import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { ProductContextId } from "./federation";

// The parser lives with the shared federation contract so proxy.ts can use it too.
export { parseProductContextView, PRODUCT_CONTEXT_QUERY } from "./federation";

export function contentScopeForContext(context: ProductContextId): StaffProgramScope {
  return context === "one_dsd" ? "dsd" : "one-dhs";
}

/** A resource preference changes context, never protected access. Old cookie and URL names remain supported. */
export async function requestedProductContext(view?: unknown): Promise<ProductContextId> {
  const explicit = parseProductContextView(view);
  if (explicit) return resolveProductContext(explicit);
  const store = await cookies();
  return resolveProductContext(store.get(PRODUCT_CONTEXT_COOKIE)?.value);
}

export async function requestedContentScope(view?: unknown): Promise<StaffProgramScope> {
  return contentScopeForContext(await requestedProductContext(view));
}




