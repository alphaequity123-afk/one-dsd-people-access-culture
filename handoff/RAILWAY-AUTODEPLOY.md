# Railway automatic deployments

Production service `0de310b5-4c71-4696-ab9d-5c78c62e1fbb` in project `e3b13c65-e831-445b-a0bb-5c5f21aea100` is connected to this repository's `main` branch. Pushes and merged pull requests to `main` trigger Railway builds.

GitHub Settings > General > Archives must have **Include Git LFS objects in archives** enabled. Railway source archives must include real media/model files, not LFS pointer text. Additional release assets are restored from the existing private asset store and checked against the tracked manifests during the build.

The existing Railway service owns production environment variables and its `/app/.data` volume. Build: `npm run build -- --webpack`. Start: `node scripts/verify-clone-agent-pilot.mjs && npm run start -- --hostname 0.0.0.0`. Health check: `/`, timeout 300 seconds. Keep these settings and the checksum gates intact.

The Ask capacity database migration `db/standalone/0071_pac_dsd_ask_capacity.sql` was applied to the existing `pac_dsd` schema on November 12, 2026. It accepts the current Ask limits and previous deployment values for rollback compatibility, retains other scope checks, and tests accepted and rejected inputs transactionally. Apply it separately through a privileged migration connection when provisioning another database; application startup does not perform migrations.

After deployment, verify Railway's successful deployment SHA matches `main`, check `/leading/journey`, the twelve new leadership course pages and `/ask`, and send a synthetic question to `/api/ask` requesting `application/x-ndjson`. Verify both streamed text and a completed answer. A failed build should leave the previous successful release active; inspect logs and fix the source before retrying.
