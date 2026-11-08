import type { Metadata } from "next";
import LibraryPage from "@/app/library/page";

// /resources forwards to /library (next.config.ts); the library page is the one source of this list.
export const metadata: Metadata = { title: "Library" };
export const dynamic = "force-dynamic";
export default LibraryPage;
