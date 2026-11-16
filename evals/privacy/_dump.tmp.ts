import { reachableWrites, logLikeWrites, loadPrivacyAllowlist, askRecords, formatHit } from "./checks.ts";
const allow = loadPrivacyAllowlist();
const w = reachableWrites(allow);
console.log("CONFLICTS"); for (const h of w.conflicts) console.log(formatHit(h));
console.log("LOGLIKE"); for (const h of logLikeWrites(w.conflicts)) console.log(formatHit(h));
console.log("RECORDS"); for (const h of askRecords()) console.log(formatHit(h));
