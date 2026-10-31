import { redirect } from "next/navigation";

/** The default protected workspace is program work, not retired consultation intake. */
export default function ConsultantHome() {
  redirect("/consultant/program");
}
