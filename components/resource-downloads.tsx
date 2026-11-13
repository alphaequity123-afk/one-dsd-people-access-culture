
import { SourceLink } from "@/components/app-link";
import { downloadHref, type DownloadKind, type DownloadScope } from "@/lib/downloads/catalog";
import { SharePage } from "@/components/share-page";
import { DOWNLOAD_FORMATS, DOWNLOAD_FORMAT_DETAILS, FALLBACK_DOWNLOAD_FORMATS, FALLBACK_DOWNLOAD_FORMAT_DETAILS } from "@/lib/downloads/model";

type ResourceDownloadsProps = {
  kind: DownloadKind;
  id: string;
  /** What the control calls the thing being downloaded. */
  noun?: string;
  /** The program view the page is showing, so the file matches the page. */
  scope?: DownloadScope;
  compact?: boolean;
  appearance?: "buttons" | "links";
  /** Also offer share controls (copy link, email, device share). On by default; pass false where the page already shows them. */
  share?: boolean;
  /** Page to share instead of the current one. */
  shareHref?: string;
  shareTitle?: string;
};

/**
 * Word, Excel, PowerPoint and PDF copies of a resource, built from the same published
 * wording the page shows, plus ways to share it. Available to everyone; nothing personal is attached.
 */
export function ResourceDownloads({ kind, id, noun = "resource", scope, compact = false, appearance = "buttons", share = true, shareHref, shareTitle }: ResourceDownloadsProps) {
  const linkClassName = appearance === "links" ? "resource-download-text-link" : "btn btn--light !min-h-0 !px-3 !py-1 !text-sm";
  return (
    <div
      data-resource-download="true"
      role="group"
      aria-label={`Download this ${noun}`}
      className={compact ? "inline-flex flex-wrap items-center gap-2 print:hidden" : "mt-4 flex flex-wrap items-center gap-2 print:hidden"}
    >
      <span className="text-sm font-bold">Download this {noun}:</span>
      {DOWNLOAD_FORMATS.map((format) => (
        <SourceLink
          key={format}
          className={linkClassName}
          href={downloadHref(kind, id, format, scope)}
          download
          aria-label={`Download this ${noun} as ${DOWNLOAD_FORMAT_DETAILS[format].label}`}
        >
          {DOWNLOAD_FORMAT_DETAILS[format].label}
        </SourceLink>
      ))}
      {FALLBACK_DOWNLOAD_FORMATS.map((format) => (
        <SourceLink
          key={format}
          className={linkClassName}
          href={downloadHref(kind, id, format, scope)}
          download
          aria-label={`Download this ${noun} as ${FALLBACK_DOWNLOAD_FORMAT_DETAILS[format].label}`}
        >
          {FALLBACK_DOWNLOAD_FORMAT_DETAILS[format].label}
        </SourceLink>
      ))}
      {share ? <SharePage compact noun={noun} href={shareHref} title={shareTitle} /> : null}
    </div>
  );
}
