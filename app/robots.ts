import type { MetadataRoute } from "next";

// The program is for staff and partners, not for search engines. Every response already
// carries "X-Robots-Tag: noindex" (next.config.ts); this file answers the standard
// /robots.txt request with the same rule instead of a not-found page.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
