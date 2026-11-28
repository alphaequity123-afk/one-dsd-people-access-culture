#!/bin/sh
# Railway start for the Dockerfile build. Railway runs a Dockerfile service's
# start command without a shell, so "a && b" in the service settings never
# reaches b. This script keeps the same order: the clone pilot gate first,
# then Next on 0.0.0.0 (the same command as `npm run start -- --hostname 0.0.0.0`).
set -e
node scripts/verify-clone-agent-pilot.mjs
echo "Starting Next"
exec ./node_modules/.bin/next start --hostname 0.0.0.0
