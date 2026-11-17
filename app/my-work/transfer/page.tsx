import type { Metadata } from "next";
import { WorkTransferControls } from "@/components/work-transfer";

export const metadata: Metadata = { title: "Move your work" };
export default function WorkTransferPage() {
  return <div className="wrap max-w-3xl py-8 space-y-6">
    <a href="/my-work">Back to My Work</a>
    <h1 className="text-3xl font-bold">Move your work</h1>
    <p>Use your plans and notes at another One DHS address or in another browser. Start by downloading them where you created them, then bring that file here.</p>
    <WorkTransferControls />
  </div>;
}
