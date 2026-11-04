import "server-only";
import { cookies } from "next/headers";
import { ownerFromCookies } from "./request";
import { isLeadersSession, LEADERS_COOKIE } from "./leaders";

/** True for a live leaders session or a live consultant (owner) session. Pages call this
 * themselves: the layout alone cannot keep page data out of the response payload. */
export async function leadersAllowed(): Promise<boolean> {
  try { return isLeadersSession((await cookies()).get(LEADERS_COOKIE)?.value) || await ownerFromCookies(); }
  catch { return false; }
}
