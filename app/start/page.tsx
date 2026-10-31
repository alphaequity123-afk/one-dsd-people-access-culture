import { DevelopmentPathways } from "@/components/development-pathways";
import Link from "next/link";
import { NewToDsd } from "@/components/new-to-dsd";
import type { Metadata } from "next";
import { ParticipationNotice } from "@/components/participation-notice";
import { ProgramContextNote } from "@/components/program-context";
import { StartClient } from "@/components/start-client";
import { PageIntro } from "@/components/ui";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";

export const metadata: Metadata = { title: "Start" };

export default async function StartPage() {
  const surface = await prepareEditableSurface("start.page");
  const copy = surface.values;
  return (
    <EditableSurfaceRegion surface={surface}>
      <PageIntro
        kicker={stringValue(copy, "introKicker")}
        title={stringValue(copy, "introTitle")}
        lede={stringValue(copy, "introLede")}
      />
      <div className="wrap space-y-6 py-8">
        <ProgramContextNote />
        <p className="max-w-3xl leading-7">Most people arrive here with a real question: a decision to make, a draft to review, a meeting to plan, or a process that is not working for someone. Start there. If you would like context first, <Link href="/one-dsd/programs">DSD programs and services</Link> shows the work the division does and the people it serves.</p>
        <noscript><p>This helper needs JavaScript. You can still <a href="/support/directory">use the support directory</a> or <a href="/library">browse the Library</a>.</p></noscript>
        <StartClient copy={copy} />
        <DevelopmentPathways compact />
        <NewToDsd />
        <ParticipationNotice surface="start_routing" />
      </div>
    </EditableSurfaceRegion>
  );
}
