"use client";
import dynamic from "next/dynamic";
export const DsdPracticePlanner = dynamic(() => import("./dsd-practice-planner-editor"), {
  ssr: false,
  loading: () => <p role="status">Opening your practice plans…</p>,
});
