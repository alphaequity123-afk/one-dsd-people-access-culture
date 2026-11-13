
import { SourceLink } from "@/components/app-link";
import { DevelopmentPathways } from "@/components/development-pathways";
import Link from "@/components/app-link";
import { NewToDsd } from "@/components/new-to-dsd";
import { Hub2More } from "@/components/hub2-choices";
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
        <noscript><p>This helper needs JavaScript. You can still <SourceLink href="/support/directory">use the support directory</SourceLink> or <Link prefetch={false} href="/library">browse the Library</Link>.</p></noscript>
        <StartClient copy={copy} />
        <div>
          {/* Moved below the finder. A link to /start#new-to-dsd still opens its panel. */}
          <Hub2More title="Guided pathways into practice"><DevelopmentPathways compact /></Hub2More>
          <Hub2More title="Getting to know the program"><NewToDsd /></Hub2More>
        </div>
        <ParticipationNotice surface="start_routing" />
      </div>
    </EditableSurfaceRegion>
  );
}
