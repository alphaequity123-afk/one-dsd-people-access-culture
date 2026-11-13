import NextLink from "next/link";
import type { ComponentProps, AnchorHTMLAttributes } from "react";
import { externalReadingHref, unavailableExternalUrl } from "@/lib/content/external-readings";

type LinkProps = ComponentProps<typeof NextLink> & { original?: boolean };
/** All known public resources open their complete reading in the app. */
export default function AppLink({ original, ...props }: LinkProps) {
  const href = typeof props.href === "string" ? props.href : undefined;
  if (href && /^https?:\/\//.test(href) && !original) {
    const local = externalReadingHref(href);
    if (local) return <NextLink {...props} href={local} target={undefined} />;
    if (unavailableExternalUrl(href)) return <span className={props.className}>{props.children}</span>;
  }
  return <NextLink {...props} />;
}
export function SourceLink({ original, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { original?: boolean }) {
  if (props.href && /^https?:\/\//.test(props.href) && !original) {
    const local = externalReadingHref(props.href);
    if (local) return <NextLink {...props} href={local} target={undefined} />;
    if (unavailableExternalUrl(props.href)) return <span className={props.className}>{props.children}</span>;
  }
  return <a {...props} />;
}
