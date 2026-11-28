import type { ReactNode } from "react";
import "./development.css";
export default function DevelopmentLayout({ children }: { children: ReactNode }) {
  return <div className="development">{children}</div>;
}
