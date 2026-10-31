# GitHub download and rebuild verification

Verified on October 31, 2026 from a new Git clone of the private repository, with Git LFS assets downloaded from GitHub. Portability fixes were pushed and then downloaded into that verification checkout. No original source folder, node_modules, or build output was copied into the verification checkout.

Application revision tested: `69a089dc24262e6a7049aadcddfa68b1e9536172` (this report is a later documentation-only commit).

## Passed

- Node 24.14.0 and npm 11.9.0; `npm ci --no-audit --no-fund` completed.
- `npm run typecheck` completed.
- `npm run build` completed, including Next.js compilation, TypeScript, all 71 static pages, and server output.
- All 4,088 effective release assets matched expected byte sizes and SHA-256 hashes.
- Build checks verified 17 curriculum videos, seven intercultural videos, four completed podcast packages (16 assets), nine CLAS packages, eight equity learning packages, and intercultural media integrity.
- Downloaded supplemental archive sizes, SHA-256 hashes and ZIP integrity checks passed for all three archives in `CHECKSUMS.json`.
- The downloaded research archive restored independently. `git fsck --full` passed; 192 commits across all refs were present on the research checkout.
- `git lfs fsck` passed after the final asset download.
- The rebuilt server started on loopback port 8915. Home, Learn, self-directed learning, Library, User Guide, Minnesota Communities and Ask pages returned HTTP 200. A curriculum video returned HTTP 200 with video/mp4 content type.
- The home page rendered successfully in the in-app browser, with working navigation from the welcome screen.
- The verification checkout had no tracked changes after the build and route checks.

## Portability repairs included

Git now preserves exact bytes for public/model assets and rebuild inputs. Original line endings were restored where automatic normalization had broken checksum identities. Reviewed-public-asset source files and reconstruction blobs are included, so the local build does not need the historical private asset store.

## Scope

This verifies a local static-content rebuild without production credentials. Live AI providers, production authentication and permissions, production database records, scheduled jobs, and a new-host deployment were not exercised. Those require deliberate production configuration described in README-HANDOFF.md. The loopback preview uses PAC_OFFLINE_BUILD=1 for local HTTP and an in-memory store. Do not use that local template unchanged on a public host.

Historical upload scripts remain archival and may reference the existing Railway service, obsolete checksums, or original local paths. Do not run them as generic setup steps. The existing product content gaps are not repaired by this packaging work.
