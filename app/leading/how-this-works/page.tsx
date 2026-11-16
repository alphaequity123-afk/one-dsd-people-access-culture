import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LEADING_LABEL } from "@/lib/content/collections";

export const metadata: Metadata = { title: LEADING_LABEL };

export default function LeadingHowThisWorksPage() {
  redirect("/leading");
}
