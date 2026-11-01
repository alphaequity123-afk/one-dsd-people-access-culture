# One DSD People, Access and Culture

This private repository contains the application source from the October 31, 2026 Railway release, public media, model assets, reviewed-asset blobs, and supplemental research/release-tool archives in `handoff/`. Install Git LFS before cloning, and run `git lfs pull` after cloning. Live database records and environment secrets are intentionally excluded.

Start with [the rebuild and preview instructions](handoff/README-HANDOFF.md). They describe a local preview without live credentials and the separate requirements for a new production host. The supplemental scripts are historical records, not generic deployment commands.

## Added October 31, 2026

This revision adds the application work completed on October 31, 2026. The rebuild instructions above are unchanged.

- A supervisor and manager space at `/leading`, with nine decision "doors", 89 questions, and four optional suggested paths at `/leading/paths`, plus a "How this works" page. It is linked from the header, the home page, My work, and the site map.
- Staff collections at `/learn/collections`, with one page per collection. The data file `lib/content/collections-data.json` is built by `scripts/content/build-collections-data.mjs`.
- 19 new supervisor and manager courses with ids beginning `sm-`, stored in `lib/content/courses/authored/supervisor-manager/`. Each has a standalone job aid at `/resources/ja-sm-*`, registered in the staff corpus and in `lib/content/resource-organization-data.json`.
- The One DSD Culture Calendar grid, shown on `/` and `/home` and on the Minnesota Communities calendar page.
- An owner-only "Edit this page" control on every page, served by `app/api/page-edits/route.ts`. Edits are stored on the server volume under `.data/page-edits`, which Git ignores, so they are not part of this repository.
- A rebuilt public search index: `models/bge-small-en-v1.5/public-document-vectors.json` now covers 9,537 documents (previously 9,406), and `manifest.json` records its new checksum.
- The Equity Analysis Toolkit, the one required course, is placed first in the new collections and supervisor paths and marked as required wherever it is listed.
