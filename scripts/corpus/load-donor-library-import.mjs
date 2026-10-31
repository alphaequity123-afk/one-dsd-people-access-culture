#!/usr/bin/env node
throw new Error("Legacy shared-database writer is disabled in standalone One DSD. Use the reviewed private pac_dsd / pac_dsd_auth bootstrap and isolated credentials; do not run this script against the One DHS database.");

import { DEFAULT_DONOR_STAGE_DIRECTORY } from "./donor-library-import-lib.mjs";

if (!process.argv.includes("--stage") && !process.argv.includes("--promote-run")) {
  process.argv.push("--stage", DEFAULT_DONOR_STAGE_DIRECTORY);
}

const { main } = await import("./load-shadow-import-v2.mjs");
await main();
