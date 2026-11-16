import type { Metadata } from "next";
import { SiteSearchPage } from "@/components/site-search-page";
import "@/components/site-search.css";

export const metadata: Metadata = { title: "Search" };

/** Typed words stay in the page; they are never put in the address (components/site-search-page.tsx). */
export default function SearchPage() {
  return <div className="calm site-search-page">
    <h1>Search</h1>
    <SiteSearchPage />
  </div>;
}
