import type { ReactNode } from "react";
import { LivePage } from "@/components/dsd-live/live-page";

export default function Layout({ children }: { children: ReactNode }) {
  return <LivePage>{children}</LivePage>;
}
