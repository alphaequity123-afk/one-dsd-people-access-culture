import data from "@/lib/content/water-we-swim-in.json";

export type WaterModule = { number: number; slug: string; title: string; minutes: number; goal: string; body: string };

export const WATER_COURSE_HREF = "/learn/water-we-swim-in";
export const WATER_COURSE_TITLE = data.title;
export const WATER_MODULES = data.modules as WaterModule[];
export const WATER_ESSAY = data.essay as { sections: Array<{ id: string; heading: string; body: string }>; limits: string; sources: string };
export const WATER_SUPPORT = "If something here brings up a hard memory or feeling, you can stop at any time. State employees can reach the State of Minnesota Employee Assistance Program for free, confidential support; your human resources office can connect you.";
