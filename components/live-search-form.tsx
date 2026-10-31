"use client";

import { useRouter } from "next/navigation";
import { useRef, type FormEvent, type ReactNode } from "react";

/** A plain search form that also updates its results shortly after typing stops. It still works without JavaScript. */
export function LiveSearchForm({ action, className, children }: { action: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function onInput(event: FormEvent<HTMLFormElement>) {
    const value = new FormData(event.currentTarget).get("q");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const query = typeof value === "string" ? value.trim() : "";
      router.replace(query ? `${action}?q=${encodeURIComponent(query)}` : action, { scroll: false });
    }, 350);
  }
  return <form method="get" role="search" action={action} className={className} onInput={onInput}>{children}</form>;
}
