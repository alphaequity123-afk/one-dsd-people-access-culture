import type { ReactNode } from "react";
import "./collection.css";

export default function CollectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="lo-collection">{children}</div>;
}
