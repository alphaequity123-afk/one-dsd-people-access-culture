"use client";
import dynamic from "next/dynamic";
export const DsdReflection = dynamic(() => import("./dsd-reflection-editor"), {
  ssr: false,
  loading: () => <p role="status">Opening your note…</p>,
});
