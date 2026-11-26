# One DSD People, Access and Culture

This private repository contains the application source from the October 31, 2026 Railway release, public media, model assets, reviewed-asset blobs, and supplemental research/release-tool archives in `handoff/`. Install Git LFS before cloning, and run `git lfs pull` after cloning. Live database records and environment secrets are intentionally excluded.

Start with [the rebuild and preview instructions](handoff/README-HANDOFF.md). They describe a local preview without live credentials and the separate requirements for a new production host. The supplemental scripts are historical records, not generic deployment commands.

## Route smoke checks

`scripts/smoke/run-local-views.sh` starts an offline local server for each program view (`PAC_STAFF_SCOPE=dsd` and `one-dhs`) and checks 139 pages for status, main heading, header menu and stray icons. `scripts/smoke/smoke-routes.mjs <base-url>` runs the same checks against any running server. See [scripts/smoke/README.md](scripts/smoke/README.md).
