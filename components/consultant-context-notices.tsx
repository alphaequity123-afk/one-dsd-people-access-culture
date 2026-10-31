"use client";
import { usePathname } from "next/navigation";

/** The private toolkit explains its own saving and document processing arrangements. */
export function ConsultantContextNotices({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/consultant/toolkit" || pathname.startsWith("/consultant/toolkit/")) return null;
  return children;
}
