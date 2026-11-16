import { redirect } from "next/navigation";

export const metadata = { title: "One DHS People, Access and Culture" };

/** The landing page is the home page (owner, 2026-11-15: the One DSD home is the model). */
export default function Root() {
  redirect("/home");
}
