import { resolve } from "node:path";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

// Separate pilot gate: it does not waive the full multi-user PostgreSQL production gate.
if (process.env.PAC_CLONE_AGENTS === "on") {
  const decisionKey = process.env.PAC_DECISION_PROVIDER === "gemini" ? "GEMINI_API_KEY" : "TYPESAFE_API_KEY";
  const required = [decisionKey, "OPENAI_API_KEY", "PAC_OWNER_KEY", "PAC_RATE_LIMIT_SECRET"];
  if (required.some(name => !process.env[name]?.trim())) throw new Error("Clone pilot credentials are incomplete.");
  const deployments = {
    "c84555b7-726f-44ab-8141-689cc1faf3c6": { origin: "https://one-dhs-pac-clone-production.up.railway.app", store: "file" },
    "6cd9836c-4591-422f-ab26-7cc062cebdd4": { origin: "https://one-dsd-people-access-culture-production.up.railway.app", store: "postgres" },
    "dc09906d-494f-49cb-8c19-916db3ec1931": { origin: "https://one-dhs-dsd-web-production.up.railway.app", store: "postgres" },
    // Owner-requested copy in the "Gary Banks" workspace (2026-11-07); shares the same Supabase databases.
    "0de310b5-4c71-4696-ab9d-5c78c62e1fbb": { origin: "https://one-people-access-culture.up.railway.app", store: "postgres" },
  };
  const target = deployments[process.env.RAILWAY_SERVICE_ID];
  if (!target) throw new Error("Agent rollout must run in an owner-authorized service.");
  if (process.env.PAC_STORE !== target.store) throw new Error("Preserve this application's designated store.");
  const root = resolve(".data");
  if (process.env.PAC_PUBLIC_ORIGIN !== target.origin) throw new Error("Clone public origin does not match its authorized deployment.");
  // With records in the database and media in the bucket, nothing durable lives on local disk, so
  // the service may run without a volume and updates can start the new release before the old stops.
  const volumeFree = process.env.PAC_RUNTIME_RECORDS?.trim().toLowerCase() === "postgres" && process.env.PAC_PUBLIC_MEDIA_STORE?.trim().toLowerCase() === "bucket";
  if (volumeFree) {
    const needed = ["PAC_RUNTIME_DATABASE_URL", "PAC_OWNER_DATABASE_URL", "PAC_MEDIA_BUCKET_ENDPOINT", "PAC_MEDIA_BUCKET_NAME", "PAC_MEDIA_BUCKET_ACCESS_KEY_ID", "PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY"];
    if (needed.some(name => !process.env[name]?.trim())) throw new Error("Volume-free storage is selected but its database or bucket settings are incomplete.");
    console.log("Clone pilot gate passed: dedicated service, database records, media bucket, private credentials and public origin.");
  } else {
    if (process.env.RAILWAY_VOLUME_MOUNT_PATH !== root || !process.env.RAILWAY_VOLUME_ID) throw new Error("The clone's durable volume is not mounted at its operational store.");
    mkdirSync(root, { recursive: true });
    const probe = resolve(root, ".probe-" + randomUUID());
    writeFileSync(probe, "volume-ready", { flag: "wx" }); unlinkSync(probe);
    console.log("Clone pilot gate passed: dedicated service, durable volume, private credentials and public origin.");
  }
}

// The one-time storage copy runs beside the site, never in front of it, so a long upload cannot
// hold up the health check. It needs the volume still mounted, and only reads from it.
const storageCopy = process.env.PAC_STORAGE_COPY?.trim().toLowerCase();
if (storageCopy === "verify" || storageCopy === "copy") {
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH !== resolve(".data")) {
    console.log(`storage_copy_result ${JSON.stringify({ ok: false, error: "The volume is not mounted, so there is nothing to copy from." })}`);
  } else {
    spawn(process.execPath, [resolve("scripts/storage/copy-to-volume-free.mjs")], { stdio: "inherit", detached: true, env: process.env }).unref();
    console.log(`storage_copy started ${JSON.stringify({ mode: storageCopy })}`);
  }
}
