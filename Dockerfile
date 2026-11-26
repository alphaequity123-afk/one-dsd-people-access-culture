# One DSD (v2-rebuild) image for Railway.
#
# Why this file exists: the default Railpack builder builds the app in one
# stage and then copies the whole /app tree (code, node_modules and about
# 4.6 GB of verified course media) into a second image layer and also exports
# a build cache. Builder disk ran out at that export step ("no space left on
# device", 2026-11-26). Building in a single stage keeps one copy of the media
# on the builder, and the cleanup below drops files the running site never
# reads. The build steps themselves (npm run build and its verifications) are
# unchanged. After they pass, scripts/public-offload.mjs moves the large media
# (about 3.6 GB) to the media bucket, so the image carries only the code, small
# files and public-offload.json.

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
# The app's own media bucket: large public files move there after the build's
# checks (scripts/public-offload.mjs) and are served from it at runtime.
ARG PAC_MEDIA_BUCKET_ENDPOINT
ARG PAC_MEDIA_BUCKET_NAME
ARG PAC_MEDIA_BUCKET_ACCESS_KEY_ID
ARG PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY
ARG PAC_MEDIA_BUCKET_REGION
ARG PAC_MEDIA_BUCKET_URL_STYLE

COPY . .

# One RUN so install, media restore, build and cleanup land in a single layer.
RUN npm ci --no-audit --no-fund \
 && npm run build -- --webpack \
 && PAC_PUBLIC_OFFLOAD=on node scripts/public-offload.mjs \
 && rm -rf .next/cache .cache/accessible-static-assets /root/.npm /root/.cache /tmp/* \
 && rm -rf node_modules/onnxruntime-node/bin/napi-v6/darwin \
           node_modules/onnxruntime-node/bin/napi-v6/win32 \
 && (find node_modules/onnxruntime-node \( -name 'libonnxruntime_providers_cuda.so' -o -name 'libonnxruntime_providers_tensorrt.so' \) -delete 2>/dev/null || true)

ENV NODE_ENV=production
EXPOSE 8080
# Railway's start command (service settings) is "sh scripts/railway-start.sh":
# the pilot check first, then Next on 0.0.0.0.
CMD ["sh", "scripts/railway-start.sh"]
