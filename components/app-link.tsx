import NextLink from "next/link";
import type { ComponentProps, AnchorHTMLAttributes } from "react";
import { externalReadingHref, externalSourceHref } from "@/lib/content/external-readings";
import { canonicalResourceHref } from "@/lib/product/resource-hrefs";
import { agencyZoneEnabled, agencyHref, isAgencyRoute } from "@/lib/program/agency-zone";

type LinkProps = ComponentProps<typeof NextLink> & { original?: boolean };
/** All known public resources open their complete reading in the app. */
export default function AppLink({ original, ...props }: LinkProps) {
  const suppliedHref = typeof props.href === "string" ? props.href : undefined;
  const href = suppliedHref === undefined ? undefined : canonicalResourceHref(suppliedHref);
  if (href !== undefined && href !== suppliedHref) props = { ...props, href };
  if (href && agencyZoneEnabled && isAgencyRoute(href)) {
    return <a href={agencyHref(href)} className={props.className} id={props.id} title={props.title} target={props.target} rel={props.rel}
      onClick={props.onClick} style={props.style} tabIndex={props.tabIndex} aria-label={props['aria-label']} aria-current={props['aria-current']}>{props.children}</a>;
  }
  if (href && /^https?:\/\//.test(href) && !original) {
    const local = externalReadingHref(href);
    if (local) return <NextLink {...props} href={local} target={undefined} />;
    const destination = externalSourceHref(href);
    if (!destination) return <span className={props.className}>{props.children}</span>;
    if (destination !== href) return <NextLink {...props} href={destination} />;
  }
  return <NextLink {...props} />;
}
export function SourceLink({ original, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { original?: boolean }) {
  if (props.href) props = { ...props, href: canonicalResourceHref(props.href) };
  if (props.href && /^https?:\/\//.test(props.href) && !original) {
    const local = externalReadingHref(props.href);
    if (local) return <NextLink {...props} href={local} target={undefined} />;
    const destination = externalSourceHref(props.href);
    if (!destination) return <span className={props.className}>{props.children}</span>;
    if (destination !== props.href) return <a {...props} href={destination} />;
  }
  return <a {...props} />;
}
