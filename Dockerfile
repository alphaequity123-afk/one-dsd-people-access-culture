# One DSD (v2-rebuild) image for Railway.
#
# Why this file exists: the default Railpack builder builds the app in one
# stage and then copies the whole /app tree (code, node_modules and about
# 4.6 GB of verified course media) into a second image layer and also exports
# a build cache. Builder disk ran out at that export step ("no space left on
# device", 2026-11-26). Building in a single stage keeps one copy of the media
# on the builder, and the cleanup below drops files the running site never
# reads. The build steps themselves (npm run build and its verifications) are
# unchanged.

FROM node:24.14.0-bookworm-slim

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Railway passes service variables to Docker builds only when they are
# declared. These are the ones the build reads: the verified asset store used
# to restore release media and videos, and the Next config switch.
ARG SERIES_ASSET_ACCESS_KEY_ID
ARG SERIES_ASSET_BUCKET
ARG SERIES_ASSET_ENDPOINT
ARG SERIES_ASSET_REGION
ARG SERIES_ASSET_SECRET_ACCESS_KEY
ARG PAC_CLONE_AGENTS
ARG NEXT_PUBLIC_SHARE_ORIGIN

COPY . .

# One RUN so install, media restore, build and cleanup land in a single layer.
RUN npm ci --no-audit --no-fund \
 && npm run build -- --webpack \
 && rm -rf .next/cache .cache/accessible-static-assets /root/.npm /root/.cache /tmp/* \
 && rm -rf node_modules/onnxruntime-node/bin/napi-v6/darwin \
           node_modules/onnxruntime-node/bin/napi-v6/win32 \
 && (find node_modules/onnxruntime-node \( -name 'libonnxruntime_providers_cuda.so' -o -name 'libonnxruntime_providers_tensorrt.so' \) -delete 2>/dev/null || true)

ENV NODE_ENV=production
EXPOSE 8080
# Railway's start command (service settings) runs the pilot check first and
# then starts Next on 0.0.0.0; this is the same command for local use.
CMD ["sh", "-c", "node scripts/verify-clone-agent-pilot.mjs && npm run start -- --hostname 0.0.0.0"]
