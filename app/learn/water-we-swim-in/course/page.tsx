import { notFound } from "next/navigation";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { WaterFoundationCourse } from "@/components/water-foundation-course";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  return { title: await culturalIntelligenceHubAvailable() ? "The Water We Swim In" : "Learning and resources" };
}

export default async function WaterFoundationPage() {
  if (!await culturalIntelligenceHubAvailable()) notFound();
  return <WaterFoundationCourse />;
}
