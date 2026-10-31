import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { reviewResources } from "@/lib/program/review-resources";
export const metadata: Metadata = { title: "Quarterly progress report" };
export default function ReportWorkspace() {
  redirect(reviewResources[7].file);
}
