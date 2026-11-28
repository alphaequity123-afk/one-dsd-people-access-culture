import type { ReactNode } from "react";
import "@/app/dsd-live.css";

/** v2 rebuild: pages carried over from the live One DSD site keep its approved look inside this wrapper. */
export function LivePage({ children }: { children: ReactNode }) {
  return <div className="dsd-live">{children}</div>;
}
