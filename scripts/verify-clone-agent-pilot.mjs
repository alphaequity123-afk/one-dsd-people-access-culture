import { resolve } from "node:path";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";

// Separate pilot gate: it does not waive the full multi-user PostgreSQL production gate.
if (process.env.PAC_CLONE_AGENTS === "on") {
  const required = ["TYPESAFE_API_KEY", "OPENAI_API_KEY", "PAC_OWNER_KEY", "PAC_RATE_LIMIT_SECRET"];
  if (required.some(name => !process.env[name]?.trim())) throw new Error("Clone pilot credentials are incomplete.");
  const deployments = {
    "c84555b7-726f-44ab-8141-689cc1faf3c6": { origin: "https://one-dhs-pac-clone-production.up.railway.app", store: "file" },
    "6cd9836c-4591-422f-ab26-7cc062cebdd4": { origin: "https://one-dsd-people-access-culture-production.up.railway.app", store: "postgres" },
    "dc09906d-494f-49cb-8c19-916db3ec1931": { origin: "https://one-dhs-dsd-web-production.up.railway.app", store: "postgres" },
  };
  const target = deployments[process.env.RAILWAY_SERVICE_ID];
  if (!target) throw new Error("Agent rollout must run in an owner-authorized service.");
  if (process.env.PAC_STORE !== target.store) throw new Error("Preserve this application's designated store.");
  const root = resolve(".data");
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH !== root || !process.env.RAILWAY_VOLUME_ID) throw new Error("The clone's durable volume is not mounted at its operational store.");
  if (process.env.PAC_PUBLIC_ORIGIN !== target.origin) throw new Error("Clone public origin does not match its authorized deployment.");
  mkdirSync(root, { recursive: true });
  const probe = resolve(root, ".probe-" + randomUUID());
  writeFileSync(probe, "volume-ready", { flag: "wx" }); unlinkSync(probe);
  console.log("Clone pilot gate passed: dedicated service, durable volume, private credentials and public origin.");
}
