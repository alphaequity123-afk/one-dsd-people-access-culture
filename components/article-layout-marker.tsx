"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ARTICLE_LAYOUT_SCRIPT, isArticlePath } from "@/lib/article-layout";

/**
 * Marks reading pages so they use one readable column (html[data-layout="article"]).
 * The inline script sets the mark before the first paint; the effect keeps it right after in-app navigation.
 */
export function ArticleLayoutMarker() {
  const pathname = usePathname();
  useEffect(() => {
    if (isArticlePath(pathname ?? "")) document.documentElement.dataset.layout = "article";
    else delete document.documentElement.dataset.layout;
  }, [pathname]);
  return null;
}

export function ArticleLayoutScript() {
  return <script dangerouslySetInnerHTML={{ __html: ARTICLE_LAYOUT_SCRIPT }} />;
}
