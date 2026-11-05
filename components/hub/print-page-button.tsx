"use client";

/** Opens the browser's print dialog, where people can print or save the page as a PDF. */
export function PrintPageButton({ label = "Print or save this page" }: { label?: string }) {
  return <button type="button" onClick={() => window.print()} className="min-h-11 rounded border border-[#1f4e79] px-4 font-semibold text-[#1f4e79]">{label}</button>;
}
