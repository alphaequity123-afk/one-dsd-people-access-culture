"use client";
import { useEffect } from "react";

/**
 * Supporting material on these pages sits in closed panels. A printed page should still carry it,
 * so every closed panel is opened just before printing and closed again afterwards.
 */
export function PrintOpenPanels() {
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    function open() {
      opened = Array.from(document.querySelectorAll<HTMLDetailsElement>("details.course-more-item:not([open])"));
      for (const panel of opened) panel.open = true;
    }
    function restore() {
      for (const panel of opened) panel.open = false;
      opened = [];
    }
    window.addEventListener("beforeprint", open);
    window.addEventListener("afterprint", restore);
    return () => {
      window.removeEventListener("beforeprint", open);
      window.removeEventListener("afterprint", restore);
    };
  }, []);
  return null;
}
