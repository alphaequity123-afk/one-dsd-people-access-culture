import { notFound, redirect } from "next/navigation";
import { reviewResources } from "@/lib/program/review-resources";
const tools = { general: reviewResources[0], hcbs: reviewResources[1] };
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(tools).map(tool => ({ tool }));
}
export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  return { title: Object.hasOwn(tools, tool) ? tools[tool as keyof typeof tools].title : "Equity review" };
}
export default async function ReviewWorkspace({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  if (!Object.hasOwn(tools, tool)) notFound();
  const resource = tools[tool as keyof typeof tools];
  redirect(resource.file);
}
