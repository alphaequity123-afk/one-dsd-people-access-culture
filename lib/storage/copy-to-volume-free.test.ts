import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";
import { copyToVolumeFree } from "@/scripts/storage/copy-to-volume-free.mjs";
import { mediaBucketConfiguration as scriptBucket, signedBucketRequest as scriptSign } from "@/scripts/storage/media-bucket.mjs";
import { mediaBucketConfiguration, signedBucketRequest } from "./media-bucket";

describe("the copy's bucket client", () => {
  it("signs exactly as the app's client does", () => {
    const settings = {
      PAC_MEDIA_BUCKET_ENDPOINT: "https://s3.amazonaws.com", PAC_MEDIA_BUCKET_NAME: "examplebucket",
      PAC_MEDIA_BUCKET_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE", PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", PAC_MEDIA_BUCKET_REGION: "us-east-1",
    } as unknown as NodeJS.ProcessEnv;
    const when = new Date("2013-05-24T00:00:00Z");
    const request = { method: "GET" as const, key: "test.txt", headers: { range: "bytes=0-9" } };
    expect(scriptSign(scriptBucket(settings), request, when)).toEqual(signedBucketRequest(mediaBucketConfiguration(settings)!, request, when));
    expect((scriptSign(scriptBucket(settings), request, when).init.headers as Record<string, string>).authorization).toContain("Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41");
  });
});

// Runs only with a disposable database (migrations 0073 to 0075 applied) and S3-compatible bucket.
const ownerUrl = process.env.PAC_TEST_RECORDS_OWNER_URL?.trim();
const bucketEndpoint = process.env.PAC_TEST_MEDIA_BUCKET_ENDPOINT?.trim();
const folders: string[] = [];
afterAll(() => { for (const folder of folders) rmSync(folder, { recursive: true, force: true }); });

describe.skipIf(!ownerUrl || !bucketEndpoint)("the one-time copy off the volume", () => {
  it("reports what is missing, copies it once, and then finds everything identical", async () => {
    const data = mkdtempSync(path.join(os.tmpdir(), "volume-copy-"));
    folders.push(data);
    const unique = `${Date.now()}`;
    const audio = Buffer.from(`ID3 copy test ${unique}`);
    const audioName = `${createHash("sha256").update(audio).digest("hex")}.mp3`;
    mkdirSync(path.join(data, "geffen-public", "audio"), { recursive: true });
    writeFileSync(path.join(data, "geffen-public", "audio", audioName), audio);
    writeFileSync(path.join(data, "geffen-public", "audio", ".geffen-temp.tmp"), "half written");
    mkdirSync(path.join(data, "page-edits"), { recursive: true });
    writeFileSync(path.join(data, "page-edits", "page-edits.json"), JSON.stringify({ version: 1, updatedAt: "2026-11-25T00:00:00.000Z", pages: { "/about": {} }, log: [] }, null, 1));
    const ledger = new DatabaseSync(path.join(data, "clone-agents.sqlite"));
    ledger.exec("CREATE TABLE runs (id TEXT PRIMARY KEY, started TEXT NOT NULL, finished TEXT, status TEXT NOT NULL, route TEXT, jev_calls INTEGER NOT NULL DEFAULT 0); CREATE TABLE voice_usage (at TEXT NOT NULL, kind TEXT NOT NULL, units INTEGER NOT NULL); CREATE TABLE daily_review (day TEXT PRIMARY KEY,status TEXT NOT NULL)");
    const runId = crypto.randomUUID();
    ledger.prepare("INSERT INTO runs VALUES (?,?,?,?,?,?)").run(runId, "2026-11-01T00:00:00.000Z", "2026-11-01T00:00:10.000Z", "completed", "learning", 2);
    ledger.prepare("INSERT INTO voice_usage VALUES (?,?,?)").run("2026-11-01T00:00:00.000Z", "speech", 40);
    ledger.prepare("INSERT INTO daily_review VALUES (?,?)").run(`2098-0${1 + (Number(unique) % 9)}-1${Number(unique) % 9}`, "completed");
    ledger.close();

    const environment = {
      PAC_OWNER_DATABASE_URL: ownerUrl, PAC_OWNER_DATABASE_SSL: "disable",
      PAC_MEDIA_BUCKET_ENDPOINT: bucketEndpoint, PAC_MEDIA_BUCKET_NAME: process.env.PAC_TEST_MEDIA_BUCKET_NAME,
      PAC_MEDIA_BUCKET_ACCESS_KEY_ID: process.env.PAC_TEST_MEDIA_BUCKET_ACCESS_KEY_ID, PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY: process.env.PAC_TEST_MEDIA_BUCKET_SECRET_ACCESS_KEY,
      PAC_MEDIA_BUCKET_REGION: "us-east-1", PAC_MEDIA_BUCKET_URL_STYLE: "path", PAC_GEFFEN_PUBLIC_MEDIA_ROOT: path.join(data, "geffen-public"),
    } as Record<string, string | undefined>;
    const before = await copyToVolumeFree({ ...environment, PAC_STORAGE_COPY: "verify" } as unknown as NodeJS.ProcessEnv, data);
    expect(before).toMatchObject({ ok: false, files: 1, filesDifferent: 1, runs: 1, runsPresent: 0 });

    const copied = await copyToVolumeFree({ ...environment, PAC_STORAGE_COPY: "copy" } as unknown as NodeJS.ProcessEnv, data);
    expect(copied).toMatchObject({ files: 1, filesCopied: 1, filesDifferent: 0, runsPresent: 1, reviewsPresent: 1, voiceImported: true });
    expect(["same", "different"]).toContain((copied as { pageEdits: string }).pageEdits); // another test may already hold a document

    const again = await copyToVolumeFree({ ...environment, PAC_STORAGE_COPY: "copy" } as unknown as NodeJS.ProcessEnv, data);
    expect(again).toMatchObject({ filesCopied: 0, filesDifferent: 0, runsPresent: 1 });
  });
});

describe("the volume inventory", () => {
  it("lists every top-level folder, hidden ones included, and writes nothing", async () => {
    const data = mkdtempSync(path.join(os.tmpdir(), "volume-inventory-"));
    folders.push(data);
    mkdirSync(path.join(data, "geffen-public", "audio"), { recursive: true });
    writeFileSync(path.join(data, "geffen-public", "audio", "a.mp3"), "1234");
    mkdirSync(path.join(data, ".cache"));
    writeFileSync(path.join(data, ".cache", "x"), "12");
    writeFileSync(path.join(data, "clone-agents.sqlite"), "123");
    const result = await copyToVolumeFree({ PAC_STORAGE_COPY: "inventory" } as unknown as NodeJS.ProcessEnv, data);
    expect(result).toEqual({ ok: true, mode: "inventory", folders: {
      "geffen-public": { files: 1, bytes: 4 }, ".cache": { files: 1, bytes: 2 }, "clone-agents.sqlite": { files: 1, bytes: 3 },
    } });
  });
});
