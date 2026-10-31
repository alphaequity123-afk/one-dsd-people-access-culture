import type { Metadata } from "next";
import { AskView, type AskSearchParams } from "./ask-view";
export const metadata: Metadata = { title: "Ask" };
export default async function AskPage({searchParams}: {searchParams: Promise<AskSearchParams>}) {
  return <AskView searchParams={await searchParams} part="surface" />;
}
