
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import "./globals.css";
import "./program-design.css";
import "./dsd-calm.css";
import "./development.css";
import "./approved-palette.css";
import "./internal-pages.css";
import "./area-colors.css";
import "./inner-theme.css";
import "./calm-system.css";
import "./dsd-pilot.css";
import "./source-readings.css";
import { InternalPage } from "@/components/internal-page";
import { OpenDetailsForHash } from "@/components/open-details-for-hash";
import { CourseMediaForPage } from "@/components/course-media-for-page";
import { PROGRAM } from "@/lib/constants";
import { PublishedProgramHeader } from "@/components/published-program-header";
import { DsdProgramFooter } from "@/components/dsd-program-footer";
import { ConnectedMinnesota } from "@/components/connected-minnesota";
import { DsdResourceActions } from "@/components/dsd-workspace";
import { ProgramContextProvider } from "@/components/program-context";
import { requestedProductContext } from "@/lib/product/request-context";
import { prepareEditableSurface, type PreparedEditableSurface } from "@/components/editable-surface";
import { fallbackEditableSurface } from "@/lib/content/editable-surfaces";
import { UniversalEditor } from "@/components/universal-editor";
import { PageEditOverlay } from "@/components/page-edit-overlay";
import { editingModeFromCookies } from "@/lib/auth/request";
import { ChromeGate } from "@/components/chrome-gate";
import { NavigationStatus } from "@/components/navigation-status";
import { loadPublishedPageCopy } from "@/lib/content/page-copy";
import { staticPageCopy } from "@/lib/content/page-copy-contract";
import { offlineShareOrigin } from "@/lib/offline/mode";
import { SHARE_ORIGIN_META } from "@/lib/product/share-link";

/**
 * A shared page (/share/…) hides the full footer, but two facts from it must still
 * reach the reader: the privacy warning and the program's DHS-system boundary. Falls
 * back to the registry wording if the published footer copy cannot be read.
 */
function firstSentence(text: string): string {
  const end = text.indexOf(". ");
  return end >= 0 ? text.slice(0, end + 1) : text;
}

function secondSentence(text: string): string {
  const end = text.indexOf(". ");
  return end >= 0 ? text.slice(end + 2).trim() : "";
}

async function ShareProgramNotice() {
  let privacyText = staticPageCopy("footer").privacyText;
  try {
    const copy = await loadPublishedPageCopy("footer");
    if (copy) privacyText = copy.privacyText;
  } catch (error) {
    console.error("share notice footer copy unavailable", error instanceof Error ? `${error.name}: ${error.message}` : error);
  }
  const ownershipNote = secondSentence(PROGRAM.ownership) || PROGRAM.ownership;
  return (
    <p className="share-program-notice wrap text-sm text-muted py-6">
      {firstSentence(privacyText)} {ownershipNote}
    </p>
  );
}

/** Root layout must always render readable text: when the database is unreachable, use registry defaults. */
async function surfaceOrFallback(surface: string): Promise<PreparedEditableSurface> {
  try {
    return await prepareEditableSurface(surface);
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    const message = error instanceof Error ? error.message : String(error);
    console.error("root layout surface unavailable", { surface, error: `${name}: ${message}` });
    return fallbackEditableSurface(surface);
  }
}


// Published content is loaded only for a request, never by an external build worker.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const brand = PROGRAM.staffBrand;
  return {
    title: { default: brand, template: `%s | ${brand}` },
    description: `${brand}: ${PROGRAM.heroLede}`,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialContext = await requestedProductContext();
  const [contextSurface, owner] = await Promise.all([
    surfaceOrFallback("site.context"),
    editingModeFromCookies(),
  ]);
  const shareOrigin = offlineShareOrigin();
  return (
    <html lang="en" className="h-full">
      <body className="program-design dsd-calm flex min-h-full flex-col">
        <NavigationStatus />
        {shareOrigin ? <meta name={SHARE_ORIGIN_META} content={shareOrigin} /> : null}
        <ProgramContextProvider
          initialContext={initialContext}
          copy={contextSurface.values}
          copyAvailable={contextSurface.available}
        >
          <ChromeGate hideOnPrefixes={["/share/", "/embedded-tools/"]} hideOnExact={["/"]}>
            <SourceLink href="#main" className="skip-link">
              Skip to main content
            </SourceLink>
            <PublishedProgramHeader />
          </ChromeGate>
          <main id="main" tabIndex={-1} className="flex-1">
            <ChromeGate hideOnPrefixes={["/share/", "/embedded-tools/"]} hideOnExact={["/"]}><DsdResourceActions canCreate={owner} /></ChromeGate>
            <InternalPage>{children}</InternalPage>
            <ChromeGate hideOnPrefixes={["/share/", "/embedded-tools/"]} hideOnExact={["/"]}><CourseMediaForPage /></ChromeGate>
            <OpenDetailsForHash />

          </main>
          <ChromeGate hideOnPrefixes={["/share/", "/embedded-tools/"]} hideOnExact={["/"]}>
            <ConnectedMinnesota />
            <DsdProgramFooter />
            <UniversalEditor owner={owner} />
          </ChromeGate>
          <ChromeGate onlyOnPrefixes={["/share/"]}>
            <ShareProgramNotice />
          </ChromeGate>
        </ProgramContextProvider>
        <PageEditOverlay />
      </body>
    </html>
  );
}


