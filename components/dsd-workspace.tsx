"use client";
import dynamic from "next/dynamic";
export const DsdResourceActions = dynamic(() => import("./dsd-saved-resources").then(module => module.ResourceActions), { ssr: false });
export const DsdSavedResourceShelf = dynamic(() => import("./dsd-saved-resources").then(module => module.SavedResourceShelf), { ssr: false, loading: () => <p role="status">Opening your saved resources…</p> });
