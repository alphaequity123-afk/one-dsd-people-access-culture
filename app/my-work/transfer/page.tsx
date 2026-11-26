import type { Metadata } from "next";
import { WorkTransferControls } from "@/components/work-transfer";

export const metadata: Metadata = { title: "Move your work" };
export default function WorkTransferPage() {
  return <div className="wrap max-w-3xl py-8 space-y-6">
    <a href="/my-work">Back to My Work</a>
    <h1 className="text-3xl font-bold">Move your work</h1>
    <p>Want your plans and notes at another One DHS address or in another browser? Download them where you made them, then bring that file here.</p>
    <WorkTransferControls />
  </div>;
}
