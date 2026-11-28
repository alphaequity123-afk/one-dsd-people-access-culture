import type { ReactNode } from "react";
import "./leadership.css";
import { LivePage } from "@/components/dsd-live/live-page";

/** The leadership space holds leadership content only (owner decision 2026-11-22). */
export default function LeadershipLayout({ children }: { children: ReactNode }) {
  return <LivePage><div className="shell leadership-shell">{children}</div></LivePage>;
}
