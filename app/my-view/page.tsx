import type { Metadata } from "next";
import { PageIntro } from "@/components/ui";
import { MyViewClient } from "@/components/my-view-client";
import { ROUTES } from "@/lib/constants";
import { consultationIntakeEnabled } from "@/lib/intelligence/consult/availability";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { withoutSystemNotices } from "@/lib/content/work-guidance";

export const metadata: Metadata = { title: ROUTES.myView.label };

export default async function MyViewPage() {
  const intakeEnabled = consultationIntakeEnabled();
  const [surface, clientSurface] = await Promise.all([
    prepareEditableSurface("my-view.page"),
    prepareEditableSurface("my-work.client"),
  ]);
  const copy = surface.values;
  return (
    <EditableSurfaceRegion surface={surface}>
      <PageIntro kicker={withoutSystemNotices(stringValue(copy, "introKicker"))} title={stringValue(copy, "introTitle")} lede={withoutSystemNotices(stringValue(copy, "introLede"))} />
      <div className="wrap space-y-6 py-8">
        <EditableSurfaceRegion surface={clientSurface}>
          <MyViewClient intakeEnabled={intakeEnabled} copy={clientSurface.values} />
        </EditableSurfaceRegion>
      </div>
    </EditableSurfaceRegion>
  );
}
