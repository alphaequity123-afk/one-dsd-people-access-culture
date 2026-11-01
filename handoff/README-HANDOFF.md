# Rebuild and preview the One DSD application

The application repository contains the deployed source, public media, local model assets, and reviewed-asset blobs. Supplemental archives in this folder preserve research history and historical release/build tools. Live database records, account sessions, passwords, and provider keys are not part of this handoff.

## Download from GitHub

Use Node **24.x**, npm **11.9.0**, Git, and Git LFS. Sign into GitHub with an account that can read this private repository. Use a normal local directory with sufficient free disk space for the working tree, Git LFS cache, dependencies, and build output.

```sh
git lfs install
git clone https://github.com/alphaequity123-afk/one-dsd-people-access-culture.git
cd one-dsd-people-access-culture
git lfs pull
git lfs fsck
```

Use a Git clone with Git LFS; do not assume a GitHub source ZIP contains the actual large assets. A file beginning with `version https://git-lfs.github.com/spec/v1` is a pointer, not the media itself.

## Build and preview without live credentials

Use a clean shell with no inherited provider keys, database connection strings, owner credentials, or enabled agent/scheduler flags. Copy `handoff/.env.example` to the repository root as `.env.local`. Its active values select static content, an in-memory store, the One DSD staff scope, and disabled AI/research/scheduling features for a loopback-only preview. Keep the commented production settings commented.

```sh
npm ci --no-audit --no-fund
node scripts/verify-railway-release-assets.mjs
npm run typecheck
npm run build
npm run start -- --hostname 127.0.0.1 --port 8915
```

Open [the local preview](http://127.0.0.1:8915). The server runs until its terminal/process is stopped. This preview verifies the downloaded application and static assets; it does not verify live AI, authentication, persistent data, scheduled jobs, or a new production deployment. In-memory changes are temporary.

The build runs asset restoration and verification scripts before Next.js compilation. When Git LFS has downloaded the complete assets, the video restoration scripts verify existing files without storage credentials. A missing or mismatched asset should be investigated; do not delete the checks or provide production keys just to make a local verification pass.

## Deploying to a new host

1. Provision the target host and an isolated database. Follow `db/standalone/README.md`, including its prerequisites, transactional bootstrap, dedicated roles, and separation checks. The legacy database migration/provision commands are explicitly disallowed by that README. This repository does not contain the live database's records.
2. Configure independent credentials in the host's secret manager. Use `config/environment-contract.json` as the complete environment contract. The example here is deliberately a minimal local-preview template, not a complete production configuration.
3. Configure the new HTTPS `PAC_PUBLIC_ORIGIN`, the appropriate runtime/content stores, and the dedicated database role URLs. Enable AI, research, protected workspaces, and scheduling only after their required secrets and activation evidence are provisioned.
4. Deliberately adapt `scripts/verify-clone-agent-pilot.mjs` to the new authorized service, origin, storage mode, and durable volume. Preserve its checks. It currently recognizes specific existing Railway services. Configure the host to run this gate before starting the application, and stop startup if the gate fails.
5. Review and satisfy production verification, health checks, access boundaries, database permissions, and relevant live feature tests before declaring the new host ready. `npm run build` succeeding alone does not validate production operation.

For a new Railway service, set the following service settings explicitly. They are held in the current Railway service settings, not in a repository config file. Configure a durable volume at `/app/.data` and update the startup gate deliberately for the new service; do not reuse another service's identifiers or secrets without review.

| Setting | Required value |
| --- | --- |
| Builder | `RAILPACK` |
| Build command | `npm run build -- --webpack` |
| Start command | `node scripts/verify-clone-agent-pilot.mjs && npm run start -- --hostname 0.0.0.0` |
| Health check path | `/` |
| Health check timeout | `300` seconds |
| Restart policy | `ON_FAILURE` |
| Maximum restart retries | `5` |

The `&&` in the start command is essential: it prevents the application from starting if the gate fails. Confirm these settings in the target service and in the resulting deployment details, then run the production checks above. Railway's legacy `railway.json` and `railway.toml` configuration files are deprecated; the application does not rely on them.

## Supplemental materials

The release and build-session scripts are historical evidence. Some contain original machine paths, obsolete archive checksums, or commands targeting the existing live Railway service. Inspect and adapt copies before use; do not run them as generic setup commands. The research package preserves its own Git history and should be extracted outside this application's repository when restoring it as a separate checkout.

The `supervisor-curriculum/` folder contains the source Markdown, placement CSV and supporting plans for the 19 supervisor courses. The repository's `scripts/content/import-supervisor-courses.mjs` and `scripts/content/build-collections-data.mjs` use these files by default; each also accepts an explicit path or its documented environment-variable override. Run either with `--check` to compare without rewriting generated content.

The historical handoff note predates the successful hotfix 3 deployment. Its claim that hotfix 3 is not live is outdated. Validation results from the new download should be read from the verification record supplied with this handoff, rather than inferred from the old note.

### Included supplemental archives

- `2-release-tools.zip`: original archive builders, test configurations, correction patches, and upload tools.
- `3-research-repo-with-git.zip`: research checkout with its separate Git history. Extract outside this application checkout.
- `4-build-session-scripts.zip`: original build-session scripts and related artifacts.

Archive sizes and SHA-256 hashes are recorded in `CHECKSUMS.json`. Extract with a ZIP utility into separate folders. These preserve the original handoff, including old paths and deployment targets; do not automatically run extracted scripts.

The local preview template uses `PAC_OFFLINE_BUILD=1` to permit loopback HTTP without HTTPS-upgrade headers. This setting is for the local preview only and must not be carried into a public deployment.
