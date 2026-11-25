# Railway automatic deployments

Production service `0de310b5-4c71-4696-ab9d-5c78c62e1fbb` in project `e3b13c65-e831-445b-a0bb-5c5f21aea100` is connected to this repository's `main` branch. Pushes and merged pull requests to `main` trigger Railway builds.

GitHub Settings > General > Archives keeps **Include Git LFS objects in archives** disabled so automatic deployments use small source archives. The npm prebuild step restores the 31 supplemental assets from the existing private asset store using config/github-supplemental-assets.json, verifies SHA-256 and byte counts, and removes only exact LFS pointers already covered by the existing release transports. Unknown pointers stop the build. The normal build then restores and verifies all release media. When adding LFS assets, publish an immutable verified transport entry as well; never bypass the checksum gates.

The existing Railway service owns production environment variables and its `/app/.data` volume. Build: `npm run build -- --webpack`. Start: `node scripts/verify-clone-agent-pilot.mjs && npm run start -- --hostname 0.0.0.0`. Health check: `/`, timeout 300 seconds. Keep these settings and the checksum gates intact.

The Ask capacity database migration `db/standalone/0071_pac_dsd_ask_capacity.sql` was applied to the existing `pac_dsd` schema on November 12, 2026. It accepts the current Ask limits and previous deployment values for rollback compatibility, retains other scope checks, and tests accepted and rejected inputs transactionally. Apply it separately through a privileged migration connection when provisioning another database; application startup does not perform migrations.

After deployment, verify Railway's successful deployment SHA matches `main`, check `/leading/journey`, the twelve new leadership course pages and `/ask`, and send a synthetic question to `/api/ask` requesting `application/x-ndjson`. Verify both streamed text and a completed answer. A failed build should leave the previous successful release active; inspect logs and fix the source before retrying.


## Running without the volume (storage parts 1 to 3)

The `/app/.data` volume is why each deployment briefly takes the site down: Railway stops a service with a volume before starting its replacement. The steps below move everything off it. Each step is owner-approved; none deletes anything until the last.

1. Apply `db/standalone/0073`, `0074` and `0075` through a privileged migration connection, in that order. Each checks itself and can be re-run.
2. Create a Railway Storage Bucket in this project. On the service, set `PAC_MEDIA_BUCKET_ENDPOINT`, `PAC_MEDIA_BUCKET_NAME`, `PAC_MEDIA_BUCKET_ACCESS_KEY_ID` and `PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY` as references to the bucket's own credentials. `PAC_OWNER_DATABASE_URL` must be the `pac_dsd_owner_writer` connection.
3. Set `PAC_STORAGE_COPY=verify` and redeploy. The start check launches `scripts/storage/copy-to-volume-free.mjs` beside the site; it reads the volume, writes nothing and logs one `storage_copy_result` line.
4. Set `PAC_STORAGE_COPY=copy` and redeploy. It copies the `geffen-public` tree and rendered drafts to the bucket, page edits and records to `pac_dsd`, then checks every file (size and SHA-256) and record. Run it until the result says `"ok":true`. Avoid page edits between this step and the next.
5. Set `PAC_RUNTIME_RECORDS=postgres` and `PAC_PUBLIC_MEDIA_STORE=bucket`, keep the volume attached, and redeploy. Check pages with course media, read-aloud audio, Ask and page edits. Run step 4 once more to bring over any records written in between. To go back, unset both settings: the volume still holds everything as it was.
6. Remove `PAC_STORAGE_COPY`, then detach the volume. Keep it, or a backup of it, until the site has run well for a while; deleting it cannot be undone.
