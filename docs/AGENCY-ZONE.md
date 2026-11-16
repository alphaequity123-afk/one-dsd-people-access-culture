# One DSD within One DHS

The owner authorized the complete DSD program to become the working division example inside One DHS People, Access and Culture. This branch retains the functioning division routes, tools, learning and media while adding a clear agency location and shared-origin navigation.

## Configuration

- `NEXT_PUBLIC_DHS_AGENCY_ZONE=1` selects the division build. Its JavaScript, styles and image optimizer use `/dsd-static`.
- `NEXT_PUBLIC_DHS_AGENCY_ORIGIN` is the exact public agency origin used for shared navigation and request validation. `DHS_AGENCY_ORIGIN` remains a server-action configuration fallback. Do not use a wildcard.
- Reuse the existing DSD service, database configuration and `/app/.data` media volume. Keep `PAC_PUBLIC_ORIGIN` at its existing standalone origin; zone mode additionally accepts only the explicitly configured agency origin. This retains both addresses without trusting forwarded request headers.
- The agency application uses `DHS_DSD_ZONE_ORIGIN` to reach this service. It owns the shared home, Ask, library, job-family, administration and training routes, then routes remaining program paths to this division service.
- Existing division contextual Ask requests use `/dsd-api/ask` so their protocol cannot collide with the agency Ask endpoint. The division service also rewrites this path locally so it works through the standalone address.
- Shared agency links perform full document navigation. Division tools continue to use normal navigation inside the division application.
- Without the zone flag, the existing standalone application behavior remains available.

## Content retained and reconciled

The two Water module hero images use the owner's approved office photographs, shipped as byte- and hash-verified bundled assets. Existing recordings, captions, source quotations and assessment answers are preserved.

Two already accepted full course reviews from the agency application are also present here: `somali-minnesota-brief` and `cultural-broker-as-a-role`. They replace their partial-review entries. The Somali course's accepted illustrative SVG has one exact, hash-checked exception in the editorial gate; other protected media fields remain blocked. Source matching passes for 152 reviewed objects and 34 partial course corrections. These figures do not establish completion of the full editorial rollout.

## Verification and remaining work

Local browser verification confirmed entry from the agency division page into `/one-dsd`, both office images on their full Water module pages, and a return to the One DHS home page. The environment contract check, TypeScript check, routing tests and targeted editorial and Water tests pass. The preview used local source content; production owner overrides were not loaded.

The full release-asset restoration and production build pass, including TypeScript and all 450 generated pages. Deployment, actual owner-edit storage, hosted voice and other live services, phone layout, complete media/download checks and the remaining editorial coverage are not yet signed off. Coordinate release with `one-dhs-pac` PR 28.

The focused follow-up suite passes 31 tests across five files, including exact agency-origin validation and rejection of forged origins. Changed-file lint and the environment contract pass. The complete suite remains a release gate. Local media tests require the `ffmpeg-static` installation script; an install with scripts disabled does not provide the executable.

## Recorded production baseline

Before integration deployment, the DSD service's successful deployment is `c2f15bc6-7361-4b17-885d-c354ee74700d`, main commit `b3fef0ce69e676549fc76c8847000de2ca33c61b`. The agency baseline is deployment `240801f4-bdba-4c10-8ba4-ede5316dd9c3`, main commit `863d78c0f433226a3c03064de8fe3fd850b2f6a8`. No production origin flags have been changed at this checkpoint. A rollback must restore both code/configuration together; database additions must remain backward-compatible and owner data must not be reset.
