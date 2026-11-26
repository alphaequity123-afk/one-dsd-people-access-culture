#!/usr/bin/env bash
# Smoke-check both program views (PAC_STAFF_SCOPE=dsd and one-dhs) against a local, offline `next dev`.
#
#   scripts/smoke/run-local-views.sh [out-dir] [port] [chunk-size]
#
# Each view runs in chunks; the dev server is restarted between chunks because `next dev` keeps every compiled
# route in memory and can exceed ~12 GB across this many routes. If the server stops mid-chunk, the routes it
# answered are kept and the rest are retried on a fresh server (a route that stops SMOKE_RETRIES+1 servers, default 4, is recorded failed).
# Before each start it waits for SMOKE_MIN_FREE_MB (default 9000) of free memory, up to SMOKE_WAIT_SECONDS (900). The server gets a clean environment with only
# the non-secret local-preview settings from handoff/.env.example: static content, in-memory store, no database
# URLs, no provider keys, AI/research/scheduling off. It listens on 127.0.0.1 only.
# Default out-dir: ${TMPDIR:-/tmp}/pac-smoke. Reports: <out-dir>/report-dsd.json and <out-dir>/report-one-dhs.json (plus per-chunk parts and server logs).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_ARG="${1:-${TMPDIR:-/tmp}/pac-smoke}"
mkdir -p "$OUT_ARG"
OUT="$(cd "$OUT_ARG" && pwd)"
PORT="${2:-18931}"
CHUNK="${3:-8}"
VIEWS="${SMOKE_VIEWS:-dsd one-dhs}"
SCRIPT="$ROOT/scripts/smoke/smoke-routes.mjs"
TOTAL="$(node "$SCRIPT" --list | wc -l)"
BASE="http://127.0.0.1:$PORT"
SERVER_PID=""

stop_server() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    for _ in $(seq 1 30); do kill -0 "$SERVER_PID" 2>/dev/null || break; sleep 1; done
    kill -9 "$SERVER_PID" 2>/dev/null || true
  fi
  SERVER_PID=""
}
trap stop_server EXIT

# On a shared machine, wait (up to SMOKE_WAIT_SECONDS) until enough memory is free for a cold `next dev` compile.
MIN_FREE_MB="${SMOKE_MIN_FREE_MB:-9000}"
wait_for_memory() {
  local waited=0 free
  while :; do
    free="$(awk '/^MemAvailable:/ {print int($2 / 1024)}' /proc/meminfo 2>/dev/null || echo "$MIN_FREE_MB")"
    (( free >= MIN_FREE_MB )) && return 0
    (( waited >= ${SMOKE_WAIT_SECONDS:-900} )) && { echo "   only ${free} MB free after ${waited}s; starting anyway" >&2; return 0; }
    (( waited % 60 == 0 )) && echo "   waiting for memory: ${free} MB free, want ${MIN_FREE_MB} MB" >&2
    sleep 5; waited=$((waited + 5))
  done
}

start_server() { # $1 view, $2 log file
  wait_for_memory
  (cd "$ROOT" && exec env -i PATH="$PATH" HOME="$HOME" NODE_OPTIONS=--max-old-space-size=6144 NEXT_TELEMETRY_DISABLED=1 \
    PAC_DATA_ENV=local PAC_OFFLINE_BUILD=1 PAC_STORE=memory PAC_CONTENT_SOURCE=static PAC_STAFF_SCOPE="$1" \
    PAC_PUBLIC_ORIGIN="$BASE" PAC_CLONE_AGENTS=off PAC_CLONE_DAILY_REVIEW=off PAC_GENERATIVE_PILOT=off PAC_RESEARCH_ENABLED=off \
    node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port "$PORT") >"$2" 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 120); do
    grep -q "Ready in" "$2" 2>/dev/null && return 0
    kill -0 "$SERVER_PID" 2>/dev/null || { echo "dev server exited; see $2" >&2; return 1; }
    sleep 1
  done
  echo "dev server did not start; see $2" >&2; return 1
}

# Index of the first result the server never answered (it stopped mid-chunk), or the chunk length if none.
answered() { node -e 'const r=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).results;const i=r.findIndex(x=>x.status===0&&/fetch failed|ECONNREFUSED|socket/i.test(x.requestError||""));console.log(i<0?r.length:i)' "$1"; }
# Keep the first $2 results of a part file.
truncate_part() { node -e 'const f=process.argv[1],n=+process.argv[2],fs=require("fs"),j=JSON.parse(fs.readFileSync(f,"utf8"));j.results=j.results.slice(0,n);fs.writeFileSync(f,JSON.stringify(j,null,2))' "$1" "$2"; }

for VIEW in $VIEWS; do
  PARTS=()
  START=0
  RETRIES=0
  while (( START < TOTAL )); do
    LOG="$OUT/dev-$VIEW-$START.log"
    PART="$OUT/part-$VIEW-$START.json"
    echo "== $VIEW routes $START..$((START + CHUNK - 1))"
    start_server "$VIEW" "$LOG"
    node "$SCRIPT" "$BASE" --label "$VIEW" --log "$LOG" --concurrency 1 --start "$START" --count "$CHUNK" --out "$PART" || true
    # `next dev` can lose its worker (usually out of memory) while the parent stays up, so judge by the answers:
    # keep the routes answered before the first refused connection and retry the rest on a fresh server.
    DONE="$( [[ -f "$PART" ]] && answered "$PART" || echo 0)"
    EXPECTED="$( [[ -f "$PART" ]] && node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).results.length)' "$PART" || echo "$CHUNK")"
    if (( DONE < EXPECTED )); then
      echo "!! dev server for $VIEW stopped answering after $DONE of routes $START..$((START + CHUNK - 1)); see $LOG" >&2
      if (( DONE > 0 )); then RETRIES=0
      elif (( RETRIES >= ${SMOKE_RETRIES:-3} )); then DONE=1; RETRIES=0   # stopped every fresh server: record it as failed
      else RETRIES=$((RETRIES + 1)); fi
      if [[ -f "$PART" ]]; then truncate_part "$PART" "$DONE"; fi
    else
      RETRIES=0
    fi
    stop_server
    if (( DONE > 0 )) && [[ -f "$PART" ]]; then PARTS+=("$PART"); fi
    START=$((START + DONE))
  done
  node "$SCRIPT" --merge "${PARTS[@]}" --label "$VIEW" --out "$OUT/report-$VIEW.json" || true
done
