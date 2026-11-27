# Keep accessibility source originals in the build cache

The accessibility build retains 87 checksum-verified original documents so repeat builds can restore the original before deriving the accessible published version. Those originals total 1,684,136,898 bytes (1,606 MiB); published repaired documents remain separate.

Railpack previously copied the application directory, including `.cache/accessible-static-assets`, into the runtime image. `railpack.json` now mounts that specific directory as a locked build cache. Railpack cache mounts are not included in the final image. This retains the original files for repeat builds without shipping a second copy with the application.

The configuration extends existing build caches. It changes no build commands, published files, source identities, repair logic, checksum gates, Node version, or runtime commands. The lock avoids two builds writing the same cache simultaneously. Local builds retain their existing behavior.

Validation used Railpack 0.44.0 (the production build version) to generate before/after plans from the application's package and version files. After normalizing the planner's verbose logging flag, the only plan difference was the new cache definition and its reference in the build step. Source inspection found that only the accessibility build script reads this cache; application routes do not use it.

Runtime image size and deployment duration must be checked on the next deployment; the manifest size is an expected reduction in uncompressed duplicate files, not a measured compressed image saving.

Reference: [Railpack cache configuration](https://railpack.com/config/file#caches).
